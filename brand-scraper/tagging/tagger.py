"""
Core tagging logic: Claude API calls with retry, parsing, and validation.
"""

import json
import re
from typing import Any, Dict, Optional, Tuple

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

import config as app_config
from .taxonomy import AiTags, classify_price_tier, repair_tags, validate_tags
from .prompt import build_system_message, build_user_message

# Lazy singleton client
_client = None


def get_client():
    """Get or create a lazy singleton Anthropic client."""
    global _client
    if _client is None:
        import anthropic

        _client = anthropic.Anthropic(api_key=app_config.ANTHROPIC_API_KEY)
    return _client


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences from Claude's response if present."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    match = re.match(r"^```(?:json)?\s*\n?(.*?)\n?\s*```$", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def call_claude(
    system: list,
    user_content: list,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Core API call to Claude with retry logic.

    Args:
        system: System message content blocks
        user_content: User message content blocks

    Returns:
        (parsed_dict, usage_dict) where usage_dict has input_tokens,
        output_tokens, and cache metrics.
    """
    client = get_client()
    model = getattr(app_config, "TAGGER_MODEL", "claude-sonnet-4-5-20250929")
    max_tokens = getattr(app_config, "TAGGER_MAX_TOKENS", 512)

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_content}],
    )

    raw_text = response.content[0].text
    cleaned = _strip_markdown_fences(raw_text)
    parsed = json.loads(cleaned)

    usage = {
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "cache_creation_input_tokens": getattr(
            response.usage, "cache_creation_input_tokens", 0
        ),
        "cache_read_input_tokens": getattr(
            response.usage, "cache_read_input_tokens", 0
        ),
    }

    return parsed, usage


def tag_product(
    name: str,
    brand: str,
    price: float,
    images: list,
    category: Optional[str] = None,
    description: Optional[str] = None,
    colors: Optional[list] = None,
    gender: Optional[str] = None,
) -> Tuple[AiTags, Dict[str, int]]:
    """
    Tag a product by its fields.

    Calls Claude API, parses response, repairs invalid enum values,
    and overrides price_tier deterministically.

    Returns:
        (AiTags instance, usage dict)
    """
    system = [build_system_message()]
    user_content = build_user_message(
        name=name,
        brand=brand,
        price=price,
        images=images,
        category=category,
        description=description,
        colors=colors,
        gender=gender,
    )

    parsed, usage = call_claude(system, user_content)

    # Override price_tier deterministically
    parsed["price_tier"] = classify_price_tier(price)

    # Attempt to repair invalid values
    parsed = repair_tags(parsed)

    # Validate
    is_valid, errors = validate_tags(parsed)
    if not is_valid:
        # Log but don't fail — partial tags are still useful
        import logging

        logger = logging.getLogger(__name__)
        logger.warning(f"Tag validation warnings for '{name}': {errors}")

    tags = AiTags.from_dict(parsed)
    return tags, usage


def tag_product_from_model(product) -> Tuple[AiTags, Dict[str, int]]:
    """
    Convenience wrapper to tag a SQLAlchemy Product instance.

    Args:
        product: Product model instance (with brand relationship loaded)

    Returns:
        (AiTags instance, usage dict)
    """
    brand_name = product.brand.name if product.brand else ""

    return tag_product(
        name=product.name,
        brand=brand_name,
        price=product.price,
        images=product.images or [],
        category=product.category,
        description=product.description,
        colors=product.colors,
        gender=product.gender,
    )
