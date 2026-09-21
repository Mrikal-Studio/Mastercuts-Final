/**
 * catalogAdapter — normalises the backend `/services` response (channels →
 * sub_categories → services) into the frontend's Service / Ritual / Section
 * model.
 *
 * NORMALISATION ONLY. This module reshapes the wire format and collapses
 * duration variants; it does not decide what exists or what is visible. Those
 * are backend facts (`is_active`, `location`, `status`, `audience`).
 *
 * Source of truth, since refactor Phase 1–3:
 *   The API owns id, name, price, duration, variants, add-ons, audience,
 *   description, detail, highlights and imagery. `catalog.ts` is now only a
 *   FALLBACK, consulted per-field when the API value is empty — which today
 *   means imagery for the 27 services whose artwork was deleted from the repo
 *   in commit 7f10506. Grouping, copy and FAQs are all backend fields now.
 *
 * The name match still exists for exactly that fallback. It is fragile by
 * nature — renaming a service in the admin portal detaches it from its
 * bundled imagery — which is why every field it supplies is being migrated to
 * a real column rather than being relied on.
 */
import type {
  ApiFaq,
  ApiLocation,
  ApiPackage,
  ApiService,
  ApiSubCategory,
  ApiDepartmentStatus,
  ServicesResponse,
} from '../api/services';
import { HARDCODED_SERVICES } from './catalog';
import type { Package, PackageItem, Service, ServiceVariant } from './types';

/**
 * One rendered section of the menu — a backend sub-category, with the services
 * that belong to it already variant-collapsed.
 *
 * This replaces the hardcoded `GROUPS` / `Category` arrays that AtHomePage and
 * RaAtHomeSection each kept their own copy of.
 */
export interface CatalogSection {
  id: string;
  /**
   * URL-safe handle derived from `name`, used only for `/explore#…` anchors.
   * Purely presentational: the id is a UUID, and `#3dfebe60-…` in a shareable
   * link is worse than `#the-atelier`. Not a backend field — nothing resolves
   * a section BY slug, so a collision would only affect anchor scrolling.
   */
  slug: string;
  name: string;
  shortName: string;
  description: string;
  tagline: string;
  /** Key onto the frontend icon map — the component stays in the frontend. */
  iconKey: string;
  color: string;
  imageUrl: string;
  /** Audience-specific card art; empty falls back to `imageUrl`. */
  imageUrlGents: string;
  imageUrlLadies: string;
  location: ApiLocation;
  status: ApiDepartmentStatus;
  sortOrder: number;
  channelId: string;
  channelName: string;
  faqs: ApiFaq[];
  /** Includes add-ons; grids filter them out via `isAddon`. */
  services: Service[];
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// --- normalisers ---------------------------------------------------------

function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[–—]/g, '-') // en-dash, em-dash → "-"
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip a variant duration suffix the seed adds for multi-variant services. */
function stripVariantSuffix(name: string): string {
  // Pattern: "Name — 60 min" or "Name - 60 min" (case-insensitive)
  return name.replace(/\s*[-–—]\s*\d+\s*min\s*$/i, '').trim();
}

// --- catalog builders ----------------------------------------------------

/**
 * Build ONE frontend Service from a group of API rows that share a
 * `variant_group` (the durations of a single logical service). The rows are
 * turned into `variants[]`, and each variant's `id` is the REAL backend
 * service id — that is what the booking payload sends, so picking "90 min"
 * books the 90-min row. Single-row groups still get a one-entry `variants[]`
 * so every cart item carries a bookable backend id in `variantId`.
 *
 * `Service.id` is the stable `variant_group` slug (the card's UI identity),
 * NOT a bookable id — booking always goes through the selected variant.
 */
/** Backend value if non-empty, else the bundled fallback, else "". */
const prefer = (api: string | undefined, local: string | undefined): string =>
  (api && api.trim()) || local || '';

function enrichServiceGroup(
  groupKey: string,
  rows: ApiService[],
  subCat: ApiSubCategory,
): Service {
  // Order options by variant_sort. The first is the default shown on the card
  // and used for quick-add.
  //
  // The duration fallback only applies to rows that never set variant_sort —
  // it keeps pre-backfill duration variants in ascending order. It is NOT a
  // claim that options are durations: a group whose options differ by finish or
  // body part carries an explicit variant_sort, which always wins.
  const ordered = [...rows].sort(
    (a, b) =>
      (a.variant_sort ?? a.duration_min) - (b.variant_sort ?? b.duration_min),
  );
  const first = ordered[0];
  const baseName = stripVariantSuffix(first.name);
  const normBase = normaliseName(baseName);

  const variants: ServiceVariant[] = ordered.map((r) => ({
    id: r.id, // real backend service id — the bookable identity
    // Rendered verbatim, never parsed. The duration fallback covers rows that
    // predate labelling; anything the backend labelled wins as-is, whether it
    // reads "90 min", "Gel Polish" or "Short — Curl".
    label: r.variant_label || `${r.duration_min} min`,
    durationMin: r.duration_min,
    price: r.price,
    // Only carried when it is not the ordinary per-service default, so
    // downstream `pricingUnit ? ... : ...` checks stay falsy for normal rows.
    ...(r.pricing_unit && r.pricing_unit !== 'service'
      ? { pricingUnit: r.pricing_unit }
      : {}),
  }));

  // Add-on identity + eligibility are shared across a group's rows; read them
  // off the representative row.
  const isAddon = first.is_addon === true;
  const addonGroups = Array.isArray(first.addon_groups)
    ? first.addon_groups
    : [];

  // Bundled entry, consulted ONLY where the API has nothing to say.
  const matched =
    HARDCODED_SERVICES.find((h) => normaliseName(h.name) === normBase) ||
    HARDCODED_SERVICES.find(
      (h) => normaliseName(stripVariantSuffix(h.name)) === normBase,
    );

  const apiHighlights = Array.isArray(first.highlights) ? first.highlights : [];
  const audience = (prefer(first.audience, matched?.audience) ||
    'unisex') as Service['audience'];

  return {
    // Bundled presentation rides along; every field below overrides it.
    ...(matched ?? {}),

    id: groupKey, // stable UI identity (the variant_group slug)
    categoryId: subCat.id, // the REAL grouping key
    name: baseName, // single card title, no duration suffix
    durationMin: first.duration_min,
    price: first.price,
    variants,
    isAddon,
    addonGroups,

    // Backend-owned copy. `highlights` is a whole-array swap rather than a
    // merge: a partially-backfilled list would read as a content bug.
    description: prefer(first.description, matched?.description),
    detail: prefer(first.detail, matched?.detail),
    highlights: apiHighlights.length ? apiHighlights : matched?.highlights,
    audience,
    requiresConsultation:
      first.requires_consultation ?? matched?.requiresConsultation,

    // Imagery: S3 where it exists, bundled path otherwise. 27 services still
    // depend on the fallback because their artwork is missing from the repo.
    image: prefer(first.image_url, matched?.image),
    imageGents: prefer(first.image_url_gents, matched?.imageGents) || undefined,
    imageLadies:
      prefer(first.image_url_ladies, matched?.imageLadies) || undefined,
  };
}

export interface AdaptedCatalog {
  /** Flat list of every bookable card, across every section. */
  services: Service[];
  /** The backend hierarchy — the only thing section-rendering code reads. */
  sections: CatalogSection[];
  /**
   * Packages, kept OUT of `services` and `sections` exactly as the backend
   * keeps them out of `channels[]` — a package is not a catalog entry.
   */
  packages: Package[];
}

/**
 * Build the frontend catalog from the API response. Only sub-categories
 * with status="active" (or unset) contribute services; coming-soon /
 * not-launched / invite-only cells are ignored at the service level (the
 * UI still uses the API tree separately to render those placeholders).
 */
export function adaptCatalog(response: ServicesResponse): AdaptedCatalog {
  const services: Service[] = [];
  const sections: CatalogSection[] = [];

  // NOTE: no status/visibility filtering here any more. `is_active=false` rows
  // are already absent from the response, and `coming_soon` sections are served
  // deliberately so the UI can render a placeholder. Re-filtering them out here
  // would silently discard exactly what the backend went to the trouble of
  // sending. Consumers decide what to do with `section.status`.
  for (const channel of sortByOrder(response.channels)) {
    for (const sub of sortByOrder(channel.sub_categories)) {
      // Group this sub-category's rows by variant_group (durations of the same
      // logical service) so they collapse into a single card. Rows with no
      // group fall back to their own id → a standalone single-variant card.
      // Insertion order is preserved so grouping doesn't reshuffle the menu.
      const groups = new Map<string, ApiService[]>();
      for (const apiSvc of sub.services) {
        const key = apiSvc.variant_group || apiSvc.id;
        const arr = groups.get(key);
        if (arr) arr.push(apiSvc);
        else groups.set(key, [apiSvc]);
      }

      const sectionServices: Service[] = [];
      for (const [groupKey, rows] of groups) {
        const service = enrichServiceGroup(groupKey, rows, sub);
        sectionServices.push(service);
        services.push(service);
      }

      sections.push({
        id: sub.id,
        slug: slugify(sub.name),
        name: sub.name,
        shortName: sub.short_name || sub.name,
        description: sub.description || '',
        tagline: sub.tagline || '',
        iconKey: sub.icon_key || '',
        color: sub.color || '',
        imageUrl: sub.image_url || '',
        imageUrlGents: sub.image_url_gents || '',
        imageUrlLadies: sub.image_url_ladies || '',
        location: sub.location || 'salon',
        status: sub.status || 'active',
        sortOrder: sub.sort_order || 0,
        channelId: channel.id,
        channelName: channel.name,
        faqs: Array.isArray(sub.faqs) ? sub.faqs.filter((f) => f?.q && f?.a) : [],
        services: sectionServices,
      });
    }
  }

  return { services, sections, packages: adaptPackages(response.packages) };
}

/**
 * Map backend packages into the frontend `Package` shape.
 *
 * PURE RESHAPING — every pricing number is copied verbatim from the wire.
 * `price`, `duration_min`, `original_price`, `savings_amount` and
 * `savings_percent` are computed server-side against LIVE member prices, so
 * recomputing any of them here would drift the moment a member is repriced.
 * That drift is precisely the bug Phase 6 exists to fix: the old hardcoded
 * journeys stored a percentage and derived the price locally, which displayed
 * a discount the booking never actually charged.
 *
 * `category` is not sent as a name — the backend models it as the package's
 * sub-category. Left empty here; the two render sites that print it fall back
 * to an empty string rather than inventing a label.
 */
function adaptPackages(packages: ApiPackage[] | undefined): Package[] {
  if (!Array.isArray(packages)) return [];
  return [...packages]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline ?? '',
      category: '',
      description: p.description ?? '',
      longDescription: p.detail ?? '',
      philosophy: p.philosophy ?? '',
      image: p.image_url ?? '',
      serviceIds: (p.items ?? []).map((i) => i.id),
      // Backend-derived. null (nothing to compare against) renders as 0 rather
      // than NaN at the six sites that print "save N%".
      savings: p.savings_percent ?? 0,
      price: p.price,
      durationMin: p.duration_min,
      originalPrice: p.original_price,
      savingsAmount: p.savings_amount,
      items: (p.items ?? []).map(
        (i): PackageItem => ({
          id: i.id,
          name: i.name,
          durationMin: i.duration_min,
          price: i.price,
          unavailable: i.unavailable,
          missing: i.missing,
        }),
      ),
      incomplete: p.incomplete === true,
    }));
}

/** Backend sort_order first, then name — mirrors the lambda's own ordering. */
function sortByOrder<T extends { sort_order: number; name: string }>(
  rows: T[],
): T[] {
  return [...rows].sort(
    (a, b) =>
      (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name),
  );
}

// Empty default for the loading state — keeps consumers' type narrowing simple.
export const EMPTY_CATALOG: AdaptedCatalog = {
  services: [],
  sections: [],
  packages: [],
};
