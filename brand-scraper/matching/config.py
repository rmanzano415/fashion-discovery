"""
Matching Engine Configuration

Configurable weights, thresholds, and curation rules.
All values can be tuned without code changes.
"""

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class MatchingWeights:
    """Point allocation for scoring dimensions (must sum to 100)."""

    aesthetic: float = 40.0
    palette: float = 30.0
    vibe: float = 30.0

    # Multiplicative bonuses applied after base score
    brand_affinity: float = 1.15  # 15% boost for followed brands
    newness: float = 1.05  # 5% boost for products < 30 days old

    def validate(self):
        total = self.aesthetic + self.palette + self.vibe
        if abs(total - 100.0) > 0.01:
            raise ValueError(f"Weights must sum to 100, got {total}")


@dataclass
class FilterThresholds:
    """Score thresholds for filtering and classification."""

    min_score: float = 20.0
    good_match: float = 60.0
    excellent_match: float = 80.0


@dataclass
class CurationRules:
    """Rules governing zine diversity and presentation."""

    max_products: int = 12
    min_products: int = 3

    # No single category may exceed this fraction of the zine
    max_category_fraction: float = 0.4

    # No single brand may exceed this fraction
    max_brand_fraction: float = 0.5

    # Oversample factor: fetch this many more candidates than max_products
    # to have room for diversity selection
    oversample_factor: int = 4


@dataclass
class MatchingConfig:
    """Complete matching configuration."""

    weights: MatchingWeights = field(default_factory=MatchingWeights)
    filters: FilterThresholds = field(default_factory=FilterThresholds)
    curation: CurationRules = field(default_factory=CurationRules)

    # Only consider products that have been AI-tagged
    require_ai_tags: bool = True

    # Penalize products the user has swiped left on
    penalize_rejected: bool = True
    rejection_penalty: float = 30.0

    def validate(self):
        self.weights.validate()


# Singleton used by default across the engine
DEFAULT_CONFIG = MatchingConfig()


# ───────────────────────────────────────────────────────────────
# Palette compatibility matrix
#
# If user.palette != product.palette but user.palette is a key
# here and product.palette is in the set, award partial credit.
# ───────────────────────────────────────────────────────────────

PALETTE_COMPATIBILITY: Dict[str, set] = {
    "neutral": {"earth-tones", "monochrome", "muted", "black-and-white"},
    "monochrome": {"neutral", "black-and-white"},
    "earth-tones": {"neutral", "warm-tones", "muted"},
    "muted": {"neutral", "earth-tones", "pastels"},
    "warm-tones": {"earth-tones", "muted"},
    "pastels": {"muted"},
    "brights": {"jewel-tones", "neon"},
    "jewel-tones": {"brights", "warm-tones"},
    "neon": {"brights"},
    "black-and-white": {"neutral", "monochrome"},
}


# ───────────────────────────────────────────────────────────────
# Vibe compatibility matrix
#
# Same idea: partial credit for vibes that are stylistically
# adjacent to the user's stated vibe.
# ───────────────────────────────────────────────────────────────

VIBE_COMPATIBILITY: Dict[str, set] = {
    "understated": {"casual", "relaxed", "polished", "sophisticated"},
    "bold": {"edgy", "glamorous", "dressy", "artistic"},
    "casual": {"relaxed", "understated", "sporty", "youthful"},
    "sophisticated": {"polished", "dressy", "understated"},
    "polished": {"sophisticated", "dressy", "understated"},
    "edgy": {"bold", "artistic", "youthful"},
    "relaxed": {"casual", "understated", "cozy", "earthy"},
    "dressy": {"sophisticated", "polished", "glamorous"},
    "playful": {"youthful", "bold", "artistic"},
    "cozy": {"relaxed", "casual", "earthy"},
    "artistic": {"edgy", "bold", "playful"},
    "sporty": {"casual", "youthful"},
    "glamorous": {"dressy", "bold", "sophisticated"},
    "earthy": {"relaxed", "cozy"},
    "youthful": {"playful", "casual", "sporty"},
}
