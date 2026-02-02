'use client';

import { useState, useCallback, useMemo } from 'react';
import { useApp } from '@/components/Providers';
import { Header } from '@/components/Header';
import { CardStack, calculateTotalPages } from '@/components/CardStack';
import { FolioFooter } from '@/components/FolioFooter';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { Product } from '@/types/product';
import { clearTornItems } from '@/components/TearableImage';
import aldProducts from '@/data/products.json';
import pnsProducts from '@/data/pas-normal-studios-products.json';

// Seeded shuffle for consistent ordering
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let m = shuffled.length;
  while (m) {
    const i = Math.floor(seededRandom(seed++) * m--);
    [shuffled[m], shuffled[i]] = [shuffled[i], shuffled[m]];
  }
  return shuffled;
}
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Combine products from both brands, interleaved for variety (stable shuffle)
const products = seededShuffle([...aldProducts, ...pnsProducts], 42);

// Extract unique brands for settings
const availableBrands = Array.from(
  new Set(products.map((p) => p.brand || p.category || 'Unknown'))
).map((name) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name }));

export default function Home() {
  const {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    profile,
    profileInitials,
    saveProfile,
    isLoaded,
  } = useApp();

  // Track cover and page state
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  // Key to force re-mount of CardStack when reset (clears torn item visual state)
  const [resetKey, setResetKey] = useState(0);

  // Settings drawer state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Track selected product for modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Calculate total pages
  const totalPages = useMemo(() => calculateTotalPages(products.length), []);

  // Handle product selection (opens modal)
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  // Toggle bookmark
  const handleBookmark = useCallback(
    (product: Product) => {
      if (isFavorite(product.id)) {
        removeFavorite(product.id);
      } else {
        addFavorite(product);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  // Handle tear-to-favorite - find product by ID and add to favorites
  const handleTear = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product && !isFavorite(productId)) {
        addFavorite(product as Product);
      }
    },
    [isFavorite, addFavorite]
  );

  const handleCoverOpen = useCallback(() => {
    setIsCoverOpen(true);
  }, []);

  const handlePageChange = useCallback((newIndex: number) => {
    setCurrentPageIndex(newIndex);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentPageIndex(0);
    setIsCoverOpen(false);
    // Clear torn items so they can be re-collected
    clearTornItems();
    // Force re-mount of CardStack to clear visual torn state
    setResetKey((k) => k + 1);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--archive-white)] flex items-center justify-center">
        {/* Editorial loading state */}
        <div className="flex flex-col items-center">
          <div className="w-px h-12 bg-[var(--soft-gray)] mb-4" />
          <span className="issue-label">Loading</span>
          <div className="w-px h-12 bg-[var(--soft-gray)] mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--archive-white)] pb-16">
      <Header
        issueTitle="SS26 Collection"
        progress={{
          current: currentPageIndex + 1,
          total: totalPages,
        }}
        isCoverOpen={isCoverOpen}
        onReset={isCoverOpen ? handleReset : undefined}
      />

      <div className="px-4 pt-2">
        <div className="max-w-lg mx-auto">
          {/* Card area - full height for immersive reading */}
          <div className="relative h-[calc(100vh-160px)] min-h-[520px]">
            <CardStack
              key={resetKey}
              products={products as Product[]}
              onSelectProduct={handleSelectProduct}
              isBookmarked={isFavorite}
              onTear={handleTear}
              onCoverOpen={handleCoverOpen}
              isCoverOpen={isCoverOpen}
              currentPageIndex={currentPageIndex}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Folio Footer */}
      <FolioFooter
        issueTitle="SS26"
        issueYear="2026"
        currentPage={isCoverOpen ? currentPageIndex + 1 : 0}
        totalPages={totalPages}
        subscriberInitials={profileInitials || undefined}
        favoritesCount={favorites.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSave={saveProfile}
        availableBrands={availableBrands}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={handleCloseModal}
        onBookmark={handleBookmark}
        isBookmarked={selectedProduct ? isFavorite(selectedProduct.id) : false}
      />
    </main>
  );
}
