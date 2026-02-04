"""
Tests for the curation and diversity logic.
"""

import pytest
from types import SimpleNamespace

from matching.curator import (
    _apply_diversity_selection,
    _arrange_for_visual_flow,
    CuratedZine,
)
from matching.ranker import RankedProduct
from matching.scorer import ScoreResult
from matching.config import MatchingConfig, CurationRules


# ───────────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────────


def _rp(product_id, score, category="tops", brand_name="brandA"):
    """Build a minimal RankedProduct for testing."""
    result = ScoreResult()
    result.total = score
    result.base = score
    result.quality = "good"

    ai_tags = {"category": category, "price_tier": "mid-range"}
    product = SimpleNamespace(
        id=product_id,
        name=f"Product {product_id}",
        ai_tags=ai_tags,
        brand=SimpleNamespace(name=brand_name),
        to_dict=lambda _ai=ai_tags, _id=product_id, _bn=brand_name: {
            "id": str(_id),
            "name": f"Product {_id}",
            "brand": _bn,
            "aiTags": _ai,
        },
    )
    return RankedProduct(product, result)


# ───────────────────────────────────────────────────────────────
# Diversity selection tests
# ───────────────────────────────────────────────────────────────


class TestDiversitySelection:
    def test_respects_category_cap(self):
        config = MatchingConfig(
            curation=CurationRules(max_category_fraction=0.3, max_brand_fraction=1.0)
        )
        # 10 tops, 5 bottoms, 5 outerwear — cap tops at 30% of 10 = 3
        pool = [_rp(i, 95 - i, "tops") for i in range(10)]
        pool += [_rp(i + 10, 80 - i, "bottoms") for i in range(5)]
        pool += [_rp(i + 15, 75 - i, "outerwear") for i in range(5)]

        selected = _apply_diversity_selection(pool, target=10, config=config)

        tops = sum(1 for rp in selected if rp.product.ai_tags["category"] == "tops")
        # Initial pass caps tops at 3; relaxation may add more but
        # prefers underrepresented categories first
        assert tops <= 5  # Relaxation adds some, but bottoms/outerwear fill most slots

    def test_respects_brand_cap(self):
        config = MatchingConfig(
            curation=CurationRules(max_brand_fraction=0.5, max_category_fraction=1.0)
        )
        pool = [_rp(i, 90 - i, "tops", "same_brand") for i in range(10)]
        pool += [_rp(i + 10, 70 - i, "bottoms", "other_brand") for i in range(5)]

        selected = _apply_diversity_selection(pool, target=10, config=config)

        same = sum(1 for rp in selected if rp.product.brand.name == "same_brand")
        assert same <= 5  # 50% of 10

    def test_fills_slots_when_caps_restrict(self):
        config = MatchingConfig(
            curation=CurationRules(max_category_fraction=0.3)
        )
        # Only tops available — caps will restrict but relaxation fills remaining
        pool = [_rp(i, 90 - i, "tops") for i in range(20)]

        selected = _apply_diversity_selection(pool, target=10, config=config)

        # Should still return 10 products (relaxation kicks in)
        assert len(selected) == 10

    def test_handles_pool_smaller_than_target(self):
        config = MatchingConfig()
        pool = [_rp(i, 90, "tops") for i in range(3)]

        selected = _apply_diversity_selection(pool, target=10, config=config)
        assert len(selected) == 3

    def test_preserves_score_ordering_within_constraints(self):
        config = MatchingConfig()
        pool = [
            _rp(1, 95, "tops"),
            _rp(2, 90, "bottoms"),
            _rp(3, 85, "outerwear"),
            _rp(4, 80, "tops"),
        ]

        selected = _apply_diversity_selection(pool, target=4, config=config)

        # First selected should be highest scorer
        assert selected[0].product.id == 1


# ───────────────────────────────────────────────────────────────
# Visual flow tests
# ───────────────────────────────────────────────────────────────


class TestVisualFlow:
    def test_hero_item_first(self):
        products = [
            _rp(1, 95, "tops"),
            _rp(2, 90, "bottoms"),
            _rp(3, 85, "outerwear"),
        ]

        arranged = _arrange_for_visual_flow(products)
        assert arranged[0].product.id == 1  # highest score stays first

    def test_alternates_categories(self):
        products = [
            _rp(1, 95, "tops"),
            _rp(2, 90, "tops"),
            _rp(3, 85, "bottoms"),
            _rp(4, 80, "bottoms"),
        ]

        arranged = _arrange_for_visual_flow(products)

        # After hero (tops), should prefer bottoms next
        categories = [rp.product.ai_tags["category"] for rp in arranged]
        # Check no two adjacent are the same (where possible)
        adjacent_same = sum(
            1 for i in range(len(categories) - 1)
            if categories[i] == categories[i + 1]
        )
        # With 2 tops + 2 bottoms, perfect alternation is possible
        assert adjacent_same == 0

    def test_handles_single_product(self):
        products = [_rp(1, 95, "tops")]
        arranged = _arrange_for_visual_flow(products)
        assert len(arranged) == 1

    def test_handles_empty(self):
        arranged = _arrange_for_visual_flow([])
        assert arranged == []


# ───────────────────────────────────────────────────────────────
# CuratedZine serialisation
# ───────────────────────────────────────────────────────────────


class TestCuratedZineSerialization:
    def test_to_dict_structure(self):
        products = [_rp(1, 90, "tops"), _rp(2, 80, "bottoms")]
        zine = CuratedZine(user_id=1, products=products)
        d = zine.to_dict()

        assert d["userId"] == 1
        assert len(d["products"]) == 2
        assert d["products"][0]["position"] == 1
        assert d["products"][1]["position"] == 2
        assert "metadata" in d
        assert d["metadata"]["totalProducts"] == 2
        assert "tops" in d["metadata"]["categories"]
        assert d["metadata"]["averageScore"] == 85.0
