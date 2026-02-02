'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Aesthetic,
  Palette,
  Vibe,
  StyleBriefingResult,
} from './OnboardingContainer';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StyleBriefingProps {
  initialBriefing: StyleBriefingResult | null;
  onComplete: (result: StyleBriefingResult) => void;
  onBack: () => void;
}

type BriefingStep = 'intro' | 'aesthetic' | 'palette' | 'vibe' | 'summary';

const STEPS: BriefingStep[] = ['intro', 'aesthetic', 'palette', 'vibe', 'summary'];

// ═══════════════════════════════════════════════════════════════
// OPTION DATA
// ═══════════════════════════════════════════════════════════════

interface AestheticOption {
  id: Aesthetic;
  label: string;
  description: string;
  gradient: string;
  icon: string;
}

const AESTHETIC_OPTIONS: AestheticOption[] = [
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Clean silhouettes, negative space, quiet luxury',
    gradient: 'from-[#E8E6E3] via-[#F5F3F0] to-[#FDFCFB]',
    icon: '\u25CB', // ○
  },
  {
    id: 'avant-garde',
    label: 'Avant-Garde',
    description: 'Deconstructed forms, asymmetry, boundary-pushing',
    gradient: 'from-[#1A1A1A] via-[#3D3D3D] to-[#6B6B6B]',
    icon: '\u25CA', // ◊
  },
  {
    id: 'street',
    label: 'Street',
    description: 'Urban energy, graphic boldness, cultural remix',
    gradient: 'from-[#2C2C2C] via-[#4A4A4A] to-[#8B8B8B]',
    icon: '\u25A0', // ■
  },
  {
    id: 'heritage',
    label: 'Heritage',
    description: 'Timeless craft, classic proportions, archival references',
    gradient: 'from-[#8B7355] via-[#A89279] to-[#D4C5B0]',
    icon: '\u25C6', // ◆
  },
];

interface PaletteOption {
  id: Palette;
  label: string;
  description: string;
  colors: string[];
}

const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: 'earth',
    label: 'Earth',
    description: 'Terracotta, olive, sand, umber',
    colors: ['#8B6F47', '#6B7F5E', '#C4A97D', '#5C4033', '#D4C5B0', '#A89279'],
  },
  {
    id: 'monolith',
    label: 'Monolith',
    description: 'Obsidian, slate, ash, ivory',
    colors: ['#1A1A1A', '#4A4A4A', '#8B8B8B', '#B8B8B8', '#E0E0E0', '#FDFCFB'],
  },
  {
    id: 'primary',
    label: 'Primary',
    description: 'Signal red, cobalt, chrome yellow',
    colors: ['#C8352B', '#2B4C8C', '#D4A017', '#1A1A1A', '#FDFCFB', '#6B8E5A'],
  },
];

interface VibeOption {
  id: Vibe;
  label: string;
  description: string;
  pattern: 'dots' | 'lines' | 'grid' | 'waves';
}

const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'understated',
    label: 'Understated',
    description: 'Whispered confidence, effortless restraint',
    pattern: 'dots',
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Unapologetic presence, maximum impact',
    pattern: 'lines',
  },
  {
    id: 'eclectic',
    label: 'Eclectic',
    description: 'Unexpected pairings, curated chaos',
    pattern: 'grid',
  },
  {
    id: 'refined',
    label: 'Refined',
    description: 'Precise details, studied elegance',
    pattern: 'waves',
  },
];

// ═══════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════

// Horizontal page flip for quiz navigation
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    rotateY: direction > 0 ? 15 : -15,
  }),
  center: {
    x: 0,
    opacity: 1,
    rotateY: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    rotateY: direction > 0 ? -15 : 15,
  }),
};

const pageTransition = {
  type: 'tween' as const,
  duration: 0.45,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

// ═══════════════════════════════════════════════════════════════
// INK STAMP COMPONENT
// ═══════════════════════════════════════════════════════════════

function InkStamp({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
      animate={{ opacity: 1, scale: 1, rotate: -8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className="text-[#1A1A1A]/25"
      >
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <circle
          cx="28"
          cy="28"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute text-[#1A1A1A]/50"
      >
        <motion.path
          d="M5 12l5 5L20 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        />
      </svg>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATTERN BACKGROUNDS
// ═══════════════════════════════════════════════════════════════

function PatternBackground({ pattern }: { pattern: string }) {
  const patternStyle: Record<string, React.CSSProperties> = {
    dots: {
      backgroundImage:
        'radial-gradient(circle, #1A1A1A 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    },
    lines: {
      backgroundImage:
        'repeating-linear-gradient(45deg, transparent, transparent 8px, #1A1A1A 8px, #1A1A1A 9px)',
    },
    grid: {
      backgroundImage:
        'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    waves: {
      backgroundImage:
        'repeating-linear-gradient(0deg, transparent, transparent 12px, #1A1A1A 12px, #1A1A1A 13px)',
    },
  };

  return (
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={patternStyle[pattern] || patternStyle.dots}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function StyleBriefing({
  initialBriefing,
  onComplete,
  onBack,
}: StyleBriefingProps) {
  const [step, setStep] = useState<BriefingStep>(
    initialBriefing ? 'summary' : 'intro'
  );
  const [direction, setDirection] = useState(1);

  const [aesthetic, setAesthetic] = useState<Aesthetic | null>(
    initialBriefing?.aesthetic ?? null
  );
  const [palette, setPalette] = useState<Palette | null>(
    initialBriefing?.palette ?? null
  );
  const [vibe, setVibe] = useState<Vibe | null>(
    initialBriefing?.vibe ?? null
  );

  const currentIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setDirection(1);
      setStep(STEPS[nextIndex]);
    }
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex === 0) {
      onBack();
      return;
    }
    setDirection(-1);
    setStep(STEPS[currentIndex - 1]);
  }, [currentIndex, onBack]);

  const handleAestheticSelect = useCallback(
    (id: Aesthetic) => {
      setAesthetic(id);
      // Auto-advance after short delay for ink stamp to show
      setTimeout(() => {
        setDirection(1);
        setStep('palette');
      }, 400);
    },
    []
  );

  const handlePaletteSelect = useCallback(
    (id: Palette) => {
      setPalette(id);
      setTimeout(() => {
        setDirection(1);
        setStep('vibe');
      }, 400);
    },
    []
  );

  const handleVibeSelect = useCallback(
    (id: Vibe) => {
      setVibe(id);
      setTimeout(() => {
        setDirection(1);
        setStep('summary');
      }, 400);
    },
    []
  );

  const handleFinalize = useCallback(() => {
    if (aesthetic && palette && vibe) {
      onComplete({ aesthetic, palette, vibe });
    }
  }, [aesthetic, palette, vibe, onComplete]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="min-h-screen flex flex-col px-6 py-8"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Back button */}
      <motion.button
        onClick={goPrev}
        className="self-start flex items-center gap-2 mb-6 group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[#1A1A1A]/40 group-hover:text-[#1A1A1A]/70 transition-colors"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40 group-hover:text-[#1A1A1A]/70 uppercase transition-colors">
          Back
        </span>
      </motion.button>

      {/* Progress indicator */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-px transition-all duration-500 ${
              i <= currentIndex
                ? 'w-8 bg-[#1A1A1A]/60'
                : 'w-4 bg-[#1A1A1A]/15'
            }`}
          />
        ))}
      </motion.div>

      {/* Step content with horizontal page flip */}
      <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ perspective: 1000 }}>
        <AnimatePresence mode="wait" custom={direction}>
          {/* INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full max-w-md text-center"
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
                Chapter III
              </span>
              <h2 className="font-serif text-4xl mt-3 mb-4">The Briefing</h2>

              <div className="w-12 h-px bg-[#1A1A1A]/15 mx-auto mb-6" />

              <p className="font-serif text-sm text-[#1A1A1A]/60 italic leading-relaxed max-w-xs mx-auto mb-2">
                Three questions to calibrate your editorial lens.
              </p>
              <p className="font-serif text-sm text-[#1A1A1A]/40 italic leading-relaxed max-w-xs mx-auto">
                Select what speaks to you. There are no wrong answers &mdash;
                only your taste, crystallized.
              </p>

              <motion.button
                onClick={goNext}
                className="mt-10 px-10 py-4 font-mono text-xs tracking-[0.15em] uppercase bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Begin Briefing
              </motion.button>
            </motion.div>
          )}

          {/* AESTHETIC SELECTION */}
          {step === 'aesthetic' && (
            <motion.div
              key="aesthetic"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full max-w-md"
            >
              <div className="text-center mb-6">
                <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
                  Question 01 of 03
                </span>
                <h3 className="font-serif text-2xl mt-2">Your Aesthetic</h3>
                <p className="font-serif text-sm text-[#1A1A1A]/50 italic mt-1">
                  Which visual language resonates?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {AESTHETIC_OPTIONS.map((option) => {
                  const isSelected = aesthetic === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleAestheticSelect(option.id)}
                      className={`relative aspect-[3/4] overflow-hidden border transition-all duration-300 ${
                        isSelected
                          ? 'border-[#1A1A1A] shadow-lg'
                          : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
                      }`}
                      whileHover={{ scale: isSelected ? 1 : 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {/* Gradient background as high-opacity imagery stand-in */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient}`} />

                      {/* Icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl opacity-10">{option.icon}</span>
                      </div>

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#FDFCFB]/90 to-transparent">
                        <span className={`font-serif text-sm block ${
                          option.id === 'avant-garde' && !isSelected
                            ? 'text-[#FDFCFB]/90'
                            : 'text-[#1A1A1A]'
                        }`}>
                          {option.label}
                        </span>
                        <span className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/50 block mt-0.5">
                          {option.description}
                        </span>
                      </div>

                      <InkStamp isVisible={isSelected} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PALETTE SELECTION */}
          {step === 'palette' && (
            <motion.div
              key="palette"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full max-w-md"
            >
              <div className="text-center mb-6">
                <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
                  Question 02 of 03
                </span>
                <h3 className="font-serif text-2xl mt-2">Your Palette</h3>
                <p className="font-serif text-sm text-[#1A1A1A]/50 italic mt-1">
                  Which mood grid draws you in?
                </p>
              </div>

              <div className="space-y-3">
                {PALETTE_OPTIONS.map((option) => {
                  const isSelected = palette === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handlePaletteSelect(option.id)}
                      className={`relative w-full overflow-hidden border transition-all duration-300 ${
                        isSelected
                          ? 'border-[#1A1A1A] shadow-lg'
                          : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
                      }`}
                      whileHover={{ scale: isSelected ? 1 : 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-stretch">
                        {/* Color mood grid */}
                        <div className="w-28 sm:w-36 flex-shrink-0">
                          <div className="grid grid-cols-3 grid-rows-2 aspect-[3/2]">
                            {option.colors.map((color, i) => (
                              <div
                                key={i}
                                className="w-full h-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Label */}
                        <div className="flex-1 p-4 flex flex-col justify-center">
                          <span className="font-serif text-base text-[#1A1A1A] text-left">
                            {option.label}
                          </span>
                          <span className="font-mono text-[8px] tracking-wider text-[#1A1A1A]/50 text-left mt-1">
                            {option.description}
                          </span>
                        </div>

                        {/* Selection indicator */}
                        <div className="flex items-center pr-4">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? 'border-[#1A1A1A] bg-[#1A1A1A]'
                                : 'border-[#1A1A1A]/20'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                className="w-2 h-2 rounded-full bg-[#FDFCFB]"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <InkStamp isVisible={isSelected} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* VIBE SELECTION */}
          {step === 'vibe' && (
            <motion.div
              key="vibe"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full max-w-md"
            >
              <div className="text-center mb-6">
                <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
                  Question 03 of 03
                </span>
                <h3 className="font-serif text-2xl mt-2">Your Vibe</h3>
                <p className="font-serif text-sm text-[#1A1A1A]/50 italic mt-1">
                  What energy does your wardrobe carry?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {VIBE_OPTIONS.map((option) => {
                  const isSelected = vibe === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleVibeSelect(option.id)}
                      className={`relative aspect-square overflow-hidden border transition-all duration-300 ${
                        isSelected
                          ? 'border-[#1A1A1A] bg-[#1A1A1A]/[0.03] shadow-lg'
                          : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 hover:bg-[#1A1A1A]/[0.01]'
                      }`}
                      whileHover={{ scale: isSelected ? 1 : 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <PatternBackground pattern={option.pattern} />

                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <span className="font-serif text-base text-[#1A1A1A] mb-1">
                          {option.label}
                        </span>
                        <span className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/50 text-center leading-relaxed">
                          {option.description}
                        </span>
                      </div>

                      <InkStamp isVisible={isSelected} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SUMMARY */}
          {step === 'summary' && (
            <motion.div
              key="summary"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="w-full max-w-md text-center"
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
                Briefing Complete
              </span>
              <h3 className="font-serif text-3xl mt-3 mb-6">Your Style Profile</h3>

              <div className="w-12 h-px bg-[#1A1A1A]/15 mx-auto mb-8" />

              {/* Results display */}
              <div className="space-y-4 max-w-xs mx-auto">
                {/* Aesthetic */}
                <motion.div
                  className="flex items-baseline justify-between py-3 border-b border-[#1A1A1A]/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
                    Aesthetic
                  </span>
                  <button
                    onClick={() => { setDirection(-1); setStep('aesthetic'); }}
                    className="font-serif text-sm text-[#1A1A1A] hover:text-[#1A1A1A]/70 transition-colors"
                  >
                    {AESTHETIC_OPTIONS.find((a) => a.id === aesthetic)?.label ?? '\u2014'}
                  </button>
                </motion.div>

                {/* Palette */}
                <motion.div
                  className="flex items-baseline justify-between py-3 border-b border-[#1A1A1A]/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
                    Palette
                  </span>
                  <div className="flex items-center gap-3">
                    {palette && (
                      <div className="flex gap-0.5">
                        {PALETTE_OPTIONS.find((p) => p.id === palette)
                          ?.colors.slice(0, 4)
                          .map((c, i) => (
                            <div
                              key={i}
                              className="w-3 h-3"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                      </div>
                    )}
                    <button
                      onClick={() => { setDirection(-1); setStep('palette'); }}
                      className="font-serif text-sm text-[#1A1A1A] hover:text-[#1A1A1A]/70 transition-colors"
                    >
                      {PALETTE_OPTIONS.find((p) => p.id === palette)?.label ?? '\u2014'}
                    </button>
                  </div>
                </motion.div>

                {/* Vibe */}
                <motion.div
                  className="flex items-baseline justify-between py-3 border-b border-[#1A1A1A]/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
                    Vibe
                  </span>
                  <button
                    onClick={() => { setDirection(-1); setStep('vibe'); }}
                    className="font-serif text-sm text-[#1A1A1A] hover:text-[#1A1A1A]/70 transition-colors"
                  >
                    {VIBE_OPTIONS.find((v) => v.id === vibe)?.label ?? '\u2014'}
                  </button>
                </motion.div>
              </div>

              {/* Edit note */}
              <motion.p
                className="font-mono text-[8px] tracking-wider text-[#1A1A1A]/30 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Tap any value to revise
              </motion.p>

              {/* Proceed */}
              <motion.button
                onClick={handleFinalize}
                disabled={!aesthetic || !palette || !vibe}
                className="mt-8 px-10 py-4 font-mono text-xs tracking-[0.15em] uppercase transition-all duration-300 bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90 disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: aesthetic && palette && vibe ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Proceed to Archive
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
