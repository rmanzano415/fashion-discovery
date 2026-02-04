"""
Matching Engine

Scores, ranks, and curates products for personalized zine delivery.
"""

from .config import DEFAULT_CONFIG, MatchingConfig, MatchingWeights, CurationRules
from .scorer import score_product, ScoreResult
from .ranker import get_matched_products
from .curator import curate_zine, CuratedZine
from .explainer import explain_match

__all__ = [
    "DEFAULT_CONFIG",
    "MatchingConfig",
    "MatchingWeights",
    "CurationRules",
    "score_product",
    "ScoreResult",
    "get_matched_products",
    "curate_zine",
    "CuratedZine",
    "explain_match",
]
