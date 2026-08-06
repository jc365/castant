"""
@file backend_client.py
@module orchestration/utils/backend_client
"""

import logging
from typing import Any

import httpx

from orchestration.config import BACKEND_API, SEND_TOKEN

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None


def _default_headers() -> dict[str, str]:
    headers: dict[str, str] = {}
    if SEND_TOKEN:
        headers["Authorization"] = f"Bearer {SEND_TOKEN}"
    return headers


async def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=BACKEND_API,
            timeout=30.0,
            headers=_default_headers(),
        )
    return _client


async def close_client():
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


async def patch_submission_metadata(submission_id: str, data: dict[str, Any]) -> dict:
    client = await get_client()
    resp = await client.patch(f"/submissions/{submission_id}/metadata", json=data)
    resp.raise_for_status()
    logger.info("Updated metadata for submission %s", submission_id)
    return resp.json()


async def get_submission(submission_id: str) -> dict:
    client = await get_client()
    resp = await client.get(f"/submissions/{submission_id}")
    resp.raise_for_status()
    return resp.json()


async def get_user(user_id: str) -> dict:
    client = await get_client()
    resp = await client.get(f"/users/{user_id}")
    resp.raise_for_status()
    return resp.json()


async def get_round(round_id: str) -> dict:
    client = await get_client()
    resp = await client.get(f"/rounds/{round_id}")
    resp.raise_for_status()
    return resp.json()
