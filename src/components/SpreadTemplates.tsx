'use client';

import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { TearableImage } from './TearableImage';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AsymmetricTemplate =
  | 'offset' | 'offset-alt'
  | 'float' | 'float-alt'
  | 'inset'
  | 'overlap' | 'overlap-alt';

interface TemplateProps {
  products: Product[];
  onSelect: (product: Product) => void;
  pageIndex: number;
  onTear?: (productId: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// MUSEUM PLACARD COMPONENT
// ═══════════════════════════════════════════════════════════════

function MuseumPlacard({
  product,
  refIndex,
}: {
  product: Product;
  refIndex: number;
}) {
  const brandName = product.brand || product.category || 'Unknown';

  return (
    <div className="mt-2">
      <span className="font-mono text-[7px] tracking-[0.12em] text-[#1A1A1A]/50 uppercase">
        House: {brandName} // Ref. {String(refIndex).padStart(3, '0')}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE A: THE OFFSET
// Two vertical images - one top-left, one bottom-right with heavy whitespace
// ═══════════════════════════════════════════════════════════════

export function TemplateOffset({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const [product1, product2] = products.slice(0, 2);

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] p-4 sm:p-6">
      {/* Product 1 - Top Left */}
      {product1 && (
        <motion.div
          className="absolute top-4 sm:top-8 left-4 sm:left-8 w-[42%] sm:w-[38%]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TearableImage
            product={product1}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[4/5]"
            sizes="40vw"
          />
          <MuseumPlacard product={product1} refIndex={pageIndex * 10 + 1} />
        </motion.div>
      )}

      {/* Product 2 - Bottom Right with offset */}
      {product2 && (
        <motion.div
          className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 w-[48%] sm:w-[44%]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TearableImage
            product={product2}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[4/5]"
            sizes="48vw"
          />
          <MuseumPlacard product={product2} refIndex={pageIndex * 10 + 2} />
        </motion.div>
      )}

      {/* Decorative corner elements */}
      <div className="absolute top-4 right-4 w-8 h-px bg-[#1A1A1A]/10" />
      <div className="absolute top-4 right-4 w-px h-8 bg-[#1A1A1A]/10" />
      <div className="absolute bottom-4 left-4 w-8 h-px bg-[#1A1A1A]/10" />
      <div className="absolute bottom-4 left-4 w-px h-8 bg-[#1A1A1A]/10" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE A-ALT: THE OFFSET (MIRRORED)
// Two vertical images - one top-right, one bottom-left
// ═══════════════════════════════════════════════════════════════

export function TemplateOffsetAlt({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const [product1, product2] = products.slice(0, 2);

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] p-4 sm:p-6">
      {/* Product 1 - Top Right */}
      {product1 && (
        <motion.div
          className="absolute top-4 sm:top-8 right-4 sm:right-8 w-[42%] sm:w-[38%]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TearableImage
            product={product1}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[4/5]"
            sizes="40vw"
          />
          <MuseumPlacard product={product1} refIndex={pageIndex * 10 + 1} />
        </motion.div>
      )}

      {/* Product 2 - Bottom Left with offset */}
      {product2 && (
        <motion.div
          className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 w-[48%] sm:w-[44%]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TearableImage
            product={product2}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[4/5]"
            sizes="48vw"
          />
          <MuseumPlacard product={product2} refIndex={pageIndex * 10 + 2} />
        </motion.div>
      )}

      {/* Decorative corner elements */}
      <div className="absolute top-4 left-4 w-8 h-px bg-[#1A1A1A]/10" />
      <div className="absolute top-4 left-4 w-px h-8 bg-[#1A1A1A]/10" />
      <div className="absolute bottom-4 right-4 w-8 h-px bg-[#1A1A1A]/10" />
      <div className="absolute bottom-4 right-4 w-px h-8 bg-[#1A1A1A]/10" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE B: THE FLOAT
// One large landscape center-right, two small squares floating left
// ═══════════════════════════════════════════════════════════════

export function TemplateFloat({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const [product1, product2, product3] = products.slice(0, 3);

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] p-4 sm:p-6">
      {/* Main image - Large landscape, center-right */}
      {product1 && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 w-[55%] sm:w-[50%]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TearableImage
            product={product1}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[3/2]"
            sizes="55vw"
          />
          <MuseumPlacard product={product1} refIndex={pageIndex * 10 + 1} />
        </motion.div>
      )}

      {/* Float 1 - Top left square */}
      {product2 && (
        <motion.div
          className="absolute top-6 sm:top-10 left-4 sm:left-8 w-[34%] sm:w-[30%]"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <TearableImage
            product={product2}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-square"
            sizes="34vw"
          />
          <MuseumPlacard product={product2} refIndex={pageIndex * 10 + 2} />
        </motion.div>
      )}

      {/* Float 2 - Bottom left square */}
      {product3 && (
        <motion.div
          className="absolute bottom-6 sm:bottom-10 left-8 sm:left-16 w-[34%] sm:w-[30%]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <TearableImage
            product={product3}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-square"
            sizes="34vw"
          />
          <MuseumPlacard product={product3} refIndex={pageIndex * 10 + 3} />
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE B-ALT: THE FLOAT (MIRRORED)
// One large landscape center-left, two small squares floating right
// ═══════════════════════════════════════════════════════════════

export function TemplateFloatAlt({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const [product1, product2, product3] = products.slice(0, 3);

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] p-4 sm:p-6">
      {/* Main image - Large landscape, center-left */}
      {product1 && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-8 w-[55%] sm:w-[50%]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TearableImage
            product={product1}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[3/2]"
            sizes="55vw"
          />
          <MuseumPlacard product={product1} refIndex={pageIndex * 10 + 1} />
        </motion.div>
      )}

      {/* Float 1 - Top right square */}
      {product2 && (
        <motion.div
          className="absolute top-6 sm:top-10 right-4 sm:right-8 w-[34%] sm:w-[30%]"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <TearableImage
            product={product2}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-square"
            sizes="34vw"
          />
          <MuseumPlacard product={product2} refIndex={pageIndex * 10 + 2} />
        </motion.div>
      )}

      {/* Float 2 - Bottom right square */}
      {product3 && (
        <motion.div
          className="absolute bottom-6 sm:bottom-10 right-8 sm:right-16 w-[34%] sm:w-[30%]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <TearableImage
            product={product3}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-square"
            sizes="34vw"
          />
          <MuseumPlacard product={product3} refIndex={pageIndex * 10 + 3} />
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE C: THE INSET
// Single portrait image centered with large white border (60% of page)
// ═══════════════════════════════════════════════════════════════

export function TemplateInset({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const product = products[0];

  if (!product) return null;

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] flex items-center justify-center">
      {/* Large white border area (outer) */}
      <motion.div
        className="relative w-[55%] sm:w-[50%] flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Section label */}
        <span className="font-mono text-[8px] tracking-[0.4em] text-[#1A1A1A]/30 uppercase mb-4">
          Featured
        </span>

        {/* The inset image */}
        <div className="relative w-full shadow-lg">
          <TearableImage
            product={product}
            onSelect={onSelect}
            onTear={onTear}
            className="aspect-[4/5]"
            sizes="55vw"
          />
        </div>

        {/* Placard centered below */}
        <div className="mt-4 text-center">
          <MuseumPlacard product={product} refIndex={pageIndex * 10 + 1} />
        </div>

        {/* Decorative marks */}
        <div className="mt-6 flex items-center gap-3">
          <div className="w-6 h-px bg-[#1A1A1A]/10" />
          <span className="font-mono text-[6px] tracking-[0.3em] text-[#1A1A1A]/20 uppercase">
            Singular
          </span>
          <div className="w-6 h-px bg-[#1A1A1A]/10" />
        </div>
      </motion.div>

      {/* Corner registration marks */}
      <div className="absolute top-6 left-6">
        <div className="w-4 h-px bg-[#1A1A1A]/15" />
        <div className="w-px h-4 bg-[#1A1A1A]/15" />
      </div>
      <div className="absolute top-6 right-6">
        <div className="w-4 h-px bg-[#1A1A1A]/15 ml-auto" />
        <div className="w-px h-4 bg-[#1A1A1A]/15 ml-auto" />
      </div>
      <div className="absolute bottom-6 left-6">
        <div className="w-px h-4 bg-[#1A1A1A]/15" />
        <div className="w-4 h-px bg-[#1A1A1A]/15" />
      </div>
      <div className="absolute bottom-6 right-6">
        <div className="w-px h-4 bg-[#1A1A1A]/15 ml-auto" />
        <div className="w-4 h-px bg-[#1A1A1A]/15 ml-auto" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE D: THE OVERLAP
// Two products where one overlaps the corner of another
// ═══════════════════════════════════════════════════════════════

export function TemplateOverlap({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const [product1, product2] = products.slice(0, 2);

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] flex items-center justify-center p-8 sm:p-12">
      <div className="relative w-full max-w-md">
        {/* Back product (z-0) - larger */}
        {product1 && (
          <motion.div
            className="relative w-[70%] sm:w-[65%]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TearableImage
              product={product1}
              onSelect={onSelect}
              onTear={onTear}
              className="aspect-[4/5]"
              sizes="50vw"
            />
            <MuseumPlacard product={product1} refIndex={pageIndex * 10 + 1} />
          </motion.div>
        )}

        {/* Front product (z-10) - overlapping with shadow */}
        {product2 && (
          <motion.div
            className="absolute -bottom-8 -right-4 sm:-right-8 w-[55%] sm:w-[50%] z-10"
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="shadow-2xl">
              <TearableImage
                product={product2}
                onSelect={onSelect}
                onTear={onTear}
                className="aspect-[4/5]"
                sizes="40vw"
              />
            </div>
            <MuseumPlacard product={product2} refIndex={pageIndex * 10 + 2} />
          </motion.div>
        )}
      </div>

      {/* Section marker */}
      <div className="absolute bottom-4 left-4">
        <span className="font-mono text-[7px] tracking-[0.2em] text-[#1A1A1A]/25 uppercase">
          Composition D
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE D-ALT: THE OVERLAP (MIRRORED)
// Two products where one overlaps the corner of another (flipped)
// ═══════════════════════════════════════════════════════════════

export function TemplateOverlapAlt({ products, onSelect, pageIndex, onTear }: TemplateProps) {
  const [product1, product2] = products.slice(0, 2);

  return (
    <div className="relative w-full h-full bg-[#FDFCFB] flex items-center justify-center p-8 sm:p-12">
      <div className="relative w-full max-w-md flex justify-end">
        {/* Back product (z-0) - larger, on right */}
        {product1 && (
          <motion.div
            className="relative w-[70%] sm:w-[65%]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TearableImage
              product={product1}
              onSelect={onSelect}
              onTear={onTear}
              className="aspect-[4/5]"
              sizes="50vw"
            />
            <MuseumPlacard product={product1} refIndex={pageIndex * 10 + 1} />
          </motion.div>
        )}

        {/* Front product (z-10) - overlapping with shadow, on left */}
        {product2 && (
          <motion.div
            className="absolute -bottom-8 -left-4 sm:-left-8 w-[55%] sm:w-[50%] z-10"
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="shadow-2xl">
              <TearableImage
                product={product2}
                onSelect={onSelect}
                onTear={onTear}
                className="aspect-[4/5]"
                sizes="40vw"
              />
            </div>
            <MuseumPlacard product={product2} refIndex={pageIndex * 10 + 2} />
          </motion.div>
        )}
      </div>

      {/* Section marker */}
      <div className="absolute bottom-4 right-4">
        <span className="font-mono text-[7px] tracking-[0.2em] text-[#1A1A1A]/25 uppercase">
          Composition D
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE RENDERER
// ═══════════════════════════════════════════════════════════════

export function renderAsymmetricTemplate(
  template: AsymmetricTemplate,
  products: Product[],
  onSelect: (product: Product) => void,
  pageIndex: number,
  onTear?: (productId: string) => void
) {
  const props = { products, onSelect, pageIndex, onTear };

  switch (template) {
    case 'offset':
      return <TemplateOffset {...props} />;
    case 'offset-alt':
      return <TemplateOffsetAlt {...props} />;
    case 'float':
      return <TemplateFloat {...props} />;
    case 'float-alt':
      return <TemplateFloatAlt {...props} />;
    case 'inset':
      return <TemplateInset {...props} />;
    case 'overlap':
      return <TemplateOverlap {...props} />;
    case 'overlap-alt':
      return <TemplateOverlapAlt {...props} />;
    default:
      return <TemplateOffset {...props} />;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get products needed for each template
// ═══════════════════════════════════════════════════════════════

export function getProductCountForTemplate(template: AsymmetricTemplate): number {
  switch (template) {
    case 'offset':
    case 'offset-alt':
      return 2;
    case 'float':
    case 'float-alt':
      return 3;
    case 'inset':
      return 1;
    case 'overlap':
    case 'overlap-alt':
      return 2;
    default:
      return 2;
  }
}
