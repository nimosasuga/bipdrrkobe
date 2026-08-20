'use client';

import { useEffect } from 'react';
import { BUILD_REVISION } from '../lib/build-revision';

const CHECK_INTERVAL_MS = 60_000;

export default function BuildRevisionGuard() {
  useEffect(() => {
    let disposed = false;
    let reloading = false;

    const verifyRevision = async () => {
      if (disposed || reloading) return;

      try {
        const response = await fetch(`/api/build-revision?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) return;

        const payload = await response.json() as { revision?: string };
        const serverRevision = payload.revision?.trim();
        if (!serverRevision || serverRevision === BUILD_REVISION) return;

        reloading = true;
        const url = new URL(window.location.href);
        url.searchParams.set('__bip_build', serverRevision);
        url.searchParams.set('__bip_reload', String(Date.now()));
        window.location.replace(url.toString());
      } catch {
        // Network failure must never interrupt an assessment in progress.
      }
    };

    const onFocus = () => { void verifyRevision(); };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void verifyRevision();
    };

    void verifyRevision();
    const interval = window.setInterval(() => { void verifyRevision(); }, CHECK_INTERVAL_MS);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
