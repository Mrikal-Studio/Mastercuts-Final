/**
 * Services API — talks to mastercuts-availability `/services`.
 *
 * Response shape (see lambdas/mastercuts-availability listServices):
 *   {
 *     currency: "AED",
 *     channels: [{
 *       id, name, short_name, sort_order,
 *       meta_information: { eyebrow?, status?, access_note?, slug? },
 *       sub_categories: [{
 *         id, name, short_name, sort_order,
 *         meta_information: { tagline?, status?, slug? },
 *         services: [{ id, name, department_id, description, duration_min,
 *                      price, currency, sort_order }]
 *       }]
 *     }]
 *   }
 *
 * `status` on channels / sub-categories takes values:
 *   "active" | "coming-soon" | "not-launched" | "invite-only"
 */
import { apiClient } from './client';

/**
 * Legacy `meta_information.status` vocabulary. Kept only because the field is
 * still present on the wire; it is `{}` on every row in both environments — the
 * seed's values were silently dropped on write — so nothing ever reads a value
 * out of it. Real status now lives in `ApiDepartment.status`.
 */
export type ChannelStatus =
  | 'active'
  | 'coming-soon'
  | 'not-launched'
  | 'invite-only';

/** @deprecated always `{}` in practice — see ChannelStatus. */
export interface ApiServiceMeta {
  slug?: string;
  tagline?: string;
  eyebrow?: string;
  status?: ChannelStatus;
  access_note?: string;
  audience?: string;
  audience_filter?: string;
}

/** Where a sub-category's menu can be delivered. */
export type ApiLocation = 'salon' | 'home' | 'both';

/**
 * Distinct from removal: an inactive department is dropped from the response
 * entirely, whereas `coming_soon` is served so the section heading can render
 * with a placeholder instead of bookable services.
 */
export type ApiDepartmentStatus = 'active' | 'coming_soon' | 'invite_only';

/**
 * Presentation fields shared by channels and sub-categories. All are served
 * with defaults ("", "salon", "active") for rows that predate the columns, so
 * they are always present as strings — never undefined.
 */
export interface ApiDepartmentFields {
  description: string;
  tagline: string;
  /** Key onto the frontend's own icon set, e.g. "sun". Not a component. */
  icon_key: string;
  color: string;
  image_url: string;
  /** Audience-specific card art; empty falls back to `image_url`. */
  image_url_gents: string;
  image_url_ladies: string;
  location: ApiLocation;
  status: ApiDepartmentStatus;
  /**
   * "Questions we're often asked", rendered as an accordion at the foot of a
   * service's detail sheet. Belongs to the sub-category: every service in a
   * menu answers the same questions. Server-side filtered to complete pairs.
   */
  faqs: ApiFaq[];
}

export interface ApiFaq {
  q: string;
  a: string;
}

export interface ApiService {
  id: string;
  name: string;
  department_id: string;
  description: string;
  duration_min: number;
  price: number;
  currency: string;
  sort_order: number;
  // Duration-variant grouping (backend `serializeService`). Rows sharing a
  // `variant_group` are durations of the same logical service and collapse into
  // one card; each keeps its own `id`/`price` so the booking payload is
  // unchanged (the chosen variant's real id is what gets booked).
  variant_group?: string;
  variant_label?: string;
  variant_sort?: number;
  /**
   * Unit the `price` is quoted in. Backend defaults it to "service", meaning
   * the price covers the whole line and no quantity is asked for — which is how
   * every pre-existing row behaves. Anything else means `price` is a RATE and
   * the customer picks how many units (e.g. "nail" → AED 15 per nail).
   */
  pricing_unit?: 'service' | 'nail' | 'full_hands';
  // Add-on identity + eligibility. `is_addon` rows are hidden from the grid;
  // `addon_groups` lists the variant_group slugs of add-ons this service offers.
  is_addon?: boolean;
  addon_groups?: string[];

  // ── Catalog presentation (backend-owned since refactor Phase 1) ──────────
  // Served with defaults for un-backfilled rows: audience "unisex", everything
  // else "" / [] / false. An empty string means "not set", and the adapter
  // falls back to the bundled catalog.ts value for it.
  /** "unisex" | "ladies" | "gentlemen" — gates the audience toggle. */
  audience?: string;
  /** Card bullet points. Empty array falls back to `description`. */
  highlights?: string[];
  /** Long copy for the detail sheet; paragraphs split on "\n\n". */
  detail?: string;
  requires_consultation?: boolean;
  image_url?: string;
  image_url_gents?: string;
  image_url_ladies?: string;
}

export interface ApiSubCategory extends ApiDepartmentFields {
  id: string;
  name: string;
  short_name?: string;
  sort_order: number;
  /** @deprecated always `{}` — see ApiServiceMeta. */
  meta_information: ApiServiceMeta;
  services: ApiService[];
}

export interface ApiChannel extends ApiDepartmentFields {
  id: string;
  name: string;
  short_name?: string;
  sort_order: number;
  /** @deprecated always `{}` — see ApiServiceMeta. */
  meta_information: ApiServiceMeta;
  sub_categories: ApiSubCategory[];
}

/** One member of a package, as the backend resolved it at read time. */
export interface ApiPackageItem {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  /** The member row is `is_active: false` — the package cannot be booked. */
  unavailable?: boolean;
  /** The member id resolves to nothing at all. */
  missing?: boolean;
}

/**
 * A package ("Curated Journey") — a bundle that books as ONE appointment.
 *
 * `price` and `duration_min` are AUTHORITATIVE: the backend charges `price` and
 * reserves `duration_min`, which is deliberately not the sum of the members (a
 * combo is scheduled tighter than its parts). `original_price` and the two
 * savings fields are derived server-side from live member prices on every read
 * — never recompute them here, or the two will disagree the moment a member is
 * repriced.
 *
 * Packages are returned SEPARATELY from `channels[]`, so they can never appear
 * as ordinary services in the catalog tree.
 */
export interface ApiPackage {
  id: string;
  name: string;
  department_id: string;
  description: string;
  /** Long-form copy; paragraphs split on "\n\n". */
  detail: string;
  tagline: string;
  /** Short pull-quote. */
  philosophy: string;
  image_url: string;
  duration_min: number;
  price: number;
  currency: string;
  sort_order: number;
  tax_percentage: number | null;
  is_package: true;
  items: ApiPackageItem[];
  /** Sum of member prices at their current catalog price. Derived. */
  original_price: number;
  /** original_price - price, floored at 0. Derived. */
  savings_amount: number;
  /** null when there is nothing to compare against — never a bogus 0%. */
  savings_percent: number | null;
  /** True when any member is missing or deactivated. Do not offer for booking. */
  incomplete: boolean;
}

export interface ServicesResponse {
  currency: string;
  channels: ApiChannel[];
  /**
   * Optional: absent on a backend that predates Phase 6, and absent-vs-empty
   * are treated the same by the adapter.
   */
  packages?: ApiPackage[];
}

export function fetchServices(signal?: AbortSignal): Promise<ServicesResponse> {
  return apiClient.get<ServicesResponse>('/services', { signal });
}
