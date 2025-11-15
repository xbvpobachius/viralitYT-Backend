from __future__ import annotations

from datetime import datetime, timedelta, time as time_cls
from typing import Any, Dict, Optional
from uuid import UUID
from urllib.parse import urlparse

import models
from roblox_generator import RobloxGeneratorClient

UPLOAD_STATUS_ACTIVE = ["scheduled", "retry", "uploading"]
PROJECT_STATUSES_READY = ["completed"]
PROJECT_STATUSES_IN_PROGRESS = ["generating", "processing"]
LOOKAHEAD_HOURS = 24


def _extract_storage_path(public_url: str) -> Optional[str]:
    """Convert a Supabase public URL into bucket/path reference."""
    if not public_url:
        return None
    try:
        parsed = urlparse(public_url)
        marker = "/storage/v1/object/public/"
        if marker in parsed.path:
            relative = parsed.path.split(marker, 1)[1]
        else:
            relative = parsed.path.lstrip("/")
        if relative.startswith("/"):
            relative = relative[1:]
        return relative
    except Exception:
        return None


def _supabase_source_id(storage_path: str) -> str:
    """Build source identifier for Supabase-stored videos."""
    return f"supabase:{storage_path}"


def _next_schedule_datetime(account: Dict[str, Any], now: datetime, has_upload_today: bool = False) -> datetime:
    """Compute the next upload datetime for the account.
    
    Rules:
    - Default target time is 18:00 (6 PM)
    - If target time has passed today AND no upload today, schedule immediately (now)
    - If it's past midnight, wait until 18:00 the next day (not today)
    - If target time hasn't passed today, schedule for today at target time
    """
    target_time = account.get("upload_time_1")
    if isinstance(target_time, datetime):
        target_time = target_time.time()
    if not target_time:
        target_time = time_cls(18, 0, 0)  # 6 PM default

    # Check if it's past midnight (00:00) but before target time
    midnight = time_cls(0, 0, 0)
    if now.time() >= midnight and now.time() < target_time:
        # It's past midnight but before target time, wait until target time the next day
        return datetime.combine(now.date() + timedelta(days=1), target_time)
    
    # Check if target time has passed today
    target_datetime_today = datetime.combine(now.date(), target_time)
    
    if target_datetime_today <= now:
        # Target time has passed today
        if not has_upload_today:
            # No upload today, schedule immediately (now)
            return now
        else:
            # Already has upload today, schedule for tomorrow at target time
            return datetime.combine(now.date() + timedelta(days=1), target_time)
    
    # Target time hasn't passed yet today, schedule for today at target time
    return target_datetime_today


async def ensure_daily_roblox_video(now: datetime) -> None:
    """Ensure each Roblox account has a generated video scheduled per day."""
    try:
        generator_client = RobloxGeneratorClient()
    except ValueError:
        # Supabase not configured; skip automation
        print("[RobloxAutomation] Supabase not configured, skipping automation")
        return

    accounts = await models.list_accounts_by_theme("roblox", active_only=True)
    print(f"[RobloxAutomation] Found {len(accounts)} active Roblox account(s) to check")

    for account in accounts:
        account_id: UUID = account["id"]
        generator_account_id = account.get("generator_account_id")

        # Ensure generator account exists and get background_url if it exists
        background_url = None
        channel_name = account.get("display_name") or "Roblox Account"
        
        try:
            # First, try to find an account by name that matches the channel name
            existing_by_name = await generator_client.get_account_by_name(channel_name)
            if existing_by_name:
                background_url = existing_by_name.get("background_url")
                # If we found an account by name, use its ID
                if not generator_account_id:
                    generator_account_id = UUID(existing_by_name["id"])
            
            # If we have a generator_account_id, try to get it
            if generator_account_id:
                existing_gen_account = await generator_client.get_account(generator_account_id)
                if existing_gen_account:
                    # Use background_url from name match if available, otherwise from ID match
                    if not background_url:
                        background_url = existing_gen_account.get("background_url")
            
            generator_account = await generator_client.ensure_account(
                account_id=generator_account_id,
                name=channel_name,
                background_url=background_url,
            )
            # Update background_url if it was set
            if background_url and generator_account.get("background_url") != background_url:
                # Update the account in Supabase to sync background_url
                try:
                    await generator_client._request(
                        "PATCH",
                        f"/rest/v1/accounts?id=eq.{generator_account['id']}",
                        json={"background_url": background_url}
                    )
                except Exception:
                    pass  # Non-critical, continue
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to ensure generator account for {account_id}: {exc}")
            continue

        if not generator_account_id:
            try:
                generator_uuid = UUID(generator_account["id"])
                await models.set_account_generator_id(account_id, generator_uuid)
                generator_account_id = generator_uuid
            except Exception as exc:
                print(f"[RobloxAutomation] Could not store generator account id for {account_id}: {exc}")
                continue

        if isinstance(generator_account_id, str):
            generator_account_id = UUID(generator_account_id)

        # Check if account is active (skip if paused)
        if not account.get("active", True):
            continue
        
        # Check if there's already an upload scheduled/completed for TODAY (only 1 per day)
        today_start = datetime.combine(now.date(), time_cls(0, 0, 0))
        today_end = datetime.combine(now.date(), time_cls(23, 59, 59))
        today_uploads = await models.get_account_uploads_between(
            account_id,
            today_start,
            today_end,
            statuses=UPLOAD_STATUS_ACTIVE,
        )
        # Also check for completed uploads today
        today_completed = await models.get_account_uploads_between(
            account_id,
            today_start,
            today_end,
            statuses=["done"],
        )
        has_upload_today = len(today_uploads) > 0 or len(today_completed) > 0
        
        if has_upload_today:
            # Already has an upload scheduled/completed for today, skip
            print(f"[RobloxAutomation] Account {account_id} already has {len(today_uploads)} active upload(s) and {len(today_completed)} completed upload(s) for today, skipping")
            continue

        # Calculate when the upload should be scheduled
        schedule_datetime = _next_schedule_datetime(account, now, has_upload_today=False)
        is_scheduled_for_today = schedule_datetime.date() == now.date()
        is_scheduled_for_now = schedule_datetime <= now + timedelta(minutes=5)  # Within 5 minutes
        
        # Try to find a completed project that hasn't been scheduled yet
        try:
            completed_projects = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_READY, limit=20
            )
            print(f"[RobloxAutomation] Found {len(completed_projects)} completed project(s) for account {account_id}")
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to fetch projects for {account_id}: {exc}")
            completed_projects = []

        project_scheduled = False

        for project in reversed(completed_projects):  # process oldest first
            project_id = UUID(project["id"])

            existing = await models.get_roblox_project(project_id)
            if existing and existing.get("status") in ("scheduled", "uploaded"):
                continue

            storage_path = _extract_storage_path(project.get("video_url", ""))
            if not storage_path:
                continue

            primary_video_id = project.get("primary_video_id")
            if primary_video_id and await models.has_account_used_primary(account_id, primary_video_id):
                continue

            secondary_video_id = project.get("secondary_video_id")
            if secondary_video_id and await models.has_account_used_primary(account_id, secondary_video_id):
                continue

            # Create or fetch video entry
            source_id = _supabase_source_id(storage_path)
            video_record = await models.upsert_video(
                source_video_id=source_id,
                title=project.get("top_text") or "Roblox Short",
                channel_title=None,
                thumbnail_url=None,
                views=None,
                duration_seconds=project.get("video_duration"),
                theme_slug="roblox",
                source_platform="generator",
            )

            print(f"[RobloxAutomation] Scheduling upload for account {account_id} at {schedule_datetime}")

            description = "Susbcribete! #pov #roblox"
            default_tags = ["#pov", "#roblox"]

            upload = await models.create_upload(
                account_id=account_id,
                video_id=video_record["id"],
                scheduled_for=schedule_datetime,
                title=description,  # Title same as description
                description=description,
                tags=default_tags,
            )
            print(f"[RobloxAutomation] Created upload {upload['id']} for account {account_id}")

            await models.mark_video_picked(video_record["id"])
            await models.insert_roblox_project(
                generator_project_id=project_id,
                account_id=account_id,
                video_id=video_record["id"],
                storage_path=storage_path,
                video_url=project.get("video_url"),
                primary_video_id=primary_video_id,
                secondary_video_id=project.get("secondary_video_id"),
                status="scheduled",
                scheduled_for=schedule_datetime,
                upload_id=upload["id"],
            )

            try:
                await generator_client.update_project_status(project_id, "assigned")
            except Exception as exc:
                print(f"[RobloxAutomation] Could not update project {project_id} status: {exc}")

            project_scheduled = True
            break
        
        # If no completed project available but upload is scheduled for today/now, create one immediately
        if not project_scheduled and (is_scheduled_for_today or is_scheduled_for_now):
            try:
                print(f"[RobloxAutomation] No completed projects available but upload scheduled for {'now' if is_scheduled_for_now else 'today'}, creating new project immediately...")
                new_project = await generator_client.create_project(generator_account_id)
                print(f"[RobloxAutomation] Created new project {new_project.get('id')} for account {account_id} to generate video for today")
            except Exception as exc:
                print(f"[RobloxAutomation] Failed to create urgent project for {account_id}: {exc}")

        # Always ensure there is at least one project in progress for future days
        # This ensures continuous video generation
        try:
            in_progress = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_IN_PROGRESS, limit=5
            )
            print(f"[RobloxAutomation] Found {len(in_progress)} project(s) in progress for account {account_id}")
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to check in-progress projects for {account_id}: {exc}")
            in_progress = []

        # Always maintain at least 2 projects in progress to ensure continuous generation
        if len(in_progress) < 2:
            projects_to_create = 2 - len(in_progress)
            for i in range(projects_to_create):
                try:
                    print(f"[RobloxAutomation] Creating new project {i+1}/{projects_to_create} for account {account_id} to maintain buffer...")
                    new_project = await generator_client.create_project(generator_account_id)
                    print(f"[RobloxAutomation] Created new project {new_project.get('id')} for account {account_id}")
                except Exception as exc:
                    print(f"[RobloxAutomation] Failed to queue new project {i+1} for {account_id}: {exc}")

