"""
Batch API integration for high-volume, cost-effective tagging.

Uses Claude's Message Batches API for 50% cost savings on large runs.
"""

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import joinedload

import config as app_config
from models import Session, Product
from .prompt import build_system_message, build_user_message
from .taxonomy import AiTags, classify_price_tier, repair_tags
from .tagger import get_client, _strip_markdown_fences

logger = logging.getLogger(__name__)

BATCHES_DIR = Path(app_config.DATA_DIR) / "batches"
BATCHES_DIR.mkdir(exist_ok=True)


def create_batch_jsonl(
    max_products: Optional[int] = None,
    brand_slug: Optional[str] = None,
) -> Tuple[Path, int]:
    """
    Create a JSONL file for the Claude Batch API.

    Each line is a request object with a custom_id set to the product's DB id.

    Returns:
        (path_to_jsonl, number_of_requests)
    """
    session = Session()
    model = getattr(app_config, "TAGGER_MODEL", "claude-sonnet-4-5-20250929")
    max_tokens = getattr(app_config, "TAGGER_MAX_TOKENS", 512)

    try:
        query = (
            session.query(Product)
            .options(joinedload(Product.brand))
            .filter(Product.ai_tags.is_(None))
            .filter(Product.is_active.is_(True))
        )

        if brand_slug:
            from models import Brand
            brand = session.query(Brand).filter_by(slug=brand_slug).first()
            if brand:
                query = query.filter(Product.brand_id == brand.id)

        if max_products:
            query = query.limit(max_products)

        products = query.all()

        if not products:
            logger.info("No untagged products found for batch")
            return None, 0

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        jsonl_path = BATCHES_DIR / f"batch_{timestamp}.jsonl"

        system = [build_system_message()]

        with open(jsonl_path, "w") as f:
            for product in products:
                brand_name = product.brand.name if product.brand else ""
                user_content = build_user_message(
                    name=product.name,
                    brand=brand_name,
                    price=product.price,
                    images=product.images or [],
                    category=product.category,
                    description=product.description,
                    colors=product.colors,
                    gender=product.gender,
                )

                request = {
                    "custom_id": str(product.id),
                    "params": {
                        "model": model,
                        "max_tokens": max_tokens,
                        "system": system,
                        "messages": [{"role": "user", "content": user_content}],
                    },
                }

                f.write(json.dumps(request) + "\n")

        logger.info(f"Created batch JSONL with {len(products)} requests: {jsonl_path}")
        return jsonl_path, len(products)

    finally:
        session.close()


def submit_batch(jsonl_path: Path) -> str:
    """
    Submit a JSONL file to the Claude Message Batches API.

    Returns:
        batch_id string
    """
    client = get_client()

    with open(jsonl_path, "r") as f:
        requests = [json.loads(line) for line in f]

    batch = client.messages.batches.create(requests=requests)

    logger.info(f"Submitted batch: {batch.id} ({len(requests)} requests)")
    return batch.id


def poll_batch(
    batch_id: str,
    interval: Optional[int] = None,
) -> Any:
    """
    Poll a batch until it reaches a terminal state.

    Args:
        batch_id: The batch ID to poll
        interval: Seconds between polls (default from config)

    Returns:
        The completed batch object
    """
    client = get_client()
    if interval is None:
        interval = getattr(app_config, "TAGGER_BATCH_POLL_INTERVAL", 60)

    while True:
        batch = client.messages.batches.retrieve(batch_id)

        logger.info(
            f"Batch {batch_id}: status={batch.processing_status}, "
            f"succeeded={batch.request_counts.succeeded}, "
            f"errored={batch.request_counts.errored}, "
            f"processing={batch.request_counts.processing}"
        )

        if batch.processing_status == "ended":
            return batch

        time.sleep(interval)


def get_batch_status(batch_id: str) -> Dict[str, Any]:
    """Get current status of a batch without polling."""
    client = get_client()
    batch = client.messages.batches.retrieve(batch_id)

    return {
        "id": batch.id,
        "status": batch.processing_status,
        "created_at": str(batch.created_at),
        "ended_at": str(batch.ended_at) if batch.ended_at else None,
        "succeeded": batch.request_counts.succeeded,
        "errored": batch.request_counts.errored,
        "processing": batch.request_counts.processing,
        "expired": batch.request_counts.expired,
        "canceled": batch.request_counts.canceled,
    }


def process_batch_results(batch_id: str) -> Dict[str, Any]:
    """
    Download and apply batch results to the database.

    Returns:
        Summary dict with counts
    """
    client = get_client()
    session = Session()
    applied = 0
    errors = 0

    try:
        for result in client.messages.batches.results(batch_id):
            product_id = int(result.custom_id)

            if result.result.type == "succeeded":
                try:
                    message = result.result.message
                    raw_text = message.content[0].text
                    cleaned = _strip_markdown_fences(raw_text)
                    parsed = json.loads(cleaned)

                    # Override price_tier deterministically
                    product = session.query(Product).get(product_id)
                    if product:
                        parsed["price_tier"] = classify_price_tier(product.price)
                        parsed = repair_tags(parsed)
                        product.ai_tags = parsed
                        product.tagged_at = datetime.utcnow()
                        applied += 1
                    else:
                        logger.warning(f"Product {product_id} not found in DB")
                        errors += 1

                except (json.JSONDecodeError, IndexError, AttributeError) as e:
                    logger.error(f"Failed to parse result for product {product_id}: {e}")
                    errors += 1
            else:
                error_msg = getattr(result.result, "error", "unknown error")
                logger.error(f"Batch error for product {product_id}: {error_msg}")
                errors += 1

        session.commit()
        logger.info(f"Batch results applied: {applied} succeeded, {errors} errors")

        return {
            "batch_id": batch_id,
            "applied": applied,
            "errors": errors,
        }

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to process batch results: {e}")
        raise
    finally:
        session.close()
