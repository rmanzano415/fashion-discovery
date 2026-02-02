"""
Fashion Discovery API

FastAPI application for user management, interaction tracking,
and delivery history. Bridges the Next.js frontend with the
SQLAlchemy/SQLite backend.
"""

from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import config
from models.database import get_session, init_db
from models.user import User
from models.product import Product
from models.interaction import UserInteraction
from models.delivery import ZineDelivery
from models.brand import Brand

# ═══════════════════════════════════════════════════════════════
# APP SETUP
# ═══════════════════════════════════════════════════════════════

app = FastAPI(title="Fashion Discovery API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ═══════════════════════════════════════════════════════════════
# REQUEST / RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════


class CreateUserRequest(BaseModel):
    subscriberName: str
    contactMethod: str = "email"
    contactValue: str
    silhouette: str = "all"
    tempo: str = "monthly"
    followedBrands: List[str] = Field(default_factory=list)
    aesthetic: Optional[str] = None
    palette: Optional[str] = None
    vibe: Optional[str] = None


class UpdateUserRequest(BaseModel):
    subscriberName: Optional[str] = None
    contactMethod: Optional[str] = None
    contactValue: Optional[str] = None
    silhouette: Optional[str] = None
    tempo: Optional[str] = None
    followedBrands: Optional[List[str]] = None
    aesthetic: Optional[str] = None
    palette: Optional[str] = None
    vibe: Optional[str] = None
    isActive: Optional[bool] = None


class InteractionRequest(BaseModel):
    userId: int
    sourceId: str  # Frontend string ID, resolved to integer FK
    action: str  # swipe_left, swipe_right, favorite, unfavorite


class SyncRequest(BaseModel):
    subscriberName: str
    contactMethod: str = "email"
    contactValue: str
    silhouette: str = "all"
    tempo: str = "monthly"
    followedBrands: List[str] = Field(default_factory=list)
    aesthetic: Optional[str] = None
    palette: Optional[str] = None
    vibe: Optional[str] = None
    favorites: List[str] = Field(default_factory=list)  # source_id strings
    swipedProducts: List[str] = Field(default_factory=list)  # source_id strings


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════


def resolve_source_id(session, source_id: str) -> Optional[int]:
    """Translate a frontend source_id string to an integer products.id."""
    product = (
        session.query(Product)
        .filter(Product.source_id == source_id, Product.is_active == True)  # noqa: E712
        .first()
    )
    return product.id if product else None


# ═══════════════════════════════════════════════════════════════
# USER ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@app.post("/api/users")
def create_user(req: CreateUserRequest):
    """Create a new user from onboarding."""
    session = get_session()
    try:
        # Check for existing user with same contact
        existing = (
            session.query(User)
            .filter(User.contact_value == req.contactValue)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail="User with this contact already exists",
            )

        user = User(
            name=req.subscriberName,
            contact_method=req.contactMethod,
            contact_value=req.contactValue,
            silhouette=req.silhouette,
            tempo=req.tempo,
            followed_brands=req.followedBrands,
            aesthetic=req.aesthetic,
            palette=req.palette,
            vibe=req.vibe,
        )
        session.add(user)
        session.commit()
        return user.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    """Get user profile by ID."""
    session = get_session()
    try:
        user = session.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.to_dict()
    finally:
        session.close()


@app.put("/api/users/{user_id}")
def update_user(user_id: int, req: UpdateUserRequest):
    """Update user profile."""
    session = get_session()
    try:
        user = session.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = req.model_dump(exclude_none=True)

        # Map camelCase request fields to snake_case model fields
        field_map = {
            "subscriberName": "name",
            "contactMethod": "contact_method",
            "contactValue": "contact_value",
            "followedBrands": "followed_brands",
            "isActive": "is_active",
        }

        for req_field, value in update_data.items():
            model_field = field_map.get(req_field, req_field)
            setattr(user, model_field, value)

        user.updated_at = datetime.utcnow()
        session.commit()
        return user.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


# ═══════════════════════════════════════════════════════════════
# INTERACTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════


VALID_ACTIONS = {"swipe_left", "swipe_right", "favorite", "unfavorite"}


@app.post("/api/interactions")
def log_interaction(req: InteractionRequest):
    """Log a user interaction (swipe/favorite) event."""
    if req.action not in VALID_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {', '.join(VALID_ACTIONS)}",
        )

    session = get_session()
    try:
        # Verify user exists
        user = session.query(User).get(req.userId)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Resolve source_id to product FK
        product_id = resolve_source_id(session, req.sourceId)
        if product_id is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product not found for sourceId: {req.sourceId}",
            )

        interaction = UserInteraction(
            user_id=req.userId,
            product_id=product_id,
            action=req.action,
        )
        session.add(interaction)
        session.commit()
        return interaction.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@app.get("/api/users/{user_id}/favorites")
def get_favorites(user_id: int):
    """
    Derive current favorites for a user.

    A product is a current favorite if the most recent interaction
    for that (user, product) pair is 'favorite' (not 'unfavorite').
    """
    session = get_session()
    try:
        user = session.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get all favorite/unfavorite interactions, newest first
        interactions = (
            session.query(UserInteraction)
            .filter(
                UserInteraction.user_id == user_id,
                UserInteraction.action.in_(["favorite", "unfavorite"]),
            )
            .order_by(UserInteraction.created_at.desc())
            .all()
        )

        # Determine current state per product
        seen = set()
        favorite_product_ids = []
        for interaction in interactions:
            if interaction.product_id not in seen:
                seen.add(interaction.product_id)
                if interaction.action == "favorite":
                    favorite_product_ids.append(interaction.product_id)

        # Fetch product details
        products = []
        if favorite_product_ids:
            product_rows = (
                session.query(Product)
                .filter(Product.id.in_(favorite_product_ids))
                .all()
            )
            products = [p.to_dict() for p in product_rows]

        return {"userId": user_id, "favorites": products}
    finally:
        session.close()


# ═══════════════════════════════════════════════════════════════
# DELIVERY ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@app.get("/api/users/{user_id}/deliveries")
def get_deliveries(
    user_id: int,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Get delivery history for a user."""
    session = get_session()
    try:
        user = session.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        deliveries = (
            session.query(ZineDelivery)
            .filter(ZineDelivery.user_id == user_id)
            .order_by(ZineDelivery.scheduled_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return {
            "userId": user_id,
            "deliveries": [d.to_dict() for d in deliveries],
        }
    finally:
        session.close()


# ═══════════════════════════════════════════════════════════════
# SYNC ENDPOINT
# ═══════════════════════════════════════════════════════════════


@app.post("/api/users/{user_id}/sync")
def sync_user(user_id: int, req: SyncRequest):
    """
    One-time migration from localStorage.

    Updates user profile and imports favorite/swiped product interactions.
    """
    session = get_session()
    try:
        user = session.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update profile fields
        user.name = req.subscriberName
        user.contact_method = req.contactMethod
        user.contact_value = req.contactValue
        user.silhouette = req.silhouette
        user.tempo = req.tempo
        user.followed_brands = req.followedBrands
        user.aesthetic = req.aesthetic
        user.palette = req.palette
        user.vibe = req.vibe
        user.updated_at = datetime.utcnow()

        # Import favorites
        imported_favorites = 0
        for source_id in req.favorites:
            product_id = resolve_source_id(session, source_id)
            if product_id:
                interaction = UserInteraction(
                    user_id=user_id,
                    product_id=product_id,
                    action="favorite",
                )
                session.add(interaction)
                imported_favorites += 1

        # Import swiped products as swipe_right
        imported_swiped = 0
        for source_id in req.swipedProducts:
            product_id = resolve_source_id(session, source_id)
            if product_id:
                interaction = UserInteraction(
                    user_id=user_id,
                    product_id=product_id,
                    action="swipe_right",
                )
                session.add(interaction)
                imported_swiped += 1

        session.commit()

        return {
            "userId": user_id,
            "profile": user.to_dict(),
            "importedFavorites": imported_favorites,
            "importedSwiped": imported_swiped,
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()
