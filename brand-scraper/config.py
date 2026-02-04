"""
Configuration settings for the brand scraper system.

Environment variables can override these defaults.
Create a .env file in the project root for local development.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ═══════════════════════════════════════════════════════════════
# PATHS
# ═══════════════════════════════════════════════════════════════

BASE_DIR = Path(__file__).parent
PROFILES_DIR = BASE_DIR / "profiles"
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/products.db")

# ═══════════════════════════════════════════════════════════════
# SCRAPING SETTINGS
# ═══════════════════════════════════════════════════════════════

# Respectful rate limiting (seconds between requests)
REQUEST_DELAY_MIN = float(os.getenv("REQUEST_DELAY_MIN", "2.0"))
REQUEST_DELAY_MAX = float(os.getenv("REQUEST_DELAY_MAX", "4.0"))

# Request timeout (seconds)
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))

# Maximum retries for failed requests
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# Whether to use rotating user agents
USE_ROTATING_USER_AGENTS = os.getenv("USE_ROTATING_USER_AGENTS", "true").lower() == "true"

# Default user agent if rotation is disabled
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# ═══════════════════════════════════════════════════════════════
# SCHEDULING
# ═══════════════════════════════════════════════════════════════

# How often to run scrapers (cron expression)
# Default: Daily at 6 AM
SCRAPE_SCHEDULE_HOUR = int(os.getenv("SCRAPE_SCHEDULE_HOUR", "6"))
SCRAPE_SCHEDULE_MINUTE = int(os.getenv("SCRAPE_SCHEDULE_MINUTE", "0"))

# ═══════════════════════════════════════════════════════════════
# PRODUCT SETTINGS
# ═══════════════════════════════════════════════════════════════

# Products not seen for this many days are marked unavailable
UNAVAILABLE_THRESHOLD_DAYS = int(os.getenv("UNAVAILABLE_THRESHOLD_DAYS", "7"))

# Products are considered "new" for this many days
NEW_PRODUCT_DAYS = int(os.getenv("NEW_PRODUCT_DAYS", "30"))

# ═══════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = LOGS_DIR / "scraper.log"
LOG_MAX_BYTES = int(os.getenv("LOG_MAX_BYTES", "10485760"))  # 10MB
LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))

# ═══════════════════════════════════════════════════════════════
# NOTIFICATIONS (Optional)
# ═══════════════════════════════════════════════════════════════

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ALERT_EMAIL = os.getenv("ALERT_EMAIL")

# ═══════════════════════════════════════════════════════════════
# API SETTINGS
# ═══════════════════════════════════════════════════════════════

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# ═══════════════════════════════════════════════════════════════
# EXPORT SETTINGS
# ═══════════════════════════════════════════════════════════════

# Path to export JSON files for the frontend
EXPORT_DIR = BASE_DIR.parent / "src" / "data"

# ═══════════════════════════════════════════════════════════════
# AI TAGGING
# ═══════════════════════════════════════════════════════════════

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
TAGGER_MODEL = os.getenv("TAGGER_MODEL", "claude-sonnet-4-5-20250929")
TAGGER_MAX_TOKENS = int(os.getenv("TAGGER_MAX_TOKENS", "512"))
TAGGER_MAX_IMAGES = int(os.getenv("TAGGER_MAX_IMAGES", "2"))
TAGGER_BATCH_SIZE = int(os.getenv("TAGGER_BATCH_SIZE", "20"))
TAGGER_BATCH_POLL_INTERVAL = int(os.getenv("TAGGER_BATCH_POLL_INTERVAL", "60"))
TAGGER_AUTO_TAG_NEW = os.getenv("TAGGER_AUTO_TAG_NEW", "false").lower() == "true"
