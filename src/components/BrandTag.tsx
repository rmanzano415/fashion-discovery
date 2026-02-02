'use client';

import { motion } from 'framer-motion';

interface BrandTagProps {
  brand: string;
  variant?: 'pill' | 'minimal' | 'corner';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function BrandTag({
  brand,
  variant = 'pill',
  position = 'bottom-left',
}: BrandTagProps) {
  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };

  if (variant === 'minimal') {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute ${positionClasses[position]} font-editorial text-[10px] text-white/80 tracking-wide italic drop-shadow-lg`}
      >
        {brand}
      </motion.span>
    );
  }

  if (variant === 'corner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`absolute ${positionClasses[position]}`}
      >
        <span className="font-mono-caption text-[9px] text-white/70 tracking-[0.15em] uppercase drop-shadow-lg">
          {brand}
        </span>
      </motion.div>
    );
  }

  // Default: pill variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className={`absolute ${positionClasses[position]}`}
    >
      <span className="inline-block px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full font-mono-caption text-[9px] text-white/90 tracking-[0.1em] uppercase">
        {brand}
      </span>
    </motion.div>
  );
}
