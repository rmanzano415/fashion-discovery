'use client';

import { useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';
import { SpreadPage } from './SpreadPage';
import { CoverCard } from './CoverCard';
import { AsymmetricTemplate, getProductCountForTemplate } from './SpreadTemplates';
import { PageType } from '@/types/page';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

// A "page" containing products and layout info
interface PageSpread {
  id: string;
  products: Product[];
  pageType: PageType;
  pageIndex: number;
}

interface CardStackProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isBookmarked: (productId: string) => boolean;
  onTear?: (productId: string) => void;
  onCoverOpen?: () => void;
  isCoverOpen: boolean;
  currentPageIndex: number;
  onPageChange: (newIndex: number) => void;
}

// ═══════════════════════════════════════════════════════════════
// RULE OF SIX LOGIC
// ═══════════════════════════════════════════════════════════════

// The asymmetric templates rotate through pages 1-5
// Includes mirrored variations for visual variety
const ASYMMETRIC_TEMPLATES: AsymmetricTemplate[] = [
  'offset',      // Template A - 2 products (top-left, bottom-right)
  'float',       // Template B - 3 products (main right, floats left)
  'inset',       // Template C - 1 product (centered)
  'overlap',     // Template D - 2 products (overlap from right)
  'offset-alt',  // Template A mirrored (top-right, bottom-left)
  'float-alt',   // Template B mirrored (main left, floats right)
  'overlap-alt', // Template D mirrored (overlap from left)
];

/**
 * Rule of Six: Every 6th page is a Full-Bleed Hero.
 * Pages 1-5 rotate through all asymmetric templates.
 */
function getPageTypeForIndex(pageIndex: number): PageType {
  // Every 6th page (0-indexed: 5, 11, 17, 23...) is a full-bleed hero
  const positionInCycle = pageIndex % 6;

  if (positionInCycle === 5) {
    // Full-bleed hero - chapter break
    const chapterNumber = Math.floor(pageIndex / 6) + 1;
    return { kind: 'fullbleed', chapterNumber };
  }

  // Count non-fullbleed pages so far to properly rotate through all templates
  // For every 6 pages, 5 are asymmetric. Calculate which asymmetric page this is overall.
  const fullbleedsBefore = Math.floor(pageIndex / 6);
  const asymmetricPageNumber = pageIndex - fullbleedsBefore;

  // Rotate through all 7 templates using the asymmetric page count
  const templateIndex = asymmetricPageNumber % ASYMMETRIC_TEMPLATES.length;
  return { kind: 'asymmetric', template: ASYMMETRIC_TEMPLATES[templateIndex] };
}

/**
 * Get the number of products needed for a page type
 */
function getProductCountForPageType(pageType: PageType): number {
  if (pageType.kind === 'fullbleed') {
    return 1;
  }
  return getProductCountForTemplate(pageType.template);
}

/**
 * Chunk products into pages using the Rule of Six
 */
function chunkProductsIntoPages(products: Product[]): PageSpread[] {
  const pages: PageSpread[] = [];
  let currentProductIndex = 0;
  let pageIndex = 0;

  while (currentProductIndex < products.length) {
    const pageType = getPageTypeForIndex(pageIndex);
    const productCount = getProductCountForPageType(pageType);
    const pageProducts = products.slice(
      currentProductIndex,
      currentProductIndex + productCount
    );

    // Only create page if we have products
    if (pageProducts.length > 0) {
      // Adjust page type if we don't have enough products
      let finalPageType = pageType;

      if (pageProducts.length < productCount && pageType.kind === 'asymmetric') {
        // Fall back to simpler templates based on available products
        if (pageProducts.length === 1) {
          finalPageType = { kind: 'asymmetric', template: 'inset' };
        } else if (pageProducts.length === 2) {
          finalPageType = { kind: 'asymmetric', template: 'offset' };
        }
      }

      pages.push({
        id: `page-${pageIndex}-${pageProducts.map((p) => p.id).join('-')}`,
        products: pageProducts,
        pageType: finalPageType,
        pageIndex,
      });

      currentProductIndex += productCount;
      pageIndex++;
    } else {
      break;
    }
  }

  return pages;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CardStack({
  products,
  onSelectProduct,
  isBookmarked,
  onTear,
  onCoverOpen,
  isCoverOpen,
  currentPageIndex,
  onPageChange,
}: CardStackProps) {
  // Chunk all products into page spreads using Rule of Six
  const allPages = useMemo(() => {
    return chunkProductsIntoPages(products);
  }, [products]);

  // Get visible pages (current and next 2 for stack effect)
  const visiblePages = useMemo(() => {
    return allPages.slice(currentPageIndex, currentPageIndex + 3);
  }, [allPages, currentPageIndex]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < allPages.length - 1) {
      onPageChange(currentPageIndex + 1);
    }
  }, [currentPageIndex, allPages.length, onPageChange]);

  const handlePrevious = useCallback(() => {
    if (currentPageIndex > 0) {
      onPageChange(currentPageIndex - 1);
    }
  }, [currentPageIndex, onPageChange]);

  const handleCoverOpen = useCallback(() => {
    onCoverOpen?.();
  }, [onCoverOpen]);

  // Show cover if not opened yet
  if (!isCoverOpen) {
    return (
      <div className="relative w-full h-full" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <CoverCard
            key="cover"
            products={products}
            onOpen={handleCoverOpen}
            isTop={true}
          />
        </AnimatePresence>

        {/* Peek of first page behind cover */}
        {allPages[0] && (
          <div className="absolute inset-0 -z-10 opacity-30 scale-[0.96] translate-y-2">
            <div className="w-full h-full bg-[#FDFCFB] rounded-sm shadow-lg" />
          </div>
        )}
      </div>
    );
  }

  // All pages viewed - show end state
  if (visiblePages.length === 0 || currentPageIndex >= allPages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-[#FDFCFB]">
        {/* Editorial end-of-issue marker */}
        <div className="mb-8">
          <div className="w-px h-16 bg-[#1A1A1A]/10 mx-auto mb-4" />
          <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
            End of Issue
          </span>
        </div>

        <h3 className="font-serif text-3xl text-[#1A1A1A] mb-3">Fin</h3>

        <p className="font-serif text-sm text-[#1A1A1A]/50 italic max-w-xs text-center leading-relaxed">
          You&apos;ve reached the end of this collection.
          <br />
          Your torn pieces await in your personal archive.
        </p>

        {/* Back button */}
        <button
          onClick={handlePrevious}
          className="mt-8 px-6 py-3 font-mono text-[10px] tracking-[0.15em] text-[#1A1A1A]/50 border border-[#1A1A1A]/15 uppercase hover:bg-[#1A1A1A]/5 transition-colors"
        >
          Return to Archive
        </button>

        <div className="mt-8 w-px h-16 bg-[#1A1A1A]/10" />
      </div>
    );
  }

  // Show spread pages
  return (
    <div className="relative w-full h-full perspective-container">
      {/* Blank page that sits behind everything to prevent flash */}
      <div className="absolute inset-0 bg-[#FDFCFB] rounded-sm shadow-lg" />

      <AnimatePresence mode="sync">
        {visiblePages.map((page, index) => (
          <SpreadPage
            // Include index in key so pages remount when position changes
            // This ensures clean state when navigating backwards
            key={`${page.id}-${index}`}
            products={page.products}
            pageType={page.pageType}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSelectProduct={onSelectProduct}
            isBookmarked={isBookmarked}
            onTear={onTear}
            isTop={index === 0}
            canGoBack={currentPageIndex > 0}
            pageNumber={currentPageIndex + index + 1}
            totalPages={allPages.length}
            pageIndex={page.pageIndex}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

// Re-export PageType for convenience
export type { PageType } from '@/types/page';

// Export helper for page calculation
export function calculateTotalPages(productCount: number): number {
  // Rule of Six: cycle is [2, 3, 1, 2, 1] for templates A-D + hero
  // But templates rotate, so approximate based on average products per page
  const avgProductsPerPage = 1.5; // Rough average
  return Math.ceil(productCount / avgProductsPerPage);
}
