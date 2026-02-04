'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingContainer, ZineProfile } from '@/components/onboarding';
import { convertZineProfile } from '@/lib/profileMapping';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function OnboardingPage() {
  const router = useRouter();

  const handleOnboardingComplete = useCallback(
    async (zineProfile: ZineProfile) => {
      const subscriberProfile = convertZineProfile(zineProfile);

      // Save mapped profile to localStorage immediately
      localStorage.setItem('zine-subscriber-profile', JSON.stringify(subscriberProfile));

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
          localStorage.setItem('zine-user-id', String(user.id));
        }
        // 409 = user already exists — still proceed
      } catch {
        // API unreachable — user can be created lazily later
      }

      // Clean up raw onboarding data
      localStorage.removeItem('zineProfile');

      router.push('/');
    },
    [router]
  );

  return <OnboardingContainer onComplete={handleOnboardingComplete} />;
}
