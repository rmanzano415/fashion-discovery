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
}

export interface SwipeDirection {
  direction: 'left' | 'right';
  productId: string;
}
