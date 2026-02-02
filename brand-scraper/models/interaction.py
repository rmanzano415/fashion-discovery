"""
User Interaction Model

Append-only event log for tracking user interactions with products.
"""

from datetime import datetime
from typing import Dict, Any

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from .database import Base


class UserInteraction(Base):
    """
    User interaction event log.

    Records swipe and favorite actions for analytics and recommendations.
    Actions: swipe_left, swipe_right, favorite, unfavorite
    """

    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # swipe_left, swipe_right, favorite, unfavorite
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="interactions")
    product = relationship("Product")

    __table_args__ = (
        Index("idx_user_action", "user_id", "action"),
        Index("idx_user_product", "user_id", "product_id"),
    )

    def __repr__(self):
        return f"<UserInteraction {self.user_id} {self.action} {self.product_id}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "userId": self.user_id,
            "productId": self.product_id,
            "action": self.action,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
