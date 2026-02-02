'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { BrandTag } from './BrandTag';

interface ProductTileProps {
  product: Product;
  onSelect: (product: Product) => void;
  isBookmarked?: boolean;
  size?: 'small' | 'medium' | 'large' | 'hero';
  brandTagVariant?: 'pill' | 'minimal' | 'corner';
  brandTagPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function ProductTile({
  product,
  onSelect,
  isBookmarked = false,
  brandTagVariant = 'pill',
  brandTagPosition = 'bottom-left',
  className = '',
}: ProductTileProps) {
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;

    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);

    // Only trigger select if it was a tap (minimal movement)
    if (dx < 10 && dy < 10) {
      onSelect(product);
    }

    startPosRef.current = null;
  };

  return (
    <motion.div
      className={`relative overflow-hidden bg-[var(--soft-gray)] cursor-pointer touch-manipulation ${className}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Product Image */}
      <Image
        src={product.images[0] || '/placeholder.jpg'}
        alt={product.name}
        fill
        className="object-cover pointer-events-none"
        unoptimized
        draggable={false}
      />

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

      {/* Brand Tag */}
      <BrandTag
        brand={product.brand}
        variant={brandTagVariant}
        position={brandTagPosition}
      />

      {/* Bookmark indicator (if bookmarked) */}
      {isBookmarked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-[var(--accent-warm)] drop-shadow-lg"
          >
            <path
              fillRule="evenodd"
              d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}

      {/* Tap hint overlay on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none"
      >
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
