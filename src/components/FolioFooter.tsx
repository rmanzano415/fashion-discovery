'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface FolioFooterProps {
  issueTitle?: string;
  issueYear?: string;
  currentPage: number;
  totalPages: number;
  subscriberInitials?: string;
  favoritesCount: number;
  onOpenSettings: () => void;
}

// ═══════════════════════════════════════════════════════════════
// MONOGRAM BUTTON
// ═══════════════════════════════════════════════════════════════

function MonogramButton({
  initials,
  onClick,
}: {
  initials: string;
  onClick: () => void;
}) {
  const displayInitials = initials || '?';

  return (
    <motion.button
      onClick={onClick}
      className="relative group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open subscriber settings"
    >
      {/* Monogram circle */}
      <div className="w-7 h-7 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center bg-[#FDFCFB] group-hover:border-[#1A1A1A]/40 transition-colors">
        <span className="font-serif text-[10px] text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors">
          {displayInitials}
        </span>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAV ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

function NavItem({
  href,
  isActive,
  label,
  icon,
  badge,
}: {
  href: string;
  isActive: boolean;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative p-2 rounded-md transition-colors ${
          isActive
            ? 'bg-[#1A1A1A] text-[#FDFCFB]'
            : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
        }`}
      >
        {icon}

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-[#1A1A1A] text-[#FDFCFB] text-[8px] font-medium rounded-full flex items-center justify-center px-1"
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </motion.div>
      <span
        className={`font-mono text-[7px] tracking-[0.15em] uppercase ${
          isActive ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/40'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function FolioFooter({
  issueTitle = 'SS26',
  issueYear = '2026',
  currentPage,
  totalPages,
  subscriberInitials,
  favoritesCount,
  onOpenSettings,
}: FolioFooterProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isFavorites = pathname === '/favorites';

  return (
    <motion.footer
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFCFB]"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Top border - very thin */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#1A1A1A]/10" />

      {/* Footer content */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Browse Navigation */}
        <div className="flex-1 flex justify-start">
          <NavItem
            href="/"
            isActive={isHome}
            label="Browse"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            }
          />
        </div>

        {/* Center: Issue info + Page indicator */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Issue title */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-[11px] text-[#1A1A1A]/60">
              {issueTitle}
            </span>
            <span className="font-mono text-[8px] tracking-wider text-[#1A1A1A]/30">
              {issueYear}
            </span>
          </div>

          {/* Page indicator */}
          {currentPage > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/50">
                {currentPage}
              </span>
              <span className="font-mono text-[7px] text-[#1A1A1A]/25">/</span>
              <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/30">
                {totalPages}
              </span>
            </div>
          )}
        </div>

        {/* Right: Archive + Monogram */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {/* Archive Navigation */}
          <NavItem
            href="/favorites"
            isActive={isFavorites}
            label="Archive"
            badge={favoritesCount}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill={isFavorites ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            }
          />

          {/* Divider */}
          <div className="w-px h-6 bg-[#1A1A1A]/10" />

          {/* Subscriber Monogram */}
          {subscriberInitials ? (
            <MonogramButton
              initials={subscriberInitials}
              onClick={onOpenSettings}
            />
          ) : (
            <motion.button
              onClick={onOpenSettings}
              className="font-mono text-[8px] tracking-[0.1em] text-[#1A1A1A]/40 uppercase hover:text-[#1A1A1A]/70 transition-colors px-2 py-1 border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Settings
            </motion.button>
          )}
        </div>
      </div>

      {/* Safe area padding for mobile */}
      <div className="h-safe-area-inset-bottom pb-1" />
    </motion.footer>
  );
}
