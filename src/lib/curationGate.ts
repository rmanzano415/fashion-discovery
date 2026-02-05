export interface BrandCurationStatus {
  slug: string;
  name: string;
  status: 'ready' | 'scraping' | 'pending' | 'insufficient_products';
  productCount: number;
  message: string;
}

export interface CurationStatus {
  isReady: boolean;
  brandStatuses: BrandCurationStatus[];
  estimatedWaitSeconds?: number;
}

export async function checkCurationReadiness(
  followedBrands: string[],
  preferences: {
    aesthetic?: string;
    palette?: string;
    vibe?: string;
    silhouette: string;
  }
): Promise<CurationStatus> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${API_BASE}/api/curation-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followedBrands, ...preferences }),
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { isReady: false, brandStatuses: [] };
  }
}
