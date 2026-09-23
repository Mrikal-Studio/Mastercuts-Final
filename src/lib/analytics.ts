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
 *   - Push from the event handler that performs the action, never from a
 *     render or an effect that mirrors state — both re-run for reasons that
 *     are not user actions.
 *
 * This module owns the whole event vocabulary. Components import a named
 * `track*` helper rather than assembling a payload, so the shape of an event
 * is defined in exactly one place and cannot drift between call sites.
 *
 * Every event also carries `tenant_id` — see `pushEvent`.
 */

// Safe to import: `env.ts` has no side effects at module load. Its only throw
// is lazy, inside `getApiBaseUrl()`, which this module never calls.
import { getPartnerId } from "./api/env";

const CURRENCY = "AED";

/**
 * Ladies/Gentlemen context, attached to funnel events for segmentation.
 *
 * IMPORTANT: this is the CURRENT audience, which has a default (`ladies`) and
 * may never have been chosen by this user. It is NOT evidence of a selection —
 * that is `gender_selected`, which fires only on an explicit change.
 */
export type AnalyticsAudience = "ladies" | "gentlemen" | "unisex";

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
  /** Set only by `purchase`; GA4 uses it to de-duplicate transactions. */
  transaction_id?: string;
}

/**
 * Params carried alongside an event. Deliberately primitives only — this type
 * is the guard rail that keeps objects (and therefore PII-bearing records like
 * accounts, guests or addresses) out of the dataLayer by construction.
 */
export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined
>;

/**
 * A pushed entry. `ecommerce` is typed separately from the flat params
 * because it is the one structured value GA4 expects; everything else stays
 * primitive, which is what keeps records (and their PII) out by construction.
 */
interface DataLayerEvent {
  event: string;
  /** Cleared before each ecommerce push so stale items never leak forward. */
  ecommerce?: EcommercePayload | null;
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | EcommercePayload
    | null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function ensureDataLayer(): unknown[] | null {
  if (typeof window === "undefined") return null;
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

/**
 * Push a raw event. Swallows any failure — analytics must never break a
 * booking flow.
 *
 * Every event is stamped with `tenant_id`, the partner this build books for.
 * It is applied HERE rather than in each `track*` helper because this is the
 * only `dataLayer.push` in the codebase — so the stamp cannot be forgotten by
 * a future event, and no call site has to remember it.
 *
 * The value comes from the same `getPartnerId()` the API layer sends as
 * `X-Partner-Id`, so analytics and API requests can never disagree about which
 * tenant a session belongs to. It resolves from a build-time env constant, so
 * it is available synchronously before any event can fire.
 *
 * When the partner is unset the key is OMITTED rather than sent as
 * `"undefined"` or `""` — a missing parameter is honest and easy to filter in
 * GA4, whereas a literal "undefined" string silently pollutes reports.
 */
export function pushEvent(payload: DataLayerEvent): void {
  const dataLayer = ensureDataLayer();
  if (!dataLayer) return;
  try {
    // Inside the try on purpose: resolving the tenant must not be able to
    // break a booking flow either, and a throw here degrades to no event
    // rather than an error surfacing to the customer.
    const tenantId = getPartnerId();
    // `tenant_id` is spread last so a caller cannot silently shadow it.
    dataLayer.push(tenantId ? { ...payload, tenant_id: tenantId } : payload);
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
  params: AnalyticsParams = {},
): void {
  pushEvent({ event: "clear_ecommerce", ecommerce: null });
  pushEvent({ event, ...params, ecommerce });
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
export function trackAddToCart(
  items: AnalyticsItem[],
  params: AnalyticsParams = {},
): void {
  if (items.length === 0) return;
  pushEcommerceEvent(
    "add_to_cart",
    { currency: CURRENCY, value: totalValue(items), items },
    params,
  );
}

/**
 * Emit `view_item` — a service detail was genuinely opened.
 *
 * Callers must fire this from the OPEN action, never from a render: the detail
 * sheet stays mounted and re-renders on every variant tap.
 */
export function trackViewItem(
  item: AnalyticsItem,
  params: AnalyticsParams = {},
): void {
  pushEcommerceEvent(
    "view_item",
    { currency: CURRENCY, value: totalValue([item]), items: [item] },
    params,
  );
}

/** Emit `begin_checkout` for the cart as it stands when checkout is entered. */
export function trackBeginCheckout(
  items: AnalyticsItem[],
  params: AnalyticsParams = {},
): void {
  if (items.length === 0) return;
  pushEcommerceEvent(
    "begin_checkout",
    { currency: CURRENCY, value: totalValue(items), items },
    { num_items: items.length, ...params },
  );
}

/**
 * Emit `purchase` — ONCE per booking, ever.
 *
 * `transaction_id` is the backend `booking_token`. Every token this tab has
 * already reported is remembered, so a re-render of the success screen, a
 * StrictMode double-invoke or a user reopening the confirmation cannot report
 * the same booking twice. GA4 de-duplicates server-side on `transaction_id`
 * too; this guard means we do not rely on that.
 */
const reportedPurchases = new Set<string>();

export function trackPurchase(
  transactionId: string,
  items: AnalyticsItem[],
  /**
   * The amount actually charged, from the booking API. Passed explicitly
   * because the server is authoritative on price — a locally summed cart can
   * disagree with it (package combo pricing, VAT handling, repricing between
   * add-to-cart and checkout). Falls back to the item sum when absent.
   */
  value?: number,
  params: AnalyticsParams = {},
): void {
  if (!transactionId || reportedPurchases.has(transactionId)) return;
  reportedPurchases.add(transactionId);
  pushEcommerceEvent(
    "purchase",
    {
      currency: CURRENCY,
      value: value ?? totalValue(items),
      items,
      transaction_id: transactionId,
    },
    params,
  );
}

/** Test seam: forget reported purchases. Not used by application code. */
export function __resetPurchaseDedupe(): void {
  reportedPurchases.clear();
}

// ── Non-ecommerce funnel events ───────────────────────────────────────────
// These carry no `ecommerce` block, so they do not go through the
// clear_ecommerce reset — there is nothing for a later event to inherit.

/**
 * Emit `page_view` for an SPA route change.
 *
 * GTM's container tag reports the initial hard load itself, so callers must
 * skip the first route and report only genuine navigations — otherwise the
 * landing page is counted twice.
 */
export function trackPageView(params: AnalyticsParams = {}): void {
  pushEvent({ event: "page_view", ...params });
}

/** Emit `explore_ra_at_home` — the user entered the Ra at Home flow. */
export function trackExploreRaAtHome(
  ctaLocation: string,
  audienceKnown: boolean,
): void {
  pushEvent({
    event: "explore_ra_at_home",
    cta_location: ctaLocation,
    audience_known: audienceKnown,
  });
}

/**
 * Emit `generate_lead` — a newsletter/lead form submitted successfully.
 *
 * Takes only the form's identity. The submitted email is deliberately not a
 * parameter of this function so it cannot be passed by mistake.
 */
export function trackGenerateLead(
  leadSource: string,
  formLocation: string,
): void {
  pushEvent({
    event: "generate_lead",
    lead_source: leadSource,
    form_location: formLocation,
  });
}

/** Emit `gender_selected` — an EXPLICIT Ladies/Gentlemen change. */
export function trackGenderSelected(
  audience: AnalyticsAudience,
  selectionSource: string,
): void {
  pushEvent({
    event: "gender_selected",
    audience,
    selection_source: selectionSource,
  });
}

/** Emit `category_selected` — an explicit category/section interaction. */
export function trackCategorySelected(params: {
  item_category: string;
  category_id: string;
  audience: AnalyticsAudience;
  selection_source: string;
}): void {
  pushEvent({ event: "category_selected", ...params });
}

/**
 * Emit `contact_click`.
 *
 * DELIBERATELY NOT used for the ordinary Call / WhatsApp links. Those are
 * plain `<a href="tel:…">` / `<a href="https://wa.me/…">` anchors, which GTM
 * detects reliably with a Click trigger on the link URL — instrumenting them
 * here as well would produce two events for one click. Those anchors are left
 * untouched on purpose; see the Contact-click note in the implementation
 * summary.
 *
 * This exists for the one case a Click trigger CANNOT see: the Wellness Hub
 * opens WhatsApp with `window.open(...)` after a form submit, so no anchor is
 * ever clicked and GTM has nothing to bind to.
 */
export function trackContactClick(params: {
  method: "whatsapp" | "phone";
  cta_location: string;
  link_url?: string;
}): void {
  pushEvent({ event: "contact_click", ...params });
}

/** Emit `checkout_progress` — the user reached a checkout step. */
export function trackCheckoutProgress(params: {
  checkout_step: number;
  step_name: string;
  audience: AnalyticsAudience;
}): void {
  pushEvent({ event: "checkout_progress", ...params });
}
