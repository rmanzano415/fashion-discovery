'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { Header } from '@/components/Header';
import { CardStack, calculateTotalPages } from '@/components/CardStack';
import { FolioFooter } from '@/components/FolioFooter';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { Product } from '@/types/product';
import { clearTornItems } from '@/components/TearableImage';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function Home() {
  const router = useRouter();
  const {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    profile,
    profileInitials,
    hasCompletedOnboarding,
    userId,
    saveProfile,
    isLoaded,
  } = useApp();

  // Fetch personalized recommendations
  const { products, isLoading: isLoadingProducts, error: productsError, refetch } = useRecommendations(userId);

  // Onboarding guard
  useEffect(() => {
    if (isLoaded && !hasCompletedOnboarding) {
      router.push('/onboarding');
    }
  }, [isLoaded, hasCompletedOnboarding, router]);

  // Track cover and page state
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Settings drawer state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Track selected product for modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Calculate total pages
  const totalPages = useMemo(() => calculateTotalPages(products.length), [products.length]);

  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProduct(null);
  }, []);

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

  const handleTear = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product && !isFavorite(productId)) {
        addFavorite(product as Product);
      }
    },
    [products, isFavorite, addFavorite]
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
    clearTornItems();
    setResetKey((k) => k + 1);
  }, []);

  // Show loading while context loads or onboarding guard is evaluating
  if (!isLoaded || (!hasCompletedOnboarding && isLoaded)) {
    return (
      <div className="min-h-screen bg-[var(--archive-white)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-px h-12 bg-[var(--soft-gray)] mb-4" />
          <span className="issue-label">Loading</span>
          <div className="w-px h-12 bg-[var(--soft-gray)] mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  // Loading recommendations
  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-[var(--archive-white)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-px h-12 bg-[var(--soft-gray)] mb-4" />
          <span className="issue-label">Curating your zine</span>
          <div className="w-px h-12 bg-[var(--soft-gray)] mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (productsError) {
    return (
      <div className="min-h-screen bg-[var(--archive-white)] flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-px h-12 bg-[var(--soft-gray)] mb-4" />
          <span className="issue-label mb-2">Unable to load</span>
          <p className="text-sm text-[var(--mid-gray)] mb-4">
            We couldn&apos;t reach the curation engine. Please check that the backend is running and try again.
          </p>
          <button
            onClick={refetch}
            className="text-xs uppercase tracking-[0.15em] border border-[var(--soft-gray)] px-4 py-2 hover:bg-[var(--warm-cream)] transition-colors"
          >
            Retry
          </button>
          <div className="w-px h-12 bg-[var(--soft-gray)] mt-4" />
        </div>
      </div>
    );
  }

  // Empty state — no matches
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--archive-white)] flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-px h-12 bg-[var(--soft-gray)] mb-4" />
          <span className="issue-label mb-2">No matches yet</span>
          <p className="text-sm text-[var(--mid-gray)] mb-4">
            We couldn&apos;t find products matching your style profile. Try adjusting your aesthetic preferences in settings.
          </p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs uppercase tracking-[0.15em] border border-[var(--soft-gray)] px-4 py-2 hover:bg-[var(--warm-cream)] transition-colors"
          >
            Open Settings
          </button>
          <div className="w-px h-12 bg-[var(--soft-gray)] mt-4" />
        </div>

        <FolioFooter
          issueTitle="SS26"
          issueYear="2026"
          currentPage={0}
          totalPages={0}
          subscriberInitials={profileInitials || undefined}
          favoritesCount={favorites.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onSave={saveProfile}
          availableBrands={[]}
        />
      </div>
    );
  }

  // Extract unique brands for settings
  const availableBrands = Array.from(
    new Set(products.map((p) => p.brand || p.category || 'Unknown'))
  ).map((name) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name }));

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

      <FolioFooter
        issueTitle="SS26"
        issueYear="2026"
        currentPage={isCoverOpen ? currentPageIndex + 1 : 0}
        totalPages={totalPages}
        subscriberInitials={profileInitials || undefined}
        favoritesCount={favorites.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSave={saveProfile}
        availableBrands={availableBrands}
      />

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
