import aiohttp
import structlog
from app.config import settings

logger = structlog.get_logger()

# Retry configuration
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = [1, 3, 5]  # Exponential backoff


async def post_callback(endpoint: str, payload: dict) -> dict:
    """POST results to the API callback endpoint with retry logic.

    Args:
        endpoint: The callback endpoint path (e.g., "/api/ai-callback/sow-parsed")
        payload: The JSON payload to send

    Returns:
        The JSON response from the API

    Raises:
        aiohttp.ClientError: After all retries are exhausted
    """
    url = f"{settings.API_BASE_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "X-AI-Secret": settings.AI_CALLBACK_SECRET,
    }

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers, timeout=30) as response:
                    if response.status == 409 or response.status == 200:
                        body = await response.json()
                        if body.get("status") == "already_processed":
                            logger.info("callback_already_processed", endpoint=endpoint, url=url)
                            return body
                    response.raise_for_status()
                    body = await response.json()
                    logger.info("callback_success", endpoint=endpoint, status=response.status)
                    return body
        except (aiohttp.ClientError, TimeoutError) as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF_SECONDS[attempt]
                logger.warning(
                    "callback_retry",
                    endpoint=endpoint,
                    attempt=attempt + 1,
                    max_retries=MAX_RETRIES,
                    wait_seconds=wait,
                    error=str(e),
                )
            await __import__("asyncio").sleep(RETRY_BACKOFF_SECONDS[attempt])

    logger.error(
        "callback_failed",
        endpoint=endpoint,
        url=url,
        retries=MAX_RETRIES,
        error=str(last_error),
    )
    raise last_error
