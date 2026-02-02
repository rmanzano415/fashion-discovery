'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Silhouette, Tempo } from './OnboardingContainer';

interface SpecificationScreenProps {
  initialSilhouette: Silhouette | null;
  initialTempo: Tempo | null;
  onComplete: (silhouette: Silhouette, tempo: Tempo) => void;
}

// ═══════════════════════════════════════════════════════════════
// WATERMARK SVG COMPONENTS
// ═══════════════════════════════════════════════════════════════

function MenswearWatermark() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      className="w-full h-full text-[#1A1A1A]"
      style={{ opacity: 0.04 }}
    >
      {/* Blazer sketch */}
      <path d="M20 20 L50 15 L80 20 L75 80 L25 80 Z" />
      <path d="M35 20 L50 35 L65 20" />
      <path d="M50 35 L50 80" />
      <path d="M30 40 L25 60" />
      <path d="M70 40 L75 60" />
    </svg>
  );
}

function WomenswearWatermark() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      className="w-full h-full text-[#1A1A1A]"
      style={{ opacity: 0.04 }}
    >
      {/* Drape/dress sketch */}
      <path d="M40 10 C 45 10, 55 10, 60 10" />
      <path d="M40 10 C 30 30, 25 50, 30 90" />
      <path d="M60 10 C 70 30, 75 50, 70 90" />
      <path d="M30 90 C 40 85, 60 85, 70 90" />
      <path d="M35 40 C 50 45, 50 45, 65 40" />
    </svg>
  );
}

function UnisexWatermark() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      className="w-full h-full text-[#1A1A1A]"
      style={{ opacity: 0.04 }}
    >
      {/* Geometric shapes */}
      <circle cx="50" cy="40" r="25" />
      <rect x="30" y="55" width="40" height="35" />
      <line x1="50" y1="15" x2="50" y2="90" strokeDasharray="2 2" />
      <line x1="20" y1="50" x2="80" y2="50" strokeDasharray="2 2" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpecificationScreen({
  initialSilhouette,
  initialTempo,
  onComplete,
}: SpecificationScreenProps) {
  const [silhouette, setSilhouette] = useState<Silhouette | null>(
    initialSilhouette
  );
  const [tempo, setTempo] = useState<Tempo | null>(initialTempo);

  const canProceed = silhouette !== null && tempo !== null;

  const handleProceed = () => {
    if (canProceed) {
      onComplete(silhouette!, tempo!);
    }
  };

  const silhouetteOptions: { value: Silhouette; label: string; desc: string }[] =
    [
      { value: 'mens', label: 'Menswear', desc: 'Tailored for him' },
      { value: 'womens', label: 'Womenswear', desc: 'Curated for her' },
      { value: 'unisex', label: 'Unisex', desc: 'Beyond boundaries' },
    ];

  const tempoOptions: { value: Tempo; label: string; desc: string }[] = [
    { value: 'quarterly', label: 'Quarterly', desc: 'Seasonal deep-dives' },
    { value: 'seasonal', label: 'Seasonal', desc: 'Bi-annual collections' },
  ];

  return (
    <motion.div
      className="min-h-screen flex flex-col px-6 py-8 relative overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Dynamic Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80vw] h-[80vw] max-w-[500px] max-h-[500px]">
          <AnimatePresence mode="wait">
            {silhouette === 'mens' && (
              <motion.div
                key="mens"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <MenswearWatermark />
              </motion.div>
            )}
            {silhouette === 'womens' && (
              <motion.div
                key="womens"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <WomenswearWatermark />
              </motion.div>
            )}
            {silhouette === 'unisex' && (
              <motion.div
                key="unisex"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <UnisexWatermark />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Header */}
        <motion.header
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
            The Mandate
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2 mb-3">
            Your Specifications
          </h2>
          <p className="font-serif text-sm text-[#1A1A1A]/60 italic">
            Define the parameters of your archive.
          </p>
        </motion.header>

        {/* Selection 1: The Silhouette */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
              01
            </span>
            <h3 className="font-serif text-lg">The Silhouette</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {silhouetteOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setSilhouette(option.value)}
                className={`relative py-4 px-3 border text-center transition-all duration-300 overflow-hidden ${
                  silhouette === option.value
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FDFCFB]'
                    : 'border-[#1A1A1A]/15 text-[#1A1A1A]/70 hover:border-[#1A1A1A]/30 hover:bg-[#1A1A1A]/[0.02]'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="block font-serif text-sm">{option.label}</span>
                <span
                  className={`block font-mono text-[8px] mt-1 tracking-wider ${
                    silhouette === option.value
                      ? 'text-[#FDFCFB]/60'
                      : 'text-[#1A1A1A]/40'
                  }`}
                >
                  {option.desc}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Divider */}
        <motion.div
          className="w-8 h-px bg-[#1A1A1A]/10 mx-auto mb-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        />

        {/* Selection 2: The Tempo */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
              02
            </span>
            <h3 className="font-serif text-lg">The Tempo</h3>
          </div>

          <div className="space-y-2">
            {tempoOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setTempo(option.value)}
                className={`w-full py-4 px-4 border text-left transition-all duration-300 flex items-center justify-between ${
                  tempo === option.value
                    ? 'border-[#1A1A1A] bg-[#1A1A1A]/[0.03]'
                    : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
              >
                <div>
                  <span
                    className={`font-serif text-base ${
                      tempo === option.value
                        ? 'text-[#1A1A1A]'
                        : 'text-[#1A1A1A]/70'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="font-mono text-[9px] text-[#1A1A1A]/40 ml-3">
                    {option.desc}
                  </span>
                </div>
                {tempo === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-[#1A1A1A]"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Summary & CTA */}
        <motion.footer
          className="pt-6 border-t border-[#1A1A1A]/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {/* Selected specs summary */}
          {(silhouette || tempo) && (
            <div className="text-center mb-6">
              <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/40 uppercase">
                Your Mandate
              </span>
              <p className="font-serif text-sm text-[#1A1A1A]/70 mt-1">
                {silhouette
                  ? silhouetteOptions.find((o) => o.value === silhouette)?.label
                  : '—'}
                {' · '}
                {tempo
                  ? tempoOptions.find((o) => o.value === tempo)?.label
                  : '—'}
              </p>
            </div>
          )}

          {/* Proceed Button */}
          <motion.button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full py-4 font-mono text-xs tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              canProceed
                ? 'bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90'
                : 'bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed'
            }`}
            whileHover={canProceed ? { scale: 1.01 } : {}}
            whileTap={canProceed ? { scale: 0.99 } : {}}
          >
            <span>Proceed to Directory</span>
            {canProceed && (
              <motion.span
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                →
              </motion.span>
            )}
          </motion.button>
        </motion.footer>
      </div>
    </motion.div>
  );
}
