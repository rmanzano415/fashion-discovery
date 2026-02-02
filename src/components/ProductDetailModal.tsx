'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark: (product: Product) => void;
  isBookmarked: boolean;
}

// Extract a compelling editorial note from the description
function extractEditorialNote(description?: string): string {
  if (!description) return '';

  const cleaned = description
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const materialMatch = cleaned.match(/[•\-]\s*([^•\-]+(?:leather|suede|cotton|wool|silk|linen|canvas|mesh|nylon)[^•\-]*)/i);
  if (materialMatch) {
    return materialMatch[1].trim().slice(0, 120);
  }

  const originMatch = cleaned.match(/[•\-]\s*([^•\-]*(?:Made in|Crafted|Handmade|Hand-stitched)[^•\-]*)/i);
  if (originMatch) {
    return originMatch[1].trim().slice(0, 120);
  }

  const sentences = cleaned.split(/[.!]/);
  const firstMeaningful = sentences.find(s =>
    s.trim().length > 20 &&
    !s.includes('ships') &&
    !s.includes('order')
  );

  return firstMeaningful?.trim().slice(0, 120) || '';
}

function formatEditorialPrice(price: string): string {
  return price.replace('$', '').replace('.00', '');
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onBookmark,
  isBookmarked,
}: ProductDetailModalProps) {
  const [imageIndex, setImageIndex] = useState(0);

  if (!product) return null;

  const editorialNote = extractEditorialNote(product.description);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="relative w-full max-w-lg h-full max-h-[85vh] bg-[var(--paper-cream)] rounded-sm shadow-2xl overflow-hidden pointer-events-auto paper-texture">

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Section */}
              <div className="relative w-full h-[55%]">
                <Image
                  src={product.images[imageIndex] || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Image navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>

                    {/* Image indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {product.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            i === imageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Editorial note overlay */}
                {editorialNote && (
                  <div className="absolute top-4 left-4 right-14 editorial-note max-w-[280px] line-clamp-2 bg-[var(--paper-cream)]/90 backdrop-blur-sm px-3 py-2 rounded">
                    &ldquo;{editorialNote}&rdquo;
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="absolute bottom-0 left-0 right-0 h-[45%] p-5 bg-[var(--paper-cream)] overflow-y-auto no-scrollbar">
                {/* Brand */}
                <p className="font-mono-caption text-[var(--muted-text)] mb-1.5">
                  {product.brand}
                </p>

                {/* Product name */}
                <h2 className="font-editorial text-2xl font-normal text-[var(--ink-black)] leading-tight mb-2">
                  {product.name}
                </h2>

                {/* Divider */}
                <div className="editorial-divider my-3" />

                {/* Price and category */}
                <div className="flex items-baseline justify-between mb-3">
                  <p className="font-editorial text-xl text-[var(--ink-black)]">
                    ${formatEditorialPrice(product.price)}
                  </p>
                  {product.category && (
                    <p className="font-mono-caption text-[var(--muted-text)]">
                      {product.category}
                    </p>
                  )}
                </div>

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-3">
                    <p className="font-mono-caption text-[var(--muted-text)] mb-1.5">Colors</p>
                    <p className="text-sm text-[var(--ink-black)]">
                      {product.colors.join(' / ')}
                    </p>
                  </div>
                )}

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-4">
                    <p className="font-mono-caption text-[var(--muted-text)] mb-1.5">Sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.slice(0, 8).map((size) => {
                        // Extract just the size part (e.g., "XS" from "BLACK / XS")
                        const sizeLabel = size.includes('/') ? size.split('/').pop()?.trim() : size;
                        return (
                          <span
                            key={size}
                            className="px-2 py-1 text-xs font-mono-caption bg-[var(--soft-gray)] text-[var(--ink-black)] rounded"
                          >
                            {sizeLabel}
                          </span>
                        );
                      })}
                      {product.sizes.length > 8 && (
                        <span className="px-2 py-1 text-xs font-mono-caption text-[var(--muted-text)]">
                          +{product.sizes.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-auto pt-3">
                  {/* Bookmark button */}
                  <button
                    onClick={() => onBookmark(product)}
                    className={`flex-1 py-3 px-4 rounded flex items-center justify-center gap-2 transition-colors ${
                      isBookmarked
                        ? 'bg-[var(--accent-warm)] text-white'
                        : 'bg-[var(--soft-gray)] text-[var(--ink-black)] hover:bg-[var(--ink-black)] hover:text-white'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={isBookmarked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                    <span className="font-mono-caption text-[10px]">
                      {isBookmarked ? 'Saved' : 'Save'}
                    </span>
                  </button>

                  {/* View on site button */}
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-[var(--ink-black)] text-white rounded flex items-center justify-center gap-2 hover:bg-[var(--ink-black)]/80 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                    <span className="font-mono-caption text-[10px]">
                      View
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
