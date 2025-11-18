from __future__ import annotations
from datetime import datetime, timedelta, time as time_cls, timezone
from typing import Any, Dict, Optional
from uuid import UUID
from urllib.parse import urlparse
import models
from roblox_generator import RobloxGeneratorClient

UPLOAD_STATUS_ACTIVE = ["scheduled", "retry", "uploading"]
PROJECT_STATUSES_READY = ["completed"]
PROJECT_STATUSES_IN_PROGRESS = ["generating", "processing"]
LOOKAHEAD_HOURS = 24

# ───── Helpers ─────
def make_aware(dt: datetime) -> datetime:
    """Convierte cualquier datetime naive a aware UTC"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def _extract_storage_path(public_url: str) -> Optional[str]:
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
    return f"supabase:{storage_path}"

def _next_schedule_datetime(account: Dict[str, Any], now: datetime, has_upload_today: bool = False) -> datetime:
    """Calcula el siguiente datetime de upload"""
    target_time = account.get("upload_time_1")
    if isinstance(target_time, datetime):
        target_time = target_time.time()
    if not target_time:
        target_time = time_cls(18, 0, 0)  # default 18:00

    target_today = datetime.combine(now.date(), target_time, tzinfo=timezone.utc)

    if has_upload_today:
        return datetime.combine(now.date() + timedelta(days=1), target_time, tzinfo=timezone.utc)

    if now < target_today:
        return target_today

    return datetime.combine(now.date() + timedelta(days=1), target_time, tzinfo=timezone.utc)

# ───── Principal ─────
async def ensure_daily_roblox_video(now: datetime) -> None:
    now = make_aware(now)
    try:
        generator_client = RobloxGeneratorClient()
    except ValueError:
        print("[RobloxAutomation] Supabase not configured, skipping automation")
        return

    accounts = await models.list_accounts_by_theme("roblox", active_only=True)
    print(f"[RobloxAutomation] Found {len(accounts)} active Roblox account(s) to check")

    for account in accounts:
        account_id: UUID = account["id"]
        generator_account_id = account.get("generator_account_id")
        background_url = None
        channel_name = account.get("display_name") or "Roblox Account"

        try:
            existing_by_name = await generator_client.get_account_by_name(channel_name)
            if existing_by_name:
                background_url = existing_by_name.get("background_url")
                if not generator_account_id:
                    generator_account_id = UUID(existing_by_name["id"])

            if generator_account_id:
                existing_gen_account = await generator_client.get_account(generator_account_id)
                if existing_gen_account and not background_url:
                    background_url = existing_gen_account.get("background_url")

            generator_account = await generator_client.ensure_account(
                account_id=generator_account_id,
                name=channel_name,
                background_url=background_url,
            )

            if background_url and generator_account.get("background_url") != background_url:
                try:
                    await generator_client._request(
                        "PATCH",
                        f"/rest/v1/accounts?id=eq.{generator_account['id']}",
                        json={"background_url": background_url}
                    )
                except Exception:
                    pass

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

        if not account.get("active", True):
            continue

        today_start = datetime.combine(now.date(), time_cls(0, 0, 0), tzinfo=timezone.utc)
        today_end = datetime.combine(now.date(), time_cls(23, 59, 59), tzinfo=timezone.utc)

        today_uploads = await models.get_account_uploads_between(
            account_id, today_start, today_end, statuses=UPLOAD_STATUS_ACTIVE
        )
        today_completed = await models.get_account_uploads_between(
            account_id, today_start, today_end, statuses=["done"]
        )
        has_upload_today = len(today_uploads) > 0 or len(today_completed) > 0

        needs_video_generation = False
        for upload in today_uploads:
            upload_scheduled_for = make_aware(upload.get("scheduled_for"))
            if upload_scheduled_for <= now + timedelta(minutes=5):
                upload_id = upload.get("id")
                try:
                    roblox_project = await models.get_roblox_project_by_upload(upload_id)
                    if not roblox_project or not roblox_project.get("video_url"):
                        needs_video_generation = True
                        break
                except Exception as exc:
                    print(f"[RobloxAutomation] Error checking upload {upload_id}: {exc}")
                    needs_video_generation = True
                    break

        if has_upload_today and not needs_video_generation:
            continue

        schedule_datetime = _next_schedule_datetime(account, now, has_upload_today=has_upload_today)

        try:
            completed_projects = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_READY, limit=20
            )
        except Exception:
            completed_projects = []

        for project in reversed(completed_projects):
            project_id = UUID(project["id"])
            existing = await models.get_roblox_project(project_id)
            if existing and existing.get("status") in ("scheduled", "uploaded"):
                continue

            storage_path = _extract_storage_path(project.get("video_url", ""))
            if not storage_path:
                continue

            primary_video_id = project.get("primary_video_id")
            secondary_video_id = project.get("secondary_video_id")
            if (primary_video_id and await models.has_account_used_primary(account_id, primary_video_id)) or \
               (secondary_video_id and await models.has_account_used_primary(account_id, secondary_video_id)):
                continue

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

            description = "Susbcribete! #pov #roblox"
            default_tags = ["#pov", "#roblox"]

            upload = await models.create_upload(
                account_id=account_id,
                video_id=video_record["id"],
                scheduled_for=schedule_datetime,
                title=description,
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
                secondary_video_id=secondary_video_id,
                status="scheduled",
                scheduled_for=schedule_datetime,
                upload_id=upload["id"],
            )

            try:
                await generator_client.update_project_status(project_id, "assigned")
            except Exception:
                pass
            break  # Solo scheduleamos un proyecto por cuenta

        # Comprobar proyectos en progreso
        try:
            in_progress = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_IN_PROGRESS, limit=5
            )
        except Exception:
            in_progress = []

        if len(in_progress) < 2:
            projects_to_create = 2 - len(in_progress)
            for i in range(projects_to_create):
                try:
                    await generator_client.create_project(generator_account_id)
                except Exception:
                    pass
