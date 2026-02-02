'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingContainer, ZineProfile } from '@/components/onboarding';

export default function OnboardingPage() {
  const router = useRouter();

  const handleOnboardingComplete = useCallback(
    (profile: ZineProfile) => {
      // Store the profile in localStorage for the main app to use
      localStorage.setItem('zineProfile', JSON.stringify(profile));

      // Navigate to the main zine experience
      router.push('/');
    },
    [router]
  );

  return <OnboardingContainer onComplete={handleOnboardingComplete} />;
}
