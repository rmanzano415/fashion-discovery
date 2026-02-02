'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  PanInfo,
  animate,
} from 'framer-motion';
import { Product } from '@/types/product';

interface CoverCardProps {
  products: Product[];
  onOpen: () => void;
  isTop: boolean;
}

// Generate dynamic edition identity from products data
function generateEditionIdentity(products: Product[]) {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = now.getMonth() + 1;

  // Season based on month
  const seasons: Record<number, string> = {
    1: 'Winter', 2: 'Winter', 3: 'Spring',
    4: 'Spring', 5: 'Spring', 6: 'Summer',
    7: 'Summer', 8: 'Summer', 9: 'Autumn',
    10: 'Autumn', 11: 'Autumn', 12: 'Winter',
  };
  const season = seasons[month];

  // Generate volume from year and issue from a hash of products
  const productHash = products.reduce((acc, p) => acc + p.id.charCodeAt(0), 0);
  const volume = parseInt(year) - 23; // Volume 1 starts in 2024
  const issue = (productHash % 12) + 1;

  // Get all unique brands from products
  const brandCounts: Record<string, number> = {};
  products.forEach(p => {
    const normalizedBrand = p.brand.toLowerCase().includes('pompeii') ? 'Pompeii' : p.brand;
    brandCounts[normalizedBrand] = (brandCounts[normalizedBrand] || 0) + 1;
  });
  const brands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]);
  const isMultiBrand = brands.length > 1;

  // Edition code (e.g., "SS26" or "FW25")
  const seasonCode = season === 'Spring' || season === 'Summer' ? 'SS' : 'FW';
  const editionCode = `${seasonCode}${year}`;

  return {
    season,
    year: now.getFullYear(),
    volume,
    issue,
    editionCode,
    brands,
    isMultiBrand,
    totalPages: products.length,
  };
}

// Curated list of fashion capitals
const FASHION_CITIES = [
  'New York',
  'Paris',
  'Milan',
  'London',
  'Tokyo',
  'Los Angeles',
  'Copenhagen',
  'Seoul',
];

export function CoverCard({ products, onOpen, isTop }: CoverCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get edition identity
  const edition = generateEditionIdentity(products);

  // Get hero image from first product
  const heroImage = products[0]?.images[0] || '/placeholder.jpg';

  // Pick a city based on product hash for consistency
  const cityIndex = products.reduce((acc, p) => acc + p.id.charCodeAt(0), 0) % FASHION_CITIES.length;
  const publishCity = FASHION_CITIES[cityIndex];

  // Motion value for drag - this gets updated by the drag gesture
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);

  // Transform drag X to rotation - opens like a book cover (drag LEFT to open)
  const rotateY = useTransform(x, [-250, -100, 0], [-60, -30, 0]);

  // Apply spring to rotation - slow, heavy book cover feel
  const springRotateY = useSpring(rotateY, {
    stiffness: 50,
    damping: 18,
    mass: 1.2,
  });

  // Shadow that appears as cover opens
  const shadowOpacity = useTransform(x, [-250, -100, 0], [0.5, 0.3, 0]);

  // Scale reduction during flip
  const scale = useTransform(x, [-250, 0], [0.95, 1]);

  const handleDragEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 80;
      const velocity = info.velocity.x;

      // Open the cover if dragged LEFT far enough or with velocity (matches inner pages)
      if (info.offset.x < -threshold || velocity < -400) {
        // Animate the cover fully open - dramatic reveal
        await Promise.all([
          animate(x, -500, { duration: 0.5, ease: [0.22, 1, 0.36, 1] }),
          animate(opacity, 0, { duration: 0.5, ease: [0.22, 1, 0.36, 1] }),
        ]);
        onOpen();
      } else {
        // Snap back
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    },
    [onOpen, x, opacity]
  );

  return (
    <motion.div
      ref={containerRef}
      className={`absolute w-full h-full ${isTop ? 'z-10' : 'z-0'}`}
      style={{
        perspective: 1500,
        perspectiveOrigin: 'center center',
      }}
      initial={{ opacity: 1 }}
    >
      <motion.div
        className="relative w-full h-full drag-page"
        style={{
          x,
          rotateY: springRotateY,
          scale,
          opacity,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {/* === COVER FRONT === */}
        <div
          className="absolute inset-0 bg-[var(--ink-black)] rounded-sm overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Hero Image - Full Bleed */}
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Cover"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            {/* Dramatic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Spine edge shadow */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/40 to-transparent" />

          {/* === MASTHEAD - Overlapping the image === */}
          <div className="absolute inset-x-0 top-[15%] flex flex-col items-center z-10">
            {/* Edition code above masthead */}
            <span className="font-mono-caption text-white/60 tracking-[0.3em] mb-2">
              {edition.editionCode}
            </span>

            {/* Main Masthead */}
            <h1
              className="font-editorial text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none text-center px-4"
              style={{
                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                fontWeight: 400,
              }}
            >
              THE ARCHIVE
            </h1>

            {/* Decorative line */}
            <div className="w-16 h-px bg-white/40 mt-4 mb-3" />

            {/* Issue details */}
            <span className="font-editorial text-white/70 text-sm italic tracking-wide">
              Vol. {edition.volume} / No. {edition.issue}
            </span>
          </div>

          {/* === BRAND FEATURE === */}
          <div className="absolute inset-x-0 bottom-[22%] flex flex-col items-center">
            <span className="font-mono-caption text-white/50 tracking-[0.2em] mb-1">
              {edition.isMultiBrand ? 'Featuring' : 'Exclusively'}
            </span>
            {edition.isMultiBrand ? (
              <div className="flex flex-col items-center gap-1">
                <span className="font-editorial text-xl text-white tracking-wide">
                  {edition.brands[0]}
                </span>
                <span className="font-mono-caption text-white/40 text-xs">
                  & {edition.brands.slice(1).join(' & ')}
                </span>
              </div>
            ) : (
              <span className="font-editorial text-2xl text-white tracking-wide">
                {edition.brands[0]}
              </span>
            )}
          </div>

          {/* === FOOTER === */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-end justify-between">
              {/* Publication info */}
              <div className="flex flex-col gap-0.5">
                <span className="font-mono-caption text-white/40 text-[9px]">
                  Published in
                </span>
                <span className="font-editorial text-white/70 text-sm italic">
                  {publishCity}
                </span>
              </div>

              {/* Page count */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono-caption text-white/40 text-[9px]">
                  This Edition
                </span>
                <span className="font-editorial text-white/70 text-sm italic">
                  {edition.totalPages + 1} Pages
                </span>
              </div>
            </div>

            {/* Open hint */}
            <div className="flex items-center justify-center mt-4 gap-2">
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
                className="w-3 h-3 text-white/30"
                animate={{ x: [0, -6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </motion.svg>
              <span className="font-mono-caption text-white/30 text-[10px]">
                Swipe to Open
              </span>
            </div>
          </div>

          {/* Dynamic page shadow during flip */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
            style={{
              opacity: shadowOpacity,
              background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
