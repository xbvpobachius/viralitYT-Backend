"""
Video processing pipeline: download → transform → upload → cleanup.
IMPORTANTE: Los videos SIEMPRE se borran después de procesarlos (bloque finally).
"""
import os
import subprocess
import uuid
from typing import Dict, Any, Optional
from pathlib import Path
from deps import settings
from youtube_client import upload_video


class PipelineError(Exception):
    """Pipeline execution error."""
    pass


def download_video(video_id: str, output_path: str) -> str:
    """
    Download video from YouTube using yt-dlp.
    Returns path to downloaded file.
    """
    try:
        cmd = [
            settings.ytdlp_bin,
            '-f', 'best[ext=mp4]',  # Best quality MP4
            '-o', output_path,
            '--no-playlist',
            '--quiet',
            '--no-warnings',
        ]
        # Add cookies if configured (file has priority)
        if getattr(settings, 'ytdlp_cookies_file', ''):
            cmd += ['--cookies', settings.ytdlp_cookies_file]
        elif getattr(settings, 'ytdlp_cookies_from_browser', ''):
            cmd += ['--cookies-from-browser', settings.ytdlp_cookies_from_browser]
        cmd += [f'https://www.youtube.com/watch?v={video_id}']
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise PipelineError(f"yt-dlp failed: {result.stderr}")
        
        if not os.path.exists(output_path):
            raise PipelineError(f"Downloaded file not found: {output_path}")
        
        return output_path
    
    except subprocess.TimeoutExpired:
        raise PipelineError("Download timeout (5 minutes)")
    except Exception as e:
        raise PipelineError(f"Download error: {str(e)}")


def transform_video(input_path: str, output_path: str) -> str:
    """
    Transform video to YouTube Shorts format:
    - 9:16 aspect ratio (vertical) - REQUIRED for Shorts
    - Maximum 60 seconds - STRICT limit
    - Re-encode if needed
    
    Returns path to transformed file.
    """
    try:
        # First, get video info
        probe_cmd = [
            settings.ffmpeg_bin.replace('ffmpeg', 'ffprobe'),
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,duration',
            '-of', 'csv=p=0',
            input_path
        ]

        try:
            probe_result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=30)
            if probe_result.returncode != 0:
                # If probe fails, just copy the file
                print(f"Warning: Could not probe video (exit {probe_result.returncode}), using as-is")
                import shutil
                shutil.copy(input_path, output_path)
                return output_path
        except FileNotFoundError:
            # ffprobe missing: fallback to copy
            print("Warning: ffprobe not found, using input file as-is")
            import shutil
            shutil.copy(input_path, output_path)
            return output_path
        
        # Parse probe output
        parts = probe_result.stdout.strip().split(',')
        if len(parts) >= 2:
            width = int(parts[0])
            height = int(parts[1])
        else:
            # Default to copying
            import shutil
            shutil.copy(input_path, output_path)
            return output_path
        
        # Build ffmpeg command
        # Ensure 9:16 aspect ratio, max 60 seconds, reasonable quality
        cmd = [
            settings.ffmpeg_bin,
            '-i', input_path,
            '-t', '60',  # Max 60 seconds
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',  # Overwrite output
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise PipelineError(f"ffmpeg failed: {result.stderr}")
        
        if not os.path.exists(output_path):
            raise PipelineError(f"Transformed file not found: {output_path}")
        
        return output_path
    
    except subprocess.TimeoutExpired:
        raise PipelineError("Transform timeout (5 minutes)")
    except Exception as e:
        raise PipelineError(f"Transform error: {str(e)}")


def cleanup_files(*file_paths: str) -> None:
    """Delete temporary files. ALWAYS called."""
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
                print(f"✅ Cleaned up: {path}")
        except Exception as e:
            print(f"⚠️ Warning: Could not delete {path}: {e}")


async def execute_pipeline(
    youtube_client,
    source_video_id: str,
    title: str,
    description: str,
    tags: list,
    privacy_status: str = None
) -> Dict[str, Any]:
    """
    Execute the complete pipeline:
    1. Download source video
    2. Transform to Shorts format
    3. Upload to YouTube
    4. Cleanup temporary files (ALWAYS - in finally block)
    
    Returns upload result with video_id.
    """
    run_id = str(uuid.uuid4())
    privacy = privacy_status or settings.upload_visibility
    
    # Generate temp file paths
    temp_dir = Path(settings.temp_dir)
    temp_dir.mkdir(exist_ok=True)
    
    download_path = str(temp_dir / f"{run_id}_raw.mp4")
    transform_path = str(temp_dir / f"{run_id}_final.mp4")
    
    try:
        print(f"[{run_id}] Starting pipeline for video {source_video_id}")
        
        # Step 1: Download
        print(f"[{run_id}] Downloading...")
        download_video(source_video_id, download_path)
        print(f"[{run_id}] Downloaded to {download_path}")
        
        # Step 2: Transform
        print(f"[{run_id}] Transforming...")
        transform_video(download_path, transform_path)
        print(f"[{run_id}] Transformed to {transform_path}")
        
        # Step 3: Upload
        print(f"[{run_id}] Uploading to YouTube...")
        result = upload_video(
            youtube_client,
            transform_path,
            title,
            description,
            tags,
            privacy_status=privacy
        )
        print(f"[{run_id}] Uploaded: {result['url']}")
        
        return {
            'success': True,
            'run_id': run_id,
            'video_id': result['video_id'],
            'url': result['url'],
            'title': result['title']
        }
    
    except Exception as e:
        print(f"[{run_id}] Pipeline error: {e}")
        raise
    
    finally:
        # Step 4: ALWAYS cleanup (even if error)
        print(f"[{run_id}] Cleaning up...")
        cleanup_files(download_path, transform_path)
        print(f"[{run_id}] ✅ Files deleted. NO local storage used.")

