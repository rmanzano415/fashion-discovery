'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title?: string;
  issueTitle?: string;
  progress?: {
    current: number;
    total: number;
  };
  isCoverOpen?: boolean;
  onReset?: () => void;
}

export function Header({
  title,
  issueTitle = 'SS26 Collection',
  progress,
  isCoverOpen = true,
  onReset,
}: HeaderProps) {
  return (
    <header className="px-6 pt-10 pb-4 bg-[var(--archive-white)]">
      <div className="max-w-lg mx-auto">
        {/* Editorial masthead */}
        <div className="flex items-center justify-between mb-1">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-baseline gap-3"
          >
            {/* Issue title - small caps style */}
            <span className="issue-label">
              {issueTitle}
            </span>

            {/* Page indicator with Cover/Page transition */}
            {progress && (
              <>
                <span className="text-[var(--soft-gray)]">&mdash;</span>
                <AnimatePresence mode="wait">
                  {!isCoverOpen ? (
                    <motion.span
                      key="cover"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="page-number"
                    >
                      Cover
                    </motion.span>
                  ) : (
                    <motion.span
                      key="page"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="page-number"
                    >
                      Page {progress.current} of {progress.total}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>

          {/* Reset as subtle "restart" - only show after cover is open */}
          {onReset && isCoverOpen && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              whileHover={{ opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="issue-label hover:opacity-100 transition-opacity"
            >
              Restart
            </motion.button>
          )}
        </div>

        {/* Optional main title for non-discover pages */}
        {title && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-editorial text-2xl text-[var(--ink-black)] mt-2"
          >
            {title}
          </motion.h1>
        )}

        {/* Minimal progress line - shows cover as page 0 */}
        {progress && (
          <div className="mt-4">
            <div className="h-px bg-[var(--soft-gray)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--ink-black)]"
                initial={{ width: 0 }}
                animate={{
                  width: isCoverOpen
                    ? `${(progress.current / progress.total) * 100}%`
                    : '0%'
                }}
                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
