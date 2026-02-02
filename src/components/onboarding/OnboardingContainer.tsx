'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CoverScreen } from './CoverScreen';
import { SpecificationScreen } from './SpecificationScreen';
import { StyleBriefing } from './StyleBriefing';
import { ArchiveUpload } from './ArchiveUpload';
import { BrandDirectory } from './BrandDirectory';
import { AddBrandOverlay } from './AddBrandOverlay';
import { RegistryScreen } from './RegistryScreen';
import { PrintingInterstitial } from './PrintingInterstitial';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type Silhouette = 'mens' | 'womens' | 'unisex';
export type Tempo = 'monthly' | 'quarterly' | 'seasonal';
export type ContactMethod = 'email' | 'phone';

export type Aesthetic = 'minimalist' | 'avant-garde' | 'street' | 'heritage';
export type Palette = 'earth' | 'monolith' | 'primary';
export type Vibe = 'understated' | 'bold' | 'eclectic' | 'refined';

export interface StyleBriefingResult {
  aesthetic: Aesthetic;
  palette: Palette;
  vibe: Vibe;
}

export interface BrandEntry {
  id: string;
  name: string;
  url: string;
  silhouette: Silhouette;
  tempo: Tempo;
  isPreset?: boolean;
}

export interface ZineProfile {
  // Subscriber details
  subscriberName: string;
  contactMethod: ContactMethod;
  contactValue: string;
  // Global specifications
  globalSilhouette: Silhouette | null;
  globalTempo: Tempo | null;
  // Style briefing results
  styleBriefing: StyleBriefingResult | null;
  // Inspiration images (base64 data URIs)
  inspirationImages: string[];
  // Selected brands
  brands: BrandEntry[];
}

type Screen =
  | 'cover'
  | 'specification'
  | 'briefing'
  | 'archive'
  | 'directory'
  | 'registry'
  | 'printing';

interface OnboardingContainerProps {
  onComplete?: (profile: ZineProfile) => void;
}

// ═══════════════════════════════════════════════════════════════
// PRESET BRANDS
// ═══════════════════════════════════════════════════════════════

const PRESET_BRANDS = [
  { id: 'ald', name: 'Aim\u00e9 Leon Dore', url: 'aimeleondore.com' },
  { id: 'kith', name: 'Kith', url: 'kith.com' },
  { id: 'stussy', name: 'St\u00fcssy', url: 'stussy.com' },
  { id: 'noah', name: 'Noah NY', url: 'noahny.com' },
  { id: 'drakes', name: "Drake's", url: 'drakes.com' },
  { id: 'jjjjound', name: 'JJJJound', url: 'jjjjound.com' },
  { id: 'apc', name: 'A.P.C.', url: 'apc.fr' },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function OnboardingContainer({ onComplete }: OnboardingContainerProps = {}) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('cover');
  const [showAddOverlay, setShowAddOverlay] = useState(false);

  const [profile, setProfile] = useState<ZineProfile>({
    subscriberName: '',
    contactMethod: 'email',
    contactValue: '',
    globalSilhouette: null,
    globalTempo: null,
    styleBriefing: null,
    inspirationImages: [],
    brands: [],
  });

  // ─────────────────────────────────────────────────────────────
  // SCREEN NAVIGATION
  // ─────────────────────────────────────────────────────────────

  // Screen 1 → Screen 2
  const handleBeginCuration = useCallback(() => {
    setCurrentScreen('specification');
  }, []);

  // Screen 2 → Screen 3 (Briefing)
  const handleSpecificationComplete = useCallback(
    (silhouette: Silhouette, tempo: Tempo) => {
      setProfile((prev) => ({
        ...prev,
        globalSilhouette: silhouette,
        globalTempo: tempo,
      }));
      setCurrentScreen('briefing');
    },
    []
  );

  // Screen 3 → Screen 4 (Archive)
  const handleBriefingComplete = useCallback(
    (result: StyleBriefingResult) => {
      setProfile((prev) => ({
        ...prev,
        styleBriefing: result,
      }));
      setCurrentScreen('archive');
    },
    []
  );

  // Screen 3 → Screen 2 (back)
  const handleBackToSpecification = useCallback(() => {
    setCurrentScreen('specification');
  }, []);

  // Screen 4 → Screen 5 (Directory)
  const handleArchiveComplete = useCallback(
    (images: string[]) => {
      setProfile((prev) => ({
        ...prev,
        inspirationImages: images,
      }));
      setCurrentScreen('directory');
    },
    []
  );

  // Screen 4 → Screen 3 (back)
  const handleBackToBriefing = useCallback(() => {
    setCurrentScreen('briefing');
  }, []);

  // Screen 5 → Screen 4 (back)
  const handleBackToArchive = useCallback(() => {
    setCurrentScreen('archive');
  }, []);

  // Screen 5 → Screen 6
  const handleProceedToRegistry = useCallback(() => {
    setCurrentScreen('registry');
  }, []);

  // Screen 6 → Screen 5 (back)
  const handleBackToDirectory = useCallback(() => {
    setCurrentScreen('directory');
  }, []);

  // Screen 6 → Screen 7
  const handleRegistryComplete = useCallback(
    (data: {
      subscriberName: string;
      contactMethod: 'email' | 'phone';
      contactValue: string;
    }) => {
      setProfile((prev) => ({
        ...prev,
        subscriberName: data.subscriberName,
        contactMethod: data.contactMethod,
        contactValue: data.contactValue,
      }));
      setCurrentScreen('printing');
    },
    []
  );

  // Screen 7 → Complete
  const handlePrintingComplete = useCallback(() => {
    if (onComplete) {
      onComplete(profile);
    }
  }, [profile, onComplete]);

  // ─────────────────────────────────────────────────────────────
  // BRAND MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  const handleTogglePresetBrand = useCallback(
    (preset: { id: string; name: string; url: string }) => {
      setProfile((prev) => {
        const exists = prev.brands.some((b) => b.id === preset.id);

        if (exists) {
          return {
            ...prev,
            brands: prev.brands.filter((b) => b.id !== preset.id),
          };
        } else {
          const newBrand: BrandEntry = {
            id: preset.id,
            name: preset.name,
            url: preset.url,
            silhouette: prev.globalSilhouette!,
            tempo: prev.globalTempo!,
            isPreset: true,
          };
          return {
            ...prev,
            brands: [...prev.brands, newBrand],
          };
        }
      });
    },
    []
  );

  const handleOpenAddOverlay = useCallback(() => {
    setShowAddOverlay(true);
  }, []);

  const handleCloseAddOverlay = useCallback(() => {
    setShowAddOverlay(false);
  }, []);

  const handleAddCustomBrand = useCallback(
    (brand: {
      name: string;
      url: string;
      silhouette?: Silhouette;
      tempo?: Tempo;
    }) => {
      setProfile((prev) => {
        const newBrand: BrandEntry = {
          id: `custom-${Date.now()}`,
          name: brand.name,
          url: brand.url,
          silhouette: brand.silhouette || prev.globalSilhouette!,
          tempo: brand.tempo || prev.globalTempo!,
          isPreset: false,
        };
        return {
          ...prev,
          brands: [...prev.brands, newBrand],
        };
      });
      setShowAddOverlay(false);
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────

  const selectedCount = profile.brands.length;
  const isBrandSelected = (brandId: string) =>
    profile.brands.some((b) => b.id === brandId);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Screen 1: Cover */}
        {currentScreen === 'cover' && (
          <CoverScreen key="cover" onBegin={handleBeginCuration} />
        )}

        {/* Screen 2: Specification */}
        {currentScreen === 'specification' && (
          <SpecificationScreen
            key="specification"
            initialSilhouette={profile.globalSilhouette}
            initialTempo={profile.globalTempo}
            onComplete={handleSpecificationComplete}
          />
        )}

        {/* Screen 3: Style Briefing */}
        {currentScreen === 'briefing' && (
          <StyleBriefing
            key="briefing"
            initialBriefing={profile.styleBriefing}
            onComplete={handleBriefingComplete}
            onBack={handleBackToSpecification}
          />
        )}

        {/* Screen 4: Archive Upload */}
        {currentScreen === 'archive' && (
          <ArchiveUpload
            key="archive"
            initialImages={profile.inspirationImages}
            onComplete={handleArchiveComplete}
            onBack={handleBackToBriefing}
          />
        )}

        {/* Screen 5: Directory */}
        {currentScreen === 'directory' && (
          <BrandDirectory
            key="directory"
            presetBrands={PRESET_BRANDS}
            selectedBrands={profile.brands}
            globalSilhouette={profile.globalSilhouette!}
            globalTempo={profile.globalTempo!}
            styleBriefing={profile.styleBriefing}
            isBrandSelected={isBrandSelected}
            onToggleBrand={handleTogglePresetBrand}
            onAddCustom={handleOpenAddOverlay}
            onBack={handleBackToArchive}
            onFinalize={handleProceedToRegistry}
            selectedCount={selectedCount}
          />
        )}

        {/* Screen 6: Registry */}
        {currentScreen === 'registry' && (
          <RegistryScreen
            key="registry"
            initialName={profile.subscriberName}
            initialContactMethod={profile.contactMethod}
            initialContactValue={profile.contactValue}
            onComplete={handleRegistryComplete}
            onBack={handleBackToDirectory}
          />
        )}

        {/* Screen 7: Printing Interstitial */}
        {currentScreen === 'printing' && (
          <PrintingInterstitial
            key="printing"
            zineProfile={profile}
            onComplete={handlePrintingComplete}
          />
        )}
      </AnimatePresence>

      {/* Add Brand Overlay */}
      <AnimatePresence>
        {showAddOverlay && (
          <AddBrandOverlay
            key="add-overlay"
            globalSilhouette={profile.globalSilhouette!}
            globalTempo={profile.globalTempo!}
            onAdd={handleAddCustomBrand}
            onClose={handleCloseAddOverlay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
