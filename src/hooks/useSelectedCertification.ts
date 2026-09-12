import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_CERTIFICATION_ID,
  assertAvailableCertification,
  getCertification,
  type Certification,
} from '@/certifications';
import { useRepositories } from '@/hooks/useRepositories';

export function useSelectedCertification() {
  const repos = useRepositories();
  const [certification, setCertification] = useState<Certification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const storedId = await repos.settings.getSelectedCertificationId();
      const stored = getCertification(storedId);
      const resolved =
        stored?.status === 'available' ? stored : assertAvailableCertification(DEFAULT_CERTIFICATION_ID);
      if (storedId !== resolved.id) {
        await repos.settings.setSelectedCertificationId(resolved.id);
      }
      await repos.progress.ensure(resolved.id);
      setCertification(resolved);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load certification.');
    }
  }, [repos]);

  const select = useCallback(
    async (certificationId: string) => {
      const next = assertAvailableCertification(certificationId);
      await repos.settings.setSelectedCertificationId(next.id);
      await repos.progress.ensure(next.id);
      setCertification(next);
      setError(null);
      return next;
    },
    [repos],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { certification, select, refresh, error };
}
