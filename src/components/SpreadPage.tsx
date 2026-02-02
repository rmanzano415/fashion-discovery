'use client';

import { useCallback, useState, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useIsPresent,
  PanInfo,
  animate,
} from 'framer-motion';
import { Product } from '@/types/product';
import { PageType } from '@/types/page';
import { FullBleedHero } from './FullBleedHero';
import { renderAsymmetricTemplate } from './SpreadTemplates';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SpreadPageProps {
  products: Product[];
  pageType: PageType;
  onNext: () => void;
  onPrevious: () => void;
  onSelectProduct: (product: Product) => void;
  isBookmarked: (productId: string) => boolean;
  onTear?: (productId: string) => void;
  isTop: boolean;
  canGoBack: boolean;
  pageNumber: number;
  totalPages: number;
  pageIndex: number;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpreadPage({
  products,
  pageType,
  onNext,
  onPrevious,
  onSelectProduct,
  onTear,
  isTop,
  canGoBack,
  pageNumber,
  totalPages,
  pageIndex,
}: SpreadPageProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isPresent = useIsPresent();

  // Determine if this is a full-bleed page (heavier flip)
  const isFullBleed = pageType.kind === 'fullbleed';

  // Motion value for drag - fresh on each mount due to key including index
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);

  // Memoize exit animation to prevent new object references on re-render,
  // which can cause AnimatePresence to restart the exit animation
  const exitAnimation = useMemo(
    () => ({ opacity: 0, transition: { duration: 0.1 } }),
    []
  );

  // Transform drag to rotation (page turn effect)
  // Full-bleed pages have heavier rotation for more dramatic effect
  const rotationRange = isFullBleed ? [-45, 0, 25] : [-60, 0, 30];
  const rotateY = useTransform(x, [-250, 0, 250], rotationRange);

  // Shadow on edge during flip
  const shadowOpacity = useTransform(x, [-200, 0, 200], [0.4, 0, 0.2]);

  const handleDragEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isAnimating) return;

      const threshold = 80;
      const velocity = info.velocity.x;

      // Slower, heavier animation for realistic 200gsm cardstock feel
      const duration = isFullBleed ? 0.9 : 0.75;
      // Easing: slow start, smooth middle, gentle settle
      const easing: [number, number, number, number] = [0.4, 0, 0.2, 1];

      // Drag left (negative) = next page
      if (info.offset.x < -threshold || velocity < -400) {
        setIsAnimating(true);
        await Promise.all([
          animate(x, -500, { duration, ease: easing }),
          animate(opacity, 0, { duration: duration * 0.8, ease: easing }),
        ]);
        onNext();
      }
      // Drag right (positive) = previous page (if allowed)
      else if ((info.offset.x > threshold || velocity > 400) && canGoBack) {
        setIsAnimating(true);
        await Promise.all([
          animate(x, 500, { duration, ease: easing }),
          animate(opacity, 0, { duration: duration * 0.8, ease: easing }),
        ]);
        onPrevious();
      }
      // Snap back - heavy 200gsm cardstock physics
      else {
        animate(x, 0, { type: 'spring', stiffness: 100, damping: 20 });
      }
    },
    [onNext, onPrevious, canGoBack, x, opacity, isAnimating, isFullBleed]
  );

  const handleSelectProduct = useCallback(
    (product: Product) => {
      // Only allow selection if not dragging
      if (Math.abs(x.get()) < 10) {
        onSelectProduct(product);
      }
    },
    [onSelectProduct, x]
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER CONTENT
  // ─────────────────────────────────────────────────────────────

  const renderContent = () => {
    // Safety check - ensure we have products
    if (!products || products.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="font-mono text-[9px] text-[#1A1A1A]/30">No products</span>
        </div>
      );
    }

    if (pageType.kind === 'fullbleed') {
      return (
        <FullBleedHero
          product={products[0]}
          onSelect={handleSelectProduct}
          chapterNumber={pageType.chapterNumber}
          onTear={onTear}
        />
      );
    }

    // Asymmetric template
    return renderAsymmetricTemplate(
      pageType.template,
      products,
      handleSelectProduct,
      pageIndex,
      onTear
    );
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      className={`absolute w-full h-full ${isTop ? 'z-10' : 'z-0'}`}
      style={{
        perspective: 1500,
        perspectiveOrigin: 'center center',
        pointerEvents: isPresent ? 'auto' : 'none',
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={exitAnimation}
    >
      <motion.div
        className="relative w-full h-full drag-page"
        style={{
          x,
          rotateY,
          opacity,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        drag={isTop && !isAnimating ? 'x' : false}
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {/* Main spread container */}
        <div
          className={`relative w-full h-full bg-[#FDFCFB] rounded-sm overflow-hidden ${
            isFullBleed ? 'shadow-2xl' : 'shadow-xl'
          }`}
        >

          {/* Dynamic page edge shadow during flip */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none"
            style={{
              opacity: shadowOpacity,
              background:
                'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)',
            }}
          />

          {/* Layout content - render for top page, blank for others */}
          <div className="absolute inset-0">
            {isTop ? renderContent() : (
              /* Blank card backing for non-top pages to prevent ghost images */
              <div className="w-full h-full bg-[#FDFCFB]" />
            )}
          </div>

          {/* Page number indicator - different style for full-bleed */}
          {isTop && !isFullBleed && (
            <div className="absolute bottom-3 right-4 z-20">
              <span className="font-mono text-[8px] tracking-wider text-[#1A1A1A]/30">
                {pageNumber}/{totalPages}
              </span>
            </div>
          )}

          {/* Navigation hints - only for non-fullbleed */}
          {isTop && !isFullBleed && (
            <div className="absolute bottom-3 left-4 z-20 flex items-center gap-3">
              {canGoBack && (
                <div className="flex items-center gap-1 opacity-40">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="w-3 h-3 text-[#1A1A1A]/40 rotate-180"
                    animate={{ x: [0, -3, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </motion.svg>
                  <span className="font-mono text-[8px] text-[#1A1A1A]/30">
                    Back
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 opacity-40">
                <span className="font-mono text-[8px] text-[#1A1A1A]/30">
                  Next
                </span>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="w-3 h-3 text-[#1A1A1A]/40"
                  animate={{ x: [0, 3, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </motion.svg>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
