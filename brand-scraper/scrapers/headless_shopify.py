"""
Headless Shopify Scraper Module

Scraper for Shopify stores using headless/custom frontends (like Next.js).
These stores don't expose the standard /products.json API, so we scrape
product URLs from collection pages and extract JSON-LD structured data
from individual product pages.

Ideal for:
- Headless commerce setups
- Custom frontends with Shopify backend
- Sites using JSON-LD for SEO
"""

import re
import json
from typing import List, Dict, Any, Optional, Set
from urllib.parse import urljoin

from .base import BaseScraper, ScrapedProduct


class HeadlessShopifyScraper(BaseScraper):
    """
    Scraper for headless Shopify stores.

    Strategy:
    1. Scrape collection pages to gather all product URLs
    2. Visit each product page and extract JSON-LD structured data
    3. Parse the schema.org Product data into ScrapedProduct format
    """

    def __init__(self, brand_config: dict):
        super().__init__(brand_config)

        # Config options
        self.collections = brand_config.get("collections", [])
        self.region_prefix = brand_config.get("region_prefix", "")
        self.max_pages = brand_config.get("max_pages", 10)
        self.product_url_pattern = brand_config.get(
            "product_url_pattern", r"/products/([a-z0-9\-]+)"
        )

    def scrape_products(self) -> List[ScrapedProduct]:
        """
        Scrape all products from the headless Shopify store.

        Returns:
            List of ScrapedProduct objects
        """
        # Step 1: Collect all product URLs from collection pages
        product_urls = self._collect_product_urls()
        self.logger.info(f"Found {len(product_urls)} unique product URLs")

        # Step 2: Scrape each product page for JSON-LD data
        products = []
        for i, url in enumerate(product_urls):
            try:
                product = self._scrape_product_page(url)
                if product:
                    products.append(product)
                    self.logger.debug(f"Scraped product {i+1}/{len(product_urls)}: {product.name}")
            except Exception as e:
                self.logger.warning(f"Failed to scrape product {url}: {e}")

        return products

    def _collect_product_urls(self) -> List[str]:
        """
        Collect all unique product URLs from collection pages.

        Returns:
            List of unique product URLs
        """
        seen_urls: Set[str] = set()
        product_urls: List[str] = []

        # Get collections to scrape
        collections = self.collections or ["all"]

        for collection in collections:
            collection_url = self._build_collection_url(collection)
            urls = self._scrape_collection_for_urls(collection_url)

            for url in urls:
                if url not in seen_urls:
                    seen_urls.add(url)
                    product_urls.append(url)

            self.logger.debug(f"Collection '{collection}': found {len(urls)} products")

        return product_urls

    def _build_collection_url(self, collection: str) -> str:
        """Build the full URL for a collection."""
        if self.region_prefix:
            path = f"/{self.region_prefix}/collections/{collection}"
        else:
            path = f"/collections/{collection}"
        return urljoin(self.base_url, path)

    def _scrape_collection_for_urls(self, collection_url: str) -> List[str]:
        """
        Scrape a collection page for product URLs.

        Args:
            collection_url: URL of the collection page

        Returns:
            List of product URLs found
        """
        urls = []
        page = 1

        while page <= self.max_pages:
            # Add page parameter
            page_url = f"{collection_url}?page={page}" if page > 1 else collection_url

            try:
                response = self.fetch_page(page_url)
                html = response.text

                # Extract product URLs using regex pattern
                pattern = self.product_url_pattern
                if self.region_prefix:
                    pattern = f"/{self.region_prefix}" + pattern

                matches = re.findall(pattern, html)

                if not matches:
                    break

                # Build full URLs
                for slug in set(matches):
                    if self.region_prefix:
                        product_url = urljoin(
                            self.base_url, f"/{self.region_prefix}/products/{slug}"
                        )
                    else:
                        product_url = urljoin(self.base_url, f"/products/{slug}")
                    urls.append(product_url)

                page += 1

            except Exception as e:
                self.logger.error(f"Error scraping collection page {page_url}: {e}")
                break

        return urls

    def _scrape_product_page(self, url: str) -> Optional[ScrapedProduct]:
        """
        Scrape a single product page for JSON-LD data.

        Args:
            url: Product page URL

        Returns:
            ScrapedProduct or None if extraction fails
        """
        try:
            response = self.fetch_page(url)
            soup = self.parse_html(response.text)

            # Find JSON-LD script
            script = soup.find("script", type="application/ld+json")
            if not script or not script.string:
                self.logger.warning(f"No JSON-LD found on {url}")
                return None

            data = json.loads(script.string)

            # Ensure it's a Product type
            if data.get("@type") != "Product":
                self.logger.warning(f"JSON-LD is not Product type on {url}")
                return None

            return self._parse_json_ld_product(data, url)

        except json.JSONDecodeError as e:
            self.logger.warning(f"Invalid JSON-LD on {url}: {e}")
            return None
        except Exception as e:
            self.logger.warning(f"Error scraping product page {url}: {e}")
            return None

    def _parse_json_ld_product(
        self, data: Dict[str, Any], url: str
    ) -> Optional[ScrapedProduct]:
        """
        Parse JSON-LD Product data into a ScrapedProduct.

        Args:
            data: JSON-LD product data
            url: Product URL

        Returns:
            ScrapedProduct or None
        """
        try:
            # Basic info
            name = data.get("name", "")
            description = data.get("description", "")

            if not name:
                return None

            # Extract product ID from URL
            slug_match = re.search(r"/products/([a-z0-9\-]+)", url)
            product_id = slug_match.group(1) if slug_match else url.split("/")[-1]

            # Images
            images = []
            image_data = data.get("image")
            if isinstance(image_data, str):
                images.append(image_data)
            elif isinstance(image_data, list):
                images.extend(image_data)

            # Price from offers
            offers = data.get("offers", {})
            price = 0.0
            original_price = None
            currency = self.config.get("currency", "USD")
            availability = "in_stock"

            if offers:
                # Handle AggregateOffer or single Offer
                if offers.get("@type") == "AggregateOffer":
                    price = float(offers.get("lowPrice", 0))
                    high_price = float(offers.get("highPrice", 0))
                    if high_price > price:
                        original_price = high_price
                    currency = offers.get("priceCurrency", currency)
                else:
                    price = float(offers.get("price", 0))
                    currency = offers.get("priceCurrency", currency)

                # Availability
                avail_url = offers.get("availability", "")
                if "OutOfStock" in avail_url:
                    availability = "out_of_stock"
                elif "LimitedAvailability" in avail_url:
                    availability = "limited"

            # Detect gender from name/URL
            gender = self.detect_gender({"url": url, "name": name})

            # Extract category from URL if possible
            category = None
            # Check for category in collection info if available
            if "jerseys" in url.lower():
                category = "Jerseys"
            elif "bibs" in url.lower():
                category = "Bibs"
            elif "jacket" in url.lower() or "gilet" in url.lower():
                category = "Jackets & Gilets"
            elif "sock" in url.lower():
                category = "Socks"
            elif "helmet" in url.lower():
                category = "Helmets"

            return ScrapedProduct(
                id=product_id,
                brand=self.brand_name,
                name=name,
                price=price,
                currency=currency,
                url=url,
                images=images,
                original_price=original_price,
                description=description,
                category=category,
                gender=gender,
                availability=availability,
                source_data=data,
            )

        except Exception as e:
            self.logger.warning(f"Failed to parse JSON-LD product: {e}")
            return None
