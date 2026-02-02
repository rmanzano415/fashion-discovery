'use client';

import { motion } from 'framer-motion';

interface BrandTileProps {
  brand?: { id: string; name: string; url: string };
  isSelected?: boolean;
  isRecommended?: boolean;
  onToggle?: () => void;
  isAddNew?: boolean;
  onAdd?: () => void;
  isCustom?: boolean;
  customSpecs?: string; // Shows if brand has overridden global specs
}

export function BrandTile({
  brand,
  isSelected = false,
  isRecommended = false,
  onToggle,
  isAddNew = false,
  onAdd,
  isCustom = false,
  customSpecs,
}: BrandTileProps) {
  // ─────────────────────────────────────────────────────────────
  // ADD NEW TILE
  // ─────────────────────────────────────────────────────────────

  if (isAddNew) {
    return (
      <motion.button
        onClick={onAdd}
        className="w-full aspect-[4/3] border border-dashed border-[#1A1A1A]/20 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:border-[#1A1A1A]/40 hover:bg-[#1A1A1A]/[0.02] group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-[#1A1A1A]/30 group-hover:text-[#1A1A1A]/50 transition-colors"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40 group-hover:text-[#1A1A1A]/60 uppercase">
          Add Brand
        </span>
      </motion.button>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // REGULAR BRAND TILE
  // ─────────────────────────────────────────────────────────────

  return (
    <motion.button
      onClick={onToggle}
      className={`relative w-full aspect-[4/3] border transition-all duration-300 overflow-hidden ${
        isSelected
          ? 'border-[#1A1A1A] bg-[#1A1A1A]/[0.03]'
          : isRecommended
            ? 'border-[#1A1A1A]/30 bg-[#1A1A1A]/[0.02] hover:border-[#1A1A1A]/50'
            : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 hover:bg-[#1A1A1A]/[0.01]'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Brand Name */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <span
          className={`font-serif text-sm sm:text-base text-center leading-tight transition-colors duration-300 ${
            isSelected ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/70'
          }`}
        >
          {brand?.name}
        </span>

        {/* Custom indicator */}
        {isCustom && (
          <span className="font-mono text-[8px] tracking-wider text-[#1A1A1A]/40 mt-1 uppercase">
            Custom
          </span>
        )}

        {/* Custom specs override indicator */}
        {customSpecs && (
          <span className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/30 mt-0.5">
            {customSpecs}
          </span>
        )}
      </div>

      {/* Recommended badge */}
      {isRecommended && !isSelected && (
        <motion.div
          className="absolute top-2 left-2"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span className="inline-block font-mono text-[7px] tracking-[0.15em] uppercase text-[#1A1A1A]/50 border border-[#1A1A1A]/15 px-1.5 py-0.5">
            Recommended
          </span>
        </motion.div>
      )}

      {/* Archival Stamp - shown when selected */}
      <AnimatedStamp isVisible={isSelected} />

      {/* Corner accent when selected */}
      {isSelected && (
        <motion.div
          className="absolute top-0 right-0"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-0 h-0 border-t-[20px] border-t-[#1A1A1A] border-l-[20px] border-l-transparent" />
        </motion.div>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARCHIVAL STAMP ANIMATION
// ═══════════════════════════════════════════════════════════════

function AnimatedStamp({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: -12 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="relative">
        {/* Outer ring - ink stamp effect */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          className="text-[#1A1A1A]/20"
        >
          {/* Outer dashed circle */}
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          {/* Inner circle */}
          <circle
            cx="30"
            cy="30"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>

        {/* Checkmark */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1A1A1A]/60"
        >
          <motion.path
            d="M5 12l5 5L20 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
