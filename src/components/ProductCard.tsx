'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useAnimation,
  PanInfo,
} from 'framer-motion';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onSwipe: (direction: 'left' | 'right') => void;
  onBookmark?: (product: Product) => void;
  isBookmarked?: boolean;
  isTop: boolean;
  pageNumber: number;
  totalPages: number;
}

// Extract a compelling editorial note from the description
function extractEditorialNote(description?: string): string {
  if (!description) return '';

  // Clean up the description
  const cleaned = description
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try to find material/construction details
  const materialMatch = cleaned.match(/[•\-]\s*([^•\-]+(?:leather|suede|cotton|wool|silk|linen|canvas|mesh|nylon)[^•\-]*)/i);
  if (materialMatch) {
    return materialMatch[1].trim().slice(0, 80);
  }

  // Try to find origin/craft details
  const originMatch = cleaned.match(/[•\-]\s*([^•\-]*(?:Made in|Crafted|Handmade|Hand-stitched)[^•\-]*)/i);
  if (originMatch) {
    return originMatch[1].trim().slice(0, 80);
  }

  // Fallback: first meaningful sentence
  const sentences = cleaned.split(/[.!]/);
  const firstMeaningful = sentences.find(s =>
    s.trim().length > 20 &&
    !s.includes('ships') &&
    !s.includes('order')
  );

  return firstMeaningful?.trim().slice(0, 80) || '';
}

// Format price for editorial display
function formatEditorialPrice(price: string): string {
  return price.replace('$', '').replace('.00', '');
}

export function ProductCard({
  product,
  onSwipe,
  onBookmark,
  isBookmarked = false,
  isTop,
  pageNumber,
  totalPages,
}: ProductCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const lastTapRef = useRef<number>(0);
  const controls = useAnimation();

  // Motion value for drag - updated by drag gesture
  const x = useMotionValue(0);

  // Transform drag to rotation (page turn effect)
  // Positive x (drag right) = negative rotateY (page turns left)
  const rotateY = useTransform(x, [-200, 0, 200], [30, 0, -60]);

  // Apply spring for slow, tactile paper feel
  const springRotateY = useSpring(rotateY, {
    stiffness: 50,
    damping: 18,
    mass: 1.2,
  });

  // Shadow on the right edge during flip
  const shadowOpacity = useTransform(x, [0, 100, 200], [0, 0.2, 0.4]);

  // Slight scale during drag
  const scale = useTransform(x, [-200, 0, 200], [0.98, 1, 0.97]);

  const handleDragEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      const velocity = info.velocity.x;

      if (info.offset.x > threshold || velocity > 400) {
        // Swipe right - slow page turn animation
        await controls.start({
          x: 400,
          rotateY: -90,
          opacity: 0,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        });
        onSwipe('right');
      } else if (info.offset.x < -threshold || velocity < -400) {
        // Swipe left - slow page turn
        await controls.start({
          x: -400,
          rotateY: 30,
          opacity: 0,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        });
        onSwipe('left');
      } else {
        // Snap back
        x.set(0);
      }
    },
    [onSwipe, controls, x]
  );

  // Double-tap to bookmark
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      onBookmark?.(product);
    }

    lastTapRef.current = now;
  }, [onBookmark, product]);

  const nextImage = () => {
    if (product.images.length > 1) {
      setImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images.length > 1) {
      setImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const editorialNote = extractEditorialNote(product.description);

  return (
    <motion.div
      className={`absolute w-full h-full ${isTop ? 'z-10' : 'z-0'}`}
      style={{
        perspective: 1500,
        perspectiveOrigin: 'center center',
      }}
      initial={{ opacity: isTop ? 1 : 0.6, scale: isTop ? 1 : 0.96 }}
      animate={{
        opacity: isTop ? 1 : 0.6,
        scale: isTop ? 1 : 0.96,
        y: isTop ? 0 : 8,
      }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <motion.div
        className="relative w-full h-full drag-page"
        style={{
          x,
          rotateY: springRotateY,
          scale,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        animate={controls}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {/* Main card - Book spread layout */}
        <div className="relative w-full h-full bg-[var(--paper-cream)] rounded-sm shadow-xl overflow-hidden paper-texture">

          {/* Spine shadow on left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-4 page-spine-shadow z-10" />

          {/* Dynamic page edge shadow during flip */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{
              opacity: shadowOpacity,
              background: 'linear-gradient(to left, rgba(0,0,0,0.3) 0%, transparent 100%)',
            }}
          />

          {/* === IMAGE SECTION (Left "page" of spread) === */}
          <div className="relative w-full h-[58%]">
            <Image
              src={product.images[imageIndex] || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover"
              priority={isTop}
              unoptimized
            />

            {/* Subtle image indicators */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-1">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === imageIndex
                        ? 'bg-white w-4'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image navigation zones (invisible tap areas) */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-0 top-0 w-1/3 h-full opacity-0"
                  aria-label="Previous image"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-0 top-0 w-1/3 h-full opacity-0"
                  aria-label="Next image"
                />
              </>
            )}

            {/* Editorial note - top left corner */}
            {editorialNote && (
              <div className="absolute top-4 left-4 right-16 editorial-note max-w-[200px] line-clamp-2 bg-[var(--paper-cream)]/90 backdrop-blur-sm px-2 py-1.5 rounded">
                &ldquo;{editorialNote}&rdquo;
              </div>
            )}

            {/* Bookmark indicator - top right */}
            <button
              onClick={(e) => { e.stopPropagation(); onBookmark?.(product); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bookmark-indicator"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                className={`w-5 h-5 ${isBookmarked ? 'bookmark-saved' : 'text-white drop-shadow-md'}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </button>
          </div>

          {/* === CONTENT SECTION (Right "page" of spread) === */}
          <div className="absolute bottom-0 left-0 right-0 h-[42%] p-5 bg-[var(--paper-cream)]">

            {/* Issue / Page indicator - top right of content */}
            <div className="absolute top-3 right-5 issue-label">
              {pageNumber}/{totalPages}
            </div>

            {/* Brand - monospace caption */}
            <p className="font-mono-caption text-[var(--muted-text)] mb-1.5">
              {product.brand}
            </p>

            {/* Product name - Editorial serif */}
            <h2 className="font-editorial text-2xl font-normal text-[var(--ink-black)] leading-tight mb-2 pr-12">
              {product.name}
            </h2>

            {/* Editorial divider */}
            <div className="editorial-divider my-3" />

            {/* Price and category row */}
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-editorial text-lg text-[var(--ink-black)]">
                ${formatEditorialPrice(product.price)}
              </p>
              {product.category && (
                <p className="font-mono-caption text-[var(--muted-text)]">
                  {product.category}
                </p>
              )}
            </div>

            {/* Colors as minimal text list */}
            {product.colors && product.colors.length > 0 && (
              <p className="text-xs text-[var(--muted-text)] tracking-wide">
                {product.colors.slice(0, 3).join(' / ')}
              </p>
            )}

            {/* Available sizes - subtle indicator */}
            {product.sizes && product.sizes.length > 0 && (
              <p className="text-xs text-[var(--muted-text)] mt-1 opacity-60">
                {product.sizes.length} sizes available
              </p>
            )}

            {/* Page turn hint - only on first card */}
            {isTop && pageNumber === 1 && (
              <div className="absolute bottom-3 right-5 flex items-center gap-1 opacity-40">
                <span className="text-[10px] text-[var(--muted-text)] italic">turn page</span>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="w-3 h-3"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </motion.svg>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
