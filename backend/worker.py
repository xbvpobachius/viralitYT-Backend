"""
Background worker for processing scheduled uploads.
Runs continuously, polling for due jobs.
"""
import asyncio
import signal
from datetime import datetime, timedelta, time as time_cls, timezone
from deps import settings, get_db_pool, close_db_pool
from scheduler import process_batch
from quotas import reset_all_quotas

SPAIN_OFFSET = timedelta(hours=1)  # UTC+1 per hora espanyola (ajustar horari estiu si cal)

class Worker:
    """Background worker for upload processing."""
    
    def __init__(self):
        self.running = False
        self.poll_interval = settings.worker_poll_interval
        self.batch_size = settings.worker_batch_size
        self.roblox_sync_interval = timedelta(minutes=5)
        self.last_roblox_sync = datetime.min.replace(tzinfo=timezone.utc)
    
    def handle_shutdown(self, signum, frame):
        """Handle graceful shutdown."""
        print(f"\nReceived signal {signum}, shutting down gracefully...")
        self.running = False
    
    async def check_quota_reset(self):
        """Check if it's time to reset daily quotas."""
        now = datetime.now(timezone.utc)
        if now.hour == 0 and now.minute < 2:
            print(f"[{now}] Resetting daily quotas...")
            try:
                await reset_all_quotas()
                print(f"[{now}] Quotas reset successfully")
            except Exception as e:
                print(f"[{now}] Error resetting quotas: {e}")
    
    async def get_due_uploads(self, db, limit):
        """Retorna uploads pendents sense processar."""
        query = """
            SELECT * FROM uploads
            WHERE status = 'pending'
            ORDER BY scheduled_for ASC
            LIMIT $1
        """
        uploads = await db.fetch(query, limit)
        print(f"[{datetime.now(timezone.utc)}] Found {len(uploads)} pending uploads")
        return uploads
    
    async def process_batch_wrapper(self, batch_size):
        """Process batch with skipping logic and distribute multiple uploads across days."""
        db = await get_db_pool()
        uploads = await self.get_due_uploads(db, batch_size)
        results = {'processed': 0, 'successful': 0, 'failed': 0, 'rescheduled': 0}

        for upload in uploads:
            now_utc = datetime.now(timezone.utc)

            # Convertim scheduled_for a aware UTC si no ho és
            scheduled_for = upload['scheduled_for']
            if scheduled_for.tzinfo is None:
                scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)

            today_start = datetime.combine(now_utc.date(), time_cls(0, 0, 0), tzinfo=timezone.utc)
            
            query_count = """
                SELECT COUNT(*) FROM uploads
                WHERE account_id = $1
                  AND scheduled_for >= $2
            """
            scheduled_count = await db.fetchval(query_count, upload['account_id'], today_start)
            
            if scheduled_count > 0:
                reschedule_day = scheduled_count
                new_schedule = (today_start + timedelta(days=reschedule_day)).replace(hour=17, minute=0, tzinfo=timezone.utc)
                query_update = """
                    UPDATE uploads
                    SET status = 'skipped', scheduled_for = $1
                    WHERE id = $2
                """
                await db.execute(query_update, new_schedule, upload['id'])
                print(f"[{now_utc}] Upload {upload['id']} skipped, rescheduled for {new_schedule}")
                results['rescheduled'] += 1
                continue

            if scheduled_for <= now_utc:
                print(f"[{now_utc}] Upload {upload['id']} is due (scheduled: {scheduled_for})")

            # Processa l'upload
            try:
                res = await process_batch(specific_upload=upload)
                results['processed'] += 1
                results['successful'] += res.get('successful', 0)
                results['failed'] += res.get('failed', 0)
                print(f"[{datetime.now(timezone.utc)}] Upload {upload['id']} processed successfully")
            except Exception as e:
                print(f"[{datetime.now(timezone.utc)}] Failed to process upload {upload['id']}: {e}")
                results['failed'] += 1

        return results

    async def run(self):
        """Main worker loop."""
        self.running = True
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        
        print(f"[{datetime.now(timezone.utc)}] Worker starting...")
        print(f"Poll interval: {self.poll_interval}s, Batch size: {self.batch_size}")
        
        await get_db_pool()
        
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
                
                if now_utc - self.last_roblox_sync >= self.roblox_sync_interval:
                    try:
                        from roblox_scheduler import ensure_daily_roblox_video
                        await ensure_daily_roblox_video(now_utc)
                    except Exception as exc:
                        print(f"[{now_utc}] Roblox automation error: {exc}")
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
