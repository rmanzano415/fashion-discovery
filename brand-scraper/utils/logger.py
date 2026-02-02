"""
Logging Configuration

Provides consistent logging across the scraper with file and console output.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import config


def setup_logging(
    log_level: str = "INFO",
    log_dir: Optional[Path] = None,
    log_to_file: bool = True,
    log_to_console: bool = True,
) -> logging.Logger:
    """
    Set up logging configuration for the scraper.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files (defaults to config.LOG_DIR)
        log_to_file: Whether to log to file
        log_to_console: Whether to log to console

    Returns:
        Configured root logger
    """
    log_dir = log_dir or config.LOGS_DIR
    log_dir.mkdir(parents=True, exist_ok=True)

    # Create root logger
    root_logger = logging.getLogger("scraper")
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Clear existing handlers
    root_logger.handlers.clear()

    # Log format
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.DEBUG)
        root_logger.addHandler(console_handler)

    # File handler - daily rotating log
    if log_to_file:
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = log_dir / f"scraper-{today}.log"

        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.DEBUG)
        root_logger.addHandler(file_handler)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger for a specific module.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Logger instance

    Usage:
        from utils.logger import get_logger
        logger = get_logger(__name__)
        logger.info("Scraping started")
    """
    # Create child logger under root "scraper" logger
    return logging.getLogger(f"scraper.{name}")


class ScrapeLogger:
    """
    Context manager for logging a scrape operation.

    Logs start, end, duration, and any errors for a scraping session.
    """

    def __init__(self, brand_name: str):
        self.brand_name = brand_name
        self.logger = get_logger("scrape")
        self.start_time: Optional[datetime] = None
        self.product_count = 0

    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.info(f"Starting scrape for {self.brand_name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = datetime.now() - self.start_time
        duration_str = f"{duration.total_seconds():.1f}s"

        if exc_type is None:
            self.logger.info(
                f"Completed scrape for {self.brand_name}: "
                f"{self.product_count} products in {duration_str}"
            )
        else:
            self.logger.error(
                f"Failed scrape for {self.brand_name} after {duration_str}: "
                f"{exc_type.__name__}: {exc_val}"
            )

        # Don't suppress exceptions
        return False

    def set_product_count(self, count: int):
        """Update the product count for logging."""
        self.product_count = count
