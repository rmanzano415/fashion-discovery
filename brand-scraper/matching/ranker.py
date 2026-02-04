"""
Product Ranking

Batch-scores products for a user, applies filters, and returns
a sorted, paginated result set.
"""

import logging
from typing import Any, Dict, List, Optional, Set

from sqlalchemy.orm import Session, joinedload

from models.product import Product
from models.user import User
from models.interaction import UserInteraction

from .config import DEFAULT_CONFIG, MatchingConfig
from .scorer import ScoreResult, score_product

logger = logging.getLogger("matching.ranker")


class RankedProduct:
    """A product paired with its match score."""

    __slots__ = ("product", "score_result")

    def __init__(self, product: Product, score_result: ScoreResult):
        self.product = product
        self.score_result = score_result

    @property
    def score(self) -> float:
        return self.score_result.total

    def to_dict(self) -> Dict[str, Any]:
        d = self.product.to_dict()
        d["matchScore"] = round(self.score_result.total, 1)
        d["matchQuality"] = self.score_result.quality
        d["matchBreakdown"] = self.score_result.to_dict()
        return d


# ───────────────────────────────────────────────────────────────
# Silhouette → gender mapping
# ───────────────────────────────────────────────────────────────

_SILHOUETTE_GENDERS = {
    "menswear": {"mens", "unisex"},
    "womenswear": {"womens", "unisex"},
    "all": None,  # no filter
}


def _load_rejected_ids(session: Session, user_id: int) -> Set[int]:
    """Return product IDs the user has swiped left on."""
    rows = (
        session.query(UserInteraction.product_id)
        .filter(
            UserInteraction.user_id == user_id,
            UserInteraction.action == "swipe_left",
        )
        .all()
    )
    return {r[0] for r in rows}


def get_matched_products(
    user_id: int,
    session: Session,
    limit: int = 50,
    offset: int = 0,
    config: MatchingConfig = DEFAULT_CONFIG,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Score, filter, and rank products for a user.

    Args:
        user_id: User to match for (0 means use ``filters["_user"]``
                 as a transient User object for preview mode).
        session: SQLAlchemy session.
        limit: Max results to return after filtering.
        offset: Pagination offset.
        config: Matching configuration.
        filters: Optional dict with keys:
            - category (str): only include this category
            - min_price (float): minimum price
            - max_price (float): maximum price
            - _user (User): transient user for preview mode

    Returns:
        Dict with keys: userId, products, total, averageScore.
    """
    filters = filters or {}

    # ── Load user ─────────────────────────────────────────────
    if user_id == 0 and "_user" in filters:
        user = filters.pop("_user")
    else:
        user = session.query(User).get(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

    # ── Load rejection history ────────────────────────────────
    rejected_ids: Set[int] = set()
    if config.penalize_rejected and user_id != 0:
        rejected_ids = _load_rejected_ids(session, user_id)

    # ── Build product query ───────────────────────────────────
    q = (
        session.query(Product)
        .options(joinedload(Product.brand))
        .filter(Product.is_active == True)  # noqa: E712
        .filter(Product.availability == "in_stock")
    )

    if config.require_ai_tags:
        q = q.filter(Product.ai_tags.isnot(None))

    # Gender filter at DB level for efficiency
    allowed_genders = _SILHOUETTE_GENDERS.get(user.silhouette or "all")
    if allowed_genders:
        q = q.filter(
            (Product.gender.in_(allowed_genders)) | (Product.gender.is_(None))
        )

    # Optional filters
    if "category" in filters:
        # category lives inside ai_tags JSON, but we also have
        # Product.category column — use the column for DB-level filtering.
        q = q.filter(Product.category == filters["category"])

    if "min_price" in filters:
        q = q.filter(Product.price >= filters["min_price"])

    if "max_price" in filters:
        q = q.filter(Product.price <= filters["max_price"])

    products: List[Product] = q.all()
    logger.info("Scoring %d products for user %s", len(products), user_id)

    # ── Score each product ────────────────────────────────────
    ranked: List[RankedProduct] = []
    for product in products:
        result = score_product(
            user=user,
            product=product,
            config=config,
            rejected_product_ids=rejected_ids,
        )
        if result.total >= config.filters.min_score:
            ranked.append(RankedProduct(product, result))

    # ── Sort by score descending ──────────────────────────────
    ranked.sort(key=lambda rp: rp.score, reverse=True)
    total_matches = len(ranked)

    avg_score = 0.0
    if ranked:
        avg_score = sum(rp.score for rp in ranked) / len(ranked)

    # ── Paginate ──────────────────────────────────────────────
    page = ranked[offset : offset + limit]

    return {
        "userId": user_id,
        "products": [rp.to_dict() for rp in page],
        "total": total_matches,
        "averageScore": round(avg_score, 1),
    }
