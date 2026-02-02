"""
Brand Model

Database model for storing brand configuration and scraping metadata.
"""

from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import relationship

from .database import Base


class Brand(Base):
    """
    Brand configuration and status model.

    Stores brand settings and tracks scraping history.
    """

    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Basic info
    name = Column(String(200), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    base_url = Column(String(500), nullable=False)

    # Scraper configuration
    scraper_type = Column(String(50), default="shopify")  # shopify, generic
    config_json = Column(JSON, nullable=True)  # Full profile config

    # Status
    is_active = Column(Boolean, default=True, index=True)
    last_scraped = Column(DateTime, nullable=True)
    last_scrape_status = Column(String(50), nullable=True)  # success, failed, partial
    last_scrape_products = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Optional brand info
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    country = Column(String(100), nullable=True)
    currency = Column(String(10), default="USD")

    # Relationships
    products = relationship("Product", back_populates="brand", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Brand {self.name}>"

    @classmethod
    def from_profile(cls, profile: Dict[str, Any]) -> "Brand":
        """
        Create a Brand instance from a YAML profile dictionary.

        Args:
            profile: Brand profile loaded from YAML

        Returns:
            Brand instance (not yet added to session)
        """
        return cls(
            name=profile.get("name", "Unknown"),
            slug=profile.get("slug", profile.get("name", "unknown").lower().replace(" ", "-")),
            base_url=profile.get("base_url", ""),
            scraper_type=profile.get("scraper_type", "shopify"),
            config_json=profile,
            currency=profile.get("currency", "USD"),
            description=profile.get("description"),
            logo_url=profile.get("logo_url"),
            country=profile.get("country"),
        )

    def update_from_profile(self, profile: Dict[str, Any]):
        """
        Update brand from a profile dictionary.

        Args:
            profile: Brand profile loaded from YAML
        """
        self.name = profile.get("name", self.name)
        self.base_url = profile.get("base_url", self.base_url)
        self.scraper_type = profile.get("scraper_type", self.scraper_type)
        self.config_json = profile
        self.currency = profile.get("currency", self.currency)
        self.description = profile.get("description", self.description)
        self.logo_url = profile.get("logo_url", self.logo_url)
        self.country = profile.get("country", self.country)
        self.updated_at = datetime.utcnow()

    def record_scrape_success(self, product_count: int):
        """Record a successful scrape."""
        self.last_scraped = datetime.utcnow()
        self.last_scrape_status = "success"
        self.last_scrape_products = product_count
        self.last_error = None

    def record_scrape_failure(self, error: str):
        """Record a failed scrape."""
        self.last_scraped = datetime.utcnow()
        self.last_scrape_status = "failed"
        self.last_error = error

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "baseUrl": self.base_url,
            "scraperType": self.scraper_type,
            "isActive": self.is_active,
            "lastScraped": self.last_scraped.isoformat() if self.last_scraped else None,
            "lastScrapeStatus": self.last_scrape_status,
            "productCount": self.last_scrape_products,
            "currency": self.currency,
            "description": self.description,
            "logoUrl": self.logo_url,
            "country": self.country,
        }
