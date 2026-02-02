"""
Zine Delivery Model

Tracks scheduled and completed zine deliveries to users.
"""

from datetime import datetime
from typing import Dict, Any

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from .database import Base


class ZineDelivery(Base):
    """
    Zine delivery tracking model.

    Records delivery lifecycle: pending -> generating -> delivered | failed
    """

    __tablename__ = "zine_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Schedule
    scheduled_at = Column(DateTime, nullable=False, index=True)
    delivered_at = Column(DateTime, nullable=True)

    # Status: pending, generating, delivered, failed
    status = Column(String(50), default="pending", nullable=False, index=True)

    # Content snapshot — product IDs included in this delivery
    product_ids = Column(JSON, default=list)

    # Delivery details
    delivery_method = Column(String(50), nullable=False, default="email")  # email, phone
    delivery_address = Column(String(300), nullable=False)

    # Error tracking
    error = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="deliveries")

    def __repr__(self):
        return f"<ZineDelivery {self.id} user={self.user_id} status={self.status}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "userId": self.user_id,
            "scheduledAt": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "deliveredAt": self.delivered_at.isoformat() if self.delivered_at else None,
            "status": self.status,
            "productIds": self.product_ids or [],
            "deliveryMethod": self.delivery_method,
            "deliveryAddress": self.delivery_address,
            "error": self.error,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
