"""
Product Scoring Algorithm

Assigns a 0–100 score to each (user, product) pair based on
aesthetic, palette, and vibe alignment.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from .config import (
    DEFAULT_CONFIG,
    MatchingConfig,
    PALETTE_COMPATIBILITY,
    VIBE_COMPATIBILITY,
)


@dataclass
class ScoreResult:
    """Detailed breakdown of a product's match score."""

    total: float = 0.0
    base: float = 0.0

    aesthetic_points: float = 0.0
    aesthetic_max: float = 0.0
    palette_points: float = 0.0
    palette_max: float = 0.0
    vibe_points: float = 0.0
    vibe_max: float = 0.0

    bonuses: Dict[str, float] = field(default_factory=dict)
    penalties: Dict[str, float] = field(default_factory=dict)

    # What matched / didn't
    matched_aesthetic: Optional[str] = None
    matched_palette: Optional[str] = None
    matched_vibe: Optional[str] = None
    partial_palette: bool = False
    partial_vibe: bool = False

    quality: str = "poor"  # poor | fair | good | excellent
    missing_data: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total": round(self.total, 1),
            "base": round(self.base, 1),
            "breakdown": {
                "aesthetic": {
                    "points": round(self.aesthetic_points, 1),
                    "max": round(self.aesthetic_max, 1),
                    "matched": self.matched_aesthetic,
                },
                "palette": {
                    "points": round(self.palette_points, 1),
                    "max": round(self.palette_max, 1),
                    "matched": self.matched_palette,
                    "partial": self.partial_palette,
                },
                "vibe": {
                    "points": round(self.vibe_points, 1),
                    "max": round(self.vibe_max, 1),
                    "matched": self.matched_vibe,
                    "partial": self.partial_vibe,
                },
            },
            "bonuses": self.bonuses,
            "penalties": self.penalties,
            "quality": self.quality,
            "missingData": self.missing_data,
        }


def score_product(
    user,
    product,
    config: MatchingConfig = DEFAULT_CONFIG,
    rejected_product_ids: Optional[Set[int]] = None,
) -> ScoreResult:
    """
    Score a single product for a user.

    Args:
        user: User model instance (needs .aesthetic, .palette, .vibe,
              .followed_brands, .silhouette)
        product: Product model instance (needs .ai_tags, .brand_id,
                 .is_new, .gender)
        config: Matching configuration
        rejected_product_ids: Product IDs the user has swiped left on

    Returns:
        ScoreResult with total score (0–100+) and detailed breakdown.
    """
    result = ScoreResult(
        aesthetic_max=config.weights.aesthetic,
        palette_max=config.weights.palette,
        vibe_max=config.weights.vibe,
    )

    ai_tags = product.ai_tags
    if not ai_tags:
        result.missing_data = True
        if config.require_ai_tags:
            return result
        ai_tags = {}

    # ── Gender filter ────────────────────────────────────────
    # Hard filter: if user specified a silhouette and the product
    # has a gender that doesn't match, score is 0.
    if user.silhouette and user.silhouette != "all" and product.gender:
        silhouette_to_gender = {
            "menswear": "mens",
            "womenswear": "womens",
        }
        required_gender = silhouette_to_gender.get(user.silhouette)
        if required_gender and product.gender not in (required_gender, "unisex"):
            return result

    # ── Aesthetic (up to config.weights.aesthetic pts) ────────
    product_aesthetics: List[str] = ai_tags.get("aesthetics", [])
    if user.aesthetic and product_aesthetics:
        if user.aesthetic in product_aesthetics:
            result.aesthetic_points = config.weights.aesthetic
            result.matched_aesthetic = user.aesthetic

    # ── Palette (up to config.weights.palette pts) ────────────
    product_palette: str = ai_tags.get("palette", "")
    if user.palette and product_palette:
        if user.palette == product_palette:
            result.palette_points = config.weights.palette
            result.matched_palette = product_palette
        elif product_palette in PALETTE_COMPATIBILITY.get(user.palette, set()):
            result.palette_points = config.weights.palette * 0.5
            result.matched_palette = product_palette
            result.partial_palette = True

    # ── Vibe (up to config.weights.vibe pts) ──────────────────
    product_vibes: List[str] = ai_tags.get("vibes", [])
    if user.vibe and product_vibes:
        if user.vibe in product_vibes:
            result.vibe_points = config.weights.vibe
            result.matched_vibe = user.vibe
        else:
            compatible = VIBE_COMPATIBILITY.get(user.vibe, set())
            overlap = compatible & set(product_vibes)
            if overlap:
                result.vibe_points = config.weights.vibe * 0.5
                result.matched_vibe = next(iter(overlap))
                result.partial_vibe = True

    # ── Base score ────────────────────────────────────────────
    result.base = result.aesthetic_points + result.palette_points + result.vibe_points
    result.total = result.base

    # ── Multiplicative bonuses ────────────────────────────────
    followed = user.followed_brands or []
    if followed and hasattr(product, "brand") and product.brand:
        brand_name = product.brand.name if hasattr(product.brand, "name") else str(product.brand)
        if brand_name in followed:
            multiplier = config.weights.brand_affinity
            bonus = result.total * (multiplier - 1)
            result.bonuses["brand_affinity"] = round(bonus, 1)
            result.total *= multiplier

    if getattr(product, "is_new", False):
        multiplier = config.weights.newness
        bonus = result.total * (multiplier - 1)
        result.bonuses["newness"] = round(bonus, 1)
        result.total *= multiplier

    # ── Penalties ─────────────────────────────────────────────
    if (
        config.penalize_rejected
        and rejected_product_ids
        and product.id in rejected_product_ids
    ):
        penalty = config.rejection_penalty
        result.penalties["rejected"] = penalty
        result.total = max(0, result.total - penalty)

    # ── Cap at 100 ────────────────────────────────────────────
    result.total = min(100.0, result.total)

    # ── Quality label ─────────────────────────────────────────
    if result.total >= config.filters.excellent_match:
        result.quality = "excellent"
    elif result.total >= config.filters.good_match:
        result.quality = "good"
    elif result.total >= config.filters.min_score:
        result.quality = "fair"
    else:
        result.quality = "poor"

    return result
