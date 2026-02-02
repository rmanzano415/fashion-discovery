/**
 * Aime Leon Dore Product Scraper
 *
 * ALD runs on Shopify, so we can use the products.json endpoint.
 * This endpoint is typically available at /products.json or /collections/all/products.json
 *
 * Usage: npx ts-node scraper/scrape-ald.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ShopifyImage {
  id: number;
  src: string;
  alt?: string;
}

interface ShopifyVariant {
  id: number;
  price: string;
  title: string;
  available: boolean;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

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

const BASE_URL = 'https://www.aimeleondore.com';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractColors(tags: string[]): string[] {
  const colorKeywords = ['black', 'white', 'navy', 'cream', 'grey', 'gray', 'green', 'blue', 'red', 'brown', 'beige', 'tan', 'olive', 'burgundy', 'yellow', 'orange', 'pink', 'purple'];
  return tags.filter(tag =>
    colorKeywords.some(color => tag.toLowerCase().includes(color))
  );
}

function extractSizes(variants: ShopifyVariant[]): string[] {
  const sizes = new Set<string>();
  variants.forEach(v => {
    if (v.title && v.title !== 'Default Title') {
      sizes.add(v.title);
    }
  });
  return Array.from(sizes);
}

async function fetchProducts(page: number = 1, limit: number = 250): Promise<ShopifyProduct[]> {
  const url = `${BASE_URL}/products.json?limit=${limit}&page=${page}`;

  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: ShopifyResponse = await response.json();
  return data.products;
}

function transformProduct(product: ShopifyProduct): Product {
  const lowestPrice = Math.min(...product.variants.map(v => parseFloat(v.price)));

  return {
    id: product.id.toString(),
    name: product.title,
    price: `$${lowestPrice.toFixed(2)}`,
    priceNumeric: lowestPrice,
    images: product.images.map(img => img.src),
    url: `${BASE_URL}/products/${product.handle}`,
    brand: 'Aimé Leon Dore',
    category: product.product_type || undefined,
    description: product.body_html ? stripHtml(product.body_html).slice(0, 500) : undefined,
    colors: extractColors(product.tags),
    sizes: extractSizes(product.variants),
  };
}

async function scrapeALD(): Promise<void> {
  console.log('Starting Aimé Leon Dore scraper...\n');

  try {
    let allProducts: ShopifyProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && allProducts.length < 50) {
      const products = await fetchProducts(page);

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts = [...allProducts, ...products];
        console.log(`  Page ${page}: Found ${products.length} products (Total: ${allProducts.length})`);
        page++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found');
    }

    // Filter out products without images
    const validProducts = allProducts.filter(p => p.images.length > 0);

    // Transform to our format
    const transformedProducts = validProducts.map(transformProduct);

    // Take first 50 for the app
    const finalProducts = transformedProducts.slice(0, 50);

    // Save to JSON
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalProducts, null, 2));

    console.log(`\nSuccess! Saved ${finalProducts.length} products to ${outputPath}`);
    console.log('\nSample product:');
    console.log(JSON.stringify(finalProducts[0], null, 2));

  } catch (error) {
    console.error('\nScraping failed:', error);
    console.log('\nALD may have anti-scraping measures. Using fallback sample data...');
    await generateSampleData();
  }
}

async function generateSampleData(): Promise<void> {
  // Fallback: Generate realistic sample data based on ALD's typical offerings
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Uniform Hoodie',
      price: '$165.00',
      priceNumeric: 165,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
      url: 'https://www.aimeleondore.com/products/uniform-hoodie',
      brand: 'Aimé Leon Dore',
      category: 'Sweatshirts',
      description: 'Premium heavyweight fleece hoodie with embroidered logo.',
      colors: ['Navy', 'Cream'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '2',
      name: 'Sailing Club Crewneck',
      price: '$145.00',
      priceNumeric: 145,
      images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800'],
      url: 'https://www.aimeleondore.com/products/sailing-club-crewneck',
      brand: 'Aimé Leon Dore',
      category: 'Sweatshirts',
      description: 'Vintage-inspired crewneck with nautical graphics.',
      colors: ['White', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '3',
      name: 'Pleated Trousers',
      price: '$225.00',
      priceNumeric: 225,
      images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'],
      url: 'https://www.aimeleondore.com/products/pleated-trousers',
      brand: 'Aimé Leon Dore',
      category: 'Pants',
      description: 'Relaxed fit pleated trousers in premium Italian wool blend.',
      colors: ['Tan', 'Charcoal'],
      sizes: ['28', '30', '32', '34', '36'],
    },
    {
      id: '4',
      name: 'Cable Knit Sweater',
      price: '$275.00',
      priceNumeric: 275,
      images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'],
      url: 'https://www.aimeleondore.com/products/cable-knit-sweater',
      brand: 'Aimé Leon Dore',
      category: 'Knitwear',
      description: 'Heritage cable knit sweater in soft merino wool.',
      colors: ['Cream', 'Forest Green'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '5',
      name: 'Logo Tee',
      price: '$75.00',
      priceNumeric: 75,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
      url: 'https://www.aimeleondore.com/products/logo-tee',
      brand: 'Aimé Leon Dore',
      category: 'T-Shirts',
      description: 'Essential logo tee in heavyweight cotton jersey.',
      colors: ['White', 'Black', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: '6',
      name: 'Varsity Jacket',
      price: '$495.00',
      priceNumeric: 495,
      images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
      url: 'https://www.aimeleondore.com/products/varsity-jacket',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Classic varsity jacket with leather sleeves and chenille patches.',
      colors: ['Navy/Cream', 'Green/Cream'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '7',
      name: 'Running Shorts',
      price: '$95.00',
      priceNumeric: 95,
      images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'],
      url: 'https://www.aimeleondore.com/products/running-shorts',
      brand: 'Aimé Leon Dore',
      category: 'Shorts',
      description: 'Lightweight nylon running shorts with interior brief.',
      colors: ['Navy', 'Black', 'Olive'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '8',
      name: 'Oxford Button-Down',
      price: '$185.00',
      priceNumeric: 185,
      images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
      url: 'https://www.aimeleondore.com/products/oxford-button-down',
      brand: 'Aimé Leon Dore',
      category: 'Shirts',
      description: 'Premium oxford cloth button-down with rolled collar.',
      colors: ['White', 'Light Blue', 'Pink'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '9',
      name: 'Cargo Pants',
      price: '$245.00',
      priceNumeric: 245,
      images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'],
      url: 'https://www.aimeleondore.com/products/cargo-pants',
      brand: 'Aimé Leon Dore',
      category: 'Pants',
      description: 'Relaxed cargo pants with multiple utility pockets.',
      colors: ['Olive', 'Khaki', 'Black'],
      sizes: ['28', '30', '32', '34', '36'],
    },
    {
      id: '10',
      name: 'Fleece Zip-Up',
      price: '$195.00',
      priceNumeric: 195,
      images: ['https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=800'],
      url: 'https://www.aimeleondore.com/products/fleece-zip-up',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Cozy polar fleece full-zip jacket with contrast details.',
      colors: ['Cream', 'Forest', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '11',
      name: 'Denim Jacket',
      price: '$325.00',
      priceNumeric: 325,
      images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800'],
      url: 'https://www.aimeleondore.com/products/denim-jacket',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Washed denim trucker jacket with vintage fading.',
      colors: ['Light Wash', 'Medium Wash'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '12',
      name: 'Striped Polo',
      price: '$135.00',
      priceNumeric: 135,
      images: ['https://images.unsplash.com/photo-1625910513413-5fc45df63c24?w=800'],
      url: 'https://www.aimeleondore.com/products/striped-polo',
      brand: 'Aimé Leon Dore',
      category: 'Polos',
      description: 'Knit polo shirt with vintage-inspired stripes.',
      colors: ['Navy/White', 'Green/Cream'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '13',
      name: 'Chino Shorts',
      price: '$125.00',
      priceNumeric: 125,
      images: ['https://images.unsplash.com/photo-1617952236317-0bd127407984?w=800'],
      url: 'https://www.aimeleondore.com/products/chino-shorts',
      brand: 'Aimé Leon Dore',
      category: 'Shorts',
      description: 'Tailored chino shorts with 7-inch inseam.',
      colors: ['Khaki', 'Navy', 'Olive'],
      sizes: ['28', '30', '32', '34', '36'],
    },
    {
      id: '14',
      name: 'Cashmere Beanie',
      price: '$95.00',
      priceNumeric: 95,
      images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800'],
      url: 'https://www.aimeleondore.com/products/cashmere-beanie',
      brand: 'Aimé Leon Dore',
      category: 'Accessories',
      description: 'Ribbed cashmere beanie with embroidered logo.',
      colors: ['Navy', 'Cream', 'Grey'],
      sizes: ['One Size'],
    },
    {
      id: '15',
      name: 'Canvas Tote',
      price: '$85.00',
      priceNumeric: 85,
      images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
      url: 'https://www.aimeleondore.com/products/canvas-tote',
      brand: 'Aimé Leon Dore',
      category: 'Accessories',
      description: 'Heavy-duty canvas tote with leather handles.',
      colors: ['Natural', 'Navy'],
      sizes: ['One Size'],
    },
    {
      id: '16',
      name: 'Track Jacket',
      price: '$265.00',
      priceNumeric: 265,
      images: ['https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800'],
      url: 'https://www.aimeleondore.com/products/track-jacket',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Retro-inspired track jacket with contrast piping.',
      colors: ['Navy', 'Forest Green'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '17',
      name: 'Corduroy Pants',
      price: '$195.00',
      priceNumeric: 195,
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
      url: 'https://www.aimeleondore.com/products/corduroy-pants',
      brand: 'Aimé Leon Dore',
      category: 'Pants',
      description: 'Wide-wale corduroy trousers with pleated front.',
      colors: ['Tan', 'Forest', 'Navy'],
      sizes: ['28', '30', '32', '34', '36'],
    },
    {
      id: '18',
      name: 'Rugby Shirt',
      price: '$175.00',
      priceNumeric: 175,
      images: ['https://images.unsplash.com/photo-1618886614638-80e3c103d31a?w=800'],
      url: 'https://www.aimeleondore.com/products/rugby-shirt',
      brand: 'Aimé Leon Dore',
      category: 'Shirts',
      description: 'Classic rugby shirt with bold stripes and rubber buttons.',
      colors: ['Navy/Green', 'Burgundy/Cream'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '19',
      name: 'Wool Overcoat',
      price: '$695.00',
      priceNumeric: 695,
      images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800'],
      url: 'https://www.aimeleondore.com/products/wool-overcoat',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Italian wool overcoat with notch lapels.',
      colors: ['Camel', 'Charcoal', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '20',
      name: 'Graphic Hoodie',
      price: '$185.00',
      priceNumeric: 185,
      images: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800'],
      url: 'https://www.aimeleondore.com/products/graphic-hoodie',
      brand: 'Aimé Leon Dore',
      category: 'Sweatshirts',
      description: 'Heavyweight hoodie with vintage-style graphic print.',
      colors: ['Black', 'Heather Grey'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '21',
      name: 'Linen Shirt',
      price: '$195.00',
      priceNumeric: 195,
      images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800'],
      url: 'https://www.aimeleondore.com/products/linen-shirt',
      brand: 'Aimé Leon Dore',
      category: 'Shirts',
      description: 'Relaxed-fit linen shirt for warm weather.',
      colors: ['White', 'Ecru', 'Light Blue'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '22',
      name: 'Swim Trunks',
      price: '$135.00',
      priceNumeric: 135,
      images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=1000'],
      url: 'https://www.aimeleondore.com/products/swim-trunks',
      brand: 'Aimé Leon Dore',
      category: 'Swimwear',
      description: 'Quick-dry swim trunks with elastic waist.',
      colors: ['Navy', 'Green', 'Orange'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '23',
      name: 'Quilted Vest',
      price: '$245.00',
      priceNumeric: 245,
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
      url: 'https://www.aimeleondore.com/products/quilted-vest',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Lightweight quilted vest with snap closure.',
      colors: ['Navy', 'Olive', 'Black'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '24',
      name: 'Leather Belt',
      price: '$125.00',
      priceNumeric: 125,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
      url: 'https://www.aimeleondore.com/products/leather-belt',
      brand: 'Aimé Leon Dore',
      category: 'Accessories',
      description: 'Full-grain leather belt with brass buckle.',
      colors: ['Brown', 'Black'],
      sizes: ['30', '32', '34', '36', '38'],
    },
    {
      id: '25',
      name: 'Baseball Cap',
      price: '$55.00',
      priceNumeric: 55,
      images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'],
      url: 'https://www.aimeleondore.com/products/baseball-cap',
      brand: 'Aimé Leon Dore',
      category: 'Accessories',
      description: 'Cotton twill cap with embroidered logo.',
      colors: ['Navy', 'White', 'Green'],
      sizes: ['One Size'],
    },
    {
      id: '26',
      name: 'Merino Cardigan',
      price: '$295.00',
      priceNumeric: 295,
      images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800'],
      url: 'https://www.aimeleondore.com/products/merino-cardigan',
      brand: 'Aimé Leon Dore',
      category: 'Knitwear',
      description: 'Button-front cardigan in soft merino wool.',
      colors: ['Navy', 'Grey', 'Burgundy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '27',
      name: 'Windbreaker',
      price: '$225.00',
      priceNumeric: 225,
      images: ['https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=800'],
      url: 'https://www.aimeleondore.com/products/windbreaker',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Packable windbreaker with hidden hood.',
      colors: ['Navy', 'Black', 'Red'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '28',
      name: 'Henley Shirt',
      price: '$95.00',
      priceNumeric: 95,
      images: ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'],
      url: 'https://www.aimeleondore.com/products/henley-shirt',
      brand: 'Aimé Leon Dore',
      category: 'T-Shirts',
      description: 'Waffle-knit henley with mother-of-pearl buttons.',
      colors: ['White', 'Grey', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '29',
      name: 'Wool Scarf',
      price: '$145.00',
      priceNumeric: 145,
      images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800'],
      url: 'https://www.aimeleondore.com/products/wool-scarf',
      brand: 'Aimé Leon Dore',
      category: 'Accessories',
      description: 'Lambswool scarf with fringed ends.',
      colors: ['Camel', 'Grey', 'Navy'],
      sizes: ['One Size'],
    },
    {
      id: '30',
      name: 'Suede Bomber',
      price: '$895.00',
      priceNumeric: 895,
      images: ['https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800'],
      url: 'https://www.aimeleondore.com/products/suede-bomber',
      brand: 'Aimé Leon Dore',
      category: 'Outerwear',
      description: 'Premium suede bomber jacket with ribbed trim.',
      colors: ['Tan', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '31',
      name: 'Pocket Tee',
      price: '$65.00',
      priceNumeric: 65,
      images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
      url: 'https://www.aimeleondore.com/products/pocket-tee',
      brand: 'Aimé Leon Dore',
      category: 'T-Shirts',
      description: 'Relaxed fit pocket tee in slub cotton.',
      colors: ['White', 'Black', 'Grey', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: '32',
      name: 'Sweatpants',
      price: '$145.00',
      priceNumeric: 145,
      images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800'],
      url: 'https://www.aimeleondore.com/products/sweatpants',
      brand: 'Aimé Leon Dore',
      category: 'Pants',
      description: 'Heavyweight fleece sweatpants with tapered leg.',
      colors: ['Heather Grey', 'Navy', 'Black'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '33',
      name: 'Camp Collar Shirt',
      price: '$195.00',
      priceNumeric: 195,
      images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
      url: 'https://www.aimeleondore.com/products/camp-collar-shirt',
      brand: 'Aimé Leon Dore',
      category: 'Shirts',
      description: 'Relaxed camp collar shirt in printed viscose.',
      colors: ['Navy Print', 'Green Print'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: '34',
      name: 'Leather Sneakers',
      price: '$275.00',
      priceNumeric: 275,
      images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
      url: 'https://www.aimeleondore.com/products/leather-sneakers',
      brand: 'Aimé Leon Dore',
      category: 'Footwear',
      description: 'Premium leather low-top sneakers.',
      colors: ['White', 'Navy', 'Green'],
      sizes: ['7', '8', '9', '10', '11', '12'],
    },
    {
      id: '35',
      name: 'Knit Polo',
      price: '$165.00',
      priceNumeric: 165,
      images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800'],
      url: 'https://www.aimeleondore.com/products/knit-polo',
      brand: 'Aimé Leon Dore',
      category: 'Polos',
      description: 'Open-knit polo in lightweight cotton.',
      colors: ['Cream', 'Navy', 'Sage'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
  ];

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  fs.writeFileSync(outputPath, JSON.stringify(sampleProducts, null, 2));

  console.log(`\nGenerated ${sampleProducts.length} sample products`);
  console.log(`Saved to ${outputPath}`);
}

// Run the scraper
scrapeALD().catch(console.error);
