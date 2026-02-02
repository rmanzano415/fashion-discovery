'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavigationProps {
  favoritesCount: number;
}

export function Navigation({ favoritesCount }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--archive-white)] border-t border-[var(--soft-gray)] px-6 py-4 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {/* Browse / Zine */}
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2.5 rounded-lg transition-colors ${
              pathname === '/'
                ? 'bg-[var(--ink-black)] text-[var(--archive-white)]'
                : 'text-[var(--muted-text)] hover:text-[var(--ink-black)]'
            }`}
          >
            {/* Book/Zine icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </motion.div>
          <span className={`issue-label ${pathname === '/' ? 'text-[var(--ink-black)]' : ''}`}>
            Browse
          </span>
        </Link>

        {/* Archive / Bookmarks */}
        <Link href="/favorites" className="flex flex-col items-center gap-1.5 relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2.5 rounded-lg transition-colors ${
              pathname === '/favorites'
                ? 'bg-[var(--ink-black)] text-[var(--archive-white)]'
                : 'text-[var(--muted-text)] hover:text-[var(--ink-black)]'
            }`}
          >
            {/* Bookmark icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={pathname === '/favorites' ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
            {/* Subtle count indicator */}
            {favoritesCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--accent-warm)] text-white text-[9px] font-medium rounded-full flex items-center justify-center"
              >
                {favoritesCount > 99 ? '+' : favoritesCount}
              </motion.span>
            )}
          </motion.div>
          <span className={`issue-label ${pathname === '/favorites' ? 'text-[var(--ink-black)]' : ''}`}>
            Archive
          </span>
        </Link>
      </div>
    </nav>
  );
}
