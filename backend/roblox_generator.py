from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx

from deps import settings


class RobloxGeneratorClient:
    """Client wrapper for interacting with the Roblox video generator Supabase project."""

    def __init__(self):
        if not settings.supabase_url or not settings.supabase_service_role:
            raise ValueError("Supabase credentials are required for Roblox integration.")

        self.base_url = settings.supabase_url.rstrip("/")
        self.service_key = settings.supabase_service_role
        self.default_headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> httpx.Response:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method,
                url,
                params=params,
                json=json,
                headers=self.default_headers,
            )
        response.raise_for_status()
        return response

    async def get_account(self, account_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetch generator account by ID."""
        params = {
            "id": f"eq.{account_id}",
            "select": "*",
            "limit": 1,
        }
        response = await self._request("GET", "/rest/v1/accounts", params=params)
        data = response.json()
        if isinstance(data, list) and data:
            return data[0]
        return None

    async def create_account(self, name: str, background_url: Optional[str] = None) -> Dict[str, Any]:
        """Create a generator account."""
        payload = {"name": name}
        if background_url:
            payload["background_url"] = background_url
        response = await self._request("POST", "/rest/v1/accounts", json=payload)
        data = response.json()
        if isinstance(data, list):
            return data[0]
        return data

    async def ensure_account(
        self,
        *,
        account_id: Optional[UUID],
        name: str,
        background_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ensure a generator account exists; create if missing."""
        if account_id:
            existing = await self.get_account(account_id)
            if existing:
                return existing
        return await self.create_account(name, background_url)

    async def create_project(
        self,
        generator_account_id: UUID,
        *,
        top_text: str = "ROBLOX",
        bottom_text: str = "LIKE",
        video_duration: int = 60,
        status: str = "generating",
    ) -> Dict[str, Any]:
        """Create a video project for the worker to process."""
        payload = {
            "account_id": str(generator_account_id),
            "top_text": top_text,
            "bottom_text": bottom_text,
            "video_duration": video_duration,
            "status": status,
        }
        response = await self._request("POST", "/rest/v1/video_projects", json=payload)
        data = response.json()
        if isinstance(data, list):
            return data[0]
        return data

    async def get_projects_by_status(
        self,
        generator_account_id: UUID,
        statuses: List[str],
        *,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch projects filtered by status."""
        if not statuses:
            return []

        status_filter = "in.(" + ",".join(statuses) + ")"
        params = {
            "account_id": f"eq.{generator_account_id}",
            "status": status_filter,
            "select": "id, account_id, status, video_url, created_at, updated_at, primary_video_id, secondary_video_id, top_text, bottom_text, video_duration",
            "order": "created_at.desc",
            "limit": limit,
        }
        response = await self._request("GET", "/rest/v1/video_projects", params=params)
        data = response.json()
        if isinstance(data, list):
            return data
        return []

    async def update_project_status(
        self,
        project_id: UUID,
        status: str,
        *,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Update a project's status (e.g., mark as assigned or uploaded)."""
        payload: Dict[str, Any] = {"status": status}
        if extra_fields:
            payload.update(extra_fields)
        params = {
            "id": f"eq.{project_id}",
            "select": "*",
        }
        response = await self._request("PATCH", "/rest/v1/video_projects", params=params, json=payload)
        data = response.json()
        if isinstance(data, list):
            return data[0]
        return data


