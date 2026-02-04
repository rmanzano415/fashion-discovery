import type { ZineProfile, Silhouette as ZineSilhouette, Tempo as ZineTempo, Aesthetic as ZineAesthetic, Palette as ZinePalette, Vibe as ZineVibe } from '@/components/onboarding/OnboardingContainer';
import type { SubscriberProfile, Silhouette, Tempo, Aesthetic, Palette, Vibe } from '@/hooks/useSubscriberProfile';

const SILHOUETTE_MAP: Record<ZineSilhouette, Silhouette> = {
  mens: 'menswear',
  womens: 'womenswear',
  unisex: 'all',
};

const TEMPO_MAP: Record<ZineTempo, Tempo> = {
  monthly: 'monthly',
  quarterly: 'quarterly',
  seasonal: 'quarterly',
};

const AESTHETIC_MAP: Record<ZineAesthetic, Aesthetic> = {
  minimalist: 'minimalist',
  'avant-garde': 'avant-garde',
  street: 'streetwear',
  heritage: 'classic',
};

const PALETTE_MAP: Record<ZinePalette, Palette> = {
  earth: 'earth-tones',
  monolith: 'monochrome',
  primary: 'brights',
};

const VIBE_MAP: Record<ZineVibe, Vibe> = {
  understated: 'understated',
  bold: 'bold',
  eclectic: 'artistic',
  refined: 'sophisticated',
};

export function convertZineProfile(zine: ZineProfile): SubscriberProfile {
  const now = Date.now();

  return {
    subscriberName: zine.subscriberName,
    contactMethod: zine.contactMethod,
    contactValue: zine.contactValue,
    silhouette: zine.globalSilhouette ? SILHOUETTE_MAP[zine.globalSilhouette] : 'all',
    tempo: zine.globalTempo ? TEMPO_MAP[zine.globalTempo] : 'monthly',
    followedBrands: zine.brands.map((b) => b.id),
    aesthetic: zine.styleBriefing ? AESTHETIC_MAP[zine.styleBriefing.aesthetic] : undefined,
    palette: zine.styleBriefing ? PALETTE_MAP[zine.styleBriefing.palette] : undefined,
    vibe: zine.styleBriefing ? VIBE_MAP[zine.styleBriefing.vibe] : undefined,
    createdAt: now,
    updatedAt: now,
  };
}
