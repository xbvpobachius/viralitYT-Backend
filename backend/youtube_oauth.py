"""
YouTube OAuth 2.0 flow and token management.
"""
from typing import Dict, Any, Optional
from uuid import UUID
import httpx
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from deps import settings
import models
from roblox_generator import RobloxGeneratorClient


SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
]


def create_oauth_flow(client_id: str, client_secret: str, state: str) -> Flow:
    """Create OAuth flow for YouTube authentication."""
    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.oauth_redirect_uri],
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=settings.oauth_redirect_uri
    )
    flow.state = state
    
    return flow


def _decode_oauth_state(state: str) -> Dict[str, Any]:
    """Decode the OAuth state string robustly into a dict.

    Accepts URL-safe base64 state; tolerates missing padding and encoding glitches.
    Raises ValueError with a user-friendly message on failure.
    """
    import base64
    import json

    if not state:
        raise ValueError("Invalid OAuth state. Please restart the connection.")

    # Ensure proper base64 padding
    padded_state = state
    missing_padding = len(padded_state) % 4
    if missing_padding:
        padded_state += '=' * (4 - missing_padding)

    raw_bytes = None
    # Try urlsafe b64 first, then standard b64 as fallback
    for decoder in (base64.urlsafe_b64decode, base64.b64decode):
        try:
            raw_bytes = decoder(padded_state.encode('ascii', errors='ignore'))
            break
        except Exception:
            continue

    if raw_bytes is None:
        raise ValueError("Invalid OAuth state. Please restart the connection.")

    # Try to interpret bytes as UTF-8 JSON, with a latin-1 fallback
    for encoding in ("utf-8", "latin-1"):
        try:
            return json.loads(raw_bytes.decode(encoding))
        except UnicodeDecodeError:
            continue
        except json.JSONDecodeError:
            break

    # Final attempt: sometimes state may already be JSON string
    try:
        return json.loads(state)
    except Exception:
        raise ValueError("Invalid OAuth state. Please restart the connection.")


async def start_oauth_flow(
    project_id: UUID,
    account_name: str,
    theme_slug: str
) -> Dict[str, Any]:
    """
    Start OAuth flow.
    Returns authorization URL and state.
    """
    project = await models.get_api_project(project_id)
    if not project:
        raise ValueError("API project not found")
    
    # Create state containing metadata
    import json
    import base64
    state_data = {
        "project_id": str(project_id),
        "account_name": account_name,
        "theme_slug": theme_slug
    }
    state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
    
    flow = create_oauth_flow(project['client_id'], project['client_secret'], state)
    
    authorization_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',  # Force consent to get refresh token
        state=state  # ensure Google roundtrips our custom state
    )
    
    return {
        "authorization_url": authorization_url,
        "state": state
    }


async def handle_oauth_callback(code: str, state: str) -> Dict[str, Any]:
    """
    Handle OAuth callback, exchange code for tokens, verify channel.
    Returns account data.
    """
    import json
    import base64
    
    # Decode state robustly
    try:
        state_data = _decode_oauth_state(state)
    except ValueError as err:
        # Surface a friendly error up the stack
        raise ValueError(str(err))
    project_id = UUID(state_data['project_id'])
    account_name = state_data['account_name']
    theme_slug = state_data['theme_slug']
    
    # Get project credentials
    project = await models.get_api_project(project_id)
    if not project:
        raise ValueError("API project not found")
    
    # Exchange code for tokens
    flow = create_oauth_flow(project['client_id'], project['client_secret'], state)
    flow.fetch_token(code=code)
    
    credentials = flow.credentials
    refresh_token = credentials.refresh_token
    
    if not refresh_token:
        raise ValueError("No refresh token received. User may have already authorized this app.")
    
    # Verify channel using YouTube API
    youtube = build('youtube', 'v3', credentials=credentials)
    channels_response = youtube.channels().list(
        part='snippet,contentDetails,statistics',
        mine=True
    ).execute()
    
    if not channels_response.get('items'):
        raise ValueError("No YouTube channel found for this account")
    
    channel = channels_response['items'][0]
    channel_id = channel['id']
    channel_title = channel['snippet']['title']
    
    # Create account in database
    account = await models.create_account(
        display_name=account_name or channel_title,
        theme_slug=theme_slug,
        refresh_token=refresh_token,
        api_project_id=project_id,
        channel_id=channel_id
    )

    # If this is a Roblox account, bootstrap the external generator immediately
    if theme_slug == "roblox":
        try:
            generator_client = RobloxGeneratorClient()
            generator_account = await generator_client.ensure_account(
                account_id=account.get("generator_account_id"),
                name=account.get("display_name") or channel_title,
            )

            generator_uuid = UUID(generator_account["id"])
            if not account.get("generator_account_id"):
                await models.set_account_generator_id(account["id"], generator_uuid)
                account["generator_account_id"] = generator_uuid

            in_progress = await generator_client.get_projects_by_status(
                generator_uuid, ["generating", "processing"], limit=1
            )
            if not in_progress:
                await generator_client.create_project(generator_uuid)
        except ValueError:
            # Supabase credentials missing; skip automatic bootstrap
            pass
        except Exception as exc:
            print(f"[RobloxAutomation] Bootstrap failed for account {account['id']}: {exc}")
    
    return {
        "account": account,
        "channel_id": channel_id,
        "channel_title": channel_title
    }


async def get_fresh_credentials(
    client_id: str,
    client_secret: str,
    refresh_token: str
) -> Credentials:
    """
    Get fresh credentials using refresh token.
    """
    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES
    )
    
    # Refresh the token
    from google.auth.transport.requests import Request
    credentials.refresh(Request())
    
    return credentials


async def get_authorized_youtube_client(account_id: UUID):
    """
    Get an authorized YouTube API client for an account.
    """
    account = await models.get_account(account_id)
    if not account:
        raise ValueError("Account not found")
    
    project = await models.get_api_project(account['api_project_id'])
    if not project:
        raise ValueError("API project not found")
    
    credentials = await get_fresh_credentials(
        project['client_id'],
        project['client_secret'],
        account['oauth_refresh_token']
    )
    
    youtube = build('youtube', 'v3', credentials=credentials)
    
    return youtube, project['id']

