"""
Taxonomy definitions for AI product tagging.

All valid enum values for each tagging dimension, plus the AiTags dataclass
and validation utilities.
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple, Any


# ═══════════════════════════════════════════════════════════════
# VALID ENUM VALUES
# ═══════════════════════════════════════════════════════════════

AESTHETICS = [
    "minimalist",
    "maximalist",
    "streetwear",
    "preppy",
    "bohemian",
    "athletic",
    "classic",
    "avant-garde",
    "romantic",
    "grunge",
    "cottagecore",
    "coastal",
    "scandinavian",
    "western",
    "punk",
    "retro",
    "futuristic",
    "normcore",
]

PALETTES = [
    "neutral",
    "earth-tones",
    "pastels",
    "brights",
    "monochrome",
    "jewel-tones",
    "muted",
    "neon",
    "black-and-white",
    "warm-tones",
]

VIBES = [
    "casual",
    "dressy",
    "edgy",
    "playful",
    "sophisticated",
    "cozy",
    "bold",
    "understated",
    "artistic",
    "sporty",
    "glamorous",
    "earthy",
    "polished",
    "relaxed",
    "youthful",
]

CATEGORIES = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "bags",
    "accessories",
    "activewear",
    "swimwear",
]

OCCASIONS = [
    "everyday",
    "work",
    "going-out",
    "date-night",
    "formal",
    "vacation",
    "weekend",
    "active",
    "lounge",
    "special-occasion",
]

SEASONS = [
    "spring",
    "summer",
    "fall",
    "winter",
    "all-season",
]

PRICE_TIERS = [
    "budget",
    "mid-range",
    "premium",
    "luxury",
]

COLOR_TEMPERATURES = [
    "warm",
    "cool",
    "neutral",
]


# ═══════════════════════════════════════════════════════════════
# PRICE TIER CLASSIFICATION
# ═══════════════════════════════════════════════════════════════


def classify_price_tier(price: float) -> str:
    """
    Deterministic price tier classification. No API call needed.

    Thresholds:
        budget:    < $50
        mid-range: $50 - $149
        premium:   $150 - $399
        luxury:    >= $400
    """
    if price < 50:
        return "budget"
    elif price < 150:
        return "mid-range"
    elif price < 400:
        return "premium"
    else:
        return "luxury"


# ═══════════════════════════════════════════════════════════════
# AI TAGS DATACLASS
# ═══════════════════════════════════════════════════════════════


@dataclass
class AiTags:
    """Structured AI-generated tags for a product."""

    aesthetics: List[str] = field(default_factory=list)
    palette: str = ""
    vibes: List[str] = field(default_factory=list)
    category: str = ""
    occasions: List[str] = field(default_factory=list)
    season: str = ""
    price_tier: str = ""
    color_temperature: str = ""
    primary_colors: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON storage."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AiTags":
        """Create from dictionary (e.g., from JSON storage)."""
        if not data:
            return cls()
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered)


# ═══════════════════════════════════════════════════════════════
# VALIDATION
# ═══════════════════════════════════════════════════════════════

_ENUM_MAP = {
    "aesthetics": AESTHETICS,
    "palette": PALETTES,
    "vibes": VIBES,
    "category": CATEGORIES,
    "occasions": OCCASIONS,
    "season": SEASONS,
    "price_tier": PRICE_TIERS,
    "color_temperature": COLOR_TEMPERATURES,
}


def validate_tags(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate tag values against the taxonomy enums.

    Returns:
        (is_valid, list_of_errors)
    """
    errors = []

    for field_name, valid_values in _ENUM_MAP.items():
        value = data.get(field_name)
        if value is None:
            continue

        if isinstance(value, list):
            for v in value:
                if v not in valid_values:
                    errors.append(f"{field_name}: invalid value '{v}' (valid: {valid_values})")
        elif isinstance(value, str):
            if value and value not in valid_values:
                errors.append(f"{field_name}: invalid value '{value}' (valid: {valid_values})")

    return (len(errors) == 0, errors)


def repair_tag_value(value: str, valid_values: List[str]) -> Optional[str]:
    """
    Attempt to repair an invalid tag value by fuzzy matching.

    Tries lowercase matching and prefix matching.
    """
    lower = value.lower().strip()
    for v in valid_values:
        if v == lower:
            return v
    # Try prefix match
    for v in valid_values:
        if v.startswith(lower) or lower.startswith(v):
            return v
    return None


def repair_tags(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Attempt to repair invalid tag values in-place.
    Returns the repaired data dict.
    """
    for field_name, valid_values in _ENUM_MAP.items():
        value = data.get(field_name)
        if value is None:
            continue

        if isinstance(value, list):
            repaired = []
            for v in value:
                if v in valid_values:
                    repaired.append(v)
                else:
                    fixed = repair_tag_value(v, valid_values)
                    if fixed:
                        repaired.append(fixed)
            data[field_name] = repaired
        elif isinstance(value, str) and value and value not in valid_values:
            fixed = repair_tag_value(value, valid_values)
            if fixed:
                data[field_name] = fixed

    return data
