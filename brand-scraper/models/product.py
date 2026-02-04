"""
Product Models

Database models for storing scraped product data and history.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
import json

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    Index,
    JSON,
)
from sqlalchemy.orm import relationship

from .database import Base


class Product(Base):
    """
    Main product model.

    Stores current state of each product with tracking metadata.
    """

    __tablename__ = "products"

    # Primary key - composite of brand + source ID for uniqueness
    id = Column(Integer, primary_key=True, autoincrement=True)

    # External ID from source (e.g., Shopify product ID)
    source_id = Column(String(100), nullable=False, index=True)

    # Brand relationship
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    brand = relationship("Brand", back_populates="products")

    # Basic product info
    name = Column(String(500), nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)  # Compare-at price
    currency = Column(String(10), default="USD")

    # URLs
    url = Column(String(1000), nullable=False)
    images = Column(JSON, default=list)  # List of image URLs

    # Classification
    category = Column(String(200), nullable=True, index=True)
    gender = Column(String(50), nullable=True, index=True)  # mens, womens, unisex

    # Additional details
    description = Column(Text, nullable=True)
    sizes = Column(JSON, default=list)
    colors = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    sku = Column(String(100), nullable=True)
    vendor = Column(String(200), nullable=True)

    # Availability
    availability = Column(String(50), default="in_stock", index=True)
    # in_stock, out_of_stock, limited, discontinued

    # Tracking timestamps
    first_seen = Column(DateTime, default=datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Soft delete - keep products but mark as removed
    is_active = Column(Boolean, default=True, index=True)
    removed_at = Column(DateTime, nullable=True)

    # Raw source data for debugging
    source_data = Column(JSON, nullable=True)

    # AI tagging
    ai_tags = Column(JSON, nullable=True)
    tagged_at = Column(DateTime, nullable=True)

    # Price history relationship
    price_history = relationship(
        "ProductHistory", back_populates="product", cascade="all, delete-orphan"
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_brand_source", "brand_id", "source_id", unique=True),
        Index("idx_gender_availability", "gender", "availability"),
        Index("idx_first_seen", "first_seen"),
    )

    def __repr__(self):
        return f"<Product {self.brand_id}:{self.source_id} - {self.name[:30]}>"

    @property
    def is_on_sale(self) -> bool:
        """Check if product is currently on sale."""
        return self.original_price is not None and self.original_price > self.price

    @property
    def discount_percentage(self) -> Optional[float]:
        """Calculate discount percentage if on sale."""
        if self.is_on_sale and self.original_price:
            return round((1 - self.price / self.original_price) * 100, 1)
        return None

    @property
    def days_since_added(self) -> int:
        """Days since product was first seen."""
        if self.first_seen:
            return (datetime.utcnow() - self.first_seen).days
        return 0

    @property
    def is_new(self) -> bool:
        """Check if product is considered 'new' (within 30 days)."""
        import config
        return self.days_since_added <= config.NEW_PRODUCT_DAYS

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON export."""
        return {
            "id": str(self.source_id),
            "brand": self.brand.name if self.brand else "",
            "name": self.name,
            "price": self.price,
            "originalPrice": self.original_price,
            "currency": self.currency,
            "url": self.url,
            "images": self.images or [],
            "category": self.category,
            "gender": self.gender,
            "description": self.description,
            "sizes": self.sizes or [],
            "colors": self.colors or [],
            "tags": self.tags or [],
            "availability": self.availability,
            "isNew": self.is_new,
            "isOnSale": self.is_on_sale,
            "discountPercentage": self.discount_percentage,
            "firstSeen": self.first_seen.isoformat() if self.first_seen else None,
            "aiTags": self.ai_tags,
            "taggedAt": self.tagged_at.isoformat() if self.tagged_at else None,
        }

    def update_from_scraped(self, scraped: "ScrapedProduct"):
        """
        Update product from a ScrapedProduct object.

        Records price changes in history.
        """
        from scrapers import ScrapedProduct

        # Track price change
        if self.price != scraped.price:
            history = ProductHistory(
                product_id=self.id,
                price=scraped.price,
                original_price=scraped.original_price,
                availability=scraped.availability,
            )
            self.price_history.append(history)

        # Update fields
        self.name = scraped.name
        self.price = scraped.price
        self.original_price = scraped.original_price
        self.url = scraped.url
        self.images = scraped.images
        self.category = scraped.category or self.category
        self.gender = scraped.gender or self.gender
        self.description = scraped.description
        self.sizes = scraped.sizes
        self.colors = scraped.colors
        self.tags = scraped.tags
        self.availability = scraped.availability
        self.sku = scraped.sku
        self.vendor = scraped.vendor
        self.last_seen = datetime.utcnow()
        self.last_updated = datetime.utcnow()
        self.source_data = scraped.source_data

        # Reactivate if previously removed
        if not self.is_active:
            self.is_active = True
            self.removed_at = None


class ProductHistory(Base):
    """
    Product price/availability history.

    Tracks changes over time for analytics and notifications.
    """

    __tablename__ = "product_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # State at this point in time
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    availability = Column(String(50), default="in_stock")

    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    product = relationship("Product", back_populates="price_history")

    def __repr__(self):
        return f"<ProductHistory {self.product_id} @ {self.recorded_at}: ${self.price}>"
