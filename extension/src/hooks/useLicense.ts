// React hook that subscribes to license changes in chrome.storage.local.
// PRD §9 — license is offline-verifiable, so this hook is purely a local
// storage subscription. No network round-trip.

import { useEffect, useState } from 'react';
import {
  type LicenseToken,
  type Tier,
  getLicense,
  tierOf,
} from '../shared/license';
import { onStorageChange } from '../shared/storage';

export interface UseLicenseResult {
  license: LicenseToken | null;
  tier: Tier;
  isPremium: boolean;
  loaded: boolean;
}

export function useLicense(): UseLicenseResult {
  const [license, setLicenseState] = useState<LicenseToken | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getLicense().then((t) => {
      if (!alive) return;
      setLicenseState(t);
      setLoaded(true);
    });
    const unsub = onStorageChange<LicenseToken>('licenseToken', (newVal) => {
      setLicenseState(newVal ?? null);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const tier = tierOf(license);
  return { license, tier, isPremium: tier === 'premium', loaded };
}
