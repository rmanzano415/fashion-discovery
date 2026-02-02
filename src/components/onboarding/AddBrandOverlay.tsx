'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Silhouette, Tempo } from './OnboardingContainer';

interface AddBrandOverlayProps {
  globalSilhouette: Silhouette;
  globalTempo: Tempo;
  onAdd: (brand: {
    name: string;
    url: string;
    silhouette?: Silhouette;
    tempo?: Tempo;
  }) => void;
  onClose: () => void;
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

export function AddBrandOverlay({
  globalSilhouette,
  globalTempo,
  onAdd,
  onClose,
}: AddBrandOverlayProps) {
  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [useCustomSpecs, setUseCustomSpecs] = useState(false);
  const [customSilhouette, setCustomSilhouette] =
    useState<Silhouette>(globalSilhouette);
  const [customTempo, setCustomTempo] = useState<Tempo>(globalTempo);

  const canAdd = url.trim() && brandName.trim();

  // Extract brand name from URL
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!brandName && newUrl) {
      try {
        const urlObj = new URL(
          newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
        );
        const hostname = urlObj.hostname
          .replace('www.', '')
          .replace('.myshopify.com', '')
          .replace('.com', '');
        const formattedName = hostname
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setBrandName(formattedName);
      } catch {
        // Invalid URL, ignore
      }
    }
  };

  const handleAdd = () => {
    if (canAdd) {
      onAdd({
        name: brandName.trim(),
        url: url.trim(),
        silhouette: useCustomSpecs ? customSilhouette : undefined,
        tempo: useCustomSpecs ? customTempo : undefined,
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-[#1A1A1A]/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Overlay Panel - Vertical "Page Lift" animation */}
      <motion.div
        className="relative w-full max-w-md bg-[#FDFCFB] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.32, 0.72, 0, 1],
          opacity: { duration: 0.3 }
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#FDFCFB] border-b border-[#1A1A1A]/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
              Manual Entry
            </span>
            <h3 className="font-serif text-xl mt-1">Add a House</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 space-y-6">
          {/* URL Input - Typewriter style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#1A1A1A]/50 uppercase">
                Shopify URL
              </span>
              <div className="mt-2 relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="brand-name.com"
                  className="w-full px-4 py-3 bg-transparent border border-[#1A1A1A]/15 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:border-[#1A1A1A]/40 focus:outline-none transition-colors tracking-wide"
                  autoFocus
                />
                {/* Typewriter cursor effect */}
                <motion.span
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-px h-4 bg-[#1A1A1A]/60"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </div>
            </label>

            {/* Brand name preview */}
            {brandName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <span className="font-mono text-[9px] text-[#1A1A1A]/40">
                  Display as:
                </span>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-transparent border border-[#1A1A1A]/10 font-serif text-base text-[#1A1A1A] focus:border-[#1A1A1A]/30 focus:outline-none transition-colors"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Divider */}
          <div className="w-8 h-px bg-[#1A1A1A]/10" />

          {/* Global Specs Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#1A1A1A]/50 uppercase">
                Specifications
              </span>
            </div>

            {/* Default specs card */}
            <div
              className={`p-4 border transition-all duration-300 ${
                useCustomSpecs
                  ? 'border-[#1A1A1A]/10 opacity-50'
                  : 'border-[#1A1A1A]/20 bg-[#1A1A1A]/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] text-[#1A1A1A]/40 uppercase tracking-wider">
                    Inherits from Mandate
                  </span>
                  <p className="font-serif text-sm text-[#1A1A1A]/80 mt-1">
                    {SILHOUETTE_LABELS[globalSilhouette]} ·{' '}
                    {TEMPO_LABELS[globalTempo]}
                  </p>
                </div>
                {!useCustomSpecs && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-[#1A1A1A]"
                  />
                )}
              </div>
            </div>

            {/* Edit toggle */}
            <button
              onClick={() => setUseCustomSpecs(!useCustomSpecs)}
              className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors"
            >
              <span className="font-mono text-[9px] tracking-wider uppercase">
                {useCustomSpecs ? 'Use Global Specs' : 'Edit for this brand'}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`transition-transform duration-300 ${
                  useCustomSpecs ? 'rotate-180' : ''
                }`}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Custom specs editor */}
            {useCustomSpecs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4"
              >
                {/* Silhouette selection */}
                <div>
                  <span className="font-mono text-[9px] text-[#1A1A1A]/40 uppercase tracking-wider">
                    Silhouette Override
                  </span>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['mens', 'womens', 'unisex'] as Silhouette[]).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => setCustomSilhouette(option)}
                          className={`py-2 px-2 border text-center transition-all duration-200 ${
                            customSilhouette === option
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FDFCFB]'
                              : 'border-[#1A1A1A]/15 text-[#1A1A1A]/60 hover:border-[#1A1A1A]/30'
                          }`}
                        >
                          <span className="font-mono text-[9px] tracking-wider uppercase">
                            {SILHOUETTE_LABELS[option]}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Tempo selection */}
                <div>
                  <span className="font-mono text-[9px] text-[#1A1A1A]/40 uppercase tracking-wider">
                    Tempo Override
                  </span>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['monthly', 'quarterly', 'seasonal'] as Tempo[]).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => setCustomTempo(option)}
                          className={`py-2 px-2 border text-center transition-all duration-200 ${
                            customTempo === option
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FDFCFB]'
                              : 'border-[#1A1A1A]/15 text-[#1A1A1A]/60 hover:border-[#1A1A1A]/30'
                          }`}
                        >
                          <span className="font-mono text-[9px] tracking-wider uppercase">
                            {TEMPO_LABELS[option]}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#FDFCFB] border-t border-[#1A1A1A]/10 px-6 py-4">
          <motion.button
            onClick={handleAdd}
            disabled={!canAdd}
            className={`w-full py-4 font-mono text-xs tracking-[0.15em] uppercase transition-all duration-300 ${
              canAdd
                ? 'bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90'
                : 'bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed'
            }`}
            whileHover={canAdd ? { scale: 1.01 } : {}}
            whileTap={canAdd ? { scale: 0.99 } : {}}
          >
            Add to Directory
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
