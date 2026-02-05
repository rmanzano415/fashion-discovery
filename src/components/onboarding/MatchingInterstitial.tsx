'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZineProfile } from './OnboardingContainer';
import { CurationStatus } from '@/lib/curationGate';

interface MatchingInterstitialProps {
  zineProfile: ZineProfile;
  curationStatus: CurationStatus;
  onComplete: () => void;
}

// ═══════════════════════════════════════════════════════════════
// AUDIO HELPERS
// ═══════════════════════════════════════════════════════════════

function playTickSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 800;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch {
    // Silent fail if audio not supported
  }
}

function playStampSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 100));
      data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    source.connect(filter).connect(audioCtx.destination);
    source.start();
  } catch {
    // Silent fail if audio not supported
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function MatchingInterstitial({
  zineProfile,
  curationStatus,
  onComplete,
}: MatchingInterstitialProps) {
  const [phase, setPhase] = useState<'scrolling' | 'stamp' | 'exit'>('scrolling');
  const [scrollY, setScrollY] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedStamp = useRef(false);

  // Build display items from brands + aesthetic tags
  const displayItems = [
    ...zineProfile.brands.map((b) => ({ type: 'brand' as const, label: b.name })),
    ...(zineProfile.styleBriefing
      ? [
          { type: 'tag' as const, label: zineProfile.styleBriefing.aesthetic },
          { type: 'tag' as const, label: zineProfile.styleBriefing.palette },
          { type: 'tag' as const, label: zineProfile.styleBriefing.vibe },
        ]
      : []),
  ];

  // Phase timing controller
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Scrolling with checkmarks (0 - 1.8s)
    // Scroll animation handled by interval below

    // Phase 2: Stamp (1.8s)
    timers.push(setTimeout(() => setPhase('stamp'), 1800));

    // Phase 3: Exit (2.3s)
    timers.push(setTimeout(() => setPhase('exit'), 2300));

    // Complete (2.5s)
    timers.push(setTimeout(() => onComplete(), 2500));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Scroll animation + tick sounds
  useEffect(() => {
    if (phase !== 'scrolling') {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
      return;
    }

    let currentIndex = 0;
    const totalDuration = 1800; // ms
    const itemInterval = totalDuration / (displayItems.length + 2);

    tickIntervalRef.current = setInterval(() => {
      if (currentIndex < displayItems.length) {
        setCheckedItems((prev) => new Set([...prev, currentIndex]));
        playTickSound();
        currentIndex++;
      }
    }, itemInterval);

    // Scroll animation
    const scrollInterval = setInterval(() => {
      setScrollY((prev) => prev + 2);
    }, 16);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      clearInterval(scrollInterval);
    };
  }, [phase, displayItems.length]);

  // Play stamp sound
  useEffect(() => {
    if (phase === 'stamp' && !hasPlayedStamp.current) {
      hasPlayedStamp.current = true;
      playStampSound();
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          className="fixed inset-0 z-50 bg-[#FDFCFB] flex flex-col items-center justify-center overflow-hidden"
          exit={{
            scale: 1.1,
            opacity: 0,
          }}
          transition={{
            duration: 0.2,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          {/* Header */}
          <div className="absolute top-6 left-6 z-20">
            <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
              Matching Selection
            </span>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-6 right-6 z-20">
            <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/30">
              {phase === 'scrolling' && 'ANALYZING'}
              {phase === 'stamp' && 'APPROVED'}
            </span>
          </div>

          {/* Main scrolling area */}
          <div className="relative w-[300px] h-[400px] overflow-hidden">
            {/* Scrolling list */}
            <motion.div
              className="absolute inset-x-0 flex flex-col items-center gap-4 py-8"
              style={{ top: 150 - scrollY }}
            >
              {displayItems.map((item, index) => (
                <motion.div
                  key={`${item.type}-${index}`}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0.3 }}
                  animate={{
                    opacity: checkedItems.has(index) ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Checkmark */}
                  <div className="w-5 h-5 flex items-center justify-center">
                    <AnimatePresence>
                      {checkedItems.has(index) && (
                        <motion.svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#1A1A1A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.6 }}
                          transition={{
                            type: 'spring',
                            damping: 15,
                            stiffness: 300,
                          }}
                        >
                          <motion.path
                            d="M5 12l5 5L20 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Label */}
                  <span
                    className={`${
                      item.type === 'brand'
                        ? 'font-serif text-lg'
                        : 'font-mono text-xs tracking-wider uppercase'
                    } text-[#1A1A1A] transition-opacity`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#FDFCFB] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FDFCFB] to-transparent pointer-events-none z-10" />

            {/* Cover card with APPROVED stamp */}
            <AnimatePresence>
              {phase === 'stamp' && (
                <motion.div
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 200,
                  }}
                >
                  {/* Card background */}
                  <div className="relative w-[260px] h-[360px] bg-[#FDFCFB] border border-[#1A1A1A]/15 shadow-xl flex flex-col items-center justify-center p-8">
                    {/* Edition info */}
                    <span className="font-mono text-[8px] tracking-[0.4em] text-[#1A1A1A]/40 uppercase">
                      Personal Edition For
                    </span>
                    <h2 className="font-serif text-xl text-[#1A1A1A] mt-2 text-center">
                      {zineProfile.subscriberName}
                    </h2>

                    {/* Brand tags */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {zineProfile.brands.slice(0, 3).map((brand) => (
                        <span
                          key={brand.id}
                          className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/50 uppercase px-2 py-1 border border-[#1A1A1A]/10"
                        >
                          {brand.name}
                        </span>
                      ))}
                    </div>

                    {/* Ready count */}
                    <div className="mt-6 text-center">
                      <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/40">
                        {curationStatus.brandStatuses.filter((b) => b.status === 'ready').length}{' '}
                        brands ready
                      </span>
                    </div>

                    {/* APPROVED stamp */}
                    <motion.div
                      className="absolute bottom-8 right-8"
                      initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                      animate={{ opacity: 1, scale: 1, rotate: -12 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div className="relative">
                        <svg
                          width="60"
                          height="60"
                          viewBox="0 0 60 60"
                          className="text-[#1A1A1A]"
                        >
                          {/* Starburst background */}
                          {[...Array(12)].map((_, i) => (
                            <line
                              key={i}
                              x1="30"
                              y1="30"
                              x2={30 + 28 * Math.cos((i * 30 * Math.PI) / 180)}
                              y2={30 + 28 * Math.sin((i * 30 * Math.PI) / 180)}
                              stroke="currentColor"
                              strokeWidth="0.5"
                              strokeOpacity="0.1"
                            />
                          ))}
                          <circle
                            cx="30"
                            cy="30"
                            r="26"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeOpacity="0.25"
                            strokeDasharray="4 2"
                          />
                          <circle
                            cx="30"
                            cy="30"
                            r="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeOpacity="0.2"
                          />
                          <circle cx="30" cy="30" r="18" fill="#1A1A1A" fillOpacity="0.05" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase">
                          Approved
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom decorative element */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-8 h-px bg-[#1A1A1A]/10" />
              <span className="font-mono text-[8px] tracking-[0.3em] text-[#1A1A1A]/30 uppercase">
                Curating Your Edition
              </span>
              <div className="w-8 h-px bg-[#1A1A1A]/10" />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
