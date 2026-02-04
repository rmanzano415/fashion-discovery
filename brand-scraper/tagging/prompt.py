"""
Prompt construction for Claude vision-based product tagging.

The system prompt is designed to be static (~1500 tokens) for prompt caching.
"""

from typing import Any, Dict, List, Optional

import config as app_config
from .taxonomy import (
    AESTHETICS,
    PALETTES,
    VIBES,
    CATEGORIES,
    OCCASIONS,
    SEASONS,
    PRICE_TIERS,
    COLOR_TEMPERATURES,
)

SYSTEM_PROMPT = f"""You are a fashion product tagger. Analyze the product image(s) and metadata, then classify it using EXACTLY the values below. Return ONLY valid JSON, no markdown fences.

## Taxonomy

**aesthetics** (pick 1-3): {', '.join(AESTHETICS)}

**palette** (pick 1): {', '.join(PALETTES)}

**vibes** (pick 1-3): {', '.join(VIBES)}

**category** (pick 1): {', '.join(CATEGORIES)}

**occasions** (pick 1-3): {', '.join(OCCASIONS)}

**season** (pick 1): {', '.join(SEASONS)}

**price_tier** (pick 1): {', '.join(PRICE_TIERS)}

**color_temperature** (pick 1): {', '.join(COLOR_TEMPERATURES)}

**primary_colors** (list 1-4 colors): Free-form lowercase color names (e.g. "navy", "cream", "olive")

**keywords** (list 3-6): Free-form descriptive keywords for search/matching (e.g. "linen", "oversized", "cropped")

## Output Format

Return a single JSON object:
{{
  "aesthetics": ["...", ...],
  "palette": "...",
  "vibes": ["...", ...],
  "category": "...",
  "occasions": ["...", ...],
  "season": "...",
  "price_tier": "...",
  "color_temperature": "...",
  "primary_colors": ["...", ...],
  "keywords": ["...", ...]
}}

Only use values from the taxonomy above for enum fields. Be precise and consistent."""


def build_system_message() -> Dict[str, Any]:
    """
    Build the system message with cache_control for prompt caching.

    The static system prompt benefits from Anthropic's prompt caching,
    reducing costs by ~90% on cache hits.
    """
    return {
        "type": "text",
        "text": SYSTEM_PROMPT,
        "cache_control": {"type": "ephemeral"},
    }


def build_image_content_block(url: str) -> Dict[str, Any]:
    """Build a URL-based image content block for Claude."""
    return {
        "type": "image",
        "source": {
            "type": "url",
            "url": url,
        },
    }


def build_image_content_block_base64(image_url: str) -> Optional[Dict[str, Any]]:
    """
    Fallback: download image and create a base64 content block.

    Used when URL-based image blocks fail (e.g., CDN restrictions).
    """
    import base64
    import requests

    try:
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "image/jpeg")
        if ";" in content_type:
            content_type = content_type.split(";")[0].strip()

        encoded = base64.b64encode(resp.content).decode("utf-8")

        return {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": content_type,
                "data": encoded,
            },
        }
    except Exception:
        return None


def build_user_message(
    name: str,
    brand: str,
    price: float,
    images: List[str],
    category: Optional[str] = None,
    description: Optional[str] = None,
    colors: Optional[List[str]] = None,
    gender: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Construct the user message content blocks (images + text).

    Limits to max TAGGER_MAX_IMAGES images and truncates description to 300 chars.
    """
    max_images = getattr(app_config, "TAGGER_MAX_IMAGES", 2)
    content = []

    # Add image blocks (up to max)
    for img_url in (images or [])[:max_images]:
        content.append(build_image_content_block(img_url))

    # Build text metadata
    text_parts = [
        f"Product: {name}",
        f"Brand: {brand}",
        f"Price: ${price:.2f}",
    ]

    if category:
        text_parts.append(f"Category: {category}")
    if gender:
        text_parts.append(f"Gender: {gender}")
    if colors:
        text_parts.append(f"Colors: {', '.join(colors[:5])}")
    if description:
        truncated = description[:300]
        if len(description) > 300:
            truncated += "..."
        text_parts.append(f"Description: {truncated}")

    content.append({
        "type": "text",
        "text": "\n".join(text_parts),
    })

    return content
