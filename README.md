# Fashion Discovery

A personalized fashion curation app that creates custom "zine" editions based on your style preferences. Complete an editorial-style onboarding to define your aesthetic, select brands you love, and receive AI-curated product recommendations tailored to your taste.

## Features

### Onboarding Experience
- **Editorial Briefing Flow**: Magazine-inspired onboarding with style specification, aesthetic quiz, and brand selection
- **Style Profiling**: Choose your aesthetic (minimalist, avant-garde, street, heritage), palette (earth tones, monochrome, brights), and vibe (understated, bold, eclectic, refined)
- **Brand Directory**: Select from curated brands or add custom ones
- **Printing Interstitial**: Animated "press" experience when your edition is being prepared

### Personalized Recommendations
- **AI Product Tagging**: Products analyzed with Claude Vision for aesthetic tags, color palettes, style vibes, and occasions
- **Smart Matching**: Scoring engine matches your preferences against product AI tags
- **Curated Zine**: Diversity-balanced selection across brands and categories
- **Match Explanations**: Understand why products were recommended for you

### Curation Gate
- **Readiness Check**: After onboarding, verifies if enough products are ready for your selected brands
- **Matching Interstitial**: When ready, animated approval flow with audio feedback before viewing your zine
- **Editorial Desk**: When not ready, shows brand status and notification opt-in

### Discovery Interface
- **Tearable Cards**: Double-tap to "tear" and collect products with paper-tear sound effects
- **Swipe Gestures**: Natural card interactions with visual feedback
- **Favorites Collection**: Persistent storage of collected items
- **Product Details**: Full product info with brand context

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Audio**: Web Audio API for UI sounds

### Backend
- **API**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **AI**: Claude Vision for product tagging

## Project Structure

```
fashion-discovery/
├── brand-scraper/                 # Python backend
│   ├── api.py                     # FastAPI endpoints
│   ├── config.py                  # Configuration
│   ├── models/                    # SQLAlchemy models
│   │   ├── brand.py
│   │   ├── product.py
│   │   ├── user.py
│   │   ├── interaction.py
│   │   └── delivery.py
│   ├── matching/                  # Recommendation engine
│   │   ├── scorer.py              # Preference-to-product scoring
│   │   ├── ranker.py              # Product ranking
│   │   ├── curator.py             # Diversity-balanced selection
│   │   └── explainer.py           # Match explanations
│   ├── tagging/                   # AI product analysis
│   │   ├── tagger.py              # Claude Vision integration
│   │   └── taxonomy.py            # Style/aesthetic enums
│   ├── scrapers/                  # Brand product scrapers
│   └── data/                      # SQLite database
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main zine view
│   │   ├── onboarding/            # Onboarding flow
│   │   ├── editorial-desk/        # Curation pending page
│   │   ├── favorites/             # Collected items
│   │   └── settings/              # User preferences
│   ├── components/
│   │   ├── onboarding/            # Onboarding screens
│   │   │   ├── OnboardingContainer.tsx
│   │   │   ├── CoverScreen.tsx
│   │   │   ├── SpecificationScreen.tsx
│   │   │   ├── StyleBriefing.tsx
│   │   │   ├── BrandDirectory.tsx
│   │   │   ├── RegistryScreen.tsx
│   │   │   ├── PrintingInterstitial.tsx
│   │   │   └── MatchingInterstitial.tsx
│   │   ├── EditorialDesk.tsx      # Curation pending UI
│   │   ├── TearableImage.tsx      # Collectible product card
│   │   ├── ZineSpread.tsx         # Magazine layout
│   │   └── Providers.tsx          # App context
│   ├── hooks/
│   │   ├── useSubscriberProfile.ts
│   │   ├── useRecommendations.ts
│   │   ├── useFavorites.ts
│   │   └── useSwipedProducts.ts
│   └── lib/
│       ├── curationGate.ts        # Curation readiness check
│       └── profileMapping.ts      # Profile type conversion
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd fashion-discovery
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up the Python backend:
```bash
cd brand-scraper
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# In brand-scraper/.env
ANTHROPIC_API_KEY=your_api_key_here
```

### Running the App

1. Start the backend API:
```bash
cd brand-scraper
source venv/bin/activate
uvicorn api:app --reload --port 8000
```

2. Start the frontend (in a new terminal):
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Users
- `POST /api/users` - Create user from onboarding
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile

### Recommendations
- `GET /api/recommendations/{user_id}` - Get ranked recommendations
- `GET /api/recommendations/{user_id}/curated` - Get curated zine
- `GET /api/recommendations/{user_id}/explain/{product_id}` - Explain match
- `POST /api/recommendations/preview` - Preview for preferences

### Curation
- `POST /api/curation-status` - Check if curation is ready for brands

### Interactions
- `POST /api/interactions` - Log swipe/favorite events
- `GET /api/users/{user_id}/favorites` - Get user's favorites

## Product Tagging

Products are analyzed with Claude Vision to extract:
- **Aesthetics**: minimalist, maximalist, avant-garde, streetwear, etc.
- **Palette**: earth-tones, monochrome, pastels, brights, etc.
- **Vibes**: understated, bold, playful, sophisticated, etc.
- **Occasions**: casual, formal, athletic, evening, etc.
- **Materials**: cotton, leather, denim, silk, etc.

Run the tagger:
```bash
cd brand-scraper
source venv/bin/activate
python -m tagging.tagger --brand aime-leon-dore --limit 50
```

## Design System

The app uses an editorial/archival aesthetic:
- **Archive White**: `#F8F5F2` - Primary background
- **Ink Black**: `#1A1A1A` - Primary text
- **Paper Cream**: `#F4F1ED` - Secondary background
- **Accent Warm**: `#C4A77D` - Highlights

Typography:
- **Serif**: Georgia/Times for editorial headers
- **Mono**: SF Mono for labels and captions

## Scripts

```bash
# Frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint

# Backend
uvicorn api:app --reload  # Start API server
python -m tagging.tagger  # Run product tagger
```

## License

MIT
