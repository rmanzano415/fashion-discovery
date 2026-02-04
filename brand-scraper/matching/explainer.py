"""
Score Explainer

Produces human-readable explanations of why a product was
(or wasn't) matched for a given user.
"""

from typing import Any, Dict, List

from .config import DEFAULT_CONFIG, MatchingConfig
from .scorer import ScoreResult, score_product


def explain_match(
    user,
    product,
    config: MatchingConfig = DEFAULT_CONFIG,
) -> Dict[str, Any]:
    """
    Generate a full explanation of a product's match score.

    Args:
        user: User model instance.
        product: Product model instance.
        config: Matching configuration.

    Returns:
        Dict with score, quality, human-readable reasons, misses,
        and summaries of both user and product profiles.
    """
    result = score_product(user, product, config)
    ai_tags = product.ai_tags or {}

    reasons = _build_reasons(result, user, product, ai_tags)
    misses = _build_misses(result, user, ai_tags, config)

    return {
        "score": round(result.total, 1),
        "quality": result.quality,
        "reasons": reasons,
        "misses": misses,
        "breakdown": result.to_dict(),
        "productSummary": {
            "aesthetics": ai_tags.get("aesthetics", []),
            "palette": ai_tags.get("palette", ""),
            "vibes": ai_tags.get("vibes", []),
            "category": ai_tags.get("category", ""),
            "priceTier": ai_tags.get("price_tier", ""),
        },
        "userSummary": {
            "aesthetic": user.aesthetic,
            "palette": user.palette,
            "vibe": user.vibe,
            "followedBrands": user.followed_brands or [],
        },
    }


def _build_reasons(
    result: ScoreResult,
    user,
    product,
    ai_tags: Dict,
) -> List[str]:
    """Turn score breakdown into natural-language reason strings."""
    reasons: List[str] = []

    # Aesthetic
    if result.aesthetic_points == result.aesthetic_max and result.matched_aesthetic:
        reasons.append(
            f"Aesthetic match: \"{result.matched_aesthetic}\" aligns with your style"
        )
    elif result.aesthetic_points > 0:
        reasons.append(
            f"Partial aesthetic overlap via \"{result.matched_aesthetic}\""
        )

    # Palette
    if result.palette_points == result.palette_max and result.matched_palette:
        reasons.append(
            f"Palette match: \"{result.matched_palette}\" fits your color preferences"
        )
    elif result.partial_palette and result.matched_palette:
        reasons.append(
            f"Compatible palette: \"{result.matched_palette}\" works well with "
            f"\"{user.palette}\""
        )

    # Vibe
    if result.vibe_points == result.vibe_max and result.matched_vibe:
        reasons.append(
            f"Vibe match: \"{result.matched_vibe}\" is your kind of energy"
        )
    elif result.partial_vibe and result.matched_vibe:
        reasons.append(
            f"Compatible vibe: \"{result.matched_vibe}\" is close to "
            f"\"{user.vibe}\""
        )

    # Bonuses
    if "brand_affinity" in result.bonuses:
        brand_name = (
            product.brand.name
            if hasattr(product, "brand") and product.brand
            else "this brand"
        )
        reasons.append(f"Bonus: {brand_name} is a brand you follow")

    if "newness" in result.bonuses:
        reasons.append("Bonus: New arrival")

    # Penalties
    if "rejected" in result.penalties:
        reasons.append("Penalty: You previously passed on this product")

    return reasons


def _build_misses(
    result: ScoreResult,
    user,
    ai_tags: Dict,
    config: MatchingConfig,
) -> List[str]:
    """Explain dimensions where the product didn't match."""
    misses: List[str] = []

    if result.aesthetic_points == 0 and user.aesthetic:
        product_aesthetics = ai_tags.get("aesthetics", [])
        if product_aesthetics:
            misses.append(
                f"Aesthetic: You prefer \"{user.aesthetic}\" but product is "
                f"{', '.join(product_aesthetics)}"
            )
        else:
            misses.append("Aesthetic: No aesthetic data for this product")

    if result.palette_points == 0 and user.palette:
        product_palette = ai_tags.get("palette", "")
        if product_palette:
            misses.append(
                f"Palette: You prefer \"{user.palette}\" but product is "
                f"\"{product_palette}\""
            )
        else:
            misses.append("Palette: No palette data for this product")

    if result.vibe_points == 0 and user.vibe:
        product_vibes = ai_tags.get("vibes", [])
        if product_vibes:
            misses.append(
                f"Vibe: You prefer \"{user.vibe}\" but product is "
                f"{', '.join(product_vibes)}"
            )
        else:
            misses.append("Vibe: No vibe data for this product")

    if result.missing_data:
        misses.append("Product has not been AI-tagged yet")

    return misses
