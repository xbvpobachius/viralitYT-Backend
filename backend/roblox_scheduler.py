from __future__ import annotations
from datetime import datetime, timedelta, time as time_cls, timezone
from typing import Any, Dict, Optional, Set, List
from uuid import UUID
from urllib.parse import urlparse
from zoneinfo import ZoneInfo
import models
from roblox_generator import RobloxGeneratorClient

UPLOAD_STATUS_ACTIVE = ["pending", "scheduled", "retry", "uploading", "skipped"]
PROJECT_STATUSES_READY = ["completed"]
PROJECT_STATUSES_IN_PROGRESS = ["generating", "processing"]
RESCHEDULE_LOOKAHEAD_DAYS = 120
TARGET_UPLOAD_TIME = time_cls(18, 0, 0)
try:
    SPAIN_TZ = ZoneInfo("Europe/Madrid")
except Exception:
    print("[RobloxAutomation] Warning: Could not load Europe/Madrid timezone, falling back to UTC+1 without DST")
    SPAIN_TZ = timezone(timedelta(hours=1))

# ───── Helpers ─────
def make_aware(dt: datetime) -> Optional[datetime]:
    """Converts naive datetime to UTC-aware datetime"""
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
        return relative.lstrip("/")
    except Exception:
        return None

def _supabase_source_id(storage_path: str) -> str:
    return f"supabase:{storage_path}"


async def _normalize_future_schedule(account_id: UUID, now: datetime) -> None:
    """Reubica uploads futuros para garantizar solo 1 por día a las 18:00 hora España."""
    local_now = now.astimezone(SPAIN_TZ)
    start_local = datetime.combine(local_now.date(), time_cls(0, 0, 0), tzinfo=SPAIN_TZ)
    end_local = start_local + timedelta(days=RESCHEDULE_LOOKAHEAD_DAYS)
    start = start_local.astimezone(timezone.utc)
    end = end_local.astimezone(timezone.utc)

    upcoming = await models.get_account_uploads_between(
        account_id,
        start,
        end,
        statuses=UPLOAD_STATUS_ACTIVE,
    )

    def _scheduled_dt(upload: Dict[str, Any]) -> datetime:
        scheduled_for = make_aware(upload.get("scheduled_for"))
        return scheduled_for or now

    upcoming_sorted = sorted(upcoming, key=_scheduled_dt)
    reserved_dates: Set[datetime.date] = set()

    for upload in upcoming_sorted:
        scheduled_for = make_aware(upload.get("scheduled_for"))
        if not scheduled_for:
            continue

        scheduled_local = scheduled_for.astimezone(SPAIN_TZ)
        target_date = scheduled_local.date()

        if scheduled_local < local_now:
            target_date = local_now.date()

        safety_counter = 0
        while target_date in reserved_dates:
            target_date += timedelta(days=1)
            safety_counter += 1
            if safety_counter > RESCHEDULE_LOOKAHEAD_DAYS:
                break

        reserved_dates.add(target_date)

        desired_local = datetime.combine(target_date, time_cls(18, 0, 0), tzinfo=SPAIN_TZ)
        desired_utc = desired_local.astimezone(timezone.utc)

        if abs((desired_utc - scheduled_for).total_seconds()) > 60:
            await models.update_upload(upload["id"], scheduled_for=desired_utc)
            print(
                f"[RobloxAutomation] Rescheduled upload {upload['id']} to "
                f"{desired_local.isoformat()} to enforce 1-per-day"
            )

def _next_schedule_datetime(account: Dict[str, Any], now: datetime, has_upload_today: bool = False) -> datetime:
    """Calcula el següent datetime de upload, sempre aware UTC (18:00 hora España)"""
    target_time = TARGET_UPLOAD_TIME
    local_now = now.astimezone(SPAIN_TZ)
    target_today_local = datetime.combine(local_now.date(), target_time, tzinfo=SPAIN_TZ)

    if has_upload_today:
        return datetime.combine(local_now.date() + timedelta(days=1), target_time, tzinfo=SPAIN_TZ).astimezone(timezone.utc)

    if local_now < target_today_local:
        return target_today_local.astimezone(timezone.utc)

    return datetime.combine(local_now.date() + timedelta(days=1), target_time, tzinfo=SPAIN_TZ).astimezone(timezone.utc)

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
                generator_account_id = UUID(generator_account["id"])
                await models.set_account_generator_id(account_id, generator_account_id)
            except Exception as exc:
                print(f"[RobloxAutomation] Could not store generator account id for {account_id}: {exc}")
                continue

        if isinstance(generator_account_id, str):
            generator_account_id = UUID(generator_account_id)

        if not account.get("active", True):
            continue

        try:
            await _normalize_future_schedule(account_id, now)
        except Exception as exc:
            print(f"[RobloxAutomation] Failed to normalize schedule for {account_id}: {exc}")

        local_now = now.astimezone(SPAIN_TZ)
        today_start_local = datetime.combine(local_now.date(), time_cls(0, 0, 0), tzinfo=SPAIN_TZ)
        today_end_local = datetime.combine(local_now.date(), time_cls(23, 59, 59), tzinfo=SPAIN_TZ)
        today_start = today_start_local.astimezone(timezone.utc)
        today_end = today_end_local.astimezone(timezone.utc)

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

        target_local_date = schedule_datetime.astimezone(SPAIN_TZ).date()
        target_start_local = datetime.combine(target_local_date, time_cls(0, 0, 0), tzinfo=SPAIN_TZ)
        target_end_local = datetime.combine(target_local_date, time_cls(23, 59, 59), tzinfo=SPAIN_TZ)
        target_start = target_start_local.astimezone(timezone.utc)
        target_end = target_end_local.astimezone(timezone.utc)

        target_day_uploads = await models.get_account_uploads_between(
            account_id,
            target_start,
            target_end,
            statuses=UPLOAD_STATUS_ACTIVE + ["done"],
        )

        if target_day_uploads:
            print(f"[RobloxAutomation] Account {account_id} already has upload scheduled for {target_local_date}, skipping")
            continue

        try:
            completed_projects = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_READY, limit=40
            )
        except Exception:
            completed_projects = []

        usage_cache: Dict[str, bool] = {}

        async def _clip_already_used(clip_id: Optional[str]) -> bool:
            if not clip_id:
                return False
            if clip_id in usage_cache:
                return usage_cache[clip_id]
            used = await models.has_account_used_primary(account_id, clip_id)
            usage_cache[clip_id] = used
            return used

        candidates: List[Dict[str, Any]] = []
        for project in reversed(completed_projects):
            try:
                project_id = UUID(project["id"])
            except Exception:
                continue

            existing = await models.get_roblox_project(project_id)
            if existing and existing.get("status") in ("scheduled", "uploaded"):
                continue

            storage_path = _extract_storage_path(project.get("video_url", ""))
            if not storage_path:
                continue

            primary_video_id = project.get("primary_video_id")
            secondary_video_id = project.get("secondary_video_id")

            already_used = await _clip_already_used(primary_video_id)
            if not already_used:
                already_used = await _clip_already_used(secondary_video_id)

            candidates.append(
                {
                    "project": project,
                    "project_id": project_id,
                    "storage_path": storage_path,
                    "primary_video_id": primary_video_id,
                    "secondary_video_id": secondary_video_id,
                    "already_used": already_used,
                }
            )

        async def _schedule_from_candidate(candidate: Dict[str, Any]) -> bool:
            project = candidate["project"]
            project_id = candidate["project_id"]
            storage_path = candidate["storage_path"]
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
                primary_video_id=candidate["primary_video_id"],
                secondary_video_id=candidate["secondary_video_id"],
                status="scheduled",
                scheduled_for=schedule_datetime,
                upload_id=upload["id"],
            )

            try:
                await generator_client.update_project_status(project_id, "assigned")
            except Exception:
                pass
            return True

        scheduled_upload = False
        for allow_reuse in (False, True):
            if scheduled_upload:
                break
            for candidate in candidates:
                if not allow_reuse and candidate["already_used"]:
                    continue
                scheduled_upload = await _schedule_from_candidate(candidate)
                if scheduled_upload:
                    if allow_reuse and candidate["already_used"]:
                        print(
                            f"[RobloxAutomation] Account {account_id} reused short "
                            f"{candidate['primary_video_id'] or candidate['secondary_video_id']} "
                            "because all fresh clips were consumed"
                        )
                    break

        if not scheduled_upload:
            print(f"[RobloxAutomation] No generator projects ready for account {account_id}, will retry later")

        # Comprobar proyectos en progreso
        try:
            in_progress = await generator_client.get_projects_by_status(
                generator_account_id, PROJECT_STATUSES_IN_PROGRESS, limit=5
            )
        except Exception:
            in_progress = []

        # Mantener buffer de 2 projects en progreso
        if len(in_progress) < 2:
            projects_to_create = 2 - len(in_progress)
            for _ in range(projects_to_create):
                try:
                    await generator_client.create_project(generator_account_id)
                except Exception:
                    pass
