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


if __name__ == "__main__":
    main()
