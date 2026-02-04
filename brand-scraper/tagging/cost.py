"""
Cost estimation and tracking for Claude API usage.

Based on Claude Sonnet 4.5 pricing.
"""

from typing import Any, Dict, Optional


# Claude Sonnet 4.5 pricing (per million tokens)
PRICE_INPUT_PER_M = 3.00
PRICE_OUTPUT_PER_M = 15.00
PRICE_CACHE_READ_PER_M = 0.30
PRICE_CACHE_WRITE_PER_M = 3.75

# Estimated tokens per product tagging request
EST_SYSTEM_TOKENS = 1500  # System prompt (cached after first call)
EST_USER_TOKENS = 800  # Images + metadata
EST_OUTPUT_TOKENS = 200  # JSON response


def estimate_cost(
    product_count: int,
    batch: bool = False,
    cache_hit_ratio: float = 0.95,
) -> Dict[str, Any]:
    """
    Estimate cost for tagging a given number of products.

    Args:
        product_count: Number of products to tag
        batch: Whether using Batch API (50% discount)
        cache_hit_ratio: Expected prompt cache hit rate (0.0 - 1.0)

    Returns:
        Dict with cost breakdown
    """
    if product_count == 0:
        return {"total": 0.0, "product_count": 0}

    cache_miss_count = max(1, int(product_count * (1 - cache_hit_ratio)))
    cache_hit_count = product_count - cache_miss_count

    # Cache write cost (first request / cache misses)
    cache_write_cost = (
        cache_miss_count * EST_SYSTEM_TOKENS / 1_000_000 * PRICE_CACHE_WRITE_PER_M
    )

    # Cache read cost (subsequent requests)
    cache_read_cost = (
        cache_hit_count * EST_SYSTEM_TOKENS / 1_000_000 * PRICE_CACHE_READ_PER_M
    )

    # User message input cost (never cached)
    input_cost = product_count * EST_USER_TOKENS / 1_000_000 * PRICE_INPUT_PER_M

    # Output cost
    output_cost = product_count * EST_OUTPUT_TOKENS / 1_000_000 * PRICE_OUTPUT_PER_M

    total = cache_write_cost + cache_read_cost + input_cost + output_cost

    if batch:
        total *= 0.5  # Batch API 50% discount

    return {
        "product_count": product_count,
        "batch_mode": batch,
        "cache_hit_ratio": cache_hit_ratio,
        "cache_write_cost": round(cache_write_cost, 4),
        "cache_read_cost": round(cache_read_cost, 4),
        "input_cost": round(input_cost, 4),
        "output_cost": round(output_cost, 4),
        "total": round(total, 4),
        "per_product": round(total / product_count, 4),
    }


class CostTracker:
    """Accumulates actual API usage across multiple calls."""

    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cache_creation_tokens = 0
        self.total_cache_read_tokens = 0
        self.call_count = 0

    def add_usage(self, usage: Dict[str, int]):
        """Add usage from a single API call."""
        self.total_input_tokens += usage.get("input_tokens", 0)
        self.total_output_tokens += usage.get("output_tokens", 0)
        self.total_cache_creation_tokens += usage.get("cache_creation_input_tokens", 0)
        self.total_cache_read_tokens += usage.get("cache_read_input_tokens", 0)
        self.call_count += 1

    def total_cost(self) -> float:
        """Calculate total cost from accumulated usage."""
        input_cost = self.total_input_tokens / 1_000_000 * PRICE_INPUT_PER_M
        output_cost = self.total_output_tokens / 1_000_000 * PRICE_OUTPUT_PER_M
        cache_write_cost = (
            self.total_cache_creation_tokens / 1_000_000 * PRICE_CACHE_WRITE_PER_M
        )
        cache_read_cost = (
            self.total_cache_read_tokens / 1_000_000 * PRICE_CACHE_READ_PER_M
        )
        return input_cost + output_cost + cache_write_cost + cache_read_cost

    def summary(self) -> Dict[str, Any]:
        """Return a summary of accumulated usage and costs."""
        return {
            "calls": self.call_count,
            "input_tokens": self.total_input_tokens,
            "output_tokens": self.total_output_tokens,
            "cache_creation_tokens": self.total_cache_creation_tokens,
            "cache_read_tokens": self.total_cache_read_tokens,
            "total_cost": round(self.total_cost(), 4),
        }
