'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegistryScreenProps {
  initialName?: string;
  initialContactMethod?: 'email' | 'phone';
  initialContactValue?: string;
  onComplete: (data: {
    subscriberName: string;
    contactMethod: 'email' | 'phone';
    contactValue: string;
  }) => void;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// ═══════════════════════════════════════════════════════════════
// MONOGRAM CREST COMPONENT
// ═══════════════════════════════════════════════════════════════

function MonogramCrest({ initials }: { initials: string }) {
  return (
    <motion.div
      className="relative w-20 h-20"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
    >
      {/* Outer ring */}
      <svg
        viewBox="0 0 80 80"
        fill="none"
        className="absolute inset-0 w-full h-full"
      >
        {/* Decorative outer border */}
        <circle
          cx="40"
          cy="40"
          r="38"
          stroke="#1A1A1A"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          stroke="#1A1A1A"
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="2 3"
        />
        <circle
          cx="40"
          cy="40"
          r="30"
          stroke="#1A1A1A"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />

        {/* Corner flourishes */}
        <path
          d="M40 5 L42 10 L40 8 L38 10 Z"
          fill="#1A1A1A"
          fillOpacity="0.15"
        />
        <path
          d="M40 75 L42 70 L40 72 L38 70 Z"
          fill="#1A1A1A"
          fillOpacity="0.15"
        />
        <path
          d="M5 40 L10 42 L8 40 L10 38 Z"
          fill="#1A1A1A"
          fillOpacity="0.15"
        />
        <path
          d="M75 40 L70 42 L72 40 L70 38 Z"
          fill="#1A1A1A"
          fillOpacity="0.15"
        />
      </svg>

      {/* Initials */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={initials}
            className="font-serif text-2xl text-[#1A1A1A]/70 tracking-wider"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {initials || '?'}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL SEAL COMPONENT
// ═══════════════════════════════════════════════════════════════

function ApprovalSeal({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute -bottom-2 -right-2"
          initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: -12 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          <div className="relative">
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              className="text-[#1A1A1A]"
            >
              {/* Starburst background */}
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="30"
                  y1="30"
                  x2={30 + 28 * Math.cos((i * 30 * Math.PI) / 180)}
                  y2={30 + 28 * Math.sin((i * 30 * Math.PI) / 180)}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeOpacity="0.1"
                />
              ))}

              {/* Outer dashed circle */}
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity="0.25"
                strokeDasharray="4 2"
              />

              {/* Inner circle */}
              <circle
                cx="30"
                cy="30"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.2"
              />

              {/* Center fill */}
              <circle cx="30" cy="30" r="18" fill="#1A1A1A" fillOpacity="0.05" />
            </svg>

            {/* Checkmark */}
            <motion.svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1A1A1A]/50"
            >
              <motion.path
                d="M5 12l5 5L20 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              />
            </motion.svg>

            {/* "APPROVED" text */}
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[6px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase whitespace-nowrap">
              Approved
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

export function RegistryScreen({
  initialName = '',
  initialContactMethod = 'email',
  initialContactValue = '',
  onComplete,
  onBack,
}: RegistryScreenProps) {
  const [name, setName] = useState(initialName);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>(
    initialContactMethod
  );
  const [contactValue, setContactValue] = useState(initialContactValue);
  const [isFocused, setIsFocused] = useState<'name' | 'contact' | null>(null);

  // Computed values
  const initials = useMemo(() => getInitials(name), [name]);

  const isNameValid = name.trim().length >= 2;
  const isContactValid =
    contactMethod === 'email'
      ? validateEmail(contactValue)
      : validatePhone(contactValue);
  const isFormValid = isNameValid && isContactValid;

  const handleSubmit = () => {
    if (isFormValid) {
      onComplete({
        subscriberName: name.trim(),
        contactMethod,
        contactValue: contactValue.trim(),
      });
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span className="font-mono text-[9px] tracking-wider uppercase">
          Back
        </span>
      </motion.button>

      {/* The Mailing Label Card */}
      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {/* Card container - Mailing label aesthetic */}
        <div className="relative bg-[#FDFCFB] border border-[#1A1A1A]/15 shadow-xl">
          {/* Perforated edge effect - top */}
          <div className="absolute -top-px left-4 right-4 h-px bg-[#FDFCFB]">
            <div className="absolute inset-0 flex justify-between">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#1A1A1A]/10 -translate-y-1/2"
                />
              ))}
            </div>
          </div>

          {/* Header section */}
          <div className="border-b border-[#1A1A1A]/10 px-6 pt-8 pb-6">
            {/* Monogram Crest */}
            <div className="flex justify-center mb-4">
              <MonogramCrest initials={initials} />
            </div>

            <div className="text-center">
              <span className="font-mono text-[8px] tracking-[0.4em] text-[#1A1A1A]/40 uppercase">
                Official Document
              </span>
              <h2 className="font-serif text-2xl mt-2">
                The Subscriber Registry
              </h2>
              <p className="font-serif text-xs text-[#1A1A1A]/50 italic mt-2">
                Finalize your mailing details for dispatch.
              </p>
            </div>
          </div>

          {/* Form section */}
          <div className="px-6 py-6 space-y-6">
            {/* Subscriber Name Field */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block">
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
                  Subscriber Name
                </span>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsFocused('name')}
                    onBlur={() => setIsFocused(null)}
                    placeholder="Your full name"
                    className="w-full bg-transparent border-b-2 border-[#1A1A1A]/20 focus:border-[#1A1A1A]/50 font-mono text-base text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 py-2 outline-none transition-colors tracking-wide"
                    autoComplete="name"
                  />
                  {/* Typewriter cursor when focused */}
                  {isFocused === 'name' && (
                    <motion.span
                      className="absolute right-0 bottom-2 w-px h-5 bg-[#1A1A1A]/60"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                </div>
                {/* Validation indicator */}
                {name && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`font-mono text-[8px] mt-1 block ${
                      isNameValid ? 'text-[#1A1A1A]/40' : 'text-[#1A1A1A]/30'
                    }`}
                  >
                    {isNameValid ? 'Name recorded' : 'Please enter your full name'}
                  </motion.span>
                )}
              </label>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#1A1A1A]/10" />
              <span className="font-mono text-[7px] tracking-[0.3em] text-[#1A1A1A]/30 uppercase">
                Dispatch Method
              </span>
              <div className="flex-1 h-px bg-[#1A1A1A]/10" />
            </div>

            {/* Contact Method Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase block mb-3">
                Dispatch Via
              </span>
              <div className="flex border border-[#1A1A1A]/15 divide-x divide-[#1A1A1A]/15">
                <button
                  onClick={() => {
                    setContactMethod('email');
                    setContactValue('');
                  }}
                  className={`flex-1 py-3 px-4 font-mono text-xs tracking-wider uppercase transition-all duration-300 ${
                    contactMethod === 'email'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'bg-transparent text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/5'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                    Email
                  </span>
                </button>
                <button
                  onClick={() => {
                    setContactMethod('phone');
                    setContactValue('');
                  }}
                  className={`flex-1 py-3 px-4 font-mono text-xs tracking-wider uppercase transition-all duration-300 ${
                    contactMethod === 'phone'
                      ? 'bg-[#1A1A1A] text-[#FDFCFB]'
                      : 'bg-transparent text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/5'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                    </svg>
                    Mobile
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Contact Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block">
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase">
                  {contactMethod === 'email' ? 'Email Address' : 'Mobile Number'}
                </span>
                <div className="relative mt-2">
                  <AnimatePresence mode="wait">
                    <motion.input
                      key={contactMethod}
                      type={contactMethod === 'email' ? 'email' : 'tel'}
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      onFocus={() => setIsFocused('contact')}
                      onBlur={() => setIsFocused(null)}
                      placeholder={
                        contactMethod === 'email'
                          ? 'you@example.com'
                          : '+1 (555) 000-0000'
                      }
                      className="w-full bg-transparent border-b-2 border-[#1A1A1A]/20 focus:border-[#1A1A1A]/50 font-mono text-base text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 py-2 outline-none transition-colors tracking-wide"
                      autoComplete={contactMethod === 'email' ? 'email' : 'tel'}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    />
                  </AnimatePresence>
                  {/* Typewriter cursor when focused */}
                  {isFocused === 'contact' && (
                    <motion.span
                      className="absolute right-0 bottom-2 w-px h-5 bg-[#1A1A1A]/60"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                </div>
                {/* Validation indicator */}
                {contactValue && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`font-mono text-[8px] mt-1 block ${
                      isContactValid ? 'text-[#1A1A1A]/40' : 'text-[#1A1A1A]/30'
                    }`}
                  >
                    {isContactValid
                      ? `${contactMethod === 'email' ? 'Email' : 'Mobile'} verified`
                      : `Please enter a valid ${contactMethod === 'email' ? 'email address' : 'phone number'}`}
                  </motion.span>
                )}
              </label>
            </motion.div>
          </div>

          {/* Footer / CTA */}
          <div className="border-t border-[#1A1A1A]/10 px-6 py-5">
            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full py-4 font-mono text-xs tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                isFormValid
                  ? 'bg-[#1A1A1A] text-[#FDFCFB] hover:bg-[#1A1A1A]/90'
                  : 'bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed'
              }`}
              whileHover={isFormValid ? { scale: 1.01 } : {}}
              whileTap={isFormValid ? { scale: 0.99 } : {}}
            >
              <span>Authorize Dispatch</span>
              {isFormValid && (
                <motion.svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  initial={{ x: -5, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </motion.svg>
              )}
            </motion.button>
          </div>

          {/* Approval Seal */}
          <ApprovalSeal isVisible={isFormValid} />

          {/* Registration number */}
          <div className="absolute bottom-2 left-6">
            <span className="font-mono text-[7px] tracking-wider text-[#1A1A1A]/20">
              REG-{Date.now().toString(36).toUpperCase().slice(-6)}
            </span>
          </div>
        </div>

        {/* Decorative postal marks */}
        <div className="absolute -top-3 -right-3 rotate-12">
          <div className="w-12 h-12 border-2 border-dashed border-[#1A1A1A]/10 rounded-full flex items-center justify-center">
            <span className="font-mono text-[6px] text-[#1A1A1A]/20 text-center leading-tight">
              FIRST
              <br />
              CLASS
            </span>
          </div>
        </div>
      </motion.div>

      {/* Bottom decorative element */}
      <motion.div
        className="mt-8 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="w-6 h-px bg-[#1A1A1A]/10" />
        <span className="font-mono text-[7px] tracking-[0.3em] text-[#1A1A1A]/25 uppercase">
          Your Privacy is Paramount
        </span>
        <div className="w-6 h-px bg-[#1A1A1A]/10" />
      </motion.div>
    </motion.div>
  );
}
