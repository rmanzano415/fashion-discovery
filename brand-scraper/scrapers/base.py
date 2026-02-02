"""
Base Scraper Module

This module defines the abstract base class that all brand scrapers inherit from.
It provides common functionality for making requests, handling errors, and
standardizing the output format.

To create a new scraper:
1. Inherit from BaseScraper
2. Implement the `scrape_products()` method
3. Optionally override other methods for custom behavior
"""

import time
import random
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential

import config

# ═══════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════


@dataclass
class ScrapedProduct:
    """
    Standardized product data structure.

    All scrapers must return products in this format to ensure
    consistency across different brand sources.
    """

    # Required fields
    id: str  # Unique identifier (usually from the source)
    brand: str  # Brand name
    name: str  # Product title/name
    price: float  # Current price
    currency: str  # Currency code (USD, EUR, etc.)
    url: str  # Full product URL
    images: List[str]  # List of image URLs

    # Optional fields
    original_price: Optional[float] = None  # Price before discount
    description: Optional[str] = None
    category: Optional[str] = None  # e.g., "Tops", "Bottoms", "Footwear"
    gender: Optional[str] = None  # "mens", "womens", "unisex"
    sizes: List[str] = field(default_factory=list)
    colors: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    availability: str = "in_stock"  # "in_stock", "out_of_stock", "limited"
    sku: Optional[str] = None
    vendor: Optional[str] = None

    # Metadata
    scraped_at: datetime = field(default_factory=datetime.utcnow)
    source_data: Dict[str, Any] = field(default_factory=dict)  # Raw data from source

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = asdict(self)
        data["scraped_at"] = self.scraped_at.isoformat()
        return data

    @property
    def is_on_sale(self) -> bool:
        """Check if product is on sale."""
        return self.original_price is not None and self.original_price > self.price

    @property
    def discount_percentage(self) -> Optional[float]:
        """Calculate discount percentage if on sale."""
        if self.is_on_sale and self.original_price:
            return round((1 - self.price / self.original_price) * 100, 1)
        return None


# ═══════════════════════════════════════════════════════════════
# BASE SCRAPER CLASS
# ═══════════════════════════════════════════════════════════════


class BaseScraper(ABC):
    """
    Abstract base class for all brand scrapers.

    Provides common functionality:
    - HTTP requests with retry logic and rate limiting
    - User agent rotation
    - Error handling and logging
    - HTML parsing helpers

    Subclasses must implement:
    - scrape_products(): Main scraping logic
    """

    def __init__(self, brand_config: dict):
        """
        Initialize the scraper with brand configuration.

        Args:
            brand_config: Dictionary containing brand settings loaded from YAML
        """
        self.config = brand_config
        self.brand_name = brand_config.get("name", "Unknown")
        self.base_url = brand_config.get("base_url", "")

        # Setup logging
        self.logger = logging.getLogger(f"scraper.{self.brand_name}")

        # Setup session
        self.session = requests.Session()
        self._setup_session()

        # User agent rotation
        self.user_agent = UserAgent() if config.USE_ROTATING_USER_AGENTS else None

        # Stats tracking
        self.stats = {
            "requests_made": 0,
            "requests_failed": 0,
            "products_scraped": 0,
            "start_time": None,
            "end_time": None,
        }

    def _setup_session(self):
        """Configure the requests session with default headers."""
        self.session.headers.update(
            {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",  # Don't use 'br' (Brotli) - requires extra package
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }
        )

    def _get_user_agent(self) -> str:
        """Get a user agent string (rotated or default)."""
        if self.user_agent:
            return self.user_agent.random
        return config.DEFAULT_USER_AGENT

    def _rate_limit(self):
        """Apply rate limiting between requests."""
        delay = random.uniform(config.REQUEST_DELAY_MIN, config.REQUEST_DELAY_MAX)
        self.logger.debug(f"Rate limiting: waiting {delay:.2f}s")
        time.sleep(delay)

    @retry(
        stop=stop_after_attempt(config.MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    def fetch_page(self, url: str, **kwargs) -> requests.Response:
        """
        Fetch a page with retry logic and rate limiting.

        Args:
            url: URL to fetch
            **kwargs: Additional arguments passed to requests.get()

        Returns:
            Response object

        Raises:
            requests.RequestException: If all retries fail
        """
        self._rate_limit()

        headers = kwargs.pop("headers", {})
        headers["User-Agent"] = self._get_user_agent()

        self.logger.debug(f"Fetching: {url}")
        self.stats["requests_made"] += 1

        try:
            response = self.session.get(
                url, headers=headers, timeout=config.REQUEST_TIMEOUT, **kwargs
            )
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            self.stats["requests_failed"] += 1
            self.logger.error(f"Request failed for {url}: {e}")
            raise

    def fetch_json(self, url: str, **kwargs) -> Dict[str, Any]:
        """
        Fetch and parse JSON from a URL.

        Args:
            url: URL to fetch
            **kwargs: Additional arguments passed to fetch_page()

        Returns:
            Parsed JSON as dictionary
        """
        # Set JSON Accept header
        headers = kwargs.pop("headers", {})
        headers["Accept"] = "application/json"
        kwargs["headers"] = headers
        response = self.fetch_page(url, **kwargs)
        return response.json()

    def parse_html(self, html: str) -> BeautifulSoup:
        """
        Parse HTML content into BeautifulSoup object.

        Args:
            html: HTML string to parse

        Returns:
            BeautifulSoup object
        """
        return BeautifulSoup(html, "lxml")

    def make_absolute_url(self, url: str) -> str:
        """
        Convert a relative URL to absolute using the base URL.

        Args:
            url: URL (can be relative or absolute)

        Returns:
            Absolute URL
        """
        if url.startswith(("http://", "https://")):
            return url
        return urljoin(self.base_url, url)

    def detect_gender(self, product_data: Dict[str, Any]) -> Optional[str]:
        """
        Detect product gender from various signals.

        Override this method for brand-specific gender detection logic.

        Args:
            product_data: Dictionary containing product information

        Returns:
            "mens", "womens", "unisex", or None if unknown
        """
        # Get gender detection rules from config
        rules = self.config.get("gender_detection", {})

        # Check URL patterns
        url = product_data.get("url", "").lower()
        url_patterns = rules.get("url_patterns", {})
        for gender, patterns in url_patterns.items():
            if any(pattern in url for pattern in patterns):
                return gender

        # Check title/name keywords
        title = product_data.get("name", "").lower()
        title_keywords = rules.get("title_keywords", {})
        for gender, keywords in title_keywords.items():
            if any(keyword in title for keyword in keywords):
                return gender

        # Check tags/categories
        tags = product_data.get("tags", [])
        if isinstance(tags, list):
            tags_lower = [t.lower() for t in tags]
            tag_mappings = rules.get("tag_mappings", {})
            for gender, mapped_tags in tag_mappings.items():
                if any(tag in tags_lower for tag in mapped_tags):
                    return gender

        # Default fallback
        return rules.get("default", None)

    def clean_price(self, price_str: str) -> Optional[float]:
        """
        Clean and parse a price string into a float.

        Handles various formats:
        - "$99.00"
        - "99,00 €"
        - "£99"
        - "99.00 USD"

        Args:
            price_str: Price string to parse

        Returns:
            Float price value or None if parsing fails
        """
        if not price_str:
            return None

        # Remove currency symbols and whitespace
        import re

        cleaned = re.sub(r"[^\d.,]", "", price_str)

        # Handle European format (comma as decimal separator)
        if "," in cleaned and "." in cleaned:
            # Both present: assume comma is thousands separator
            cleaned = cleaned.replace(",", "")
        elif "," in cleaned:
            # Only comma: could be decimal separator
            parts = cleaned.split(",")
            if len(parts) == 2 and len(parts[1]) == 2:
                # Looks like decimal (e.g., "99,00")
                cleaned = cleaned.replace(",", ".")
            else:
                # Likely thousands separator
                cleaned = cleaned.replace(",", "")

        try:
            return float(cleaned)
        except ValueError:
            self.logger.warning(f"Could not parse price: {price_str}")
            return None

    def clean_image_url(self, url: str) -> str:
        """
        Clean and normalize image URLs.

        - Convert protocol-relative URLs
        - Remove size parameters for highest quality
        - Handle CDN URLs

        Args:
            url: Image URL to clean

        Returns:
            Cleaned image URL
        """
        if not url:
            return ""

        # Handle protocol-relative URLs
        if url.startswith("//"):
            url = "https:" + url

        # Make absolute if needed
        url = self.make_absolute_url(url)

        return url

    @abstractmethod
    def scrape_products(self) -> List[ScrapedProduct]:
        """
        Main scraping method - must be implemented by subclasses.

        Returns:
            List of ScrapedProduct objects
        """
        pass

    def run(self) -> List[ScrapedProduct]:
        """
        Execute the scraper with timing and error handling.

        Returns:
            List of scraped products
        """
        self.stats["start_time"] = datetime.utcnow()
        self.logger.info(f"Starting scrape for {self.brand_name}")

        try:
            products = self.scrape_products()
            self.stats["products_scraped"] = len(products)
            self.logger.info(
                f"Scrape complete: {len(products)} products found"
            )
            return products
        except Exception as e:
            self.logger.error(f"Scrape failed: {e}", exc_info=True)
            raise
        finally:
            self.stats["end_time"] = datetime.utcnow()
            self._log_stats()

    def _log_stats(self):
        """Log scraping statistics."""
        duration = (
            (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
            if self.stats["end_time"] and self.stats["start_time"]
            else 0
        )
        self.logger.info(
            f"Stats: {self.stats['requests_made']} requests, "
            f"{self.stats['requests_failed']} failed, "
            f"{self.stats['products_scraped']} products, "
            f"{duration:.1f}s duration"
        )
