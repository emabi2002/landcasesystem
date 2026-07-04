'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGuidedTour } from './GuidedTour';
import { WELCOME_TOUR_ID } from '@/help/help-content';

const WELCOME_SEEN_KEY = 'dlpp_welcome_tour_seen';

/** Resolve once the selector appears in the DOM, or after `timeout` ms. */
function waitForElement(selector: string, timeout = 3500): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve();
    const start = Date.now();
    const tick = () => {
      if (document.querySelector(selector) || Date.now() - start > timeout) {
        resolve();
        return;
      }
      window.setTimeout(tick, 150);
    };
    tick();
  });
}

/**
 * Automatically launches the welcome tour the first time a signed-in user
 * lands on an app page. It never runs on the login/root screens, only fires
 * once per browser, and only for authenticated users.
 */
export function WelcomeTour() {
  const pathname = usePathname();
  const { startTour } = useGuidedTour();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    if (typeof window === 'undefined') return;
    if (!pathname || pathname === '/login' || pathname === '/') return;
    if (window.localStorage.getItem(WELCOME_SEEN_KEY)) return;

    let cancelled = false;

    (async () => {
      // Only greet users who are actually signed in.
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) return;

      startedRef.current = true;
      // Remember so it never shows again on this browser.
      window.localStorage.setItem(WELCOME_SEEN_KEY, '1');

      // Wait for the sidebar to render so the highlights land on real elements.
      await waitForElement('[data-tour="app-sidebar"]');
      if (!cancelled) startTour(WELCOME_TOUR_ID);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, startTour]);

  return null;
}
