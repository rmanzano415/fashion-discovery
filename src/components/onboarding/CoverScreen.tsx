'use client';

import { motion } from 'framer-motion';

interface CoverScreenProps {
  onBegin: () => void;
}

export function CoverScreen({ onBegin }: CoverScreenProps) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Decorative top line */}
      <motion.div
        className="w-px h-16 bg-[#1A1A1A]/20 mb-8"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      />

      {/* Edition marker */}
      <motion.span
        className="font-mono text-[10px] tracking-[0.4em] text-[#1A1A1A]/50 uppercase mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Est. 2026
      </motion.span>

      {/* Main Headline */}
      <motion.h1
        className="font-serif text-4xl sm:text-5xl md:text-6xl text-center leading-[1.1] tracking-tight mb-4 max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        The Archive:
        <br />
        <span className="italic">Your Personal Edition</span>
      </motion.h1>

      {/* Decorative divider */}
      <motion.div
        className="w-12 h-px bg-[#1A1A1A]/30 my-8"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />

      {/* The Manifesto - 3 lines */}
      <motion.div
        className="max-w-sm text-center mb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <p className="font-serif text-base leading-relaxed text-[#1A1A1A]/70">
          A curated discovery engine tailored to your aesthetic.
          <br />
          We collect the latest from the houses you love
          <br />
          and bind them into a monthly digital volume.
        </p>
      </motion.div>

      {/* CTA Button with physical press animation */}
      <motion.button
        onClick={onBegin}
        className="group relative px-10 py-4 bg-[#1A1A1A] text-[#FDFCFB] font-mono text-xs tracking-[0.2em] uppercase overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 4px 20px rgba(26, 26, 26, 0.2)',
        }}
        whileTap={{
          scale: 0.96,
          boxShadow: '0 0px 5px rgba(26, 26, 26, 0.1)',
        }}
      >
        {/* Button press effect overlay */}
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          whileTap={{ opacity: 0.1 }}
          transition={{ duration: 0.1 }}
        />

        {/* Ink spread effect on hover */}
        <motion.div
          className="absolute inset-0 bg-[#FDFCFB]/5"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 2, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ borderRadius: '50%', transformOrigin: 'center' }}
        />

        <span className="relative z-10">Begin Curation</span>
      </motion.button>

      {/* Footer note */}
      <motion.p
        className="font-mono text-[9px] text-[#1A1A1A]/30 mt-8 tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        2 minutes to configure · Unlimited editions
      </motion.p>

      {/* Decorative bottom line */}
      <motion.div
        className="w-px h-16 bg-[#1A1A1A]/20 mt-8"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      />
    </motion.div>
  );
}
