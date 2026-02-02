"""
Shopify Scraper Module

Specialized scraper for Shopify-based stores. Most Shopify stores expose
a /products.json endpoint that provides structured product data, making
scraping much more reliable than HTML parsing.

Features:
- Automatic Shopify detection
- JSON API scraping (preferred)
- HTML fallback for stores that block the JSON endpoint
- Collection-based filtering
- Variant handling (sizes, colors)
"""

import re
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin

from .base import BaseScraper, ScrapedProduct


class ShopifyScraper(BaseScraper):
    """
    Scraper optimized for Shopify stores.

    Shopify stores typically expose product data at:
    - /products.json (all products)
    - /collections/{collection}/products.json (filtered)

    This scraper uses the JSON API when available for reliable data extraction.
    """

    def __init__(self, brand_config: dict):
        super().__init__(brand_config)

        # Shopify-specific config
        self.use_json_api = brand_config.get("use_json_api", True)
        self.collections = brand_config.get("collections", [])
        self.products_per_page = brand_config.get("products_per_page", 250)
        self.max_pages = brand_config.get("max_pages", 10)

    def is_shopify_store(self) -> bool:
        """
        Detect if the target site is a Shopify store.

        Checks:
        1. /products.json endpoint returns valid JSON
        2. Page source contains Shopify indicators

        Returns:
            True if site appears to be Shopify-based
        """
        try:
            # Try the JSON endpoint
            url = urljoin(self.base_url, "/products.json?limit=1")
            response = self.fetch_page(url)

            if response.status_code == 200:
                data = response.json()
                if "products" in data:
                    self.logger.info("Shopify detected via /products.json")
                    return True
        except Exception:
            pass

        try:
            # Check page source for Shopify indicators
            response = self.fetch_page(self.base_url)
            html = response.text.lower()

            shopify_indicators = [
                "shopify.theme",
                "cdn.shopify.com",
                "shopify-section",
                '"shopify"',
            ]

            if any(indicator in html for indicator in shopify_indicators):
                self.logger.info("Shopify detected via page source")
                return True
        except Exception:
            pass

        return False

    def scrape_products(self) -> List[ScrapedProduct]:
        """
        Scrape all products from the Shopify store.

        Strategy:
        1. If collections are specified, scrape each collection
        2. Otherwise, scrape all products via /products.json
        3. Fall back to HTML scraping if JSON fails

        Returns:
            List of ScrapedProduct objects
        """
        products = []

        if self.use_json_api:
            try:
                if self.collections:
                    # Scrape specific collections
                    for collection in self.collections:
                        collection_products = self._scrape_collection_json(collection)
                        products.extend(collection_products)
                else:
                    # Scrape all products
                    products = self._scrape_all_products_json()

                # Deduplicate by product ID
                seen_ids = set()
                unique_products = []
                for product in products:
                    if product.id not in seen_ids:
                        seen_ids.add(product.id)
                        unique_products.append(product)

                return unique_products

            except Exception as e:
                self.logger.warning(f"JSON API failed, falling back to HTML: {e}")

        # HTML fallback
        return self._scrape_html_fallback()

    def _scrape_all_products_json(self) -> List[ScrapedProduct]:
        """
        Scrape all products using the /products.json endpoint.

        Returns:
            List of ScrapedProduct objects
        """
        products = []
        page = 1

        while page <= self.max_pages:
            url = urljoin(
                self.base_url,
                f"/products.json?limit={self.products_per_page}&page={page}",
            )

            try:
                data = self.fetch_json(url)
                page_products = data.get("products", [])

                if not page_products:
                    break

                for product_data in page_products:
                    product = self._parse_shopify_product(product_data)
                    if product:
                        products.append(product)

                self.logger.debug(f"Page {page}: {len(page_products)} products")
                page += 1

            except Exception as e:
                self.logger.error(f"Failed to fetch page {page}: {e}")
                break

        return products

    def _scrape_collection_json(self, collection: str) -> List[ScrapedProduct]:
        """
        Scrape products from a specific collection.

        Args:
            collection: Collection handle (e.g., "new-arrivals", "mens")

        Returns:
            List of ScrapedProduct objects
        """
        products = []
        page = 1

        while page <= self.max_pages:
            url = urljoin(
                self.base_url,
                f"/collections/{collection}/products.json?limit={self.products_per_page}&page={page}",
            )

            try:
                data = self.fetch_json(url)
                page_products = data.get("products", [])

                if not page_products:
                    break

                for product_data in page_products:
                    # Add collection info to product
                    product_data["_collection"] = collection
                    product = self._parse_shopify_product(product_data)
                    if product:
                        products.append(product)

                page += 1

            except Exception as e:
                self.logger.error(f"Failed to fetch collection {collection} page {page}: {e}")
                break

        return products

    def _parse_shopify_product(self, data: Dict[str, Any]) -> Optional[ScrapedProduct]:
        """
        Parse a Shopify product JSON object into a ScrapedProduct.

        Args:
            data: Shopify product JSON data

        Returns:
            ScrapedProduct object or None if parsing fails
        """
        try:
            # Basic info
            product_id = str(data.get("id", ""))
            title = data.get("title", "")
            handle = data.get("handle", "")

            if not product_id or not title:
                return None

            # URL
            url = urljoin(self.base_url, f"/products/{handle}")

            # Price (from first variant)
            variants = data.get("variants", [])
            price = 0.0
            original_price = None
            sizes = []
            availability = "out_of_stock"

            if variants:
                first_variant = variants[0]
                price = float(first_variant.get("price", 0))

                compare_price = first_variant.get("compare_at_price")
                if compare_price:
                    original_price = float(compare_price)

                # Collect sizes and check availability
                for variant in variants:
                    size = variant.get("option1") or variant.get("title", "")
                    if size and size not in sizes and size != "Default Title":
                        sizes.append(size)

                    if variant.get("available", False):
                        availability = "in_stock"

            # Images
            images = []
            for img in data.get("images", []):
                img_url = img.get("src", "")
                if img_url:
                    # Get highest quality version
                    img_url = self._optimize_shopify_image_url(img_url)
                    images.append(img_url)

            # Tags and categories
            tags = data.get("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",")]

            product_type = data.get("product_type", "")
            vendor = data.get("vendor", "")

            # Detect gender
            gender = self.detect_gender(
                {
                    "url": url,
                    "name": title,
                    "tags": tags,
                    "product_type": product_type,
                    "_collection": data.get("_collection", ""),
                }
            )

            # Description (strip HTML)
            description = data.get("body_html", "")
            if description:
                from bs4 import BeautifulSoup

                description = BeautifulSoup(description, "lxml").get_text(
                    separator=" ", strip=True
                )

            return ScrapedProduct(
                id=product_id,
                brand=self.brand_name,
                name=title,
                price=price,
                currency=self.config.get("currency", "USD"),
                url=url,
                images=images,
                original_price=original_price,
                description=description,
                category=product_type,
                gender=gender,
                sizes=sizes,
                tags=tags,
                availability=availability,
                sku=handle,
                vendor=vendor,
                source_data=data,
            )

        except Exception as e:
            self.logger.warning(f"Failed to parse product: {e}")
            return None

    def _optimize_shopify_image_url(self, url: str) -> str:
        """
        Optimize Shopify CDN image URL for best quality.

        Shopify images can have size modifiers like _100x100.
        We remove these to get the original quality image.

        Args:
            url: Shopify image URL

        Returns:
            Optimized image URL
        """
        # Remove size modifiers
        # Pattern: _100x100, _grande, _large, _medium, _small, _compact, _icon
        url = re.sub(
            r"_(pico|icon|thumb|small|compact|medium|large|grande|\d+x\d*)\.",
            ".",
            url,
        )

        # Ensure https
        if url.startswith("//"):
            url = "https:" + url

        return url

    def _scrape_html_fallback(self) -> List[ScrapedProduct]:
        """
        Fallback HTML scraping when JSON API is not available.

        Uses CSS selectors from brand config to extract products.

        Returns:
            List of ScrapedProduct objects
        """
        products = []
        selectors = self.config.get("selectors", {})

        # Get product listing pages
        listing_urls = self.config.get("listing_urls", ["/collections/all"])

        for listing_url in listing_urls:
            full_url = urljoin(self.base_url, listing_url)
            page = 1

            while page <= self.max_pages:
                page_url = f"{full_url}?page={page}"

                try:
                    response = self.fetch_page(page_url)
                    soup = self.parse_html(response.text)

                    # Find product cards
                    card_selector = selectors.get("product_card", ".product-card")
                    cards = soup.select(card_selector)

                    if not cards:
                        break

                    for card in cards:
                        product = self._parse_html_product_card(card, selectors)
                        if product:
                            products.append(product)

                    page += 1

                except Exception as e:
                    self.logger.error(f"HTML scraping failed for {page_url}: {e}")
                    break

        return products

    def _parse_html_product_card(
        self, card, selectors: Dict[str, str]
    ) -> Optional[ScrapedProduct]:
        """
        Parse a product from an HTML card element.

        Args:
            card: BeautifulSoup element containing product info
            selectors: CSS selectors for product fields

        Returns:
            ScrapedProduct or None
        """
        try:
            # Title
            title_elem = card.select_one(selectors.get("title", ".product-title"))
            title = title_elem.get_text(strip=True) if title_elem else ""

            # URL
            link_elem = card.select_one(selectors.get("link", "a"))
            url = link_elem.get("href", "") if link_elem else ""
            url = self.make_absolute_url(url)

            # Extract ID from URL
            product_id = url.split("/")[-1].split("?")[0] if url else ""

            # Price
            price_elem = card.select_one(selectors.get("price", ".price"))
            price = self.clean_price(price_elem.get_text() if price_elem else "0")

            # Original price
            original_price_elem = card.select_one(
                selectors.get("original_price", ".compare-price")
            )
            original_price = (
                self.clean_price(original_price_elem.get_text())
                if original_price_elem
                else None
            )

            # Image
            img_elem = card.select_one(selectors.get("image", "img"))
            images = []
            if img_elem:
                img_url = img_elem.get("src") or img_elem.get("data-src", "")
                if img_url:
                    images.append(self.clean_image_url(img_url))

            if not title or not url:
                return None

            return ScrapedProduct(
                id=product_id,
                brand=self.brand_name,
                name=title,
                price=price or 0.0,
                currency=self.config.get("currency", "USD"),
                url=url,
                images=images,
                original_price=original_price,
            )

        except Exception as e:
            self.logger.warning(f"Failed to parse HTML product card: {e}")
            return None
