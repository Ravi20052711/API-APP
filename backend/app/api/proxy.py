from fastapi import APIRouter, Request, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models import APIKey, UsageLog
import httpx
import time
from datetime import datetime

from app.middleware.auth import get_api_key_from_header

router = APIRouter(prefix="/proxy", tags=["api-proxy"])

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def api_proxy(
    path: str,
    request: Request,
    api_key: APIKey = Depends(get_api_key_from_header),
    db: Session = Depends(get_db)
):
    # 1. Validation is handled by get_api_key_from_header

    # 2. Check if this is a "Masked" key with an upstream
    if not api_key.upstream_url:
        raise HTTPException(status_code=400, detail="This key is not configured for API proxying/transfers.")

    # 3. Prepare Upstream Request
    upstream_full_url = f"{api_key.upstream_url.rstrip('/')}/{path}"
    
    headers = dict(request.headers)
    if api_key.upstream_key:
        headers["X-API-Key"] = api_key.upstream_key 
        headers["Authorization"] = f"Bearer {api_key.upstream_key}"
    
    headers.pop("host", None)
    headers.pop("content-length", None)
    headers.pop("accept-encoding", None)
    if "accept-encoding" in headers:
        del headers["accept-encoding"]

    # 4. Proxy the Request and Track Usage
    start_time = time.time()
    async with httpx.AsyncClient() as client:
        try:
            upstream_response = await client.request(
                request.method,
                upstream_full_url,
                headers=headers,
                params=request.query_params,
                content=await request.body(),
                timeout=30.0
            )
            process_time = (time.time() - start_time) * 1000
            
            # LOG USAGE
            usage_log = UsageLog(
                api_key_id=api_key.id,
                user_id=api_key.user_id,
                endpoint=path,
                method=request.method,
                status_code=upstream_response.status_code,
                response_time_ms=process_time,
                ip_address=request.client.host
            )
            db.add(usage_log)
            db.commit()

            resp_headers = dict(upstream_response.headers)
            resp_headers.pop("content-encoding", None)
            resp_headers.pop("content-length", None)

            return Response(
                content=upstream_response.content,
                status_code=upstream_response.status_code,
                headers=resp_headers
            )
            
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}")
