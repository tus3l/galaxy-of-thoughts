import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

/**
 * Get unique browser fingerprint for user identification
 * This persists across sessions and helps enforce one-star-per-day limit
 */
export async function getUserFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  
  const fp = await fpPromise;
  const result = await fp.get();
  
  return result.visitorId;
}
