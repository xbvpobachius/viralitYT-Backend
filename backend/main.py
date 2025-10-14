"""
FastAPI main application with all routes.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import models
import youtube_oauth
import video_feed
import quotas
from deps import get_db_pool, close_db_pool, settings


app = FastAPI(
    title="Viralit-YT API",
    description="Multi-account YouTube Shorts publisher with quota rotation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:3000|https://viralityt-backend-production\.up\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Lifecycle events
@app.on_event("startup")
async def startup():
    """Initialize database connection pool on startup."""
    await get_db_pool()
    print("Database connection pool created")


@app.on_event("shutdown")
async def shutdown():
    """Close database connection pool on shutdown."""
    await close_db_pool()
    print("Database connection pool closed")


# Request/Response models
class CreateAPIProjectRequest(BaseModel):
    project_name: str
    client_id: str
    client_secret: str
    daily_quota: int = 10000


class StartOAuthRequest(BaseModel):
    project_id: str
    account_name: str
    theme_slug: str


class ScanThemeRequest(BaseModel):
    theme_slug: str
    account_id: str


class PickVideoRequest(BaseModel):
    video_id: str
    account_id: str
    scheduled_for: datetime
    custom_title: Optional[str] = None
    custom_description: Optional[str] = None
    custom_tags: Optional[List[str]] = None


class BulkScheduleItem(BaseModel):
    account_id: str
    video_id: str
    scheduled_for: datetime


class BulkScheduleRequest(BaseModel):
    uploads: List[BulkScheduleItem]


class UpdateAccountStatusRequest(BaseModel):
    active: bool


class UpdateUploadRequest(BaseModel):
    scheduled_for: Optional[datetime] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


# Health check
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Viralit-YT API",
        "status": "healthy",
        "version": "1.0.1"
    }


# API Projects endpoints
@app.post("/api-projects")
async def create_api_project(request: CreateAPIProjectRequest):
    """Create a new Google Cloud API project for quota rotation."""
    try:
        project = await models.create_api_project(
            request.project_name,
            request.client_id,
            request.client_secret,
            request.daily_quota
        )
        return project
    except Exception as e:
        print(f"Error creating API project: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")


@app.get("/api-projects")
async def list_api_projects():
    """List all API projects."""
    projects = await models.list_api_projects()
    return {"projects": projects}


# OAuth endpoints
@app.post("/auth/youtube/start")
async def start_youtube_oauth(request: StartOAuthRequest):
    """
    Start YouTube OAuth flow.
    Returns authorization URL to redirect user to.
    """
    try:
        result = await youtube_oauth.start_oauth_flow(
            UUID(request.project_id),
            request.account_name,
            request.theme_slug
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/auth/youtube/callback")
async def youtube_oauth_callback(code: str, state: str):
    """
    Handle OAuth callback from Google.
    Creates account and redirects to frontend.
    """
    try:
        result = await youtube_oauth.handle_oauth_callback(code, state)
        
        # Redirect to frontend dashboard with success message
        redirect_url = f"{settings.frontend_base_url}/dashboard?connected={result['account']['id']}"
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        # Redirect to frontend with error
        redirect_url = f"{settings.frontend_base_url}/onboarding?error={str(e)}"
        return RedirectResponse(url=redirect_url)


# Accounts endpoints
@app.get("/accounts")
async def list_accounts():
    """List all YouTube accounts."""
    accounts = await models.list_accounts()
    return {"accounts": accounts}


@app.get("/accounts/{account_id}")
async def get_account(account_id: str):
    """Get account details."""
    account = await models.get_account(UUID(account_id))
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Remove sensitive data
    account.pop('oauth_refresh_token', None)
    return account


@app.patch("/accounts/{account_id}/status")
async def update_account_status(account_id: str, request: UpdateAccountStatusRequest):
    """Pause or resume an account."""
    try:
        await models.update_account_status(UUID(account_id), request.active)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Themes endpoints
@app.get("/themes")
async def list_themes():
    """List all themes."""
    themes = await models.list_themes()
    return {"themes": themes}


@app.post("/themes/scan")
async def scan_theme(request: ScanThemeRequest):
    """
    Scan YouTube for videos matching a theme.
    Discovers channels and fetches recent Shorts.
    """
    try:
        result = await video_feed.scan_theme_for_videos(
            request.theme_slug,
            request.account_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Videos endpoints
@app.get("/videos")
async def list_videos(
    theme: str = Query(..., description="Theme slug"),
    state: str = Query("new", description="Video state: new, picked, or all"),
    limit: int = Query(50, ge=1, le=200)
):
    """List videos for a theme."""
    picked = None if state == "all" else (state == "picked")
    
    videos = await models.list_videos(theme, picked, limit)
    return {
        "videos": videos,
        "count": len(videos)
    }


@app.post("/videos/pick")
async def pick_video(request: PickVideoRequest):
    """
    Pick a video for an account and schedule it.
    """
    try:
        upload = await video_feed.pick_video_for_account(
            request.video_id,
            request.account_id,
            request.scheduled_for,
            request.custom_title,
            request.custom_description,
            request.custom_tags
        )
        return upload
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Uploads endpoints
@app.get("/uploads")
async def list_uploads(
    account_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500)
):
    """List uploads with optional filters."""
    account_uuid = UUID(account_id) if account_id else None
    uploads = await models.list_uploads(account_uuid, status, limit)
    return {
        "uploads": uploads,
        "count": len(uploads)
    }


@app.patch("/uploads/{upload_id}")
async def update_upload(upload_id: str, request: UpdateUploadRequest):
    """Update an upload's schedule or metadata."""
    try:
        updated = await models.update_upload(UUID(upload_id),
            scheduled_for=request.scheduled_for,
            title=request.title,
            description=request.description,
            tags=request.tags,
            status=request.status,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Upload not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/uploads/{upload_id}")
async def delete_upload(upload_id: str):
    """Delete an upload."""
    try:
        await models.delete_upload(UUID(upload_id))
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/uploads/schedule/bulk")
async def schedule_bulk_uploads(request: BulkScheduleRequest):
    """Schedule multiple uploads at once."""
    try:
        uploads = []
        for item in request.uploads:
            upload = await video_feed.pick_video_for_account(
                item.video_id,
                item.account_id,
                item.scheduled_for
            )
            uploads.append(upload)
        
        return {
            "success": True,
            "uploads": uploads,
            "count": len(uploads)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Dashboard & Metrics endpoints
@app.get("/dashboard/metrics")
async def get_dashboard_metrics():
    """
    Get dashboard metrics:
    - Uploads today, failures, etc.
    - Quota status
    - Account summary
    """
    try:
        # Get quota status
        quota_status = await quotas.get_quota_status()
        
        # Get upload stats
        today = datetime.utcnow().date()
        all_uploads = await models.list_uploads(limit=1000)
        
        uploads_today = [u for u in all_uploads if u['created_at'].date() == today]
        done_count = len([u for u in uploads_today if u['status'] == 'done'])
        failed_count = len([u for u in all_uploads if u['status'] == 'failed'])
        scheduled_count = len([u for u in all_uploads if u['status'] == 'scheduled'])
        
        # Get account stats
        accounts = await models.list_accounts()
        active_accounts = len([a for a in accounts if a['active']])
        
        return {
            "uploads_today": len(uploads_today),
            "uploads_done": done_count,
            "uploads_failed": failed_count,
            "uploads_scheduled": scheduled_count,
            "active_accounts": active_accounts,
            "total_accounts": len(accounts),
            "quota": quota_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Quota endpoints
@app.get("/quota/status")
async def get_quota_status():
    """Get current quota status across all projects."""
    status = await quotas.get_quota_status()
    return status


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

