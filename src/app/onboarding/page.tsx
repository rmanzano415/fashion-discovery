'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { OnboardingContainer, ZineProfile } from '@/components/onboarding';
import { MatchingInterstitial } from '@/components/onboarding/MatchingInterstitial';
import { convertZineProfile } from '@/lib/profileMapping';
import { checkCurationReadiness, CurationStatus } from '@/lib/curationGate';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile, setUserId } = useApp();

  // State for Path A (MatchingInterstitial)
  const [showMatchingInterstitial, setShowMatchingInterstitial] = useState(false);
  const [curationStatus, setCurationStatus] = useState<CurationStatus | null>(null);
  const [lastZineProfile, setLastZineProfile] = useState<ZineProfile | null>(null);

  const handleOnboardingComplete = useCallback(
    async (zineProfile: ZineProfile) => {
      const subscriberProfile = convertZineProfile(zineProfile);

      // Update context state (drives hasCompletedOnboarding and profile)
      saveProfile(subscriberProfile);

      // Store for MatchingInterstitial if needed
      setLastZineProfile(zineProfile);

      // Try to create the backend user
      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriberName: subscriberProfile.subscriberName,
            contactMethod: subscriberProfile.contactMethod,
            contactValue: subscriberProfile.contactValue,
            silhouette: subscriberProfile.silhouette,
            tempo: subscriberProfile.tempo,
            followedBrands: subscriberProfile.followedBrands,
            aesthetic: subscriberProfile.aesthetic,
            palette: subscriberProfile.palette,
            vibe: subscriberProfile.vibe,
          }),
        });

        if (res.ok) {
          const user = await res.json();
          setUserId(user.id);
        }
        // 409 = user already exists — still proceed
      } catch {
        // API unreachable — user can be created lazily later
      }

      // Check curation readiness
      const status = await checkCurationReadiness(subscriberProfile.followedBrands, {
        aesthetic: subscriberProfile.aesthetic,
        palette: subscriberProfile.palette,
        vibe: subscriberProfile.vibe,
        silhouette: subscriberProfile.silhouette,
      });

      // Clean up raw onboarding data
      localStorage.removeItem('zineProfile');

      if (status.isReady) {
        // Path A: Show MatchingInterstitial then go to zine
        setCurationStatus(status);
        setShowMatchingInterstitial(true);
      } else {
        // Path B: Store status and redirect to EditorialDesk
        localStorage.setItem('curation-status', JSON.stringify(status));
        router.push('/editorial-desk');
      }
    },
    [router, saveProfile, setUserId]
  );

  const handleMatchingComplete = useCallback(() => {
    router.push('/');
  }, [router]);

  // Render MatchingInterstitial if ready
  if (showMatchingInterstitial && curationStatus && lastZineProfile) {
    return (
      <MatchingInterstitial
        zineProfile={lastZineProfile}
        curationStatus={curationStatus}
        onComplete={handleMatchingComplete}
      />
    );
  }

  return <OnboardingContainer onComplete={handleOnboardingComplete} />;
}
