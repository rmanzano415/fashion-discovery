'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';

interface FavoriteCardProps {
  product: Product;
  onRemove: () => void;
  index: number;
}

// Format price for editorial display
function formatEditorialPrice(price: string): string {
  return price.replace('$', '').replace('.00', '');
}

export function FavoriteCard({ product, onRemove, index }: FavoriteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="bg-[var(--paper-cream)] rounded-sm shadow-sm overflow-hidden paper-texture group"
    >
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[3/4]">
          <Image
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          {/* Subtle gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </a>

      <div className="p-3">
        {/* Brand - monospace */}
        <p className="font-mono-caption text-[var(--muted-text)] mb-1">
          {product.brand}
        </p>

        {/* Product name - Editorial serif */}
        <h3 className="font-editorial text-sm text-[var(--ink-black)] leading-tight truncate mb-2">
          {product.name}
        </h3>

        {/* Price and remove */}
        <div className="flex items-center justify-between">
          <p className="font-editorial text-sm text-[var(--ink-black)]">
            ${formatEditorialPrice(product.price)}
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.preventDefault(); onRemove(); }}
            className="p-1.5 text-[var(--muted-text)] hover:text-[var(--ink-black)] transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove from archive"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        </div>

        {/* Category as subtle tag */}
        {product.category && (
          <p className="issue-label mt-2 opacity-60">{product.category}</p>
        )}
      </div>
    </motion.div>
  );
}
