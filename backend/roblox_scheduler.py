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


def _next_schedule_datetime(account: Dict[str, Any], now: datetime) -> datetime:
    """Compute the next upload datetime for the account (prefer same-day 18:00)."""
    target_time = account.get("upload_time_1")
    if isinstance(target_time, datetime):
        target_time = target_time.time()
    if not target_time:
        target_time = time_cls(18, 0, 0)

    candidate = datetime.combine(now.date(), target_time)

    if candidate <= now:
        # If the preferred slot has passed, schedule ASAP (in roughly 5 minutes)
        candidate = now + timedelta(minutes=5)

    return candidate


async def ensure_daily_roblox_video(now: datetime) -> None:
    """Ensure each Roblox account has a generated video scheduled per day."""
    try:
        generator_client = RobloxGeneratorClient()
    except ValueError:
        # Supabase not configured; skip automation
        return

    accounts = await models.list_accounts_by_theme("roblox", active_only=True)

    for account in accounts:
        account_id: UUID = account["id"]
        generator_account_id = account.get("generator_account_id")

        # Ensure generator account exists
        try:
            generator_account = await generator_client.ensure_account(
                account_id=generator_account_id,
                name=account.get("display_name") or "Roblox Account",
                background_url=None,
            )
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

        # Check existing upcoming uploads
        upcoming_uploads = await models.get_account_uploads_between(
            account_id,
            now,
            now + timedelta(hours=LOOKAHEAD_HOURS),
            statuses=UPLOAD_STATUS_ACTIVE,
        )
        if upcoming_uploads:
            continue

        # Try to find a completed project that hasn't been scheduled yet
        try:
            completed_projects = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_READY, limit=20
            )
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

            schedule_datetime = _next_schedule_datetime(account, now)

            description = "Susbcribete! #pov #roblox"
            default_tags = ["#pov", "#roblox"]

            upload = await models.create_upload(
                account_id=account_id,
                video_id=video_record["id"],
                scheduled_for=schedule_datetime,
                title=video_record.get("title") or "Roblox Short",
                description=description,
                tags=default_tags,
            )

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

        # Ensure there is always a project in progress for next day
        if not project_scheduled:
            try:
                in_progress = await generator_client.get_projects_by_status(
                    generator_account_id, PROJECT_STATUSES_IN_PROGRESS, limit=1
                )
            except Exception:
                in_progress = []

            if not in_progress:
                try:
                    await generator_client.create_project(generator_account_id)
                except Exception as exc:
                    print(f"[RobloxAutomation] Failed to queue new project for {account_id}: {exc}")

