from fastapi import APIRouter, Request, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models import APIKey
import httpx
import time

from app.middleware.auth import get_api_key_from_header

router = APIRouter(prefix="/gateway", tags=["gateway"])

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def api_gateway(
    path: str,
    request: Request,
    api_key: APIKey = Depends(get_api_key_from_header)
):
    # 1. Validation is now handled by the get_api_key_from_header dependency

    # 2. Check if this is a "Masked" key with an upstream
    if not api_key.upstream_url:
        return {
            "message": "Gateway received request",
            "path": path,
            "note": "This key is not configured for proxying to an upstream service."
        }

    # 3. Prepare Upstream Request
    upstream_full_url = f"{api_key.upstream_url.rstrip('/')}/{path}"
    
    # Copy headers from original request but replace/add the upstream secret
    headers = dict(request.headers)
    if api_key.upstream_key:
        # We assume the upstream expects Authorization or its own header
        # For flexibility, we'll add it as X-Upstream-Key and Authorization
        headers["X-API-Key"] = api_key.upstream_key 
        headers["Authorization"] = f"Bearer {api_key.upstream_key}"
    
    # Remove platform-specific headers
    headers.pop("host", None)
    headers.pop("content-length", None)

    # 4. Proxy the Request
    async with httpx.AsyncClient() as client:
        try:
            method = request.method
            content = await request.body()
            params = request.query_params
            
            upstream_response = await client.request(
                method,
                upstream_full_url,
                headers=headers,
                params=params,
                content=content,
                timeout=30.0
            )
            
            # 5. Return Upstream Response to User
            return Response(
                content=upstream_response.content,
                status_code=upstream_response.status_code,
                headers=dict(upstream_response.headers)
            )
            
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}")
