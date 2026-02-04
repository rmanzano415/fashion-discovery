"""
AI Product Tagging System

Claude vision-powered product classification for aesthetic, palette, vibe,
category, occasion, season, and color dimensions.
"""

from .taxonomy import AiTags, validate_tags, classify_price_tier
from .tagger import tag_product, tag_product_from_model
from .bulk import count_untagged, get_untagged_batch, run_bulk_tagger
from .batch import create_batch_jsonl, submit_batch, poll_batch, process_batch_results
from .cost import estimate_cost, CostTracker

__all__ = [
    "AiTags",
    "validate_tags",
    "classify_price_tier",
    "tag_product",
    "tag_product_from_model",
    "count_untagged",
    "get_untagged_batch",
    "run_bulk_tagger",
    "create_batch_jsonl",
    "submit_batch",
    "poll_batch",
    "process_batch_results",
    "estimate_cost",
    "CostTracker",
]
