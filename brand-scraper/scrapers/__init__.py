"""
Scrapers module - Contains all scraper implementations.

Usage:
    from scrapers import ShopifyScraper, GenericScraper, get_scraper_for_brand
"""

from .base import BaseScraper, ScrapedProduct
from .shopify import ShopifyScraper
from .generic import GenericScraper
from .headless_shopify import HeadlessShopifyScraper

__all__ = [
    "BaseScraper",
    "ScrapedProduct",
    "ShopifyScraper",
    "GenericScraper",
    "HeadlessShopifyScraper",
    "create_scraper",
]


def get_scraper_for_brand(brand_config: dict) -> BaseScraper:
    """
    Factory function to get the appropriate scraper for a brand.

    Args:
        brand_config: Brand configuration dictionary loaded from YAML

    Returns:
        Appropriate scraper instance for the brand
    """
    scraper_type = brand_config.get("scraper_type", "generic")

    if scraper_type == "shopify":
        return ShopifyScraper(brand_config)
    elif scraper_type == "headless_shopify":
        return HeadlessShopifyScraper(brand_config)
    elif scraper_type == "generic":
        return GenericScraper(brand_config)
    else:
        raise ValueError(f"Unknown scraper type: {scraper_type}")


# Alias for consistency
create_scraper = get_scraper_for_brand
