'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/types/product';
import { getTornItems, addTornItem, isTornItem } from './TearableImage';

// ═══════════════════════════════════════════════════════════════
// JAGGED TEAR CLIP PATH (for full-bleed)
// ═══════════════════════════════════════════════════════════════

const TORN_PIECE_CLIP = `polygon(
  0% 6%,
  4% 2%,
  10% 5%,
  16% 1%,
  22% 4%,
  28% 0%,
  35% 3%,
  42% 1%,
  50% 5%,
  58% 1%,
  65% 4%,
  72% 0%,
  78% 3%,
  85% 1%,
  92% 5%,
  100% 2%,
  100% 100%,
  0% 100%
)`;

// ═══════════════════════════════════════════════════════════════
// AUDIO & HAPTIC HELPERS
// ═══════════════════════════════════════════════════════════════

function playTearSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 0.2; // 200ms for larger tear
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 150));
      data[i] = (Math.random() * 2 - 1) * envelope * 0.4;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 600;

    const filter2 = audioCtx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 3500;

    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(audioCtx.destination);

    source.start();
  } catch {
    // Silent fail
  }
}

function triggerHaptic() {
  if (typeof window === 'undefined') return;
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 50]); // Double vibration for dramatic effect
    }
  } catch {
    // Silent fail
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface FullBleedHeroProps {
  product: Product;
  onSelect: (product: Product) => void;
  chapterNumber: number;
  onTear?: (productId: string) => void;
}

export function FullBleedHero({
  product,
  onSelect,
  chapterNumber,
  onTear,
}: FullBleedHeroProps) {
  const [localTorn, setLocalTorn] = useState(false);
  const [isTearing, setIsTearing] = useState(false);
  const [showTornPiece, setShowTornPiece] = useState(false);
  const lastClickTime = useRef(0);
  const clickCount = useRef(0);

  // Check localStorage on mount
  useEffect(() => {
    if (product) {
      setLocalTorn(isTornItem(product.id));
    }
  }, [product]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!product) return;

      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime.current;

      if (timeSinceLastClick < 300) {
        clickCount.current++;
        if (clickCount.current >= 2 && !localTorn && !isTearing) {
          e.stopPropagation();
          setIsTearing(true);
          setShowTornPiece(true);

          triggerHaptic();
          playTearSound();

          setTimeout(() => {
            setLocalTorn(true);
            addTornItem(product.id);
            onTear?.(product.id);
          }, 100);

          setTimeout(() => {
            setShowTornPiece(false);
            setIsTearing(false);
          }, 1400);

          clickCount.current = 0;
          return;
        }
      } else {
        clickCount.current = 1;
      }

      lastClickTime.current = now;

      setTimeout(() => {
        if (clickCount.current === 1) {
          onSelect(product);
        }
      }, 300);
    },
    [product, onSelect, localTorn, isTearing, onTear]
  );

  // Safety check
  if (!product) {
    return (
      <div className="w-full h-full bg-[#FDFCFB] flex items-center justify-center">
        <span className="font-mono text-[9px] text-[#1A1A1A]/30">Loading...</span>
      </div>
    );
  }

  const brandName = product.brand || product.category || 'Archive';
  const imageUrl = product.images[0] || '/placeholder.jpg';

  // ─────────────────────────────────────────────────────────────
  // TORN STATE
  // ─────────────────────────────────────────────────────────────

  if (localTorn && !isTearing) {
    return (
      <motion.div
        className="relative w-full h-full cursor-pointer overflow-hidden bg-gradient-to-b from-[#F5F3F0] to-[#E8E5E0]"
        onClick={() => onSelect(product)}
      >
        {/* Torn paper texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)',
          }}
        />

        {/* Collected indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5}
              className="w-24 h-24 text-[#1A1A1A]/15"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </motion.div>

          <span className="font-mono text-[10px] tracking-[0.3em] text-[#1A1A1A]/30 uppercase mt-4">
            Chapter {chapterNumber} — Collected
          </span>

          <span className="font-serif text-2xl text-[#1A1A1A]/20 mt-2">
            {brandName}
          </span>
        </div>

        {/* Torn edge at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)',
          }}
        />
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // NORMAL STATE
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full overflow-visible">
      <motion.div
        className="relative w-full h-full cursor-pointer overflow-hidden"
        onClick={handleClick}
        whileHover={{ scale: isTearing ? 1 : 1.01 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Full-bleed image */}
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

        {/* Chapter marker - large, low-opacity serif in center */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Chapter number */}
          <span className="font-mono text-[10px] tracking-[0.5em] text-white/40 uppercase mb-4">
            Chapter {chapterNumber}
          </span>

          {/* Brand name - large, translucent */}
          <h2
            className="font-serif text-5xl sm:text-6xl md:text-7xl text-white/20 text-center px-8 leading-tight tracking-wide"
            style={{
              textShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            {brandName}
          </h2>

          {/* Decorative line */}
          <motion.div
            className="mt-6 w-16 h-px bg-white/20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        </motion.div>

        {/* Double-tap hint */}
        {!localTorn && (
          <motion.div
            className="absolute top-6 right-6 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="font-mono text-[7px] tracking-wider text-white/40 bg-black/20 backdrop-blur-sm px-2 py-1">
              Double-tap to collect
            </span>
          </motion.div>
        )}

        {/* Museum-style placard - bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="bg-black/20 backdrop-blur-sm px-3 py-2">
            <span className="font-mono text-[7px] tracking-[0.15em] text-white/70 uppercase">
              House: {brandName} // Ref. {product.id.toString().slice(-4)}
            </span>
          </div>

          {/* Page indicator */}
          <span className="font-mono text-[8px] tracking-wider text-white/40">
            Full Bleed
          </span>
        </div>
      </motion.div>

      {/* Falling torn piece */}
      <AnimatePresence>
        {showTornPiece && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: 1000,
              rotate: 15,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.3,
              ease: [0.32, 0, 0.67, 0],
            }}
            style={{
              clipPath: TORN_PIECE_CLIP,
              transformOrigin: 'top center',
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
