'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrandTile } from './BrandTile';
import {
  BrandEntry,
  Silhouette,
  Tempo,
  StyleBriefingResult,
} from './OnboardingContainer';

interface BrandDirectoryProps {
  presetBrands: { id: string; name: string; url: string }[];
  selectedBrands: BrandEntry[];
  globalSilhouette: Silhouette;
  globalTempo: Tempo;
  styleBriefing: StyleBriefingResult | null;
  isBrandSelected: (brandId: string) => boolean;
  onToggleBrand: (brand: { id: string; name: string; url: string }) => void;
  onAddCustom: () => void;
  onBack: () => void;
  onFinalize: () => void;
  selectedCount: number;
}

const SILHOUETTE_LABELS: Record<Silhouette, string> = {
  mens: 'Menswear',
  womens: 'Womenswear',
  unisex: 'Unisex',
};

const TEMPO_LABELS: Record<Tempo, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  seasonal: 'Seasonal',
};

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════════════

// Maps brand IDs to their affinity scores for each aesthetic/palette/vibe.
// Higher score = stronger recommendation when that trait is selected.
const BRAND_AFFINITIES: Record<string, {
  aesthetic: Record<string, number>;
  palette: Record<string, number>;
  vibe: Record<string, number>;
}> = {
  ald: {
    aesthetic: { heritage: 3, street: 2, minimalist: 1, 'avant-garde': 0 },
    palette: { earth: 3, monolith: 1, primary: 1 },
    vibe: { refined: 3, understated: 2, bold: 1, eclectic: 1 },
  },
  kith: {
    aesthetic: { street: 3, heritage: 1, minimalist: 1, 'avant-garde': 0 },
    palette: { monolith: 2, primary: 2, earth: 1 },
    vibe: { bold: 3, eclectic: 2, refined: 1, understated: 0 },
  },
  stussy: {
    aesthetic: { street: 3, 'avant-garde': 1, heritage: 1, minimalist: 0 },
    palette: { primary: 2, monolith: 2, earth: 1 },
    vibe: { bold: 3, eclectic: 2, understated: 0, refined: 0 },
  },
  noah: {
    aesthetic: { street: 2, heritage: 2, 'avant-garde': 1, minimalist: 1 },
    palette: { earth: 2, primary: 2, monolith: 1 },
    vibe: { eclectic: 3, bold: 2, refined: 1, understated: 0 },
  },
  drakes: {
    aesthetic: { heritage: 3, minimalist: 2, 'avant-garde': 0, street: 0 },
    palette: { earth: 3, monolith: 1, primary: 1 },
    vibe: { refined: 3, understated: 2, bold: 0, eclectic: 0 },
  },
  jjjjound: {
    aesthetic: { minimalist: 3, 'avant-garde': 2, heritage: 1, street: 0 },
    palette: { monolith: 3, earth: 1, primary: 0 },
    vibe: { understated: 3, refined: 2, bold: 0, eclectic: 1 },
  },
  apc: {
    aesthetic: { minimalist: 3, heritage: 2, 'avant-garde': 1, street: 0 },
    palette: { monolith: 2, earth: 2, primary: 0 },
    vibe: { understated: 3, refined: 2, eclectic: 0, bold: 0 },
  },
};

function getRecommendedBrandIds(
  briefing: StyleBriefingResult | null
): Set<string> {
  if (!briefing) return new Set();

  const scores: Record<string, number> = {};

  for (const [brandId, affinities] of Object.entries(BRAND_AFFINITIES)) {
    const aestheticScore = affinities.aesthetic[briefing.aesthetic] ?? 0;
    const paletteScore = affinities.palette[briefing.palette] ?? 0;
    const vibeScore = affinities.vibe[briefing.vibe] ?? 0;
    scores[brandId] = aestheticScore + paletteScore + vibeScore;
  }

  // Recommend brands scoring in the top tier (>= 6 total points)
  const threshold = 6;
  const recommended = new Set<string>();

  for (const [brandId, score] of Object.entries(scores)) {
    if (score >= threshold) {
      recommended.add(brandId);
    }
  }

  // Always recommend at least the top 2
  if (recommended.size < 2) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < Math.min(2, sorted.length); i++) {
      recommended.add(sorted[i][0]);
    }
  }

  return recommended;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BrandDirectory({
  presetBrands,
  selectedBrands,
  globalSilhouette,
  globalTempo,
  styleBriefing,
  isBrandSelected,
  onToggleBrand,
  onAddCustom,
  onBack,
  onFinalize,
  selectedCount,
}: BrandDirectoryProps) {
  // Get custom brands (non-preset)
  const customBrands = selectedBrands.filter((b) => !b.isPreset);

  const recommendedIds = useMemo(
    () => getRecommendedBrandIds(styleBriefing),
    [styleBriefing]
  );

  // Sort presets: recommended first, then the rest
  const sortedPresets = useMemo(() => {
    if (recommendedIds.size === 0) return presetBrands;
    return [...presetBrands].sort((a, b) => {
      const aRec = recommendedIds.has(a.id) ? 0 : 1;
      const bRec = recommendedIds.has(b.id) ? 0 : 1;
      return aRec - bRec;
    });
  }, [presetBrands, recommendedIds]);

  return (
    <motion.div
      className="min-h-screen flex flex-col px-6 py-8"
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Header */}
      <motion.header
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
          The Directory
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl mt-2 mb-3">
          Select Your Houses
        </h2>
        <p className="font-serif text-sm text-[#1A1A1A]/60 italic max-w-xs mx-auto">
          {styleBriefing
            ? 'Houses aligned with your briefing are highlighted.'
            : 'Select brands to populate your first edition.'}
        </p>
      </motion.header>

      {/* Global specs badge */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 transition-colors group"
        >
          <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/50 uppercase">
            Mandate:
          </span>
          <span className="font-serif text-sm text-[#1A1A1A]/80">
            {SILHOUETTE_LABELS[globalSilhouette]} &middot; {TEMPO_LABELS[globalTempo]}
          </span>
          <span className="font-mono text-[9px] text-[#1A1A1A]/30 group-hover:text-[#1A1A1A]/50 transition-colors">
            Edit
          </span>
        </button>
      </motion.div>

      {/* Decorative line */}
      <motion.div
        className="w-16 h-px bg-[#1A1A1A]/10 mx-auto mb-6"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />

      {/* Brand Grid */}
      <motion.div
        className="flex-1 max-w-lg mx-auto w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Preset brands */}
          {sortedPresets.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
            >
              <BrandTile
                brand={brand}
                isSelected={isBrandSelected(brand.id)}
                isRecommended={recommendedIds.has(brand.id)}
                onToggle={() => onToggleBrand(brand)}
              />
            </motion.div>
          ))}

          {/* Custom brands */}
          {customBrands.map((brand) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <BrandTile
                brand={brand}
                isSelected={true}
                onToggle={() =>
                  onToggleBrand({ id: brand.id, name: brand.name, url: brand.url })
                }
                isCustom
                customSpecs={
                  brand.silhouette !== globalSilhouette ||
                  brand.tempo !== globalTempo
                    ? `${SILHOUETTE_LABELS[brand.silhouette]} \u00b7 ${TEMPO_LABELS[brand.tempo]}`
                    : undefined
                }
              />
            </motion.div>
          ))}

          {/* Add Custom Tile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.4 + presetBrands.length * 0.05,
              duration: 0.3,
            }}
          >
            <BrandTile isAddNew onAdd={onAddCustom} />
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="mt-8 pt-6 border-t border-[#1A1A1A]/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        {/* Selection indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/50">
            Houses Selected:
          </span>
          <span className="font-mono text-sm font-medium text-[#1A1A1A]">
            {selectedCount}
          </span>
        </div>

        {/* Finalize Button */}
        <div className="flex justify-center">
          <motion.button
            onClick={onFinalize}
            className="px-10 py-4 font-mono text-xs tracking-[0.15em] uppercase transition-all duration-300 bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Print First Edition
          </motion.button>
        </div>
      </motion.footer>
    </motion.div>
  );
}
