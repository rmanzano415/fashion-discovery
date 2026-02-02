"""
Database Configuration Module

Sets up SQLAlchemy engine, session, and base model class.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import config

# Create engine
engine = create_engine(
    config.DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    future=True,
)

# Session factory
Session = sessionmaker(bind=engine, expire_on_commit=False)

# Base class for models
Base = declarative_base()


def init_db():
    """
    Initialize the database by creating all tables.

    Call this once on first run or when schema changes.
    """
    # Import all models to ensure they're registered
    from . import product, brand, user, interaction, delivery  # noqa: F401

    Base.metadata.create_all(engine)


def get_session():
    """
    Get a new database session.

    Usage:
        with get_session() as session:
            products = session.query(Product).all()

    Returns:
        SQLAlchemy session context manager
    """
    return Session()
