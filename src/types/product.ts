export interface AiTags {
  aesthetics: string[];
  palette: string;
  vibes: string[];
  category: string;
  occasions: string[];
  season: string;
  price_tier: string;
  color_temperature: string;
  primary_colors: string[];
  keywords: string[];
}

export interface Product {
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
  aiTags?: AiTags;
  taggedAt?: string;
}

export interface SwipeDirection {
  direction: 'left' | 'right';
  productId: string;
}
