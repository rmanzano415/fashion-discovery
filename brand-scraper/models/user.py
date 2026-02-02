"""
User Model

Database model for subscriber profiles and preferences.
Maps 1:1 to the frontend SubscriberProfile TypeScript interface.
"""

from datetime import datetime
from typing import Dict, Any

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    """
    Subscriber profile model.

    Stores user preferences for zine delivery and product curation.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Identity
    name = Column(String(200), nullable=False)
    contact_method = Column(String(20), nullable=False, default="email")  # email, phone
    contact_value = Column(String(300), nullable=False, unique=True, index=True)

    # Editorial mandate
    silhouette = Column(String(50), default="all")  # menswear, womenswear, all
    tempo = Column(String(50), default="monthly")  # weekly, monthly, quarterly

    # Style briefing
    aesthetic = Column(String(50), nullable=True)  # minimalist, avant-garde, street, heritage
    palette = Column(String(50), nullable=True)  # earth, monolith, primary
    vibe = Column(String(50), nullable=True)  # understated, bold, eclectic, refined

    # Brand preferences
    followed_brands = Column(JSON, default=list)

    # Status
    is_active = Column(Boolean, default=True, index=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interactions = relationship(
        "UserInteraction", back_populates="user", cascade="all, delete-orphan"
    )
    deliveries = relationship(
        "ZineDelivery", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User {self.id}: {self.name}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "subscriberName": self.name,
            "contactMethod": self.contact_method,
            "contactValue": self.contact_value,
            "silhouette": self.silhouette,
            "tempo": self.tempo,
            "aesthetic": self.aesthetic,
            "palette": self.palette,
            "vibe": self.vibe,
            "followedBrands": self.followed_brands or [],
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
