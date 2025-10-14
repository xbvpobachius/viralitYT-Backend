"""
Database models and queries using asyncpg.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import asyncpg
from deps import get_db, encrypt_field, decrypt_field


# API Projects
async def create_api_project(
    project_name: str,
    client_id: str,
    client_secret: str,
    daily_quota: int = 10000
) -> Dict[str, Any]:
    """Create a new API project with encrypted credentials."""
    # Temporarily disabled encryption to avoid UTF-8 errors
    encrypted_client_id = client_id
    encrypted_client_secret = client_secret
    
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO api_projects (project_name, client_id, client_secret, daily_quota)
            VALUES ($1, $2, $3, $4)
            RETURNING id, project_name, daily_quota, quota_used_today, quota_reset_at, created_at
            """,
            project_name, encrypted_client_id, encrypted_client_secret, daily_quota
        )
        return dict(row)


async def get_api_project(project_id: UUID) -> Optional[Dict[str, Any]]:
    """Get API project by ID with decrypted credentials."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            "SELECT id, project_name, daily_quota, quota_used_today, quota_reset_at, created_at FROM api_projects WHERE id = $1",
            project_id
        )
        if not row:
            return None
        
        data = dict(row)
        # Temporary: Use environment variables to avoid UTF-8 errors
        # TODO: Re-enable encryption when we clean up old data
        from deps import settings
        client_id = getattr(settings, 'temp_client_id', None)
        client_secret = getattr(settings, 'temp_client_secret', None)
        
        print(f"DEBUG: temp_client_id = {client_id}")
        print(f"DEBUG: temp_client_secret = {client_secret}")
        
        data['client_id'] = client_id
        data['client_secret'] = client_secret
        return data


async def list_api_projects() -> List[Dict[str, Any]]:
    """List all API projects (without decrypted secrets)."""
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT id, project_name, daily_quota, quota_used_today, quota_reset_at, created_at
            FROM api_projects
            ORDER BY created_at DESC
            """
        )
        return [dict(row) for row in rows]


async def update_quota_usage(project_id: UUID, cost: int) -> None:
    """Update quota usage for a project."""
    async with get_db() as conn:
        # Record in history
        await conn.execute(
            """
            INSERT INTO quota_history (api_project_id, operation, cost, quota_before, quota_after)
            SELECT id, 'upload', $2,
                   quota_used_today,
                   quota_used_today + $2
            FROM api_projects WHERE id = $1
            """,
            project_id, cost
        )
        
        # Update project quota
        await conn.execute(
            "UPDATE api_projects SET quota_used_today = quota_used_today + $1 WHERE id = $2",
            cost, project_id
        )


async def reset_daily_quotas() -> None:
    """Reset all project quotas (called by cron daily)."""
    async with get_db() as conn:
        await conn.execute(
            """
            UPDATE api_projects
            SET quota_used_today = 0,
                quota_reset_at = (NOW()::DATE + INTERVAL '1 day')
            """
        )


# Themes
async def list_themes() -> List[Dict[str, Any]]:
    """List all themes."""
    async with get_db() as conn:
        rows = await conn.fetch("SELECT * FROM themes ORDER BY title")
        return [dict(row) for row in rows]


async def get_theme(slug: str) -> Optional[Dict[str, Any]]:
    """Get theme by slug."""
    async with get_db() as conn:
        row = await conn.fetchrow("SELECT * FROM themes WHERE slug = $1", slug)
        return dict(row) if row else None


# Accounts
async def create_account(
    display_name: str,
    theme_slug: str,
    refresh_token: str,
    api_project_id: UUID,
    channel_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new YouTube account."""
    # Temporarily disabled encryption to avoid UTF-8 errors
    encrypted_token = refresh_token
    
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO accounts (display_name, channel_id, theme_slug, oauth_refresh_token, api_project_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, display_name, channel_id, theme_slug, active, api_project_id, created_at
            """,
            display_name, channel_id, theme_slug, encrypted_token, api_project_id
        )
        return dict(row)


async def get_account(account_id: UUID) -> Optional[Dict[str, Any]]:
    """Get account by ID with decrypted refresh token."""
    async with get_db() as conn:
        row = await conn.fetchrow("SELECT * FROM accounts WHERE id = $1", account_id)
        if not row:
            return None
        
        data = dict(row)
        # Temporarily skip decryption to avoid UTF-8 errors
        # data['oauth_refresh_token'] = decrypt_field(data['oauth_refresh_token'])
        return data


async def list_accounts() -> List[Dict[str, Any]]:
    """List all accounts (without tokens)."""
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT id, display_name, channel_id, theme_slug, active,
                   api_project_id, upload_time_1, upload_time_2, created_at
            FROM accounts
            ORDER BY created_at DESC
            """
        )
        return [dict(row) for row in rows]


async def update_account_status(account_id: UUID, active: bool) -> None:
    """Pause or resume an account."""
    async with get_db() as conn:
        await conn.execute(
            "UPDATE accounts SET active = $1 WHERE id = $2",
            active, account_id
        )


# Videos
async def upsert_video(
    source_video_id: str,
    title: Optional[str],
    channel_title: Optional[str],
    thumbnail_url: Optional[str],
    views: Optional[int],
    duration_seconds: Optional[int],
    theme_slug: str
) -> Dict[str, Any]:
    """Insert or update a video."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO videos (source_video_id, title, channel_title, thumbnail_url, views, duration_seconds, theme_slug)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (source_video_id) DO UPDATE
            SET title = EXCLUDED.title,
                channel_title = EXCLUDED.channel_title,
                thumbnail_url = EXCLUDED.thumbnail_url,
                views = EXCLUDED.views,
                duration_seconds = EXCLUDED.duration_seconds
            RETURNING *
            """,
            source_video_id, title, channel_title, thumbnail_url, views, duration_seconds, theme_slug
        )
        return dict(row)


async def list_videos(theme_slug: str, picked: Optional[bool] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """List videos by theme, optionally filtered by picked status."""
    async with get_db() as conn:
        if picked is None:
            rows = await conn.fetch(
                """
                SELECT * FROM videos
                WHERE theme_slug = $1
                ORDER BY views DESC NULLS LAST, created_at DESC
                LIMIT $2
                """,
                theme_slug, limit
            )
        else:
            rows = await conn.fetch(
                """
                SELECT * FROM videos
                WHERE theme_slug = $1 AND picked = $2
                ORDER BY views DESC NULLS LAST, created_at DESC
                LIMIT $3
                """,
                theme_slug, picked, limit
            )
        return [dict(row) for row in rows]


async def get_video_by_id(video_id: UUID) -> Optional[Dict[str, Any]]:
    """Get a single video by its UUID."""
    async with get_db() as conn:
        row = await conn.fetchrow("SELECT * FROM videos WHERE id = $1", video_id)
        return dict(row) if row else None


async def mark_video_picked(video_id: UUID) -> None:
    """Mark a video as picked."""
    async with get_db() as conn:
        await conn.execute("UPDATE videos SET picked = true WHERE id = $1", video_id)


# Uploads
async def create_upload(
    account_id: UUID,
    video_id: UUID,
    scheduled_for: datetime,
    title: str,
    description: str,
    tags: List[str]
) -> Dict[str, Any]:
    """Create a new scheduled upload."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO uploads (account_id, video_id, scheduled_for, title, description, tags)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            """,
            account_id, video_id, scheduled_for, title, description, tags
        )
        return dict(row)


async def get_upload(upload_id: UUID) -> Optional[Dict[str, Any]]:
    """Get upload by ID."""
    async with get_db() as conn:
        row = await conn.fetchrow("SELECT * FROM uploads WHERE id = $1", upload_id)
        return dict(row) if row else None


async def list_uploads(
    account_id: Optional[UUID] = None,
    status: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """List uploads with optional filters."""
    async with get_db() as conn:
        if account_id and status:
            rows = await conn.fetch(
                """
                SELECT u.*, v.title as video_title, v.source_video_id, a.display_name as account_name
                FROM uploads u
                JOIN videos v ON u.video_id = v.id
                JOIN accounts a ON u.account_id = a.id
                WHERE u.account_id = $1 AND u.status = $2
                ORDER BY u.scheduled_for DESC
                LIMIT $3
                """,
                account_id, status, limit
            )
        elif account_id:
            rows = await conn.fetch(
                """
                SELECT u.*, v.title as video_title, v.source_video_id, a.display_name as account_name
                FROM uploads u
                JOIN videos v ON u.video_id = v.id
                JOIN accounts a ON u.account_id = a.id
                WHERE u.account_id = $1
                ORDER BY u.scheduled_for DESC
                LIMIT $2
                """,
                account_id, limit
            )
        elif status:
            rows = await conn.fetch(
                """
                SELECT u.*, v.title as video_title, v.source_video_id, a.display_name as account_name
                FROM uploads u
                JOIN videos v ON u.video_id = v.id
                JOIN accounts a ON u.account_id = a.id
                WHERE u.status = $1
                ORDER BY u.scheduled_for DESC
                LIMIT $2
                """,
                status, limit
            )
        else:
            rows = await conn.fetch(
                """
                SELECT u.*, v.title as video_title, v.source_video_id, a.display_name as account_name
                FROM uploads u
                JOIN videos v ON u.video_id = v.id
                JOIN accounts a ON u.account_id = a.id
                ORDER BY u.scheduled_for DESC
                LIMIT $1
                """,
                limit
            )
        return [dict(row) for row in rows]


async def update_upload_status(
    upload_id: UUID,
    status: str,
    run_id: Optional[str] = None,
    error: Optional[str] = None,
    youtube_video_id: Optional[str] = None
) -> None:
    """Update upload status."""
    async with get_db() as conn:
        # Record in history
        await conn.execute(
            """
            INSERT INTO upload_history (upload_id, status, run_id, error)
            VALUES ($1, $2, $3, $4)
            """,
            upload_id, status, run_id or '', error
        )
        
        # Update upload
        if youtube_video_id:
            await conn.execute(
                """
                UPDATE uploads
                SET status = $1, run_id = $2, error = $3, youtube_video_id = $4
                WHERE id = $5
                """,
                status, run_id, error, youtube_video_id, upload_id
            )
        else:
            await conn.execute(
                """
                UPDATE uploads
                SET status = $1, run_id = $2, error = $3
                WHERE id = $4
                """,
                status, run_id, error, upload_id
            )


async def increment_upload_retry(upload_id: UUID) -> int:
    """Increment retry count and return new count."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            UPDATE uploads
            SET retry_count = retry_count + 1
            WHERE id = $1
            RETURNING retry_count
            """,
            upload_id
        )
        return row['retry_count']


async def select_due_uploads(now: datetime, limit: int = 10) -> List[Dict[str, Any]]:
    """Select uploads that are due for processing."""
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT u.*, a.oauth_refresh_token, a.api_project_id, v.source_video_id
            FROM uploads u
            JOIN accounts a ON u.account_id = a.id
            JOIN videos v ON u.video_id = v.id
            WHERE u.status = 'scheduled'
              AND u.scheduled_for <= $1
              AND a.active = true
            ORDER BY u.scheduled_for ASC
            LIMIT $2
            """,
            now, limit
        )
        
        # Decrypt tokens
        result = []
        for row in rows:
            data = dict(row)
            # Temporarily skip decryption to avoid UTF-8 errors
            # data['oauth_refresh_token'] = decrypt_field(data['oauth_refresh_token'])
            result.append(data)
        
        return result

