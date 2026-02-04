"""
Tests for the product scoring algorithm.
"""

import pytest
from types import SimpleNamespace

from matching.scorer import score_product, ScoreResult
from matching.config import MatchingConfig, MatchingWeights


# ───────────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────────


def make_user(**overrides):
    defaults = {
        "id": 1,
        "aesthetic": "minimalist",
        "palette": "neutral",
        "vibe": "understated",
        "silhouette": "all",
        "followed_brands": [],
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def make_product(**overrides):
    defaults = {
        "id": 100,
        "ai_tags": {
            "aesthetics": ["minimalist", "scandinavian"],
            "palette": "neutral",
            "vibes": ["understated", "sophisticated"],
            "category": "tops",
            "occasions": ["everyday", "work"],
            "season": "all-season",
            "price_tier": "mid-range",
            "color_temperature": "cool",
            "primary_colors": ["white", "navy"],
            "keywords": ["linen", "relaxed-fit"],
        },
        "brand": SimpleNamespace(name="asket"),
        "brand_id": 1,
        "is_new": False,
        "gender": None,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


# ───────────────────────────────────────────────────────────────
# Tests
# ───────────────────────────────────────────────────────────────


class TestPerfectMatch:
    def test_all_dimensions_match(self):
        user = make_user()
        product = make_product()
        result = score_product(user, product)

        assert result.aesthetic_points == 40.0
        assert result.palette_points == 30.0
        assert result.vibe_points == 30.0
        assert result.total == 100.0
        assert result.quality == "excellent"

    def test_total_never_exceeds_100(self):
        user = make_user(followed_brands=["asket"])
        product = make_product(is_new=True)
        result = score_product(user, product)
        assert result.total <= 100.0


class TestPartialMatches:
    def test_aesthetic_only(self):
        user = make_user(palette="brights", vibe="bold")
        product = make_product()
        result = score_product(user, product)

        assert result.aesthetic_points == 40.0
        assert result.palette_points == 0.0
        assert result.vibe_points == 0.0
        assert result.total == 40.0

    def test_palette_only(self):
        user = make_user(aesthetic="maximalist", vibe="bold")
        product = make_product()
        result = score_product(user, product)

        assert result.aesthetic_points == 0.0
        assert result.palette_points == 30.0
        assert result.total == 30.0

    def test_vibe_only(self):
        user = make_user(aesthetic="maximalist", palette="brights")
        product = make_product()
        result = score_product(user, product)

        assert result.vibe_points == 30.0
        assert result.total == 30.0


class TestCompatibilityMatrices:
    def test_palette_compatibility_gives_half_points(self):
        user = make_user(palette="neutral")
        product = make_product(
            ai_tags={**make_product().ai_tags, "palette": "earth-tones"}
        )
        result = score_product(user, product)

        assert result.palette_points == 15.0  # 50% of 30
        assert result.partial_palette is True

    def test_vibe_compatibility_gives_half_points(self):
        user = make_user(vibe="understated")
        product = make_product(
            ai_tags={**make_product().ai_tags, "vibes": ["casual", "relaxed"]}
        )
        result = score_product(user, product)

        assert result.vibe_points == 15.0  # 50% of 30
        assert result.partial_vibe is True

    def test_incompatible_palette_gives_zero(self):
        user = make_user(palette="neon")
        product = make_product(
            ai_tags={**make_product().ai_tags, "palette": "earth-tones"}
        )
        result = score_product(user, product)
        assert result.palette_points == 0.0

    def test_incompatible_vibe_gives_zero(self):
        user = make_user(vibe="glamorous")
        product = make_product(
            ai_tags={**make_product().ai_tags, "vibes": ["earthy", "cozy"]}
        )
        result = score_product(user, product)
        assert result.vibe_points == 0.0


class TestBonuses:
    def test_brand_affinity_boost(self):
        user = make_user(followed_brands=["asket"])
        product = make_product()
        result = score_product(user, product)

        assert "brand_affinity" in result.bonuses
        assert result.total == 100.0  # capped at 100

    def test_no_brand_affinity_for_unfollowed(self):
        user = make_user(followed_brands=["pompeii"])
        product = make_product()
        result = score_product(user, product)
        assert "brand_affinity" not in result.bonuses

    def test_newness_boost(self):
        user = make_user()
        product = make_product(is_new=True)
        result = score_product(user, product)
        assert "newness" in result.bonuses


class TestPenalties:
    def test_rejection_penalty(self):
        user = make_user()
        product = make_product()
        result = score_product(user, product, rejected_product_ids={100})

        assert "rejected" in result.penalties
        assert result.total < 100.0

    def test_no_penalty_without_rejection(self):
        user = make_user()
        product = make_product()
        result = score_product(user, product, rejected_product_ids={999})
        assert "rejected" not in result.penalties

    def test_rejection_cannot_go_below_zero(self):
        user = make_user(aesthetic="maximalist", palette="neon", vibe="glamorous")
        product = make_product()
        result = score_product(user, product, rejected_product_ids={100})
        assert result.total >= 0.0


class TestGenderFilter:
    def test_menswear_user_excludes_womens(self):
        user = make_user(silhouette="menswear")
        product = make_product(gender="womens")
        result = score_product(user, product)
        assert result.total == 0.0

    def test_menswear_user_allows_unisex(self):
        user = make_user(silhouette="menswear")
        product = make_product(gender="unisex")
        result = score_product(user, product)
        assert result.total > 0.0

    def test_all_silhouette_allows_everything(self):
        user = make_user(silhouette="all")
        product = make_product(gender="womens")
        result = score_product(user, product)
        assert result.total > 0.0


class TestMissingData:
    def test_no_ai_tags_returns_zero(self):
        user = make_user()
        product = make_product(ai_tags=None)
        result = score_product(user, product)
        assert result.total == 0.0
        assert result.missing_data is True

    def test_no_user_aesthetic(self):
        user = make_user(aesthetic=None)
        product = make_product()
        result = score_product(user, product)
        assert result.aesthetic_points == 0.0
        # palette + vibe should still score
        assert result.total == 60.0

    def test_empty_product_aesthetics(self):
        user = make_user()
        product = make_product(
            ai_tags={**make_product().ai_tags, "aesthetics": []}
        )
        result = score_product(user, product)
        assert result.aesthetic_points == 0.0


class TestConfigurableWeights:
    def test_custom_weights(self):
        config = MatchingConfig(
            weights=MatchingWeights(aesthetic=50.0, palette=25.0, vibe=25.0)
        )
        user = make_user()
        product = make_product()
        result = score_product(user, product, config=config)

        assert result.aesthetic_points == 50.0
        assert result.palette_points == 25.0
        assert result.vibe_points == 25.0
        assert result.total == 100.0

    def test_quality_labels_use_config_thresholds(self):
        config = MatchingConfig()
        config.filters.excellent_match = 90.0

        user = make_user()
        product = make_product()
        # With palette compatibility (partial), score won't hit 90
        product.ai_tags["palette"] = "earth-tones"
        result = score_product(user, product, config=config)

        assert result.total < 90.0
        assert result.quality != "excellent"


class TestScoreResultSerialization:
    def test_to_dict(self):
        user = make_user()
        product = make_product()
        result = score_product(user, product)
        d = result.to_dict()

        assert "total" in d
        assert "breakdown" in d
        assert "aesthetic" in d["breakdown"]
        assert "quality" in d
