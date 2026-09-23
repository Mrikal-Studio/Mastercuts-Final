import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * SPA page-view reporting.
 *
 * The GTM container tag in `index.html` reports the initial hard load on its
 * own. React Router then changes the URL without a document load, so every
 * navigation after the first is invisible to GTM. This component closes that
 * gap — and only that gap.
 *
 * Why the first route is skipped: reporting it here would count the landing
 * page twice, once from the container and once from us. `seenFirstRoute`
 * starts false and is set on the first run, so the initial render reports
 * nothing and the first genuine navigation reports normally.
 *
 * Why an effect is the right place despite the "never fire from render" rule:
 * a route change is not user state we are mirroring, it IS the event. The
 * guard below keys on the resolved URL, so a re-render (or a StrictMode
 * double-invoke, which re-runs effects with the same location) cannot report
 * the same URL twice in a row.
 *
 * Deliberately not reported: any user or session identifier. GA4 owns
 * analytics identity; inventing our own would fragment its reporting.
 */
export function RouteAnalytics() {
  const location = useLocation();
  const seenFirstRoute = useRef(false);
  const lastReported = useRef<string | null>(null);

  // `search` and `hash` are included because the app uses both meaningfully:
  // `/at-home#signature` deep links from search, and campaign query strings
  // land on the first URL. They are part of the page's identity.
  const url = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (!seenFirstRoute.current) {
      seenFirstRoute.current = true;
      lastReported.current = url;
      return;
    }
    if (lastReported.current === url) return;
    lastReported.current = url;

    trackPageView({
      page_path: `${location.pathname}${location.search}`,
      page_location: window.location.href,
      page_title: document.title,
      page_hash: location.hash || undefined,
    });
  }, [url, location.pathname, location.search, location.hash]);

  return null;
}
