# Brand Product Scraper

A modular Python scraper system for collecting fashion products from brand websites. Designed to be easily extensible with new brands through YAML configuration files.

## Features

- **Modular Architecture**: Add new brands via YAML profiles without code changes
- **Multiple Scraper Types**: Supports Shopify stores (JSON API) and generic websites (CSS selectors)
- **Rate Limiting**: Built-in request throttling to respect server limits
- **Price History**: Tracks price changes over time for analytics
- **Scheduled Scraping**: Run scrapers on configurable schedules
- **Gender Detection**: Automatically categorize products by gender
- **Database Storage**: SQLAlchemy ORM with SQLite (configurable)

## Quick Start

### 1. Install Dependencies

```bash
cd brand-scraper
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python main.py init-db
```

### 3. Sync Brand Profiles

```bash
python main.py sync-profiles
```

### 4. Run Scraper

```bash
# Scrape all brands
python main.py scrape

# Scrape specific brand
python main.py scrape --brand pompeii
```

### 5. Export Products

```bash
python main.py export --output products.json
```

## Project Structure

```
brand-scraper/
├── main.py              # CLI entry point
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── README.md
│
├── models/              # Database models
│   ├── __init__.py
│   ├── database.py      # SQLAlchemy setup
│   ├── brand.py         # Brand model
│   └── product.py       # Product & ProductHistory models
│
├── scrapers/            # Scraper implementations
│   ├── __init__.py
│   ├── base.py          # Abstract base scraper
│   ├── shopify.py       # Shopify JSON API scraper
│   └── generic.py       # CSS selector scraper
│
├── profiles/            # Brand configuration files
│   ├── template.yaml    # Template for new brands
│   ├── pompeii.yaml
│   └── aimeleondore.yaml
│
├── utils/               # Utility modules
│   ├── __init__.py
│   ├── logger.py        # Logging configuration
│   └── scheduler.py     # APScheduler wrapper
│
├── data/                # Database storage
│   └── scraper.db
│
└── logs/                # Log files
    └── scraper-YYYY-MM-DD.log
```

## Adding a New Brand

### 1. Create Profile

Copy the template and customize:

```bash
cp profiles/template.yaml profiles/your-brand.yaml
```

### 2. Configure Basic Info

```yaml
name: "Your Brand"
slug: "your-brand"          # Used as unique identifier
base_url: "https://www.yourbrand.com"
```

### 3. Choose Scraper Type

**For Shopify stores:**

```yaml
scraper_type: "shopify"
use_json_api: true
products_per_page: 250
collections:
  - "new-arrivals"
  - "mens"
  - "womens"
```

**For custom websites:**

```yaml
scraper_type: "generic"
listing_urls:
  - "/shop/all"
  - "/collections/all"

selectors:
  product_card: ".product-card"
  link: "a.product-link"
  title: ".product-title"
  price: ".product-price"
  image: "img.product-image"
```

### 4. Configure Gender Detection

```yaml
gender_detection:
  url_patterns:
    mens:
      - "/mens"
      - "/men/"
    womens:
      - "/womens"
      - "/women/"

  title_keywords:
    mens:
      - "men's"
    womens:
      - "women's"

  default: "unisex"  # Fallback if not detected
```

### 5. Sync and Scrape

```bash
python main.py sync-profiles
python main.py scrape --brand your-brand
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `init-db` | Initialize database tables |
| `sync-profiles` | Sync YAML profiles to database |
| `scrape` | Scrape products (all or specific brand) |
| `export` | Export products to JSON |
| `schedule` | Run with continuous scheduler |

### Examples

```bash
# Initialize everything
python main.py init-db
python main.py sync-profiles

# Scrape specific brand
python main.py scrape --brand pompeii

# Export all products
python main.py export --output all-products.json

# Export single brand
python main.py export --output pompeii.json --brand pompeii

# Run scheduler (continuous)
python main.py schedule
```

## Configuration

Edit `config.py` to customize:

```python
# Database
DATABASE_URL = "sqlite:///data/scraper.db"

# Rate limiting
REQUEST_DELAY_MIN = 1.0  # seconds
REQUEST_DELAY_MAX = 3.0  # seconds

# Scraping
DEFAULT_PRODUCTS_PER_PAGE = 250
MAX_PAGES_PER_COLLECTION = 20

# Scheduling
SCRAPE_INTERVAL_HOURS = 6
```

## Scraper Types

### Shopify Scraper

Uses Shopify's `/products.json` API endpoint. This is the most reliable method for Shopify stores.

Features:
- Pagination handling
- Collection filtering
- Variant extraction (sizes, colors)
- Image URL optimization

### Generic Scraper

Uses CSS selectors to extract product data from any website. Requires more configuration but works with any site structure.

Features:
- Configurable selectors
- Pagination support (query or path based)
- Optional fields fallbacks

## Data Model

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `source_id` | string | ID from source (Shopify product ID) |
| `name` | string | Product name |
| `price` | float | Current price |
| `original_price` | float | Compare-at price (if on sale) |
| `currency` | string | Currency code (USD, EUR, etc) |
| `url` | string | Product page URL |
| `images` | list | Image URLs |
| `category` | string | Product category |
| `gender` | string | mens, womens, unisex |
| `sizes` | list | Available sizes |
| `colors` | list | Available colors |
| `tags` | list | Product tags |
| `availability` | string | in_stock, out_of_stock, etc |

### Computed Properties

- `is_on_sale`: True if original_price > price
- `discount_percentage`: Percentage off original price
- `is_new`: True if added within NEW_PRODUCT_DAYS

## Extending

### Adding a New Scraper Type

1. Create new scraper in `scrapers/`:

```python
from scrapers.base import BaseScraper, ScrapedProduct

class CustomScraper(BaseScraper):
    def scrape_products(self) -> List[ScrapedProduct]:
        # Your implementation
        pass
```

2. Register in `scrapers/__init__.py`:

```python
from .custom import CustomScraper

def create_scraper(profile: dict) -> BaseScraper:
    if scraper_type == "custom":
        return CustomScraper(profile)
    # ...
```

### Adding Custom Processing

Override methods in your scraper:

```python
class CustomScraper(BaseScraper):
    def detect_gender(self, product: ScrapedProduct) -> Optional[str]:
        # Custom gender detection logic
        pass

    def detect_category(self, product: ScrapedProduct) -> Optional[str]:
        # Custom category detection
        pass
```

## Logging

Logs are written to:
- Console (INFO level)
- `logs/scraper-YYYY-MM-DD.log` (DEBUG level)

Log format:
```
2024-01-15 10:30:45 | INFO     | scraper.main | Starting scrape for Pompeii
2024-01-15 10:31:12 | INFO     | scraper.main | Completed scrape for Pompeii: 150 products in 27.3s
```

## Troubleshooting

### Rate Limiting Issues

If you're getting blocked, increase delays in `config.py`:

```python
REQUEST_DELAY_MIN = 2.0
REQUEST_DELAY_MAX = 5.0
```

### Missing Products

Check if the brand uses:
- Client-side rendering (may need Playwright)
- Infinite scroll (may need scroll simulation)
- Geographic restrictions (may need proxy)

### Database Issues

Reset the database:

```bash
rm data/scraper.db
python main.py init-db
python main.py sync-profiles
```

## License

MIT
