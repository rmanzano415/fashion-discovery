'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ArchiveUploadProps {
  initialImages: string[];
  onComplete: (images: string[]) => void;
  onBack: () => void;
}

const MAX_IMAGES = 5;

// Scrapbook layout transforms for each image position
const SCRAPBOOK_TRANSFORMS = [
  { rotate: -3, x: 0, y: 0, scale: 1, zIndex: 5 },
  { rotate: 2, x: 10, y: -5, scale: 0.95, zIndex: 4 },
  { rotate: -5, x: -8, y: 8, scale: 0.92, zIndex: 3 },
  { rotate: 4, x: 5, y: -3, scale: 0.9, zIndex: 2 },
  { rotate: -2, x: -5, y: 5, scale: 0.88, zIndex: 1 },
];

// Washi tape colors (muted, archival feel)
const WASHI_COLORS = [
  'bg-[#D4C5B0]/60',
  'bg-[#C8B8A2]/50',
  'bg-[#B8A892]/55',
  'bg-[#DDD5C8]/65',
  'bg-[#C5BEB0]/50',
];

// Washi tape rotation for each position
const WASHI_ROTATIONS = [-8, 5, -3, 7, -6];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ArchiveUpload({
  initialImages,
  onComplete,
  onBack,
}: ArchiveUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = images.length < MAX_IMAGES;

  // ─────────────────────────────────────────────────────────────
  // FILE HANDLING
  // ─────────────────────────────────────────────────────────────

  const processFile = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Not an image file'));
          return;
        }

        // Cap at 2MB for base64 storage
        if (file.size > 2 * 1024 * 1024) {
          reject(new Error('File too large'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      });
    },
    []
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_IMAGES - images.length;
      const toProcess = fileArray.slice(0, remaining);

      if (toProcess.length === 0) return;

      setIsProcessing(true);

      const results: string[] = [];
      for (const file of toProcess) {
        try {
          const dataUri = await processFile(file);
          results.push(dataUri);
        } catch {
          // Skip invalid files silently
        }
      }

      if (results.length > 0) {
        setImages((prev) => [...prev, ...results]);
      }

      setIsProcessing(false);
    },
    [images.length, processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [addFiles]
  );

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleProceed = useCallback(() => {
    onComplete(images);
  }, [images, onComplete]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="min-h-screen flex flex-col px-6 py-8"
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Back button */}
      <motion.button
        onClick={onBack}
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

      {/* Header */}
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
          Chapter IV
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl mt-2 mb-3">
          The Archive
        </h2>
        <p className="font-serif text-sm text-[#1A1A1A]/60 italic max-w-xs mx-auto">
          Upload inspiration to shape your first edition.
          We&apos;ll compose your issue around these references.
        </p>
      </motion.header>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Drop Zone / Envelope */}
        {canAddMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-[#1A1A1A]/50 bg-[#1A1A1A]/[0.03] scale-[1.01]'
                  : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 hover:bg-[#1A1A1A]/[0.01]'
              }`}
            >
              {/* Envelope flap triangle */}
              <div className="absolute top-0 left-0 right-0 h-12 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(26,26,26,0.03), transparent)',
                  }}
                />
                <svg
                  viewBox="0 0 400 48"
                  className="w-full h-12 text-[#1A1A1A]/[0.06]"
                  preserveAspectRatio="none"
                >
                  <polygon points="0,0 200,48 400,0" fill="currentColor" />
                </svg>
              </div>

              {/* Envelope body */}
              <div className="pt-16 pb-10 px-6 flex flex-col items-center">
                {/* Folder icon */}
                <motion.svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-[#1A1A1A]/30 mb-4"
                  animate={isDragOver ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <path
                    d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {canAddMore && (
                    <>
                      <line x1="12" y1="11" x2="12" y2="17" strokeLinecap="round" />
                      <line x1="9" y1="14" x2="15" y2="14" strokeLinecap="round" />
                    </>
                  )}
                </motion.svg>

                <span className="font-serif text-sm text-[#1A1A1A]/60 mb-1">
                  {isDragOver ? 'Release to add' : 'Drop images here'}
                </span>
                <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/30">
                  or tap to browse &middot; {images.length}/{MAX_IMAGES} SLOTS FILLED
                </span>

                {isProcessing && (
                  <motion.div
                    className="mt-3 font-mono text-[9px] tracking-wider text-[#1A1A1A]/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Processing...
                  </motion.div>
                )}
              </div>

              {/* Corner marks */}
              <div className="absolute top-14 left-3 w-3 h-px bg-[#1A1A1A]/10" />
              <div className="absolute top-14 left-3 w-px h-3 bg-[#1A1A1A]/10" />
              <div className="absolute top-14 right-3 w-3 h-px bg-[#1A1A1A]/10" />
              <div className="absolute top-14 right-3 w-px h-3 bg-[#1A1A1A]/10" style={{ marginLeft: 'auto' }} />
              <div className="absolute bottom-3 left-3 w-3 h-px bg-[#1A1A1A]/10" />
              <div className="absolute bottom-3 left-3 w-px h-3 bg-[#1A1A1A]/10" style={{ marginTop: '-12px' }} />
              <div className="absolute bottom-3 right-3 w-3 h-px bg-[#1A1A1A]/10" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </motion.div>
        )}

        {/* Scrapbook Display */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-[#1A1A1A]/10" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
                  Your Inspiration Board
                </span>
                <div className="flex-1 h-px bg-[#1A1A1A]/10" />
              </div>

              {/* Asymmetric scrapbook grid */}
              <div className="relative min-h-[280px]">
                {images.map((src, index) => {
                  const transform = SCRAPBOOK_TRANSFORMS[index] ?? SCRAPBOOK_TRANSFORMS[0];
                  const washiColor = WASHI_COLORS[index % WASHI_COLORS.length];
                  const washiRotation = WASHI_ROTATIONS[index % WASHI_ROTATIONS.length];

                  // Asymmetric positions based on index
                  const positions = [
                    { top: '0%', left: '5%', width: '52%' },
                    { top: '2%', left: '50%', width: '48%' },
                    { top: '45%', left: '0%', width: '45%' },
                    { top: '48%', left: '40%', width: '42%' },
                    { top: '35%', left: '55%', width: '40%' },
                  ];
                  const pos = positions[index] ?? positions[0];

                  return (
                    <motion.div
                      key={index}
                      className="absolute group"
                      style={{
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                        zIndex: transform.zIndex,
                      }}
                      initial={{
                        opacity: 0,
                        scale: 0.7,
                        rotate: transform.rotate * 2,
                        y: 40,
                      }}
                      animate={{
                        opacity: 1,
                        scale: transform.scale,
                        rotate: transform.rotate,
                        x: transform.x,
                        y: transform.y,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.5,
                        y: 20,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                        delay: index * 0.08,
                      }}
                    >
                      {/* Washi tape strip */}
                      <div
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 ${washiColor} z-10`}
                        style={{
                          transform: `translateX(-50%) rotate(${washiRotation}deg)`,
                          opacity: 0.7,
                        }}
                      />

                      {/* Image with shadow */}
                      <div className="relative border border-[#1A1A1A]/10 bg-[#FDFCFB] p-1 shadow-md">
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F3F0]">
                          <Image
                            src={src}
                            alt={`Inspiration ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="200px"
                            unoptimized
                          />
                        </div>

                        {/* Remove button */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FDFCFB] border border-[#1A1A1A]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 8 8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-[#1A1A1A]/50"
                          >
                            <line x1="1" y1="1" x2="7" y2="7" />
                            <line x1="7" y1="1" x2="1" y2="7" />
                          </svg>
                        </motion.button>

                        {/* Photo number */}
                        <span className="absolute bottom-2 right-2 font-mono text-[7px] tracking-wider text-[#1A1A1A]/30">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.footer
        className="mt-8 pt-6 border-t border-[#1A1A1A]/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex justify-center">
          <motion.button
            onClick={handleProceed}
            className="px-10 py-4 font-mono text-xs tracking-[0.15em] uppercase transition-all duration-300 bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {images.length > 0 ? 'Proceed to Directory' : 'Skip for Now'}
          </motion.button>
        </div>

        <p className="font-mono text-[8px] tracking-wider text-[#1A1A1A]/30 text-center mt-4">
          {images.length > 0
            ? `${images.length} image${images.length !== 1 ? 's' : ''} will inform your first edition`
            : 'You can always add inspiration later'}
        </p>
      </motion.footer>
    </motion.div>
  );
}
