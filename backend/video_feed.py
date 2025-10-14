"""
Video feed scanning and discovery.
SOLO descubre Shorts (≤60 segundos)
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from youtube_oauth import get_authorized_youtube_client
from youtube_client import search_channels, get_channel_videos
import models


async def scan_theme_for_videos(theme_slug: str, account_id: str) -> Dict[str, Any]:
    """
    Scan YouTube for SHORTS matching a theme.
    Uses search keywords from the theme to find relevant channels,
    then fetches recent Shorts from those channels.
    
    Returns summary of videos found and inserted.
    """
    # Get theme
    theme = await models.get_theme(theme_slug)
    if not theme:
        raise ValueError(f"Theme not found: {theme_slug}")
    
    # Get authorized YouTube client
    youtube, project_id = await get_authorized_youtube_client(account_id)
    
    search_keywords = theme.get('search_keywords', [])
    if not search_keywords:
        search_keywords = [f"{theme_slug} shorts"]
    
    all_channels = []
    all_videos = []
    
    # Search for channels using each keyword
    for keyword in search_keywords[:3]:  # Limit to avoid quota exhaustion
        channels = search_channels(youtube, keyword, max_results=5)
        all_channels.extend(channels)
    
    # Remove duplicates
    unique_channels = {ch['channel_id']: ch for ch in all_channels}
    
    # For each channel, get recent Shorts (≤60s)
    for channel_id, channel in unique_channels.items():
        videos = get_channel_videos(
            youtube,
            channel_id,
            published_after=datetime.utcnow() - timedelta(days=30),
            max_results=30
        )
        all_videos.extend(videos)
    
    # Insert/update videos in database
    inserted_count = 0
    for video in all_videos:
        try:
            await models.upsert_video(
                source_video_id=video['video_id'],
                title=video['title'],
                channel_title=video['channel_title'],
                thumbnail_url=video['thumbnail_url'],
                views=video['views'],
                duration_seconds=video['duration_seconds'],
                theme_slug=theme_slug
            )
            inserted_count += 1
        except Exception as e:
            print(f"Error inserting video {video['video_id']}: {e}")
    
    return {
        'theme': theme_slug,
        'channels_found': len(unique_channels),
        'videos_found': len(all_videos),
        'videos_inserted': inserted_count,
        'channels': list(unique_channels.values())[:10]  # Sample
    }


async def get_top_videos_for_theme(theme_slug: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get top unpicked videos for a theme, sorted by views.
    """
    videos = await models.list_videos(theme_slug, picked=False, limit=limit)
    return videos


async def pick_video_for_account(
    video_id: str,
    account_id: str,
    scheduled_for: datetime,
    custom_title: str = None,
    custom_description: str = None,
    custom_tags: List[str] = None
) -> Dict[str, Any]:
    """
    Pick a video for an account and schedule it for upload.
    """
    from uuid import UUID
    
    video_uuid = UUID(video_id)
    account_uuid = UUID(account_id)
    
    # Get video by ID (reliable fetch)
    video = await models.get_video_by_id(video_uuid)
    
    if not video:
        raise ValueError("Video not found")
    
    if video['picked']:
        raise ValueError("Video already picked")
    
    # Get theme for default tags
    theme = await models.get_theme(video['theme_slug'])
    
    # Prepare upload metadata
    title = custom_title or video['title']
    description = custom_description or f"Amazing content! Follow for more.\n\n{' '.join(theme.get('default_hashtags', []))}"
    tags = custom_tags or theme.get('default_hashtags', [])
    
    # Mark video as picked
    await models.mark_video_picked(video_uuid)
    
    # Create upload job
    upload = await models.create_upload(
        account_id=account_uuid,
        video_id=video_uuid,
        scheduled_for=scheduled_for,
        title=title,
        description=description,
        tags=tags
    )
    
    return upload


async def schedule_bulk_uploads(
    account_id: str,
    video_ids: List[str],
    start_date: datetime,
    uploads_per_day: int = 2
) -> List[Dict[str, Any]]:
    """
    Schedule multiple videos for an account over consecutive days.
    """
    from uuid import UUID
    import random
    
    account_uuid = UUID(account_id)
    account = await models.get_account(account_uuid)
    
    if not account:
        raise ValueError("Account not found")
    
    # Get upload times from account settings
    time_1 = account.get('upload_time_1', datetime.strptime('10:00:00', '%H:%M:%S').time())
    time_2 = account.get('upload_time_2', datetime.strptime('18:00:00', '%H:%M:%S').time())
    times = [time_1, time_2]
    
    uploads = []
    current_date = start_date.date()
    
    for i, video_id in enumerate(video_ids):
        day_offset = i // uploads_per_day
        time_index = i % uploads_per_day
        
        # Schedule date and time with jitter
        schedule_date = current_date + timedelta(days=day_offset)
        schedule_time = times[time_index]
        
        # Add ±30 min jitter
        jitter_minutes = random.randint(-30, 30)
        scheduled_datetime = datetime.combine(schedule_date, schedule_time) + timedelta(minutes=jitter_minutes)
        
        # Pick and schedule
        upload = await pick_video_for_account(
            video_id=video_id,
            account_id=account_id,
            scheduled_for=scheduled_datetime
        )
        uploads.append(upload)
    
    return uploads

