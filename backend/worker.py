from __future__ import annotations
import asyncio
import signal
from datetime import datetime, timedelta, time as time_cls, timezone
from zoneinfo import ZoneInfo
from deps import settings, get_db_pool, close_db_pool
from scheduler import process_batch
from quotas import reset_all_quotas

try:
    SPAIN_TZ = ZoneInfo("Europe/Madrid")
except Exception:
    print("[Worker] Warning: Europe/Madrid timezone unavailable, defaulting to UTC+1 without DST")
    SPAIN_TZ = timezone(timedelta(hours=1))

TARGET_UPLOAD_TIME = time_cls(18, 0, 0)
ENFORCED_STATUSES = ["pending", "scheduled", "retry", "uploading", "skipped", "done"]
MAX_RESCHEDULE_LOOKAHEAD_DAYS = 180

class Worker:
    """Background worker for upload processing with scheduled consideration."""

    def __init__(self):
        self.running = False
        self.poll_interval = settings.worker_poll_interval
        self.batch_size = settings.worker_batch_size
        self.roblox_sync_interval = timedelta(minutes=5)
        self.last_roblox_sync = datetime.min.replace(tzinfo=timezone.utc)

    def handle_shutdown(self, signum, frame):
        print(f"\nReceived signal {signum}, shutting down gracefully...")
        self.running = False

    async def check_quota_reset(self):
        now = datetime.now(timezone.utc)
        if now.hour == 0 and now.minute < 2:
            print(f"[{now}] Resetting daily quotas...")
            try:
                await reset_all_quotas()
                print(f"[{now}] Quotas reset successfully")
            except Exception as e:
                print(f"[{now}] Error resetting quotas: {e}")

    def _local_day_bounds(self, local_date):
        start_local = datetime.combine(local_date, time_cls(0, 0, 0), tzinfo=SPAIN_TZ)
        end_local = datetime.combine(local_date, time_cls(23, 59, 59), tzinfo=SPAIN_TZ)
        return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)

    def _target_local_datetime(self, local_date):
        return datetime.combine(local_date, TARGET_UPLOAD_TIME, tzinfo=SPAIN_TZ)

    async def _has_upload_on_date(self, db, account_id, local_date, exclude_upload_id):
        day_start, day_end = self._local_day_bounds(local_date)
        query = """
            SELECT 1
            FROM uploads
            WHERE account_id = $1
              AND scheduled_for BETWEEN $2 AND $3
              AND status = ANY($4::text[])
              AND id <> $5
            LIMIT 1
        """
        row = await db.fetchrow(
            query,
            account_id,
            day_start,
            day_end,
            ENFORCED_STATUSES,
            exclude_upload_id,
        )
        return row is not None

    async def _find_first_available_date(self, db, account_id, start_date, exclude_upload_id):
        candidate = start_date
        for _ in range(MAX_RESCHEDULE_LOOKAHEAD_DAYS):
            conflict = await self._has_upload_on_date(db, account_id, candidate, exclude_upload_id)
            if not conflict:
                return candidate
            candidate += timedelta(days=1)
        return candidate

    async def _reschedule_upload(self, db, upload, target_local_date, reason):
        upload_id = upload['id']
        account_id = upload['account_id']
        target_local_dt = self._target_local_datetime(target_local_date)
        target_utc = target_local_dt.astimezone(timezone.utc)
        await db.execute(
            """
            UPDATE uploads
            SET scheduled_for = $1,
                status = CASE WHEN status = 'pending' THEN 'scheduled' ELSE status END
            WHERE id = $2
            """,
            target_utc,
            upload_id,
        )
        await db.execute(
            """
            UPDATE roblox_projects
            SET scheduled_for = $1
            WHERE upload_id = $2
            """,
            target_utc,
            upload_id,
        )
        print(
            f"  - Upload {upload_id} for account {account_id} {reason}. "
            f"Rescheduled to {target_local_dt.isoformat()}"
        )

    async def get_due_uploads(self, db, limit):
        """Consider 'scheduled' uploads as pending if the scheduled time has arrived."""
        query = """
            SELECT * FROM uploads
            WHERE status = 'pending' OR (status = 'scheduled' AND scheduled_for <= NOW())
            ORDER BY scheduled_for ASC
            LIMIT $1
        """
        uploads = await db.fetch(query, limit)
        print(f"[{datetime.now(timezone.utc)}] Found {len(uploads)} pending/scheduled uploads:")
        for u in uploads:
            print(f"  - Upload ID {u['id']} | Account {u['account_id']} | Scheduled: {u['scheduled_for']} | Status: {u['status']}")
        return uploads

    async def process_batch_wrapper(self, batch_size):
        db = await get_db_pool()
        uploads = await self.get_due_uploads(db, batch_size)
        results = {'processed': 0, 'successful': 0, 'failed': 0, 'rescheduled': 0}

        for upload in uploads:
            now_utc = datetime.now(timezone.utc)
            scheduled_for = upload['scheduled_for']

            # Parse datetime if string
            if isinstance(scheduled_for, str):
                try:
                    if scheduled_for.endswith("Z"):
                        scheduled_for = scheduled_for[:-1] + "+00:00"
                    scheduled_for = datetime.fromisoformat(scheduled_for)
                except Exception:
                    scheduled_for = datetime.strptime(scheduled_for, "%Y-%m-%d %H:%M:%S")
            if scheduled_for.tzinfo is None:
                scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)

            print(f"[{now_utc}] Processing upload {upload['id']} | Scheduled: {scheduled_for} | Account: {upload['account_id']}")

            scheduled_local = scheduled_for.astimezone(SPAIN_TZ)
            target_local_date = scheduled_local.date()

            if scheduled_local.time() != TARGET_UPLOAD_TIME:
                desired_date = target_local_date
                if scheduled_local.time() > TARGET_UPLOAD_TIME:
                    desired_date = target_local_date + timedelta(days=1)
                desired_date = await self._find_first_available_date(
                    db,
                    upload['account_id'],
                    desired_date,
                    upload['id'],
                )
                await self._reschedule_upload(
                    db,
                    upload,
                    desired_date,
                    "was not aligned to 18:00 Europe/Madrid",
                )
                results['rescheduled'] += 1
                continue

            conflict = await self._has_upload_on_date(
                db,
                upload['account_id'],
                target_local_date,
                upload['id'],
            )
            if conflict:
                desired_date = await self._find_first_available_date(
                    db,
                    upload['account_id'],
                    target_local_date + timedelta(days=1),
                    upload['id'],
                )
                await self._reschedule_upload(
                    db,
                    upload,
                    desired_date,
                    "would exceed the 1 upload per day limit",
                )
                results['rescheduled'] += 1
                continue

            # Process upload if scheduled time has arrived
            if scheduled_for <= now_utc:
                try:
                    print(f"  - Upload {upload['id']} is due, processing now...")
                    res = await process_batch()  # No arguments, evitar error
                    results['processed'] += 1
                    results['successful'] += res.get('successful', 0)
                    results['failed'] += res.get('failed', 0)
                    print(f"  - Upload {upload['id']} processed successfully | Success: {res.get('successful', 0)}, Failed: {res.get('failed', 0)}")
                except Exception as e:
                    print(f"  - Failed to process upload {upload['id']}: {e}")
                    results['failed'] += 1

        return results

    async def run(self):
        self.running = True
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)

        print(f"[{datetime.now(timezone.utc)}] Worker starting...")
        print(f"Poll interval: {self.poll_interval}s, Batch size: {self.batch_size}")

        await get_db_pool()

        # Initial Roblox automation
        try:
            from roblox_scheduler import ensure_daily_roblox_video
            now_utc = datetime.now(timezone.utc)
            print(f"[{now_utc}] Running initial Roblox automation check...")
            await ensure_daily_roblox_video(now_utc)
            self.last_roblox_sync = now_utc
        except Exception as exc:
            print(f"[{datetime.now(timezone.utc)}] Initial Roblox automation error: {exc}")

        while self.running:
            try:
                now_utc = datetime.now(timezone.utc)
                print(f"[{now_utc}] Checking for due uploads...")

                # Roblox sync
                if now_utc - self.last_roblox_sync >= self.roblox_sync_interval:
                    try:
                        from roblox_scheduler import ensure_daily_roblox_video
                        await ensure_daily_roblox_video(now_utc)
                        print(f"  - Roblox automation completed successfully at {now_utc}")
                    except Exception as exc:
                        print(f"  - Roblox automation error: {exc}")
                    finally:
                        self.last_roblox_sync = now_utc

                await self.check_quota_reset()
                results = await self.process_batch_wrapper(self.batch_size)

                print(f"[{now_utc}] Batch summary: Processed={results['processed']}, Successful={results['successful']}, Failed={results['failed']}, Rescheduled={results['rescheduled']}")

                if self.running:
                    await asyncio.sleep(self.poll_interval)

            except Exception as e:
                print(f"[{datetime.now(timezone.utc)}] Error in worker loop: {e}")
                import traceback
                traceback.print_exc()
                if self.running:
                    await asyncio.sleep(30)

        print(f"[{datetime.now(timezone.utc)}] Closing database connections...")
        await close_db_pool()
        print(f"[{datetime.now(timezone.utc)}] Worker stopped.")


async def main():
    worker = Worker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
