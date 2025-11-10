"""
Background worker for processing scheduled uploads.
Runs continuously, polling for due jobs.
"""
import asyncio
import signal
import sys
from datetime import datetime, timedelta
from deps import settings, get_db_pool, close_db_pool
from scheduler import process_batch
from quotas import reset_all_quotas


class Worker:
    """Background worker for upload processing."""
    
    def __init__(self):
        self.running = False
        self.poll_interval = settings.worker_poll_interval
        self.batch_size = settings.worker_batch_size
        self.roblox_sync_interval = timedelta(minutes=30)
        self.last_roblox_sync = datetime.min
    
    def handle_shutdown(self, signum, frame):
        """Handle graceful shutdown."""
        print(f"\nReceived signal {signum}, shutting down gracefully...")
        self.running = False
    
    async def check_quota_reset(self):
        """Check if it's time to reset daily quotas."""
        now = datetime.utcnow()
        
        # Reset at midnight UTC
        if now.hour == 0 and now.minute < 2:  # Within first 2 minutes of midnight
            print(f"[{now}] Resetting daily quotas...")
            try:
                await reset_all_quotas()
                print(f"[{now}] Quotas reset successfully")
            except Exception as e:
                print(f"[{now}] Error resetting quotas: {e}")
    
    async def run(self):
        """Main worker loop."""
        self.running = True
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        
        print(f"Worker starting...")
        print(f"Poll interval: {self.poll_interval}s")
        print(f"Batch size: {self.batch_size}")
        
        # Initialize database connection pool
        await get_db_pool()
        
        while self.running:
            try:
                now = datetime.utcnow()
                print(f"\n[{now}] Checking for due uploads...")
                
                # Run Roblox automation periodically
                if now - self.last_roblox_sync >= self.roblox_sync_interval:
                    try:
                        from roblox_scheduler import ensure_daily_roblox_video
                        await ensure_daily_roblox_video(now)
                    except Exception as exc:
                        print(f"[{now}] Roblox automation error: {exc}")
                    finally:
                        self.last_roblox_sync = now
                
                # Check quota reset
                await self.check_quota_reset()
                
                # Process batch of uploads
                results = await process_batch(self.batch_size)
                
                if results['processed'] > 0:
                    print(f"[{now}] Batch processed:")
                    print(f"  - Total: {results['processed']}")
                    print(f"  - Successful: {results['successful']}")
                    print(f"  - Failed: {results['failed']}")
                    print(f"  - Retrying: {results['retrying']}")
                else:
                    print(f"[{now}] No uploads due")
                
                # Sleep until next poll
                if self.running:
                    await asyncio.sleep(self.poll_interval)
            
            except Exception as e:
                print(f"Error in worker loop: {e}")
                import traceback
                traceback.print_exc()
                
                # Sleep before retrying
                if self.running:
                    await asyncio.sleep(30)
        
        # Cleanup
        print("Closing database connections...")
        await close_db_pool()
        print("Worker stopped.")


async def main():
    """Entry point for worker."""
    worker = Worker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())

