/**
 * CatalogProvider — fetches /services on mount, normalises via catalogAdapter,
 * exposes the data + helper functions through useCatalog().
 *
 * Design notes:
 *   - The shape returned by useCatalog() mirrors what catalog.ts exported
 *     before the migration, minus the retired ritual helpers: `services`,
 *     `sections`, `getService(id)`, `getSectionById(id)`. Consumers
 *     destructure from the hook instead of importing directly.
 *   - Therapists remain hardcoded (the roster is empty). Packages and their
 *     totals come from the backend since Phase 6.6 — `packages` / `journeys`
 *     are the same API-derived list under two names, and getJourneyTotals
 *     copies the server's derived pricing rather than recomputing it.
 *   - The provider also exposes the raw `channelTree` from the API so the
 *     landing page can render coming-soon / not-launched channels straight
 *     from backend metadata without going through the adapter.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { fetchServices, type ServicesResponse } from '../api/services';
import { ApiError, NetworkError } from '../api/errors';
import {
  HARDCODED_THERAPISTS,
  type JourneyTotals,
} from './catalog';
import {
  adaptCatalog,
  EMPTY_CATALOG,
  type AdaptedCatalog,
  type CatalogSection,
} from './catalogAdapter';
import type { ApiLocation } from '../api/services';
import type {
  Package,
  Service,
  ServiceAudience,
  Therapist,
} from './types';

export type CatalogStatus = 'loading' | 'ready' | 'error';

export interface CatalogContextValue {
  status: CatalogStatus;
  error: string | null;

  // Bookable surface — driven by the API.
  services: Service[];

  // Therapists are still hardcoded (the roster is empty). Packages come from
  // the backend since Phase 6.6; `journeys` is the same list under its
  // storytelling name and is kept so existing call sites did not move.
  therapists: Therapist[];
  packages: Package[];
  journeys: Package[];

  /**
   * The backend hierarchy — sub-categories in `sort_order`, each with its own
   * copy, imagery, icon key, FAQs, location and status. Section-rendering code
   * reads THIS; it must not keep its own list of what sections exist.
   */
  sections: CatalogSection[];
  /**
   * Sections deliverable at the given location, in backend order.
   * `coming_soon` sections are included — they render as placeholders — so
   * callers filter on `status`, not by checking whether `services` is empty.
   */
  getSections: (location: ApiLocation, audience?: ServiceAudience) => CatalogSection[];
  /** Resolve a section by its id (`Service.categoryId`) or by its anchor slug. */
  getSectionById: (id: string | undefined) => CatalogSection | undefined;
  /** Services in a section, minus add-ons, filtered by the audience toggle. */
  getSectionServices: (sectionId: string, audience?: ServiceAudience) => Service[];

  getService: (id: string) => Service | undefined;
  getTherapist: (id: string) => Therapist | undefined;
  /** Therapists covering a sub-category. The roster is empty, so always []. */
  getTherapistsForSection: (sectionId: string) => Therapist[];
  getAtHomeServices: (audience?: ServiceAudience) => Service[];
  getAddOnsForService: (service: Service) => Service[];
  /**
   * Add-ons offered by anything currently in the cart, minus what is already
   * there. Driven by `addon_groups` on the backend rows — the previous version
   * hardcoded "any somatic-recovery massage unlocks every add-on".
   */
  getAddOnSuggestions: (cartServiceIds: string[]) => Service[];
  getJourney: (id: string) => Package | undefined;
  getFrequentlyAddedSuggestions: (cartServiceIds: string[], limit?: number) => Service[];
  getJourneyTotals: (journey: Package) => JourneyTotals;

  // Raw API tree — for landing page channel placeholders (coming-soon etc.).
  channelTree: ServicesResponse['channels'];

  refetch: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

interface ProviderState {
  status: CatalogStatus;
  error: string | null;
  catalog: AdaptedCatalog;
  channelTree: ServicesResponse['channels'];
}

const INITIAL_STATE: ProviderState = {
  status: 'loading',
  error: null,
  catalog: EMPTY_CATALOG,
  channelTree: [],
};

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>(INITIAL_STATE);
  // Abort the in-flight request when refetch is called or the provider unmounts.
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    fetchServices(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'ready',
          error: null,
          catalog: adaptCatalog(response),
          channelTree: response.channels,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof ApiError
            ? `Catalog API ${err.statusCode}: ${err.message}`
            : err instanceof NetworkError
              ? err.message
              : 'Failed to load services catalog';
        setState({
          status: 'error',
          error: message,
          catalog: EMPTY_CATALOG,
          channelTree: [],
        });
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const value = useMemo<CatalogContextValue>(() => {
    const { catalog, channelTree, status, error } = state;
    const { services, sections, packages } = catalog;

    const getService = (id: string) => services.find((s) => s.id === id);
    const getTherapist = (id: string) =>
      HARDCODED_THERAPISTS.find((t) => t.id === id);
    const getTherapistsForSection = (sectionId: string) =>
      HARDCODED_THERAPISTS.filter((t) => t.categoryIds.includes(sectionId));

    // Accepts an id or an anchor slug so `/explore#the-atelier` and
    // `Service.categoryId` both resolve through one lookup.
    const getSectionById = (id: string | undefined) =>
      id ? sections.find((sec) => sec.id === id || sec.slug === id) : undefined;

    const getSectionServices = (
      sectionId: string,
      audience?: ServiceAudience,
    ): Service[] => {
      const sec = getSectionById(sectionId);
      if (!sec) return [];
      // Add-ons are never standalone cards; they attach inside a parent's sheet.
      return sec.services.filter(
        (s) => !s.isAddon && matchesAudience(s, audience),
      );
    };

    /** Does this service pass the Ladies/Gentlemen filter? */
    const matchesAudience = (s: Service, audience?: ServiceAudience) =>
      !audience || audience === 'unisex'
        ? true
        : s.audience === audience || s.audience === 'unisex';

    const getSections = (
      location: ApiLocation,
      audience?: ServiceAudience,
    ): CatalogSection[] =>
      sections
        // "both" satisfies either surface; a section is otherwise only shown
        // where the backend says it can be delivered.
        .filter((sec) => sec.location === location || sec.location === 'both')
        .map((sec) => ({
          ...sec,
          services: sec.services.filter(
            (s) => !s.isAddon && matchesAudience(s, audience),
          ),
        }));

    /**
     * Flat at-home service list.
     *
     * Delivery location is now a property of the SECTION, not the service —
     * it was uniform across every service in a sub-category, so holding it
     * per-row meant maintaining 43 values to express 8 facts. A `coming_soon`
     * section contributes nothing here: its heading renders, but nothing in it
     * is bookable yet.
     */
    const getAtHomeServices = (audience?: ServiceAudience): Service[] =>
      getSections('home', audience)
        .filter((sec) => sec.status === 'active')
        .flatMap((sec) => sec.services);

    // Resolve the add-on Services a given service offers, from its addonGroups
    // slugs. Add-ons live in the full `services` list (only the grid getters
    // filter them out), so they resolve by id (= their variant_group slug).
    const getAddOnsForService = (service: Service): Service[] =>
      (service.addonGroups ?? [])
        .map((slug) => services.find((s) => s.id === slug))
        .filter((s): s is Service => !!s);

    /**
     * Union of the add-ons every cart line offers, minus anything already in
     * the cart. Eligibility comes from each service's `addon_groups`, so a
     * catalog change is enough to alter it — the previous implementation
     * hardcoded "any somatic-recovery massage unlocks every add-on".
     */
    const getAddOnSuggestions = (cartServiceIds: string[]): Service[] => {
      const inCart = new Set(cartServiceIds);
      const out = new Map<string, Service>();
      for (const id of cartServiceIds) {
        const svc = getService(id);
        if (!svc || svc.isAddon) continue;
        for (const addOn of getAddOnsForService(svc)) {
          if (!inCart.has(addOn.id)) out.set(addOn.id, addOn);
        }
      }
      return [...out.values()];
    };

    const getJourney = (id: string) => packages.find((p) => p.id === id);

    const getFrequentlyAddedSuggestions = (
      cartServiceIds: string[],
      limit = 6,
    ): Service[] => {
      // Delegate to the existing pure helper, but pass our `services` list
      // by temporarily aliasing — legacy helper reads from the hardcoded
      // module-level `services` const, so we re-implement it here against
      // the API-derived list.
      if (cartServiceIds.length === 0) return [];
      const cartSectionIds = new Set<string>();
      const cartIdSet = new Set(cartServiceIds);
      for (const id of cartServiceIds) {
        const svc = getService(id);
        if (svc) cartSectionIds.add(svc.categoryId);
      }
      const sameSection: Service[] = [];
      const crossSection: Service[] = [];
      for (const svc of services) {
        if (cartIdSet.has(svc.id)) continue;
        if (cartSectionIds.has(svc.categoryId)) sameSection.push(svc);
        else crossSection.push(svc);
      }
      const result: Service[] = [];
      for (const svc of sameSection) {
        if (result.length >= limit) break;
        result.push(svc);
      }
      for (const svc of crossSection) {
        if (result.length >= limit) break;
        result.push(svc);
      }
      return result;
    };

    /**
     * Backend-authoritative. Every field is copied from the package row, not
     * recomputed from its members: the server derives them against LIVE member
     * prices on every read, and a second local computation would disagree the
     * moment anything is repriced. The JourneyTotals shape is unchanged so no
     * render site had to move.
     */
    const getJourneyTotals = (journey: Package): JourneyTotals => ({
      totalDuration: journey.durationMin,
      totalPriceFull: journey.originalPrice,
      totalPriceDiscounted: journey.price,
      savingsAed: journey.savingsAmount,
    });

    return {
      status,
      error,
      services,
      sections,
      getSections,
      getSectionById,
      getSectionServices,
      therapists: HARDCODED_THERAPISTS,
      packages,
      journeys: packages,
      getService,
      getTherapist,
      getTherapistsForSection,
      getAtHomeServices,
      getAddOnsForService,
      getAddOnSuggestions,
      getJourney,
      getFrequentlyAddedSuggestions,
      getJourneyTotals,
      channelTree,
      refetch: load,
    };
  }, [state, load]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error(
      'useCatalog must be used inside <CatalogProvider>. Wrap your app root.',
    );
  }
  return ctx;
}
