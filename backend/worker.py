from __future__ import annotations
import asyncio
import signal
from datetime import datetime, timedelta, time as time_cls, timezone
from deps import settings, get_db_pool, close_db_pool
from scheduler import process_batch
from quotas import reset_all_quotas

SPAIN_OFFSET = timedelta(hours=1)  # UTC+1 por defecto, ajustar si hay horario de verano

class Worker:
    """Background worker for upload processing with scheduled handling."""

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

    async def get_due_uploads(self, db, limit):
        """Return pending and due scheduled uploads."""
        query = """
            SELECT * FROM uploads
            WHERE status IN ('pending', 'scheduled')
            ORDER BY scheduled_for ASC
            LIMIT $1
        """
        uploads = await db.fetch(query, limit)

        # Filtrar només els que ja són due (scheduled <= now)
        now_utc = datetime.now(timezone.utc)
        due_uploads = []
        for u in uploads:
            scheduled_for = u['scheduled_for']
            if isinstance(scheduled_for, str):
                if scheduled_for.endswith("Z"):
                    scheduled_for = scheduled_for[:-1] + "+00:00"
                scheduled_for = datetime.fromisoformat(scheduled_for)
            if scheduled_for.tzinfo is None:
                scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)
            u['scheduled_for'] = scheduled_for
            if scheduled_for <= now_utc or u['status'] == 'pending':
                due_uploads.append(u)

        print(f"[{now_utc}] Found {len(due_uploads)} pending/scheduled uploads:")
        for u in due_uploads:
            print(f"  - Upload ID {u['id']} | Account {u['account_id']} | Scheduled: {u['scheduled_for']} | Status: {u['status']}")
        return due_uploads

    async def process_batch_wrapper(self, batch_size):
        db = await get_db_pool()
        uploads = await self.get_due_uploads(db, batch_size)
        results = {'processed': 0, 'successful': 0, 'failed': 0, 'rescheduled': 0}

        for upload in uploads:
            now_utc = datetime.now(timezone.utc)
            scheduled_for = upload['scheduled_for']

            print(f"[{now_utc}] Processing upload {upload['id']} | Scheduled: {scheduled_for} | Account: {upload['account_id']}")

            # Comptar uploads del mateix compte avui
            today_start = datetime.combine(now_utc.date(), time_cls(0, 0, 0), tzinfo=timezone.utc)
            query_count = """
                SELECT COUNT(*) FROM uploads
                WHERE account_id = $1
                  AND scheduled_for >= $2
            """
            scheduled_count = await db.fetchval(query_count, upload['account_id'], today_start)
            print(f"  - Scheduled uploads today for account {upload['account_id']}: {scheduled_count}")

            # Reschedule si és massa aviat per l’hora
            if scheduled_for > now_utc and scheduled_count > 1:
                reschedule_day = scheduled_count - 1
                new_schedule = (today_start + timedelta(days=reschedule_day)).replace(hour=17, minute=0, tzinfo=timezone.utc)
                query_update = """
                    UPDATE uploads
                    SET status = 'skipped', scheduled_for = $1
                    WHERE id = $2
                """
                await db.execute(query_update, new_schedule, upload['id'])
                print(f"  - Upload {upload['id']} skipped, rescheduled for {new_schedule}")
                results['rescheduled'] += 1
                continue

            # Processar upload ja due
            try:
                print(f"  - Upload {upload['id']} is due, processing now...")
                res = await process_batch(upload_id=upload['id'])
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

        # Inicialitzar Roblox automation
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
