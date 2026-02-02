'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZineProfile } from './OnboardingContainer';

interface PrintingInterstitialProps {
  zineProfile: ZineProfile;
  onComplete: () => void;
}

// Status messages for the logger - personalized with subscriber context
const getStatusMessages = (name: string) => [
  '> INITIALIZING PRESS',
  '> ANALYZING SILHOUETTE',
  '> LOADING BRAND REGISTRY',
  `> REGISTERING ${name.toUpperCase().split(' ')[0] || 'SUBSCRIBER'}`,
  '> CURATING HOUSES',
  '> SETTING TEMPO',
  '> COMPOSING LAYOUTS',
  '> APPLYING INK',
  '> BINDING ISSUE',
  '> FINALIZING EDITION',
];

// Get initials from name
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export function PrintingInterstitial({
  zineProfile,
  onComplete,
}: PrintingInterstitialProps) {
  const [phase, setPhase] = useState<'ink' | 'binding' | 'press' | 'complete'>('ink');
  const [statusIndex, setStatusIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  // Personalized data
  const subscriberName = zineProfile.subscriberName || 'Subscriber';
  const initials = getInitials(subscriberName);
  const statusMessages = useMemo(() => getStatusMessages(subscriberName), [subscriberName]);

  // Phase timing controller
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Ink Saturation (0.0s - 0.8s)
    // Scan line animation handled by CSS/Framer

    // Phase 2: Binding (0.8s)
    timers.push(setTimeout(() => setPhase('binding'), 800));

    // Phase 3: Press (1.5s)
    timers.push(setTimeout(() => setPhase('press'), 1500));

    // Complete (2.0s)
    timers.push(setTimeout(() => setPhase('complete'), 2000));

    // Trigger onComplete after exit animation
    timers.push(setTimeout(() => onComplete(), 2400));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Status logger cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 180);

    return () => clearInterval(interval);
  }, [statusMessages.length]);

  // Scan progress for Phase 1
  useEffect(() => {
    if (phase === 'ink') {
      const interval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 2, 100));
      }, 16);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Get brand names for display
  const brandNames = zineProfile.brands.slice(0, 5).map((b) => b.name);
  const editionNumber = useMemo(
    () => `No. ${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    []
  );

  return (
    <AnimatePresence>
      {phase !== 'complete' ? (
        <motion.div
          className="fixed inset-0 z-50 bg-[#FDFCFB] flex items-center justify-center overflow-hidden"
          exit={{
            scale: 1.2,
            opacity: 0,
          }}
          transition={{
            duration: 0.4,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          {/* Status Logger */}
          <div className="absolute top-6 left-6 z-20">
            <motion.div
              key={statusIndex}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40"
            >
              {statusMessages[statusIndex]}
            </motion.div>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-6 right-6 z-20">
            <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/30">
              {phase === 'ink' && 'SATURATING'}
              {phase === 'binding' && 'BINDING'}
              {phase === 'press' && 'PRESSING'}
            </span>
          </div>

          {/* Main Print Area */}
          <div className="relative w-[280px] h-[400px]">
            {/* Phase 1: Ink Saturation - The scanning effect */}
            {(phase === 'ink' || phase === 'binding' || phase === 'press') && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 1 }}
                animate={{ opacity: phase === 'ink' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Base paper */}
                <div className="absolute inset-0 bg-[#FDFCFB] border border-[#1A1A1A]/10 shadow-lg" />

                {/* Scanning line */}
                <motion.div
                  className="absolute left-0 right-0 h-px bg-[#1A1A1A]/60"
                  style={{ top: `${scanProgress}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'ink' ? 1 : 0 }}
                />

                {/* Ink content that reveals as scan passes */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-8"
                  style={{
                    clipPath: `inset(0 0 ${100 - scanProgress}% 0)`,
                  }}
                >
                  {/* Edition number */}
                  <motion.span
                    className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/50 uppercase mix-blend-multiply"
                    style={{
                      filter: `blur(${Math.max(0, 3 - scanProgress / 30)}px)`,
                    }}
                  >
                    {editionNumber}
                  </motion.span>

                  {/* Subscriber Name - Personalized Reveal */}
                  <motion.h2
                    className="font-serif text-xl text-[#1A1A1A] mt-4 mix-blend-multiply text-center"
                    style={{
                      filter: `blur(${Math.max(0, 4 - scanProgress / 25)}px)`,
                      opacity: scanProgress > 10 ? 1 : 0,
                    }}
                  >
                    {subscriberName}
                  </motion.h2>

                  {/* Decorative divider */}
                  <motion.div
                    className="mt-3 w-16 h-px bg-[#1A1A1A]/30 mix-blend-multiply"
                    style={{
                      opacity: scanProgress > 25 ? 1 : 0,
                      transform: `scaleX(${Math.min(1, (scanProgress - 25) / 20)})`,
                    }}
                  />

                  {/* "Curated For" label */}
                  <motion.span
                    className="font-mono text-[7px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase mt-4 mix-blend-multiply"
                    style={{
                      opacity: scanProgress > 35 ? 1 : 0,
                    }}
                  >
                    Curated Selection
                  </motion.span>

                  {/* Brand names */}
                  <div className="mt-3 space-y-1 text-center">
                    {brandNames.map((name, i) => (
                      <motion.p
                        key={name}
                        className="font-serif text-sm text-[#1A1A1A]/70 mix-blend-multiply"
                        style={{
                          filter: `blur(${Math.max(0, 2 - scanProgress / 40)}px)`,
                          opacity: scanProgress > 40 + i * 10 ? 1 : 0,
                        }}
                      >
                        {name}
                      </motion.p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Phase 2: Binding - Paper layers flying in */}
            {(phase === 'binding' || phase === 'press') && (
              <div className="absolute inset-0">
                {/* Layer 1 - From left */}
                <motion.div
                  className="absolute inset-0 bg-[#FDFCFB] border border-[#1A1A1A]/10"
                  initial={{ x: -300, rotateY: -30, opacity: 0 }}
                  animate={{
                    x: 0,
                    rotateY: 0,
                    opacity: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 100,
                  }}
                  style={{ transformOrigin: 'right center' }}
                />

                {/* Layer 2 - From right */}
                <motion.div
                  className="absolute inset-0 bg-[#FDFCFB] border border-[#1A1A1A]/10"
                  initial={{ x: 300, rotateY: 30, opacity: 0 }}
                  animate={{
                    x: 0,
                    rotateY: 0,
                    opacity: 1,
                    boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                  }}
                  transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 100,
                    delay: 0.1,
                  }}
                  style={{ transformOrigin: 'left center' }}
                />

                {/* Layer 3 - From bottom (the cover) */}
                <motion.div
                  className="absolute inset-0 bg-[#FDFCFB] border border-[#1A1A1A]/10"
                  initial={{ y: 200, scale: 0.9, opacity: 0 }}
                  animate={{
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  }}
                  transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 100,
                    delay: 0.2,
                  }}
                >
                  {/* Cover content preview - Personalized */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    {/* Monogram crest */}
                    <div className="relative w-14 h-14 mb-4">
                      <svg
                        viewBox="0 0 56 56"
                        fill="none"
                        className="absolute inset-0 w-full h-full"
                      >
                        <circle
                          cx="28"
                          cy="28"
                          r="26"
                          stroke="#1A1A1A"
                          strokeWidth="0.5"
                          strokeOpacity="0.2"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="22"
                          stroke="#1A1A1A"
                          strokeWidth="1"
                          strokeOpacity="0.15"
                          strokeDasharray="2 2"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center font-serif text-lg text-[#1A1A1A]/60">
                        {initials}
                      </span>
                    </div>

                    <span className="font-mono text-[8px] tracking-[0.4em] text-[#1A1A1A]/40 uppercase">
                      Personal Edition For
                    </span>
                    <h2 className="font-serif text-xl text-[#1A1A1A] mt-2 mix-blend-multiply text-center">
                      {subscriberName}
                    </h2>
                    <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/50 mt-2 uppercase">
                      {editionNumber}
                    </span>

                    {/* Brand list */}
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {brandNames.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/40 uppercase px-2 py-1 border border-[#1A1A1A]/10"
                        >
                          {name}
                        </span>
                      ))}
                      {brandNames.length > 3 && (
                        <span className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/30 uppercase px-2 py-1">
                          +{brandNames.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Phase 3: Press - The stamp effect */}
            {phase === 'press' && (
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1 }}
                animate={{
                  scale: [1, 0.95, 1.02, 1],
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.4, 0.7, 1],
                  ease: 'easeInOut',
                }}
              >
                {/* Press effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-[#1A1A1A]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.05, 0] }}
                  transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                />

                {/* Stamp mark */}
                <motion.div
                  className="absolute bottom-8 right-8"
                  initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: -12 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="relative">
                    <svg
                      width="50"
                      height="50"
                      viewBox="0 0 50 50"
                      className="text-[#1A1A1A]/20"
                    >
                      <circle
                        cx="25"
                        cy="25"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                      <circle
                        cx="25"
                        cy="25"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] tracking-wider text-[#1A1A1A]/40">
                      READY
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Bottom decorative elements */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-8 h-px bg-[#1A1A1A]/10" />
              <span className="font-mono text-[8px] tracking-[0.3em] text-[#1A1A1A]/30 uppercase">
                Preparing Your Edition
              </span>
              <div className="w-8 h-px bg-[#1A1A1A]/10" />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
