# Fashion Discovery

A mobile-first fashion discovery app with Tinder-style swipe gestures. Browse curated products from Aime Leon Dore, swipe right to save favorites, and build your wishlist.

## Features

- **Swipeable Cards**: Drag products left to skip or right to save
- **Gesture Controls**: Natural swipe interactions with visual feedback
- **Favorites List**: Persistent storage of liked items using localStorage
- **Progress Tracking**: See how many products you've browsed
- **Magazine-Style UI**: Clean, modern design with smooth animations
- **Mobile-First**: Optimized for touch devices, works great on desktop too
- **Real Product Data**: Scrapes actual products from Aime Leon Dore

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Data**: Product scraper for Shopify stores

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd fashion-discovery
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
fashion-discovery/
├── scraper/
│   └── scrape-ald.ts      # Product scraper for Aime Leon Dore
├── src/
│   ├── app/
│   │   ├── favorites/
│   │   │   └── page.tsx   # Favorites list page
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout with providers
│   │   └── page.tsx       # Home page with card stack
│   ├── components/
│   │   ├── ActionButtons.tsx   # Like/dislike buttons
│   │   ├── CardStack.tsx       # Manages visible cards
│   │   ├── FavoriteCard.tsx    # Grid card for favorites
│   │   ├── Header.tsx          # Page header with progress
│   │   ├── Navigation.tsx      # Bottom tab navigation
│   │   ├── ProductCard.tsx     # Swipeable product card
│   │   └── Providers.tsx       # App context provider
│   ├── data/
│   │   └── products.json       # Scraped product data
│   ├── hooks/
│   │   ├── useFavorites.ts     # Favorites management
│   │   └── useSwipedProducts.ts # Swipe tracking
│   └── types/
│       └── product.ts          # TypeScript interfaces
└── package.json
```

## Scraper

The scraper extracts products from Aime Leon Dore's Shopify store.

### Running the Scraper

```bash
npx ts-node scraper/scrape-ald.ts
```

This will:
1. Fetch products from the Shopify JSON API
2. Transform the data to our format
3. Save 50 products to `src/data/products.json`

### Scraped Data Format

```typescript
interface Product {
  id: string;
  name: string;
  price: string;
  priceNumeric: number;
  images: string[];
  url: string;
  brand: string;
  category?: string;
  description?: string;
  colors?: string[];
  sizes?: string[];
}
```

### Anti-Scraping Notes

Aime Leon Dore uses Shopify, which exposes a `/products.json` endpoint. If this endpoint is blocked, the scraper includes fallback sample data. Alternative approaches:
- Use a headless browser (Puppeteer/Playwright)
- Rotate user agents
- Add delays between requests
- Use a proxy service

## Usage

### Discover Page
- **Swipe Right** or **Tap Heart**: Save product to favorites
- **Swipe Left** or **Tap X**: Skip product
- **Image Arrows**: Browse multiple product images
- **Reset Button**: Start over with all products

### Favorites Page
- View all saved products in a grid
- Click product to visit the original page
- Remove items with the trash icon
- Clear all favorites with Reset

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Customization

### Adding New Brands

1. Create a new scraper in `scraper/` following the ALD pattern
2. Update the data source in `src/data/`
3. Modify the Product interface if needed

### Styling

The app uses TailwindCSS with a custom color scheme defined in `globals.css`. Key design tokens:
- Background: `#f9fafb` (gray-50)
- Text: `#111827` (gray-900)
- Accent: System colors for like (green) and dislike (red)

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Static Export

```bash
npm run build
# Output in .next/ folder
```

## License

MIT
