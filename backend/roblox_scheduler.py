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


#  ┌──────────────────────────────────────────────────────┐
#  │              *** FUNCIÓN FIXEADA ***                 │
#  └──────────────────────────────────────────────────────┘
def _next_schedule_datetime(account: Dict[str, Any], now: datetime, has_upload_today: bool = False) -> datetime:
    """
    Reglas correctas:
    - Hora objetivo: 18:00 (si no está definida)
    - Si AHORA < 18:00 → hoy a las 18:00
    - Si AHORA >= 18:00 → mañana a las 18:00
    - Si ya hay upload hoy → siempre mañana a las 18:00
    """

    # Obtener hora objetivo
    target_time = account.get("upload_time_1")
    if isinstance(target_time, datetime):
        target_time = target_time.time()
    if not target_time:
        target_time = time_cls(18, 0, 0)  # 18:00 por defecto

    target_today = datetime.combine(now.date(), target_time)

    # Si ya hay upload hoy → siempre mañana
    if has_upload_today:
        return datetime.combine(now.date() + timedelta(days=1), target_time)

    # Si aún no hemos llegado → hoy
    if now < target_today:
        return target_today

    # Si ya pasó → mañana
    return datetime.combine(now.date() + timedelta(days=1), target_time)


async def ensure_daily_roblox_video(now: datetime) -> None:
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
                if existing_gen_account:
                    if not background_url:
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

        today_start = datetime.combine(now.date(), time_cls(0, 0, 0))
        today_end = datetime.combine(now.date(), time_cls(23, 59, 59))

        today_uploads = await models.get_account_uploads_between(
            account_id, today_start, today_end, statuses=UPLOAD_STATUS_ACTIVE
        )
        today_completed = await models.get_account_uploads_between(
            account_id, today_start, today_end, statuses=["done"]
        )
        has_upload_today = len(today_uploads) > 0 or len(today_completed) > 0

        needs_video_generation = False
        if today_uploads:
            print(f"[RobloxAutomation] Checking {len(today_uploads)} upload(s) scheduled for today...")
            for upload in today_uploads:
                upload_scheduled_for = upload.get("scheduled_for")
                if isinstance(upload_scheduled_for, str):
                    from dateutil import parser
                    upload_scheduled_for = parser.parse(upload_scheduled_for)

                print(f"[RobloxAutomation] Checking upload {upload.get('id')} scheduled for {upload_scheduled_for} (now: {now})")

                if upload_scheduled_for <= now + timedelta(minutes=5):
                    upload_id = upload.get("id")
                    try:
                        roblox_project = await models.get_roblox_project_by_upload(upload_id)
                        print(f"[RobloxAutomation] Upload {upload_id} roblox_project: {roblox_project is not None}, video_url: {roblox_project.get('video_url') if roblox_project else None}")
                        if not roblox_project or not roblox_project.get("video_url"):
                            needs_video_generation = True
                            print(f"[RobloxAutomation] ✅ Upload {upload_id} scheduled for {upload_scheduled_for} needs video generation (no video_url)")
                            break
                        else:
                            print(f"[RobloxAutomation] Upload {upload_id} already has video_url, skipping")
                    except Exception as exc:
                        print(f"[RobloxAutomation] ❌ Error checking upload {upload_id}: {exc}")
                        import traceback
                        traceback.print_exc()
                        needs_video_generation = True
                        break

        if has_upload_today and not needs_video_generation:
            print(f"[RobloxAutomation] Account {account_id} already has uploads for today, skipping")
            continue

        schedule_datetime = _next_schedule_datetime(account, now, has_upload_today=has_upload_today)
        is_scheduled_for_today = schedule_datetime.date() == now.date()
        is_scheduled_for_now = schedule_datetime <= now + timedelta(minutes=5)

        if needs_video_generation and today_uploads:
            earliest_upload = min(today_uploads, key=lambda u: u.get("scheduled_for", now))
            upload_time = earliest_upload.get("scheduled_for")
            if isinstance(upload_time, str):
                from dateutil import parser
                upload_time = parser.parse(upload_time)
            is_scheduled_for_today = upload_time.date() == now.date()
            is_scheduled_for_now = upload_time <= now + timedelta(minutes=5)

        try:
            generating_projects = await generator_client.get_projects_by_status(
                generator_account_id, ["generating"], limit=5
            )
            print(f"[RobloxAutomation] Found {len(generating_projects)} project(s) with status 'generating' for account {account_id}")
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to check generating projects for {account_id}: {exc}")
            generating_projects = []

        try:
            completed_projects = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_READY, limit=20
            )
            print(f"[RobloxAutomation] Found {len(completed_projects)} completed project(s) for account {account_id}")
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to fetch projects for {account_id}: {exc}")
            completed_projects = []

        project_scheduled = False

        for project in reversed(completed_projects):
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
                title=description,
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

        if needs_video_generation or is_scheduled_for_today or is_scheduled_for_now:
            if len(generating_projects) == 0:
                try:
                    reason = "needs video generation" if needs_video_generation else ("now" if is_scheduled_for_now else "today")
                    print(f"[RobloxAutomation] Upload {reason} but no projects generating, creating new project immediately...")
                    new_project = await generator_client.create_project(generator_account_id)
                    print(f"[RobloxAutomation] ✅ Created new project {new_project.get('id')} with status 'generating' for account {account_id}")
                    print(f"[RobloxAutomation] The local generator will pick this up and process it immediately")
                except Exception as exc:
                    print(f"[RobloxAutomation] ❌ Failed to create urgent project for {account_id}: {exc}")
            else:
                reason = "needs video generation" if needs_video_generation else ("now" if is_scheduled_for_now else "today")
                print(f"[RobloxAutomation] Upload {reason} and {len(generating_projects)} project(s) already generating - local generator will process them")

        try:
            in_progress = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_IN_PROGRESS, limit=5
            )
            print(f"[RobloxAutomation] Found {len(in_progress)} project(s) in progress for account {account_id}")
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to check in-progress projects for {account_id}: {exc}")
            in_progress = []

        if len(in_progress) < 2:
            projects_to_create = 2 - len(in_progress)
            for i in range(projects_to_create):
                try:
                    print(f"[RobloxAutomation] Creating new project {i+1}/{projects_to_create} for account {account_id} to maintain buffer...")
                    new_project = await generator_client.create_project(generator_account_id)
                    print(f"[RobloxAutomation] Created new project {new_project.get('id')} for account {account_id}")
                except Exception as exc:
                    print(f"[RobloxAutomation] Failed to queue new project {i+1} for {account_id}: {exc}")
