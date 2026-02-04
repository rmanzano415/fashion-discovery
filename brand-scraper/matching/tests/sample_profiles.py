"""
Sample user profiles for testing and demo purposes.

Run directly to score all profiles against the real product database
and print a comparison report.

Usage:
    cd brand-scraper
    python -m matching.tests.sample_profiles
"""

from types import SimpleNamespace
from typing import List


def get_sample_profiles() -> List[SimpleNamespace]:
    """
    Return diverse test user profiles.

    Each profile represents a distinct style archetype to validate
    that the matching engine produces meaningfully different results.
    """
    return [
        SimpleNamespace(
            id=0,
            name="Minimal Maven",
            aesthetic="minimalist",
            palette="neutral",
            vibe="understated",
            silhouette="all",
            followed_brands=[],
        ),
        SimpleNamespace(
            id=0,
            name="Maximalist Mary",
            aesthetic="maximalist",
            palette="brights",
            vibe="bold",
            silhouette="womenswear",
            followed_brands=[],
        ),
        SimpleNamespace(
            id=0,
            name="Vintage Vicky",
            aesthetic="retro",
            palette="earth-tones",
            vibe="earthy",
            silhouette="womenswear",
            followed_brands=[],
        ),
        SimpleNamespace(
            id=0,
            name="Streetwear Steve",
            aesthetic="streetwear",
            palette="monochrome",
            vibe="edgy",
            silhouette="menswear",
            followed_brands=[],
        ),
        SimpleNamespace(
            id=0,
            name="Classic Claire",
            aesthetic="classic",
            palette="neutral",
            vibe="sophisticated",
            silhouette="all",
            followed_brands=[],
        ),
    ]


def run_comparison():
    """Score all sample profiles against the real database and print results."""
    import sys
    import os

    # Ensure brand-scraper is on the path
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

    from models.database import get_session, init_db
    from models.product import Product
    from sqlalchemy.orm import joinedload
    from matching.scorer import score_product
    from matching.config import DEFAULT_CONFIG

    init_db()
    session = get_session()

    try:
        products = (
            session.query(Product)
            .options(joinedload(Product.brand))
            .filter(
                Product.is_active == True,  # noqa: E712
                Product.ai_tags.isnot(None),
            )
            .all()
        )
        print(f"Loaded {len(products)} tagged products\n")

        profiles = get_sample_profiles()

        for profile in profiles:
            scores = []
            for product in products:
                result = score_product(profile, product, DEFAULT_CONFIG)
                scores.append((product, result))

            scores.sort(key=lambda x: x[1].total, reverse=True)

            above_threshold = [s for s in scores if s[1].total >= DEFAULT_CONFIG.filters.min_score]
            good_plus = [s for s in scores if s[1].total >= DEFAULT_CONFIG.filters.good_match]

            print(f"{'=' * 60}")
            print(f"  {profile.name}")
            print(f"  aesthetic={profile.aesthetic}  palette={profile.palette}  vibe={profile.vibe}")
            print(f"{'=' * 60}")
            print(f"  Total matches (>={DEFAULT_CONFIG.filters.min_score}): {len(above_threshold)}")
            print(f"  Good+ matches (>={DEFAULT_CONFIG.filters.good_match}): {len(good_plus)}")

            if scores:
                avg = sum(s[1].total for s in scores) / len(scores)
                print(f"  Average score across all products: {avg:.1f}")

            print(f"\n  Top 5 products:")
            for product, result in scores[:5]:
                brand = product.brand.name if product.brand else "?"
                tags = product.ai_tags or {}
                print(
                    f"    {result.total:5.1f}  [{result.quality:9s}]  "
                    f"{brand} — {product.name[:40]}"
                )
                print(
                    f"           aesthetics={tags.get('aesthetics', [])}  "
                    f"palette={tags.get('palette', '')}  "
                    f"vibes={tags.get('vibes', [])}"
                )

            print(f"\n  Bottom 3 (worst matches):")
            for product, result in scores[-3:]:
                brand = product.brand.name if product.brand else "?"
                print(
                    f"    {result.total:5.1f}  [{result.quality:9s}]  "
                    f"{brand} — {product.name[:40]}"
                )

            print()

        # ── Cross-profile overlap check ───────────────────────
        print(f"{'=' * 60}")
        print("  CROSS-PROFILE OVERLAP")
        print(f"{'=' * 60}")

        top_sets = {}
        for profile in profiles:
            scores = []
            for product in products:
                result = score_product(profile, product, DEFAULT_CONFIG)
                scores.append((product.id, result.total))
            scores.sort(key=lambda x: x[1], reverse=True)
            top_sets[profile.name] = {pid for pid, _ in scores[:20]}

        for i, p1 in enumerate(profiles):
            for p2 in profiles[i + 1 :]:
                overlap = top_sets[p1.name] & top_sets[p2.name]
                pct = len(overlap) / 20 * 100 if top_sets[p1.name] else 0
                print(f"  {p1.name} vs {p2.name}: {len(overlap)}/20 overlap ({pct:.0f}%)")

        print()

    finally:
        session.close()


if __name__ == "__main__":
    run_comparison()
