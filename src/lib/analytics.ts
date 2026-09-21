/**
 * GA4 / Google Tag Manager dataLayer helpers.
 *
 * The GTM container is installed in `index.html`; it creates `window.dataLayer`
 * before the bundle runs. Everything here only ever pushes onto that array, so
 * the app degrades silently when GTM is blocked (ad blockers, privacy modes) or
 * when the snippet has not run yet — `ensureDataLayer` creates the array and
 * GTM picks up anything already queued once it loads.
 *
 * Rules for callers:
 *   - Never push PII (name, email, phone, address, guest profiles).
 *   - Push only AFTER the operation being reported has actually succeeded.
 *   - Never push from inside a React state updater: `<StrictMode>` double-
 *     invokes updaters in development, which would double-count every event.
 */

const CURRENCY = 'AED';

/** One entry of a GA4 ecommerce `items` array. */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  /**
   * UNIT price — never a line total. GA4 derives revenue as `price * quantity`,
   * so sending a line total alongside `quantity > 1` double-counts.
   */
  price: number;
  quantity: number;
  item_variant?: string;
  item_category?: string;
}

interface EcommercePayload {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

interface DataLayerEvent {
  event: string;
  /** Cleared before each ecommerce push so stale items never leak forward. */
  ecommerce: EcommercePayload | null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function ensureDataLayer(): unknown[] | null {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

/**
 * Push a raw event. Swallows any failure — analytics must never break a
 * booking flow.
 */
export function pushEvent(payload: DataLayerEvent): void {
  const dataLayer = ensureDataLayer();
  if (!dataLayer) return;
  try {
    dataLayer.push(payload);
  } catch {
    // Ignored on purpose: a failed metric must not surface to the customer.
  }
}

/**
 * Push a GA4 ecommerce event, clearing `ecommerce` first.
 *
 * The reset is Google's documented guard for single-page apps: the dataLayer
 * persists across route changes, so without it a later event can inherit the
 * previous event's `items`.
 */
export function pushEcommerceEvent(
  event: string,
  ecommerce: EcommercePayload,
): void {
  pushEvent({ event: 'clear_ecommerce', ecommerce: null } as DataLayerEvent);
  pushEvent({ event, ecommerce });
}

/** Total for a set of items, as GA4 computes it: sum of price * quantity. */
function totalValue(items: AnalyticsItem[]): number {
  const value = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  // Guard against float drift (e.g. 0.1 + 0.2) in the reported revenue.
  return Math.round(value * 100) / 100;
}

/**
 * Emit `add_to_cart`. `value` is derived from the items so it can never
 * disagree with them.
 */
export function trackAddToCart(items: AnalyticsItem[]): void {
  if (items.length === 0) return;
  pushEcommerceEvent('add_to_cart', {
    currency: CURRENCY,
    value: totalValue(items),
    items,
  });
}
