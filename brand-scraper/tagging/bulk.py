"""
Bulk tagging: process untagged products in batches with crash-safe commits.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

from sqlalchemy.orm import joinedload

from models import Session, Product
from .tagger import tag_product_from_model
from .cost import CostTracker

logger = logging.getLogger(__name__)


def count_untagged(session=None) -> int:
    """Count products that haven't been tagged yet."""
    own_session = session is None
    if own_session:
        session = Session()
    try:
        return session.query(Product).filter(Product.ai_tags.is_(None)).count()
    finally:
        if own_session:
            session.close()


def get_untagged_batch(session, batch_size: int = 20) -> List[Product]:
    """
    Get a batch of untagged products with brand relationship eagerly loaded.

    Always queries from offset 0 since tagged products drop out of the filter.
    """
    return (
        session.query(Product)
        .options(joinedload(Product.brand))
        .filter(Product.ai_tags.is_(None))
        .filter(Product.is_active.is_(True))
        .limit(batch_size)
        .all()
    )


def run_bulk_tagger(
    batch_size: int = 20,
    max_products: Optional[int] = None,
    dry_run: bool = False,
    brand_slug: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Process untagged products in batches.

    Commits after each batch for crash safety. Tagged products naturally
    drop out of the ai_tags IS NULL query, so we always query from offset 0.

    Args:
        batch_size: Products per batch
        max_products: Maximum total products to process (None = all)
        dry_run: If True, only count and estimate costs
        brand_slug: Optional brand filter

    Returns:
        Summary dict with counts and cost info
    """
    session = Session()
    tracker = CostTracker()
    total_tagged = 0
    total_errors = 0
    failed_ids = set()  # Track failed product IDs to avoid infinite retry

    try:
        # Build base query for counting
        query = session.query(Product).filter(Product.ai_tags.is_(None))
        query = query.filter(Product.is_active.is_(True))

        if brand_slug:
            from models import Brand
            brand = session.query(Brand).filter_by(slug=brand_slug).first()
            if not brand:
                return {"error": f"Brand not found: {brand_slug}"}
            query = query.filter(Product.brand_id == brand.id)

        untagged_count = query.count()
        target_count = min(untagged_count, max_products) if max_products else untagged_count

        logger.info(f"Found {untagged_count} untagged products, targeting {target_count}")

        if dry_run:
            from .cost import estimate_cost
            estimate = estimate_cost(target_count)
            return {
                "dry_run": True,
                "untagged_count": untagged_count,
                "target_count": target_count,
                "cost_estimate": estimate,
            }

        while total_tagged < target_count:
            remaining = target_count - total_tagged
            current_batch_size = min(batch_size, remaining)

            # Re-query untagged products (tagged ones drop out)
            batch_query = (
                session.query(Product)
                .options(joinedload(Product.brand))
                .filter(Product.ai_tags.is_(None))
                .filter(Product.is_active.is_(True))
            )
            if brand_slug:
                batch_query = batch_query.filter(Product.brand_id == brand.id)
            if failed_ids:
                batch_query = batch_query.filter(~Product.id.in_(failed_ids))

            products = batch_query.limit(current_batch_size).all()

            if not products:
                logger.info("No more untagged products found")
                break

            batch_tagged = 0
            for product in products:
                try:
                    tags, usage = tag_product_from_model(product)
                    product.ai_tags = tags.to_dict()
                    product.tagged_at = datetime.utcnow()
                    tracker.add_usage(usage)
                    batch_tagged += 1
                    logger.info(
                        f"Tagged: {product.name[:50]} "
                        f"[{tags.category}] [{', '.join(tags.aesthetics)}]"
                    )
                except Exception as e:
                    total_errors += 1
                    failed_ids.add(product.id)
                    logger.error(f"Failed to tag product {product.id} ({product.name}): {e}")

            # Commit after each batch for crash safety
            session.commit()
            total_tagged += batch_tagged

            logger.info(
                f"Batch complete: {batch_tagged} tagged, "
                f"{total_tagged}/{target_count} total, "
                f"cost so far: ${tracker.total_cost():.4f}"
            )

        return {
            "tagged": total_tagged,
            "errors": total_errors,
            "cost": tracker.summary(),
        }

    except Exception as e:
        session.rollback()
        logger.error(f"Bulk tagger failed: {e}")
        raise
    finally:
        session.close()
