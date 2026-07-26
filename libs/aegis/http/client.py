import httpx
from aegis.middleware.correlation import request_id_var

def get_async_client() -> httpx.AsyncClient:
    req_id = request_id_var.get("")
    headers = {}
    if req_id:
        headers["X-Request-ID"] = req_id

    transport = httpx.AsyncHTTPTransport(retries=3)
    return httpx.AsyncClient(timeout=10.0, headers=headers, transport=transport)
