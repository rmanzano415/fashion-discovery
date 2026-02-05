'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurationStatus } from '@/lib/curationGate';

interface EditorialDeskProps {
  curationStatus: CurationStatus;
  onNotifyMe: () => void;
}

export function EditorialDesk({ curationStatus, onNotifyMe }: EditorialDeskProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseAndNotify = () => {
    setIsClosing(true);
    // Wait for animation then trigger callback
    setTimeout(() => {
      onNotifyMe();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center px-6 py-12">
      <AnimatePresence>
        {!isClosing ? (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              rotateX: -90,
              y: -100,
              opacity: 0,
            }}
            transition={{
              duration: 0.6,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{
              transformOrigin: 'top center',
              perspective: 1000,
            }}
          >
            {/* Header */}
            <div className="text-center mb-10">
              <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
                Editorial Review
              </span>
              <h1 className="font-serif text-2xl mt-4 text-[#1A1A1A]">
                Your Edition is Under Selection
              </h1>
              <p className="font-serif text-sm text-[#1A1A1A]/50 italic mt-2">
                Our editors are curating the perfect pieces for your profile.
              </p>
            </div>

            {/* Brand status list */}
            <div className="space-y-4">
              {curationStatus.brandStatuses.map((brand, index) => (
                <motion.div
                  key={brand.slug}
                  className="border-t border-[#1A1A1A]/10 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[#1A1A1A]">{brand.name}</h3>
                    <StatusBadge status={brand.status} />
                  </div>
                  <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40 mt-1">
                    {brand.message}
                  </p>
                </motion.div>
              ))}

              {curationStatus.brandStatuses.length === 0 && (
                <div className="border-t border-[#1A1A1A]/10 pt-4 text-center">
                  <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40">
                    Processing your brand selections...
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-8 h-px bg-[#1A1A1A]/10" />

            {/* Estimated time */}
            {curationStatus.estimatedWaitSeconds && (
              <div className="text-center mb-6">
                <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/30">
                  Estimated wait:{' '}
                  {Math.ceil(curationStatus.estimatedWaitSeconds / 60)} minutes
                </span>
              </div>
            )}

            {/* CTA Button */}
            <motion.button
              onClick={handleCloseAndNotify}
              className="w-full py-4 bg-[#1A1A1A] text-[#FDFCFB] font-mono text-xs tracking-[0.15em] uppercase transition-colors hover:bg-[#1A1A1A]/90"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Close & Notify Me
            </motion.button>

            {/* Privacy note */}
            <div className="mt-6 text-center">
              <span className="font-mono text-[7px] tracking-[0.2em] text-[#1A1A1A]/25 uppercase">
                We&apos;ll notify you when your edition is ready
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════

function StatusBadge({
  status,
}: {
  status: 'ready' | 'scraping' | 'pending' | 'insufficient_products';
}) {
  const config = {
    ready: {
      label: 'Ready',
      bgClass: 'bg-[#1A1A1A]/10',
      textClass: 'text-[#1A1A1A]/60',
    },
    scraping: {
      label: 'Gathering',
      bgClass: 'bg-[#C4A77D]/20',
      textClass: 'text-[#C4A77D]',
    },
    pending: {
      label: 'Pending',
      bgClass: 'bg-[#1A1A1A]/5',
      textClass: 'text-[#1A1A1A]/40',
    },
    insufficient_products: {
      label: 'Limited',
      bgClass: 'bg-[#1A1A1A]/5',
      textClass: 'text-[#1A1A1A]/40',
    },
  };

  const { label, bgClass, textClass } = config[status];

  return (
    <span
      className={`px-2 py-1 font-mono text-[8px] tracking-wider uppercase ${bgClass} ${textClass}`}
    >
      {label}
    </span>
  );
}
