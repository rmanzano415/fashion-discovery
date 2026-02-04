"""
Zine Curation

Takes ranked products and selects a diverse, visually-ordered
subset suitable for a personalized zine.
"""

import logging
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from .config import DEFAULT_CONFIG, MatchingConfig
from .ranker import RankedProduct, get_matched_products

logger = logging.getLogger("matching.curator")


class CuratedZine:
    """A curated collection of products ready for delivery."""

    def __init__(self, user_id: int, products: List[RankedProduct]):
        self.user_id = user_id
        self.products = products
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        category_counts: Counter = Counter()
        brand_counts: Counter = Counter()
        tier_counts: Counter = Counter()
        scores: List[float] = []

        for rp in self.products:
            tags = rp.product.ai_tags or {}
            category_counts[tags.get("category", "unknown")] += 1
            brand_name = (
                rp.product.brand.name
                if hasattr(rp.product, "brand") and rp.product.brand
                else "unknown"
            )
            brand_counts[brand_name] += 1
            tier_counts[tags.get("price_tier", "unknown")] += 1
            scores.append(rp.score)

        return {
            "userId": self.user_id,
            "products": [
                {**rp.to_dict(), "position": idx + 1}
                for idx, rp in enumerate(self.products)
            ],
            "metadata": {
                "totalProducts": len(self.products),
                "categories": dict(category_counts),
                "brands": dict(brand_counts),
                "priceTiers": dict(tier_counts),
                "averageScore": round(sum(scores) / len(scores), 1) if scores else 0,
                "scoreRange": (
                    [round(min(scores), 1), round(max(scores), 1)] if scores else []
                ),
                "createdAt": self.created_at,
            },
        }


def curate_zine(
    user_id: int,
    session: Session,
    config: MatchingConfig = DEFAULT_CONFIG,
    max_products: Optional[int] = None,
) -> CuratedZine:
    """
    Build a curated zine for a user.

    1. Oversample ranked products.
    2. Apply diversity selection (category, brand caps).
    3. Arrange for visual flow.

    Args:
        user_id: Target user.
        session: Database session.
        config: Matching config.
        max_products: Override ``config.curation.max_products``.

    Returns:
        CuratedZine with diverse, well-arranged products.
    """
    target = max_products or config.curation.max_products
    pool_size = target * config.curation.oversample_factor

    # Fetch a large pool of ranked products
    raw = get_matched_products(
        user_id=user_id,
        session=session,
        limit=pool_size,
        offset=0,
        config=config,
    )

    # Reconstruct RankedProduct objects from the ranked list.
    # get_matched_products returns dicts, but we need the original
    # Product objects for diversity logic.  Re-query is cheaper than
    # re-scoring so we re-use the internal path instead.
    pool = _build_pool(user_id, session, config, pool_size)

    if len(pool) < config.curation.min_products:
        logger.warning(
            "Only %d products above threshold for user %s (need %d)",
            len(pool),
            user_id,
            config.curation.min_products,
        )
        return CuratedZine(user_id, pool)

    selected = _apply_diversity_selection(pool, target, config)
    arranged = _arrange_for_visual_flow(selected)

    return CuratedZine(user_id, arranged)


# ───────────────────────────────────────────────────────────────
# Internal helpers
# ───────────────────────────────────────────────────────────────


def _build_pool(
    user_id: int,
    session: Session,
    config: MatchingConfig,
    pool_size: int,
) -> List[RankedProduct]:
    """Build a pool of RankedProduct objects (not dicts) for curation."""
    from models.user import User
    from models.product import Product
    from models.interaction import UserInteraction
    from sqlalchemy.orm import joinedload

    user = session.query(User).get(user_id)
    if not user:
        return []

    # Rejected IDs
    rejected_ids = set()
    if config.penalize_rejected:
        rows = (
            session.query(UserInteraction.product_id)
            .filter(
                UserInteraction.user_id == user_id,
                UserInteraction.action == "swipe_left",
            )
            .all()
        )
        rejected_ids = {r[0] for r in rows}

    q = (
        session.query(Product)
        .options(joinedload(Product.brand))
        .filter(Product.is_active == True)  # noqa: E712
        .filter(Product.availability == "in_stock")
    )
    if config.require_ai_tags:
        q = q.filter(Product.ai_tags.isnot(None))

    from .ranker import _SILHOUETTE_GENDERS
    allowed = _SILHOUETTE_GENDERS.get(user.silhouette or "all")
    if allowed:
        q = q.filter(
            (Product.gender.in_(allowed)) | (Product.gender.is_(None))
        )

    products = q.all()

    from .scorer import score_product

    ranked: List[RankedProduct] = []
    for product in products:
        result = score_product(user, product, config, rejected_ids)
        if result.total >= config.filters.min_score:
            ranked.append(RankedProduct(product, result))

    ranked.sort(key=lambda rp: rp.score, reverse=True)
    return ranked[:pool_size]


def _get_category(rp: RankedProduct) -> str:
    tags = rp.product.ai_tags or {}
    return tags.get("category", "unknown")


def _get_brand(rp: RankedProduct) -> str:
    if hasattr(rp.product, "brand") and rp.product.brand:
        return rp.product.brand.name if hasattr(rp.product.brand, "name") else "unknown"
    return "unknown"


def _apply_diversity_selection(
    pool: List[RankedProduct],
    target: int,
    config: MatchingConfig,
) -> List[RankedProduct]:
    """
    Greedy selection that maximises score while respecting diversity caps.

    For each slot, pick the highest-scoring candidate that doesn't
    violate category or brand fraction limits.
    """
    max_per_category = max(1, int(target * config.curation.max_category_fraction))
    max_per_brand = max(1, int(target * config.curation.max_brand_fraction))

    category_counts: Counter = Counter()
    brand_counts: Counter = Counter()
    selected: List[RankedProduct] = []
    deferred: List[RankedProduct] = []

    for rp in pool:
        if len(selected) >= target:
            break

        cat = _get_category(rp)
        brand = _get_brand(rp)

        if category_counts[cat] >= max_per_category:
            deferred.append(rp)
            continue
        if brand_counts[brand] >= max_per_brand:
            deferred.append(rp)
            continue

        selected.append(rp)
        category_counts[cat] += 1
        brand_counts[brand] += 1

    # Fill remaining slots from deferred items, preferring the
    # least-represented category first.
    if len(selected) < target and deferred:
        deferred.sort(
            key=lambda rp: (category_counts[_get_category(rp)], -rp.score),
        )
        for rp in deferred:
            if len(selected) >= target:
                break
            selected.append(rp)

    return selected


def _arrange_for_visual_flow(
    products: List[RankedProduct],
) -> List[RankedProduct]:
    """
    Re-order products for visual presentation.

    Strategy:
    - Lead with the highest-scoring product (hero item).
    - Then alternate categories as much as possible to keep
      the visual rhythm varied.
    """
    if len(products) <= 2:
        return products

    # Start with the hero (highest score – already first after selection)
    hero = products[0]
    remaining = list(products[1:])
    arranged = [hero]

    last_category = _get_category(hero)

    while remaining:
        # Prefer a product from a different category than the previous one
        best_idx = None
        for i, rp in enumerate(remaining):
            if _get_category(rp) != last_category:
                best_idx = i
                break

        if best_idx is None:
            best_idx = 0

        chosen = remaining.pop(best_idx)
        arranged.append(chosen)
        last_category = _get_category(chosen)

    return arranged
