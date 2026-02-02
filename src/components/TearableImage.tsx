'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/types/product';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface TearableImageProps {
  product: Product;
  onSelect: (product: Product) => void;
  className?: string;
  sizes?: string;
  isTorn?: boolean;
  onTear?: (productId: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// TORN STATE PERSISTENCE
// ═══════════════════════════════════════════════════════════════

const TORN_STORAGE_KEY = 'zine-torn-items';

export function getTornItems(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(TORN_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function addTornItem(productId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const items = getTornItems();
    items.add(productId);
    localStorage.setItem(TORN_STORAGE_KEY, JSON.stringify([...items]));
  } catch {
    // Silent fail
  }
}

export function isTornItem(productId: string): boolean {
  return getTornItems().has(productId);
}

export function clearTornItems(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TORN_STORAGE_KEY);
  } catch {
    // Silent fail
  }
}

// ═══════════════════════════════════════════════════════════════
// JAGGED TEAR CLIP PATHS
// ═══════════════════════════════════════════════════════════════

// Jagged top edge for the torn piece that falls
const TORN_PIECE_CLIP = `polygon(
  0% 8%,
  5% 3%,
  12% 7%,
  18% 2%,
  25% 6%,
  32% 1%,
  40% 5%,
  48% 0%,
  55% 4%,
  62% 1%,
  70% 6%,
  78% 2%,
  85% 5%,
  92% 1%,
  100% 4%,
  100% 100%,
  0% 100%
)`;

// Matching jagged bottom edge for the stub that remains
const STUB_CLIP = `polygon(
  0% 0%,
  100% 0%,
  100% 92%,
  92% 99%,
  85% 95%,
  78% 98%,
  70% 94%,
  62% 99%,
  55% 96%,
  48% 100%,
  40% 95%,
  32% 99%,
  25% 94%,
  18% 98%,
  12% 93%,
  5% 97%,
  0% 92%
)`;

// ═══════════════════════════════════════════════════════════════
// AUDIO HELPER
// ═══════════════════════════════════════════════════════════════

function playTearSound() {
  if (typeof window === 'undefined') return;

  try {
    // Create paper tear sound using Web Audio API
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create noise buffer for paper tear
    const bufferSize = audioCtx.sampleRate * 0.15; // 150ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise that sounds like paper
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Sharp attack, quick decay envelope
      const envelope = Math.exp(-t * 20) * (1 - Math.exp(-t * 200));
      // Filtered noise
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Add filter for paper-like quality
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const filter2 = audioCtx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 4000;

    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(audioCtx.destination);

    source.start();
  } catch {
    // Silent fail if audio not supported
  }
}

// ═══════════════════════════════════════════════════════════════
// HAPTIC HELPER
// ═══════════════════════════════════════════════════════════════

function triggerHaptic() {
  if (typeof window === 'undefined') return;

  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  } catch {
    // Silent fail
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function TearableImage({
  product,
  onSelect,
  className = '',
  sizes = '40vw',
  isTorn: isTornProp,
  onTear,
}: TearableImageProps) {
  const [localTorn, setLocalTorn] = useState(false);
  const [isTearing, setIsTearing] = useState(false);
  const [showTornPiece, setShowTornPiece] = useState(false);
  const lastClickTime = useRef(0);
  const clickCount = useRef(0);

  // Check localStorage on mount
  useEffect(() => {
    if (isTornProp === undefined) {
      setLocalTorn(isTornItem(product.id));
    }
  }, [product.id, isTornProp]);

  const torn = isTornProp ?? localTorn;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime.current;

      // Double-click detection (within 300ms)
      if (timeSinceLastClick < 300) {
        clickCount.current++;
        if (clickCount.current >= 2 && !torn && !isTearing) {
          // Trigger tear!
          e.stopPropagation();
          setIsTearing(true);
          setShowTornPiece(true);

          // Haptic & audio feedback
          triggerHaptic();
          playTearSound();

          // After tear animation starts, mark as torn
          setTimeout(() => {
            setLocalTorn(true);
            addTornItem(product.id);
            onTear?.(product.id);
          }, 100);

          // Hide the falling piece after it falls
          setTimeout(() => {
            setShowTornPiece(false);
            setIsTearing(false);
          }, 1200);

          clickCount.current = 0;
          return;
        }
      } else {
        clickCount.current = 1;
      }

      lastClickTime.current = now;

      // Single click - select product (with delay to check for double)
      setTimeout(() => {
        if (clickCount.current === 1) {
          onSelect(product);
        }
      }, 300);
    },
    [product, onSelect, torn, isTearing, onTear]
  );

  const imageUrl = product.images[0] || '/placeholder.jpg';

  // ─────────────────────────────────────────────────────────────
  // TORN STATE - Show paper stub
  // ─────────────────────────────────────────────────────────────

  if (torn && !isTearing) {
    return (
      <div
        className={`relative cursor-pointer overflow-hidden ${className}`}
        onClick={() => onSelect(product)}
      >
        {/* Paper stub background */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#F5F3F0] to-[#EBE8E4]"
          style={{ clipPath: STUB_CLIP }}
        />

        {/* Torn edge texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            clipPath: STUB_CLIP,
            background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          }}
        />

        {/* "Collected" indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="mb-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                className="w-8 h-8 text-[#1A1A1A]/20 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </motion.div>
            <span className="font-mono text-[7px] tracking-[0.15em] text-[#1A1A1A]/30 uppercase">
              Collected
            </span>
          </div>
        </div>

        {/* Subtle shadow on torn edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.05), transparent)',
          }}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // NORMAL STATE - Tearable image
  // ─────────────────────────────────────────────────────────────

  return (
    <div className={`relative overflow-visible ${className}`}>
      {/* Main image */}
      <motion.div
        className="relative w-full h-full cursor-pointer overflow-hidden bg-[#F5F3F0]"
        onClick={handleClick}
        whileHover={{ scale: isTearing ? 1 : 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes={sizes}
          draggable={false}
          priority
        />

        {/* Double-tap hint on hover */}
        {!torn && (
          <motion.div
            className="absolute bottom-2 right-2 pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <span className="font-mono text-[6px] tracking-wider text-white/60 bg-black/30 px-2 py-1 rounded-sm">
              Double-tap to collect
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Falling torn piece */}
      <AnimatePresence>
        {showTornPiece && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none overflow-visible"
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: 1000,
              rotate: 15,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.1,
              ease: [0.32, 0, 0.67, 0],
              // Heavy paper physics
              type: 'tween',
            }}
            style={{
              clipPath: TORN_PIECE_CLIP,
              transformOrigin: 'top center',
            }}
          >
            <div className="relative w-full h-full bg-[#F5F3F0]">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes={sizes}
              />
            </div>

            {/* Shadow on the torn piece */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
