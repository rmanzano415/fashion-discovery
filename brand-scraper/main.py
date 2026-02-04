#!/usr/bin/env python3
"""
Brand Product Scraper - Main Entry Point

A modular scraper system for collecting fashion products from brand websites.

Usage:
    # Scrape all active brands
    python main.py scrape

    # Scrape a specific brand
    python main.py scrape --brand pompeii

    # Run with scheduler (continuous)
    python main.py schedule

    # Sync brand profiles to database
    python main.py sync-profiles

    # Export products to JSON
    python main.py export --output products.json

    # Initialize database
    python main.py init-db
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import yaml

import config
from models import init_db, Session, Brand, Product
from scrapers import create_scraper, ScrapedProduct
from utils.logger import setup_logging, get_logger, ScrapeLogger
from utils.scheduler import ScraperScheduler

# Set up logging
setup_logging(log_level=config.LOG_LEVEL)
logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# PROFILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════


def load_profile(slug: str) -> dict:
    """
    Load a brand profile from YAML file.

    Args:
        slug: Brand slug (filename without .yaml)

    Returns:
        Profile dictionary

    Raises:
        FileNotFoundError: If profile doesn't exist
    """
    profile_path = config.PROFILES_DIR / f"{slug}.yaml"

    if not profile_path.exists():
        raise FileNotFoundError(f"Profile not found: {profile_path}")

    with open(profile_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_all_profiles() -> List[dict]:
    """
    Load all brand profiles from the profiles directory.

    Returns:
        List of profile dictionaries
    """
    profiles = []

    for profile_path in config.PROFILES_DIR.glob("*.yaml"):
        # Skip template
        if profile_path.stem == "template":
            continue

        try:
            with open(profile_path, "r", encoding="utf-8") as f:
                profile = yaml.safe_load(f)
                profiles.append(profile)
                logger.debug(f"Loaded profile: {profile.get('slug', profile_path.stem)}")
        except Exception as e:
            logger.error(f"Failed to load profile {profile_path}: {e}")

    return profiles


def sync_profiles_to_db():
    """
    Synchronize brand profiles from YAML files to database.

    Creates new brands or updates existing ones.
    """
    profiles = load_all_profiles()
    session = Session()

    try:
        for profile in profiles:
            slug = profile.get("slug")
            if not slug:
                logger.warning(f"Profile missing slug: {profile.get('name')}")
                continue

            # Check if brand exists
            brand = session.query(Brand).filter_by(slug=slug).first()

            if brand:
                brand.update_from_profile(profile)
                logger.info(f"Updated brand: {brand.name}")
            else:
                brand = Brand.from_profile(profile)
                session.add(brand)
                logger.info(f"Created brand: {brand.name}")

        session.commit()
        logger.info(f"Synced {len(profiles)} profiles to database")

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to sync profiles: {e}")
        raise
    finally:
        session.close()


# ═══════════════════════════════════════════════════════════════════════════
# SCRAPING
# ═══════════════════════════════════════════════════════════════════════════


def scrape_brand(slug: str) -> int:
    """
    Scrape products for a single brand.

    Args:
        slug: Brand slug

    Returns:
        Number of products scraped
    """
    session = Session()

    try:
        # Load profile and get/create brand in DB
        profile = load_profile(slug)
        brand = session.query(Brand).filter_by(slug=slug).first()

        if not brand:
            brand = Brand.from_profile(profile)
            session.add(brand)
            session.commit()

        # Create scraper and run
        scraper = create_scraper(profile)

        with ScrapeLogger(brand.name) as scrape_log:
            scraped_products = scraper.scrape_products()
            scrape_log.set_product_count(len(scraped_products))

            # Process scraped products
            new_count = 0
            updated_count = 0

            for sp in scraped_products:
                # Check if product exists
                product = (
                    session.query(Product)
                    .filter_by(brand_id=brand.id, source_id=sp.id)
                    .first()
                )

                if product:
                    product.update_from_scraped(sp)
                    updated_count += 1
                else:
                    product = Product(
                        source_id=sp.id,
                        brand_id=brand.id,
                        name=sp.name,
                        price=sp.price,
                        original_price=sp.original_price,
                        currency=sp.currency,
                        url=sp.url,
                        images=sp.images,
                        category=sp.category,
                        gender=sp.gender,
                        description=sp.description,
                        sizes=sp.sizes,
                        colors=sp.colors,
                        tags=sp.tags,
                        availability=sp.availability,
                        sku=sp.sku,
                        vendor=sp.vendor,
                        source_data=sp.source_data,
                    )
                    session.add(product)
                    new_count += 1

                    # Auto-tag new products if enabled
                    if config.TAGGER_AUTO_TAG_NEW:
                        try:
                            from tagging import tag_product
                            from datetime import datetime as dt

                            tags, _usage = tag_product(
                                name=sp.name,
                                brand=brand.name,
                                price=sp.price,
                                images=sp.images,
                                category=sp.category,
                                description=sp.description,
                                colors=sp.colors,
                                gender=sp.gender,
                            )
                            product.ai_tags = tags.to_dict()
                            product.tagged_at = dt.utcnow()
                            logger.info(f"Auto-tagged: {sp.name[:50]}")
                        except Exception as tag_err:
                            logger.warning(
                                f"Auto-tagging failed for {sp.name}: {tag_err}"
                            )

            # Mark products not seen as potentially removed
            # (Products not in this scrape that were last seen recently)
            # This is handled separately to avoid false positives

            brand.record_scrape_success(len(scraped_products))
            session.commit()

            logger.info(
                f"Scrape complete for {brand.name}: "
                f"{new_count} new, {updated_count} updated"
            )

            return len(scraped_products)

    except Exception as e:
        session.rollback()

        # Record failure if we have a brand
        if "brand" in locals() and brand:
            brand.record_scrape_failure(str(e))
            session.commit()

        logger.error(f"Scrape failed for {slug}: {e}")
        raise

    finally:
        session.close()


def scrape_all_brands() -> dict:
    """
    Scrape all active brands.

    Returns:
        Dictionary of results by brand slug
    """
    profiles = load_all_profiles()
    results = {}

    for profile in profiles:
        slug = profile.get("slug")
        if not slug:
            continue

        try:
            count = scrape_brand(slug)
            results[slug] = {"status": "success", "products": count}
        except Exception as e:
            results[slug] = {"status": "failed", "error": str(e)}

    return results


# ═══════════════════════════════════════════════════════════════════════════
# EXPORT
# ═══════════════════════════════════════════════════════════════════════════


def export_products(
    output_path: Path,
    brand_slug: Optional[str] = None,
    include_inactive: bool = False,
):
    """
    Export products to JSON file.

    Args:
        output_path: Output file path
        brand_slug: Optional brand to filter by
        include_inactive: Include inactive/removed products
    """
    session = Session()

    try:
        query = session.query(Product)

        if brand_slug:
            brand = session.query(Brand).filter_by(slug=brand_slug).first()
            if brand:
                query = query.filter_by(brand_id=brand.id)

        if not include_inactive:
            query = query.filter_by(is_active=True)

        products = query.all()

        # Convert to dict format
        export_data = {
            "exported_at": datetime.utcnow().isoformat(),
            "count": len(products),
            "products": [p.to_dict() for p in products],
        }

        # Write to file
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Exported {len(products)} products to {output_path}")

    finally:
        session.close()


# ═══════════════════════════════════════════════════════════════════════════
# SCHEDULER
# ═══════════════════════════════════════════════════════════════════════════


def run_scheduler():
    """
    Run the scraper with scheduled jobs.

    Runs continuously until interrupted.
    """
    scheduler = ScraperScheduler()

    # Load all profiles and schedule them
    profiles = load_all_profiles()

    for profile in profiles:
        slug = profile.get("slug")
        if not slug:
            continue

        # Schedule based on config
        scheduler.add_interval_job(
            slug, scrape_brand, hours=config.SCRAPE_INTERVAL_HOURS
        )

    scheduler.start()
    logger.info("Scheduler running. Press Ctrl+C to stop.")

    try:
        # Keep main thread alive
        import time

        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        logger.info("Shutting down scheduler...")
        scheduler.stop()


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Brand Product Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # scrape command
    scrape_parser = subparsers.add_parser("scrape", help="Scrape brand products")
    scrape_parser.add_argument(
        "--brand", "-b", help="Specific brand slug to scrape (default: all)"
    )

    # schedule command
    subparsers.add_parser("schedule", help="Run with scheduler (continuous)")

    # sync-profiles command
    subparsers.add_parser("sync-profiles", help="Sync YAML profiles to database")

    # export command
    export_parser = subparsers.add_parser("export", help="Export products to JSON")
    export_parser.add_argument(
        "--output", "-o", required=True, help="Output file path"
    )
    export_parser.add_argument("--brand", "-b", help="Filter by brand slug")
    export_parser.add_argument(
        "--include-inactive", action="store_true", help="Include inactive products"
    )

    # init-db command
    subparsers.add_parser("init-db", help="Initialize database tables")

    # tag command group
    tag_parser = subparsers.add_parser("tag", help="AI product tagging")
    tag_subparsers = tag_parser.add_subparsers(dest="tag_command", help="Tagging sub-command")

    tag_subparsers.add_parser("migrate", help="Add ai_tags/tagged_at columns to existing DB")

    bulk_parser = tag_subparsers.add_parser("bulk", help="Tag untagged products")
    bulk_parser.add_argument("--batch-size", type=int, default=config.TAGGER_BATCH_SIZE)
    bulk_parser.add_argument("--max", type=int, default=None, help="Max products to tag")
    bulk_parser.add_argument("--dry-run", action="store_true", help="Estimate costs only")
    bulk_parser.add_argument("--brand", help="Filter by brand slug")

    batch_submit_parser = tag_subparsers.add_parser("batch-submit", help="Submit batch to API")
    batch_submit_parser.add_argument("--max", type=int, default=None)

    batch_status_parser = tag_subparsers.add_parser("batch-status", help="Check batch status")
    batch_status_parser.add_argument("batch_id", help="Batch ID to check")

    batch_process_parser = tag_subparsers.add_parser("batch-process", help="Apply batch results")
    batch_process_parser.add_argument("batch_id", help="Batch ID to process")

    tag_subparsers.add_parser("report", help="Tag coverage report")
    tag_subparsers.add_parser("validate", help="Validate all existing tags")

    view_parser = tag_subparsers.add_parser("view", help="View tags for a product")
    view_parser.add_argument("product_id", type=int, help="Product DB id")

    retag_parser = tag_subparsers.add_parser("retag", help="Re-tag specific products")
    retag_parser.add_argument("product_ids", type=int, nargs="+", help="Product DB ids")

    export_tags_parser = tag_subparsers.add_parser("export", help="Export tags to CSV")
    export_tags_parser.add_argument("--output", "-o", default="tags_export.csv")

    # Parse args
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    if args.command == "init-db":
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialized")

    elif args.command == "sync-profiles":
        sync_profiles_to_db()

    elif args.command == "scrape":
        if args.brand:
            scrape_brand(args.brand)
        else:
            results = scrape_all_brands()
            for slug, result in results.items():
                status = result["status"]
                if status == "success":
                    print(f"  {slug}: {result['products']} products")
                else:
                    print(f"  {slug}: FAILED - {result['error']}")

    elif args.command == "export":
        export_products(
            Path(args.output),
            brand_slug=args.brand,
            include_inactive=args.include_inactive,
        )

    elif args.command == "schedule":
        run_scheduler()

    elif args.command == "tag":
        _handle_tag_command(args)


def _handle_tag_command(args):
    """Handle all tag sub-commands."""
    if not args.tag_command:
        print("Usage: python main.py tag <sub-command>")
        print("Sub-commands: migrate, bulk, batch-submit, batch-status, batch-process,")
        print("              report, validate, view, retag, export")
        sys.exit(1)

    if args.tag_command == "migrate":
        from sqlalchemy import text, inspect
        from models import engine

        inspector = inspect(engine)
        existing = [col["name"] for col in inspector.get_columns("products")]

        with engine.begin() as conn:
            if "ai_tags" not in existing:
                conn.execute(text("ALTER TABLE products ADD COLUMN ai_tags JSON"))
                print("Added column: ai_tags")
            else:
                print("Column ai_tags already exists")

            if "tagged_at" not in existing:
                conn.execute(text("ALTER TABLE products ADD COLUMN tagged_at DATETIME"))
                print("Added column: tagged_at")
            else:
                print("Column tagged_at already exists")

        print("Migration complete.")

    elif args.tag_command == "bulk":
        from tagging import run_bulk_tagger, estimate_cost, count_untagged

        if args.dry_run:
            result = run_bulk_tagger(
                batch_size=args.batch_size,
                max_products=args.max,
                dry_run=True,
                brand_slug=args.brand,
            )
            est = result.get("cost_estimate", {})
            print(f"\nDry Run Report:")
            print(f"  Untagged products: {result.get('untagged_count', 0)}")
            print(f"  Would tag: {result.get('target_count', 0)}")
            print(f"  Estimated cost: ${est.get('total', 0):.4f}")
            print(f"  Per product: ${est.get('per_product', 0):.4f}")
        else:
            untagged = count_untagged()
            target = min(untagged, args.max) if args.max else untagged
            est = estimate_cost(target)
            print(f"\nWill tag {target} products (estimated cost: ${est['total']:.4f})")
            confirm = input("Proceed? [y/N] ").strip().lower()
            if confirm != "y":
                print("Aborted.")
                return

            result = run_bulk_tagger(
                batch_size=args.batch_size,
                max_products=args.max,
                brand_slug=args.brand,
            )
            cost = result.get("cost", {})
            print(f"\nBulk Tagging Complete:")
            print(f"  Tagged: {result.get('tagged', 0)}")
            print(f"  Errors: {result.get('errors', 0)}")
            print(f"  Total cost: ${cost.get('total_cost', 0):.4f}")

    elif args.tag_command == "batch-submit":
        from tagging import create_batch_jsonl, submit_batch

        jsonl_path, count = create_batch_jsonl(max_products=args.max)
        if not jsonl_path:
            print("No untagged products found.")
            return

        print(f"Created JSONL with {count} requests: {jsonl_path}")
        batch_id = submit_batch(jsonl_path)
        print(f"Submitted batch: {batch_id}")
        print(f"Check status: python main.py tag batch-status {batch_id}")

    elif args.tag_command == "batch-status":
        from tagging.batch import get_batch_status

        status = get_batch_status(args.batch_id)
        print(f"\nBatch Status: {args.batch_id}")
        for k, v in status.items():
            print(f"  {k}: {v}")

    elif args.tag_command == "batch-process":
        from tagging import process_batch_results

        result = process_batch_results(args.batch_id)
        print(f"\nBatch Results Applied:")
        print(f"  Applied: {result.get('applied', 0)}")
        print(f"  Errors: {result.get('errors', 0)}")

    elif args.tag_command == "report":
        session = Session()
        try:
            total = session.query(Product).filter(Product.is_active.is_(True)).count()
            tagged = session.query(Product).filter(
                Product.is_active.is_(True),
                Product.ai_tags.isnot(None),
            ).count()
            untagged = total - tagged

            print(f"\nTag Coverage Report:")
            print(f"  Total active products: {total}")
            print(f"  Tagged: {tagged} ({tagged/total*100:.1f}%)" if total else f"  Tagged: {tagged}")
            print(f"  Untagged: {untagged}")
        finally:
            session.close()

    elif args.tag_command == "validate":
        from tagging.taxonomy import validate_tags

        session = Session()
        try:
            products = session.query(Product).filter(
                Product.ai_tags.isnot(None)
            ).all()

            invalid_count = 0
            for p in products:
                is_valid, errors = validate_tags(p.ai_tags)
                if not is_valid:
                    invalid_count += 1
                    print(f"  Product {p.id} ({p.name[:40]}): {errors}")

            print(f"\nValidated {len(products)} tagged products: {invalid_count} with issues")
        finally:
            session.close()

    elif args.tag_command == "view":
        session = Session()
        try:
            product = session.query(Product).get(args.product_id)
            if not product:
                print(f"Product {args.product_id} not found.")
                return

            print(f"\nProduct: {product.name}")
            print(f"Brand: {product.brand.name if product.brand else 'N/A'}")
            print(f"Price: ${product.price:.2f}")

            if product.ai_tags:
                print(f"Tagged at: {product.tagged_at}")
                import json as _json
                print(f"Tags:\n{_json.dumps(product.ai_tags, indent=2)}")
            else:
                print("Not tagged yet.")
        finally:
            session.close()

    elif args.tag_command == "retag":
        from tagging import tag_product_from_model
        from sqlalchemy.orm import joinedload

        session = Session()
        try:
            for pid in args.product_ids:
                product = (
                    session.query(Product)
                    .options(joinedload(Product.brand))
                    .get(pid)
                )
                if not product:
                    print(f"Product {pid} not found, skipping.")
                    continue

                try:
                    tags, usage = tag_product_from_model(product)
                    product.ai_tags = tags.to_dict()
                    product.tagged_at = datetime.utcnow()
                    session.commit()
                    print(f"Re-tagged product {pid}: {product.name[:50]}")
                except Exception as e:
                    print(f"Failed to re-tag product {pid}: {e}")
        finally:
            session.close()

    elif args.tag_command == "export":
        import csv

        session = Session()
        try:
            products = session.query(Product).filter(
                Product.ai_tags.isnot(None)
            ).all()

            if not products:
                print("No tagged products to export.")
                return

            output_path = Path(args.output)
            fieldnames = [
                "id", "name", "brand", "price", "aesthetics", "palette",
                "vibes", "category", "occasions", "season", "price_tier",
                "color_temperature", "primary_colors", "keywords", "tagged_at",
            ]

            with open(output_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

                for p in products:
                    tags = p.ai_tags or {}
                    writer.writerow({
                        "id": p.id,
                        "name": p.name,
                        "brand": p.brand.name if p.brand else "",
                        "price": p.price,
                        "aesthetics": ", ".join(tags.get("aesthetics", [])),
                        "palette": tags.get("palette", ""),
                        "vibes": ", ".join(tags.get("vibes", [])),
                        "category": tags.get("category", ""),
                        "occasions": ", ".join(tags.get("occasions", [])),
                        "season": tags.get("season", ""),
                        "price_tier": tags.get("price_tier", ""),
                        "color_temperature": tags.get("color_temperature", ""),
                        "primary_colors": ", ".join(tags.get("primary_colors", [])),
                        "keywords": ", ".join(tags.get("keywords", [])),
                        "tagged_at": p.tagged_at.isoformat() if p.tagged_at else "",
                    })

            print(f"Exported {len(products)} tagged products to {output_path}")
        finally:
            session.close()


if __name__ == "__main__":
    main()
