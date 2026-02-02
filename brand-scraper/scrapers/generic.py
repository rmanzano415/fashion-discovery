"""
Generic Scraper Module

Fallback scraper for non-Shopify sites that relies entirely on
CSS selectors defined in the brand profile.

This scraper is highly configurable through YAML profiles and can
handle most website structures with proper selector configuration.
"""

from typing import List, Dict, Optional
from urllib.parse import urljoin

from .base import BaseScraper, ScrapedProduct


class GenericScraper(BaseScraper):
    """
    Generic scraper that uses CSS selectors from configuration.

    Requires a well-defined brand profile with selectors for:
    - Product cards/containers
    - Title, price, image, URL elements
    - Pagination handling

    Best for:
    - Custom-built e-commerce sites
    - Sites that block API access
    - Sites with non-standard structures
    """

    def __init__(self, brand_config: dict):
        super().__init__(brand_config)

        # Get selectors from config
        self.selectors = brand_config.get("selectors", {})
        self.pagination = brand_config.get("pagination", {})

        # Validate required selectors
        self._validate_selectors()

    def _validate_selectors(self):
        """Validate that required selectors are present in config."""
        required = ["product_card"]
        missing = [s for s in required if s not in self.selectors]

        if missing:
            self.logger.warning(
                f"Missing recommended selectors: {missing}. "
                "Scraping may not work correctly."
            )

    def scrape_products(self) -> List[ScrapedProduct]:
        """
        Scrape products using CSS selectors from configuration.

        Returns:
            List of ScrapedProduct objects
        """
        products = []

        # Get listing pages to scrape
        listing_urls = self.config.get("listing_urls", ["/"])
        max_pages = self.config.get("max_pages", 10)

        for listing_url in listing_urls:
            listing_products = self._scrape_listing_page(listing_url, max_pages)
            products.extend(listing_products)

        # Deduplicate
        seen_ids = set()
        unique_products = []
        for product in products:
            if product.id not in seen_ids:
                seen_ids.add(product.id)
                unique_products.append(product)

        return unique_products

    def _scrape_listing_page(
        self, base_listing_url: str, max_pages: int
    ) -> List[ScrapedProduct]:
        """
        Scrape all pages of a product listing.

        Args:
            base_listing_url: Starting URL for the listing
            max_pages: Maximum number of pages to scrape

        Returns:
            List of products from all pages
        """
        products = []
        page = 1

        while page <= max_pages:
            # Build page URL
            page_url = self._build_page_url(base_listing_url, page)
            full_url = urljoin(self.base_url, page_url)

            self.logger.debug(f"Scraping page {page}: {full_url}")

            try:
                response = self.fetch_page(full_url)
                soup = self.parse_html(response.text)

                # Find product cards
                card_selector = self.selectors.get("product_card", ".product")
                cards = soup.select(card_selector)

                if not cards:
                    self.logger.debug(f"No products found on page {page}, stopping")
                    break

                self.logger.debug(f"Found {len(cards)} products on page {page}")

                for card in cards:
                    product = self._parse_product_card(card)
                    if product:
                        products.append(product)

                # Check for next page
                if not self._has_next_page(soup, page):
                    break

                page += 1

            except Exception as e:
                self.logger.error(f"Error scraping page {page}: {e}")
                break

        return products

    def _build_page_url(self, base_url: str, page: int) -> str:
        """
        Build URL for a specific page number.

        Args:
            base_url: Base listing URL
            page: Page number

        Returns:
            URL with page parameter
        """
        if page == 1:
            return base_url

        pagination_type = self.pagination.get("type", "query")
        param_name = self.pagination.get("param", "page")

        if pagination_type == "query":
            # ?page=2
            separator = "&" if "?" in base_url else "?"
            return f"{base_url}{separator}{param_name}={page}"
        elif pagination_type == "path":
            # /page/2 or /2
            return f"{base_url}/{param_name}/{page}"
        else:
            return f"{base_url}?{param_name}={page}"

    def _has_next_page(self, soup, current_page: int) -> bool:
        """
        Check if there's a next page to scrape.

        Args:
            soup: BeautifulSoup object of current page
            current_page: Current page number

        Returns:
            True if next page exists
        """
        next_selector = self.pagination.get("next_selector")

        if next_selector:
            next_elem = soup.select_one(next_selector)
            return next_elem is not None

        # Default: assume there's always a next page until we find no products
        return True

    def _parse_product_card(self, card) -> Optional[ScrapedProduct]:
        """
        Parse a product from an HTML card element.

        Args:
            card: BeautifulSoup element containing product info

        Returns:
            ScrapedProduct or None if parsing fails
        """
        try:
            # Extract product URL and ID first
            url = self._extract_url(card)
            product_id = self._extract_id(card, url)

            if not url:
                self.logger.debug("No URL found for product card")
                return None

            # Extract basic info
            title = self._extract_text(card, "title")
            price = self._extract_price(card, "price")
            original_price = self._extract_price(card, "original_price")
            images = self._extract_images(card)

            if not title:
                self.logger.debug(f"No title found for product: {url}")
                return None

            # Extract additional info
            category = self._extract_text(card, "category")
            description = self._extract_text(card, "description")

            # Build product data for gender detection
            product_data = {
                "url": url,
                "name": title,
                "category": category,
            }

            return ScrapedProduct(
                id=product_id,
                brand=self.brand_name,
                name=title,
                price=price or 0.0,
                currency=self.config.get("currency", "USD"),
                url=url,
                images=images,
                original_price=original_price,
                description=description,
                category=category,
                gender=self.detect_gender(product_data),
            )

        except Exception as e:
            self.logger.warning(f"Failed to parse product card: {e}")
            return None

    def _extract_url(self, card) -> str:
        """Extract product URL from card."""
        link_selector = self.selectors.get("link", "a")
        link_elem = card.select_one(link_selector)

        if link_elem:
            href = link_elem.get("href", "")
            return self.make_absolute_url(href)

        return ""

    def _extract_id(self, card, url: str) -> str:
        """Extract product ID from card or URL."""
        # Try ID selector first
        id_selector = self.selectors.get("id")
        if id_selector:
            id_elem = card.select_one(id_selector)
            if id_elem:
                # Check for data attribute
                product_id = id_elem.get("data-product-id") or id_elem.get("data-id")
                if product_id:
                    return str(product_id)

        # Try card's data attributes
        card_id = card.get("data-product-id") or card.get("data-id")
        if card_id:
            return str(card_id)

        # Fall back to URL-based ID
        if url:
            # Get last path segment
            path = url.rstrip("/").split("/")[-1]
            # Remove query string
            path = path.split("?")[0]
            return path

        return ""

    def _extract_text(self, card, field: str) -> str:
        """Extract text content for a field."""
        selector = self.selectors.get(field)
        if not selector:
            return ""

        elem = card.select_one(selector)
        if elem:
            return elem.get_text(strip=True)

        return ""

    def _extract_price(self, card, field: str) -> Optional[float]:
        """Extract and clean price for a field."""
        text = self._extract_text(card, field)
        if text:
            return self.clean_price(text)
        return None

    def _extract_images(self, card) -> List[str]:
        """Extract product images from card."""
        images = []

        img_selector = self.selectors.get("image", "img")
        img_elems = card.select(img_selector)

        for img in img_elems:
            # Try various image attributes
            url = (
                img.get("src")
                or img.get("data-src")
                or img.get("data-lazy-src")
                or img.get("data-original")
            )

            if url:
                clean_url = self.clean_image_url(url)
                if clean_url and clean_url not in images:
                    images.append(clean_url)

        # Also check for srcset
        if not images:
            for img in img_elems:
                srcset = img.get("srcset", "")
                if srcset:
                    # Get highest resolution from srcset
                    parts = srcset.split(",")
                    if parts:
                        # Last one is usually highest res
                        last_src = parts[-1].strip().split(" ")[0]
                        if last_src:
                            images.append(self.clean_image_url(last_src))

        return images
