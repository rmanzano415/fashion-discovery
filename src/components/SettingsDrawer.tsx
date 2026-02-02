'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SubscriberProfile,
  Silhouette,
  Tempo,
  Aesthetic,
  Palette,
  Vibe,
  getInitials,
} from '@/hooks/useSubscriberProfile';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SubscriberProfile;
  onSave: (updates: Partial<SubscriberProfile>) => void;
  availableBrands: { id: string; name: string }[];
}

// ═══════════════════════════════════════════════════════════════
// AUDIO HELPER
// ═══════════════════════════════════════════════════════════════

function playStampSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    // Create a "thump" sound for the stamp
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      50,
      audioCtx.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.15
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Silent fail
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-4 h-px bg-[#1A1A1A]/20" />
        <span className="font-mono text-[8px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase">
          {title}
        </span>
        <div className="flex-1 h-px bg-[#1A1A1A]/10" />
      </div>
      {subtitle && (
        <p className="font-serif text-xs text-[#1A1A1A]/50 italic pl-7">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOGGLE BUTTON GROUP
// ═══════════════════════════════════════════════════════════════

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex border border-[#1A1A1A]/15 divide-x divide-[#1A1A1A]/15">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2.5 px-3 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 ${
            value === option.value
              ? 'bg-[#1A1A1A] text-[#FDFCFB]'
              : 'bg-transparent text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/5'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BRAND STAMP COMPONENT
// ═══════════════════════════════════════════════════════════════

function BrandStamp({
  brand,
  isFollowed,
  onToggle,
}: {
  brand: { id: string; name: string };
  isFollowed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      className={`relative px-3 py-2 border transition-all duration-300 ${
        isFollowed
          ? 'border-[#1A1A1A]/40 bg-[#1A1A1A]/5'
          : 'border-[#1A1A1A]/15 bg-transparent hover:border-[#1A1A1A]/30'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span
        className={`font-mono text-[9px] tracking-wider uppercase ${
          isFollowed ? 'text-[#1A1A1A]/80' : 'text-[#1A1A1A]/50'
        }`}
      >
        {brand.name}
      </span>

      {/* Followed indicator */}
      {isFollowed && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-[#1A1A1A] rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FDFCFB"
            strokeWidth="3"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION TOAST
// ═══════════════════════════════════════════════════════════════

function NotificationToast({
  isVisible,
  message,
}: {
  isVisible: boolean;
  message: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1A1A] text-[#FDFCFB] px-6 py-3 shadow-xl"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-3">
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <path d="M5 12l5 5L20 7" />
            </motion.svg>
            <span className="font-mono text-[10px] tracking-wider uppercase">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SettingsDrawer({
  isOpen,
  onClose,
  profile,
  onSave,
  availableBrands,
}: SettingsDrawerProps) {
  // Local form state
  const [name, setName] = useState(profile.subscriberName);
  const [contactMethod, setContactMethod] = useState(profile.contactMethod);
  const [contactValue, setContactValue] = useState(profile.contactValue);
  const [silhouette, setSilhouette] = useState(profile.silhouette);
  const [tempo, setTempo] = useState(profile.tempo);
  const [followedBrands, setFollowedBrands] = useState(profile.followedBrands);
  const [aesthetic, setAesthetic] = useState<Aesthetic | undefined>(profile.aesthetic);
  const [palette, setPalette] = useState<Palette | undefined>(profile.palette);
  const [vibe, setVibe] = useState<Vibe | undefined>(profile.vibe);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);

  // Sync local state when profile changes
  useEffect(() => {
    setName(profile.subscriberName);
    setContactMethod(profile.contactMethod);
    setContactValue(profile.contactValue);
    setSilhouette(profile.silhouette);
    setTempo(profile.tempo);
    setFollowedBrands(profile.followedBrands);
    setAesthetic(profile.aesthetic);
    setPalette(profile.palette);
    setVibe(profile.vibe);
  }, [profile]);

  const toggleBrand = useCallback((brandId: string) => {
    setFollowedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((b) => b !== brandId)
        : [...prev, brandId]
    );
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      subscriberName: name.trim(),
      contactMethod,
      contactValue: contactValue.trim(),
      silhouette,
      tempo,
      followedBrands,
      aesthetic,
      palette,
      vibe,
    });

    // Play stamp sound and show notification
    playStampSound();
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  }, [
    name,
    contactMethod,
    contactValue,
    silhouette,
    tempo,
    followedBrands,
    aesthetic,
    palette,
    vibe,
    onSave,
  ]);

  const initials = getInitials(name);
  const hasChanges =
    name !== profile.subscriberName ||
    contactMethod !== profile.contactMethod ||
    contactValue !== profile.contactValue ||
    silhouette !== profile.silhouette ||
    tempo !== profile.tempo ||
    JSON.stringify(followedBrands) !== JSON.stringify(profile.followedBrands) ||
    aesthetic !== profile.aesthetic ||
    palette !== profile.palette ||
    vibe !== profile.vibe;

  return (
    <>
      {/* Notification Toast */}
      <NotificationToast
        isVisible={showNotification}
        message="Changes Published"
      />

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/30 z-[49]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCFB] max-h-[85vh] overflow-hidden rounded-t-2xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-[#1A1A1A]/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-[#1A1A1A]/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">
                    Subscriber Settings
                  </h2>
                  <p className="font-serif text-xs text-[#1A1A1A]/50 italic mt-1">
                    The Editorial Office
                  </p>
                </div>

                {/* Monogram preview */}
                {initials && (
                  <div className="w-12 h-12 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center">
                    <span className="font-serif text-lg text-[#1A1A1A]/70">
                      {initials}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-6 py-5 space-y-6">
              {/* Section 1: The Mandate */}
              <section>
                <SectionHeader
                  title="The Mandate"
                  subtitle="Your editorial preferences"
                />

                <div className="space-y-4">
                  {/* Silhouette */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Silhouette
                    </label>
                    <ToggleGroup
                      options={[
                        { value: 'menswear' as Silhouette, label: 'Menswear' },
                        { value: 'womenswear' as Silhouette, label: 'Womenswear' },
                        { value: 'all' as Silhouette, label: 'All' },
                      ]}
                      value={silhouette}
                      onChange={setSilhouette}
                    />
                  </div>

                  {/* Tempo */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Dispatch Tempo
                    </label>
                    <ToggleGroup
                      options={[
                        { value: 'weekly' as Tempo, label: 'Weekly' },
                        { value: 'monthly' as Tempo, label: 'Monthly' },
                        { value: 'quarterly' as Tempo, label: 'Quarterly' },
                      ]}
                      value={tempo}
                      onChange={setTempo}
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: The Briefing */}
              <section>
                <SectionHeader
                  title="The Briefing"
                  subtitle="Your style profile"
                />

                <div className="space-y-4">
                  {/* Aesthetic */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Aesthetic
                    </label>
                    <ToggleGroup
                      options={[
                        { value: 'minimalist' as Aesthetic, label: 'Minimalist' },
                        { value: 'avant-garde' as Aesthetic, label: 'Avant-Garde' },
                        { value: 'street' as Aesthetic, label: 'Street' },
                        { value: 'heritage' as Aesthetic, label: 'Heritage' },
                      ]}
                      value={aesthetic ?? 'minimalist'}
                      onChange={setAesthetic}
                    />
                  </div>

                  {/* Palette */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Palette
                    </label>
                    <ToggleGroup
                      options={[
                        { value: 'earth' as Palette, label: 'Earth' },
                        { value: 'monolith' as Palette, label: 'Monolith' },
                        { value: 'primary' as Palette, label: 'Primary' },
                      ]}
                      value={palette ?? 'earth'}
                      onChange={setPalette}
                    />
                  </div>

                  {/* Vibe */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Vibe
                    </label>
                    <ToggleGroup
                      options={[
                        { value: 'understated' as Vibe, label: 'Understated' },
                        { value: 'bold' as Vibe, label: 'Bold' },
                        { value: 'eclectic' as Vibe, label: 'Eclectic' },
                        { value: 'refined' as Vibe, label: 'Refined' },
                      ]}
                      value={vibe ?? 'understated'}
                      onChange={setVibe}
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: The Directory */}
              <section>
                <SectionHeader
                  title="The Directory"
                  subtitle="Houses you follow"
                />

                <div className="flex flex-wrap gap-2">
                  {availableBrands.map((brand) => (
                    <BrandStamp
                      key={brand.id}
                      brand={brand}
                      isFollowed={followedBrands.includes(brand.id)}
                      onToggle={() => toggleBrand(brand.id)}
                    />
                  ))}
                </div>

                {followedBrands.length > 0 && (
                  <p className="font-mono text-[8px] text-[#1A1A1A]/40 mt-3">
                    Following {followedBrands.length} house
                    {followedBrands.length !== 1 ? 's' : ''}
                  </p>
                )}
              </section>

              {/* Section 3: Contact */}
              <section>
                <SectionHeader
                  title="The Registry"
                  subtitle="Your mailing details"
                />

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Subscriber Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A]/50 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 py-2 outline-none transition-colors"
                    />
                  </div>

                  {/* Contact Method */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      Dispatch Via
                    </label>
                    <ToggleGroup
                      options={[
                        { value: 'email' as const, label: 'Email' },
                        { value: 'phone' as const, label: 'Mobile' },
                      ]}
                      value={contactMethod}
                      onChange={(v) => {
                        setContactMethod(v);
                        setContactValue('');
                      }}
                    />
                  </div>

                  {/* Contact Value */}
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase block mb-2">
                      {contactMethod === 'email' ? 'Email Address' : 'Mobile Number'}
                    </label>
                    <input
                      type={contactMethod === 'email' ? 'email' : 'tel'}
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder={
                        contactMethod === 'email'
                          ? 'you@example.com'
                          : '+1 (555) 000-0000'
                      }
                      className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A]/50 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 py-2 outline-none transition-colors"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer with save button */}
            <div className="px-6 py-4 border-t border-[#1A1A1A]/10 bg-[#FDFCFB]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 font-mono text-[10px] tracking-[0.15em] uppercase border border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`flex-1 py-3 font-mono text-[10px] tracking-[0.15em] uppercase transition-all ${
                    hasChanges
                      ? 'bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90'
                      : 'bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed'
                  }`}
                  whileHover={hasChanges ? { scale: 1.01 } : {}}
                  whileTap={hasChanges ? { scale: 0.99 } : {}}
                >
                  {hasChanges ? 'Publish Changes' : 'No Changes'}
                </motion.button>
              </div>

              {/* Safe area padding */}
              <div className="h-safe-area-inset-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
