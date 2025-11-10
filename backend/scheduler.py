"""
Job scheduler for processing uploads.
"""
from datetime import datetime
from typing import List, Dict, Any
from uuid import UUID
import models
from youtube_oauth import get_authorized_youtube_client
from pipeline import execute_pipeline, PipelineError
from quotas import pick_project_for_upload, track_quota_usage
import traceback


async def select_due_uploads(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Select uploads that are ready to process.
    """
    now = datetime.utcnow()
    uploads = await models.select_due_uploads(now, limit)
    return uploads


async def process_upload(upload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single upload job.
    Returns result with success status.
    """
    upload_id = upload['id']
    account_id = upload['account_id']
    source_video_id = upload['source_video_id']
    
    import uuid
    run_id = str(uuid.uuid4())
    
    try:
        print(f"[{run_id}] Processing upload {upload_id}")
        
        # Check quota availability
        project = await pick_project_for_upload()
        if not project:
            error = "No API projects with available quota"
            print(f"[{run_id}] {error}")
            await models.update_roblox_project_status_by_upload(upload_id, 'paused')
            await models.update_upload_status(
                upload_id,
                status='paused',
                run_id=run_id,
                error=error
            )
            return {
                'success': False,
                'upload_id': upload_id,
                'error': error,
                'should_retry': False
            }
        
        # Update status to uploading
        await models.update_upload_status(
            upload_id,
            status='uploading',
            run_id=run_id
        )
        
        # Get authorized YouTube client
        youtube, _ = await get_authorized_youtube_client(account_id)
        
        # Execute pipeline
        result = await execute_pipeline(
            youtube,
            source_video_id,
            upload['title'],
            upload['description'],
            upload['tags'] or []
        )
        
        # Track quota usage
        await track_quota_usage(project['id'])
        
        # Update status to done
        await models.update_upload_status(
            upload_id,
            status='done',
            run_id=run_id,
            youtube_video_id=result['video_id']
        )
        await models.update_roblox_project_status_by_upload(upload_id, 'uploaded')
        
        print(f"[{run_id}] Upload {upload_id} completed: {result['url']}")
        
        return {
            'success': True,
            'upload_id': upload_id,
            'youtube_video_id': result['video_id'],
            'url': result['url']
        }
    
    except PipelineError as e:
        error = f"Pipeline error: {str(e)}"
        print(f"[{run_id}] {error}")
        
        # Increment retry count
        retry_count = await models.increment_upload_retry(upload_id)
        
        if retry_count >= upload.get('max_retries', 3):
            # Max retries exceeded
            await models.update_upload_status(
                upload_id,
                status='failed',
                run_id=run_id,
                error=error
            )
            should_retry = False
            await models.update_roblox_project_status_by_upload(upload_id, 'failed')
        else:
            # Schedule retry
            await models.update_upload_status(
                upload_id,
                status='retry',
                run_id=run_id,
                error=error
            )
            should_retry = True
            await models.update_roblox_project_status_by_upload(upload_id, 'retry')
        
        return {
            'success': False,
            'upload_id': upload_id,
            'error': error,
            'should_retry': should_retry,
            'retry_count': retry_count
        }
    
    except Exception as e:
        error = f"Unexpected error: {str(e)}\n{traceback.format_exc()}"
        print(f"[{run_id}] {error}")
        
        # Increment retry count
        retry_count = await models.increment_upload_retry(upload_id)
        
        if retry_count >= upload.get('max_retries', 3):
            await models.update_upload_status(
                upload_id,
                status='failed',
                run_id=run_id,
                error=error
            )
            should_retry = False
            await models.update_roblox_project_status_by_upload(upload_id, 'failed')
        else:
            await models.update_upload_status(
                upload_id,
                status='retry',
                run_id=run_id,
                error=error
            )
            should_retry = True
            await models.update_roblox_project_status_by_upload(upload_id, 'retry')
        
        return {
            'success': False,
            'upload_id': upload_id,
            'error': error,
            'should_retry': should_retry,
            'retry_count': retry_count
        }


async def process_batch(batch_size: int = 5) -> Dict[str, Any]:
    """
    Process a batch of due uploads.
    Returns summary of processing results.
    """
    uploads = await select_due_uploads(batch_size)
    
    if not uploads:
        return {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'retrying': 0
        }
    
    results = {
        'processed': len(uploads),
        'successful': 0,
        'failed': 0,
        'retrying': 0,
        'uploads': []
    }
    
    for upload in uploads:
        result = await process_upload(upload)
        results['uploads'].append(result)
        
        if result['success']:
            results['successful'] += 1
        elif result.get('should_retry'):
            results['retrying'] += 1
        else:
            results['failed'] += 1
    
    return results

