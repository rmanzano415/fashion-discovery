'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { EditorialDesk } from '@/components/EditorialDesk';
import { CurationStatus } from '@/lib/curationGate';

export default function EditorialDeskPage() {
  const router = useRouter();
  const { hasCompletedOnboarding, saveProfile } = useApp();
  const [curationStatus, setCurationStatus] = useState<CurationStatus | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load curation status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('curation-status');
      if (stored) {
        setCurationStatus(JSON.parse(stored));
      }
    } catch {
      // Silent fail
    }
    setIsLoaded(true);
  }, []);

  // Guard: redirect to onboarding if not completed
  useEffect(() => {
    if (isLoaded && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [isLoaded, hasCompletedOnboarding, router]);

  const handleNotifyMe = () => {
    // Save notification preference
    saveProfile({ notifyOnReady: true, curationTimestamp: Date.now() });

    // Clean up
    localStorage.removeItem('curation-status');

    // Redirect to home
    router.push('/');
  };

  // Don't render until loaded and verified
  if (!isLoaded || !hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <span className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/30 uppercase">
          Loading...
        </span>
      </div>
    );
  }

  // If no curation status, show empty state
  if (!curationStatus) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-xl text-[#1A1A1A]">No Selection in Progress</h1>
          <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40 mt-2">
            Return to the zine to start browsing.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 bg-[#1A1A1A] text-[#FDFCFB] font-mono text-xs tracking-[0.15em] uppercase"
          >
            Go to Zine
          </button>
        </div>
      </div>
    );
  }

  return <EditorialDesk curationStatus={curationStatus} onNotifyMe={handleNotifyMe} />;
}
