import { useCallback, useSyncExternalStore } from 'react';
import type { ServiceAudience } from '@/lib/booking/types';
import { trackGenderSelected } from '@/lib/analytics';

const STORAGE_KEY = 'ra.audience';
const DEFAULT: ServiceAudience = 'ladies';

function parse(raw: string | null): ServiceAudience | null {
  if (raw === 'ladies' || raw === 'gentlemen' || raw === 'unisex') return raw;
  return null;
}

function read(): ServiceAudience {
  if (typeof window === 'undefined') return DEFAULT;
  return parse(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT;
}

/**
 * Has the user ever actually chosen an audience?
 *
 * The stored key is written only by `setAudienceGlobal`, i.e. only by a real
 * selection; `DEFAULT` is what `read()` falls back to when nothing is stored.
 * So the key's PRESENCE is the signal, and the value is not consulted —
 * a stored "ladies" is a choice, an absent one is not.
 *
 * Analytics-only. Nothing about rendering or persistence depends on this.
 */
function hasStoredAudience(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY)) !== null;
  } catch {
    // Storage can throw in private modes. Unknowable → report as not chosen.
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Shared external store. Every `useAudience()` consumer reads from this single
// source of truth and re-renders together. A plain per-component useState would
// NOT sync within the same tab — the `storage` event only fires in *other*
// tabs — so toggling the audience in one component (e.g. the Ra-at-Home filter)
// would leave sibling components (e.g. ServiceCard's image picker) stale.
// ──────────────────────────────────────────────────────────────────────────
let current: ServiceAudience = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

// Cross-tab sync: when another tab changes the stored audience, mirror it here.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    const next = parse(e.newValue);
    if (next && next !== current) {
      current = next;
      emit();
    }
  });
}

/**
 * `selectionSource` is analytics-only — it names the UI that made the change
 * and never affects the stored value. Optional so existing callers that pass
 * only the audience keep working unchanged.
 */
function setAudienceGlobal(next: ServiceAudience, selectionSource?: string) {
  // Unchanged value: no state change, and therefore no selection to report.
  // This is the existing early return — the analytics push sits after it on
  // purpose, so re-selecting the active option stays silent.
  if (next === current) return;
  current = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  emit();

  // After the state is committed, never before: the event reports something
  // that has actually happened. Cross-tab mirroring (the `storage` listener
  // above) deliberately does NOT come through here — a change made in another
  // tab was already reported by that tab, and reporting it again would double
  // count one user action.
  trackGenderSelected(next, selectionSource ?? 'unknown');
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): ServiceAudience {
  return current;
}

function getServerSnapshot(): ServiceAudience {
  return DEFAULT;
}

export function useAudience(): [
  ServiceAudience,
  (next: ServiceAudience, selectionSource?: string) => void,
] {
  const audience = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const update = useCallback(
    (next: ServiceAudience, selectionSource?: string) =>
      setAudienceGlobal(next, selectionSource),
    [],
  );
  return [audience, update];
}

/**
 * The current audience, read outside React.
 *
 * For analytics callers that need the audience as event context but are not
 * rendering (e.g. a provider callback). Reads the same singleton the hook
 * does, so the two can never disagree.
 */
export function getCurrentAudience(): ServiceAudience {
  return current;
}

/**
 * Whether the current audience came from an explicit choice rather than the
 * `ladies` default. Feeds `audience_known` on `explore_ra_at_home`, since
 * several Ra at Home entry points bypass the picker entirely.
 */
export function hasChosenAudience(): boolean {
  return hasStoredAudience();
}
