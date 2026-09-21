// `RitualId` / `Ritual` are gone. Rituals were a frontend-only grouping that
// duplicated the backend sub-category one-for-one (a proven 8↔8 bijection);
// sections now come from `/services` and carry their own copy, imagery, icon
// key and FAQs. See docs/master-cuts/05-catalog-backend-driven-refactor.md.

export type ServiceAudience = 'gentlemen' | 'ladies' | 'unisex';

export type ServiceLocation = 'salon' | 'home' | 'both';

/** Unit a price is quoted in. Absent/"service" = the price covers the line. */
export type PricingUnit = 'service' | 'nail' | 'full_hands';

export interface ServiceVariant {
  id: string;
  /**
   * The customer-facing option label, rendered verbatim. It is NOT necessarily
   * a duration — it may be "60 min", "Gel Polish", "Eyebrows", "Short — Curl".
   * Never parse it; `durationMin` and `price` are independent fields.
   */
  label: string;
  durationMin: number;
  /** Per `pricingUnit`. For "service" this is the whole line price. */
  price: number;
  /** Omitted for ordinary per-service pricing. */
  pricingUnit?: PricingUnit;
}

export interface Service {
  id: string;
  /**
   * The backend sub-category this service belongs to (`department_id`).
   * The only grouping key — resolve the section with `getSectionById`.
   */
  categoryId: string;
  name: string;
  description: string;
  detail?: string;
  highlights?: string[];
  durationMin: number;
  price: number;
  image: string;
  // Optional audience-specific imagery — used when the active audience is
  // known. Falls back to `image` when absent or for unisex contexts.
  imageGents?: string;
  imageLadies?: string;
  audience: ServiceAudience;
  location?: ServiceLocation;
  requiresConsultation?: boolean;
  variants?: ServiceVariant[];
  // Add-on identity + eligibility (data-driven from service_dev via /services).
  // `isAddon` services are hidden from the standalone grid and are only bookable
  // as attachments; `addonGroups` lists the variant_group slugs of the add-ons
  // this service offers inside its selection sheet.
  isAddon?: boolean;
  addonGroups?: string[];
  // True if this service is eligible to appear in the cart's
  // "Frequently added together" section. Currently scoped narrowly per
  // client direction; future services can opt in by setting this flag.
  frequentlyAdded?: boolean;
  // True for enhancement add-ons (e.g. Hot Stone, Cupping) that cannot be
  // booked on their own. Excluded from every standalone booking surface; they
  // surface in the cart only once a parent massage (ritual 'somatic-recovery')
  // is present, and are removed if the last parent massage leaves the cart.
  addOn?: boolean;
}

/**
 * A bundled entry in catalog.ts. Identical to a Service except it has no
 * `categoryId` — it is presentation fallback, not a row in the catalog, so it
 * belongs to no backend sub-category. Only the adapter reads these, and only to
 * fill fields the API left empty.
 */
export type FallbackService = Omit<Service, 'categoryId'>;

export function pickServiceImage(
  service: Pick<Service, 'image' | 'imageGents' | 'imageLadies'>,
  audience: ServiceAudience,
): string {
  if (audience === 'gentlemen' && service.imageGents) return service.imageGents;
  if (audience === 'ladies' && service.imageLadies) return service.imageLadies;
  return service.image;
}

export interface Therapist {
  id: string;
  name: string;
  title: string;
  /** Sub-category ids this therapist covers. The roster is empty today. */
  categoryIds: string[];
  languages: string[];
  image?: string;
  bio?: string;
}

/**
 * A package / "Curated Journey" — a bundle that books as ONE appointment.
 *
 * Backed by a real `service_dev` row since Phase 6.6. Every pricing field here
 * comes from the backend and is AUTHORITATIVE; nothing is recomputed from the
 * member services. See ApiPackage in lib/api/services.ts.
 */
export interface Package {
  id: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  longDescription: string;
  philosophy: string;
  image: string;
  serviceIds: string[];
  /**
   * Percent off, from the backend's derived `savings_percent`. Retained under
   * the original name so the six render sites that print "save N%" did not
   * change. 0 when the backend could not derive one.
   */
  savings: number;
  /** The combo price. What the customer is charged. Backend-authoritative. */
  price: number;
  /**
   * What the appointment occupies. Deliberately NOT the sum of member
   * durations — a combo is scheduled tighter than its parts.
   */
  durationMin: number;
  /** Sum of member prices at their current catalog price. Derived server-side. */
  originalPrice: number;
  /** originalPrice - price, floored at 0. Derived server-side. */
  savingsAmount: number;
  /** Resolved members, for display only. Never priced independently. */
  items: PackageItem[];
  /** A member is missing or deactivated — the backend rejects the booking. */
  incomplete: boolean;
}

/** One service inside a package, as the backend resolved it. */
export interface PackageItem {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  unavailable?: boolean;
  missing?: boolean;
}

export interface CartItem {
  id: string;
  serviceId: string;
  // NOTE: no category/section key here, deliberately. Carts are persisted to
  // localStorage, so every field is a migration risk; the section is derivable
  // from `serviceId` whenever it is needed. Items written by older builds carry
  // a now-unused `ritualId`, which simply hydrates and is ignored.
  name: string;
  durationMin: number;
  price: number;
  image: string;
  therapistPref: string | 'any';
  addedAt: number;
  variantId?: string;
  variantLabel?: string;
  // ── Unit-based pricing ───────────────────────────────────────────────────
  // Present only on a unit-priced line (per-nail work). `price` above stays the
  // LINE TOTAL (unitPrice x units) so every existing total/render keeps working
  // untouched; these two explain how that total was reached and are what the
  // booking sends as `service_units`.
  //
  // Both optional, so carts persisted by older builds hydrate unchanged.
  pricingUnit?: PricingUnit;
  unitPrice?: number;
  units?: number;
  // Set on an add-on line: the cart-item id of the parent service it was
  // attached to. Removing the parent cascades to its add-ons; at booking the
  // link is sent to the backend (service_links) so history renders the grouping.
  parentItemId?: string;
  unavailable?: boolean;
  // Journey bundle — present when this line item represents a curated journey
  journeyId?: string;
  journeyServiceIds?: string[];
  // Which saved guest this service is for. Defaults to the self profile
  // when omitted (e.g. items added pre-login).
  forGuestId?: string;
}

export interface GuestProfile {
  id: string;
  name: string;
  phone?: string;
  relation?: string;
  notes?: string;
  // True for the auto-created profile derived from the account holder.
  // Always pinned to the top of the picker list.
  isSelf?: boolean;
}

export type WaitlistSource = 'date-full' | 'therapist-unavailable';
export type WaitlistTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';

export interface WaitlistRequest {
  id: string;
  createdAt: number;
  guestName: string;
  guestPhone: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeOfDay?: WaitlistTimeOfDay;
  preferredTherapistId?: string;
  // Snapshot in case the therapist is renamed later.
  preferredTherapistName?: string;
  notes?: string;
  source: WaitlistSource;
}

export interface ServiceAddress {
  id: string;
  flatVilla: string;
  landmark?: string;
  label: 'home' | 'other';
  displayAddress: string;
}

export interface GuestDetails {
  name: string;
  phone: string;
  notes?: string;
  address?: ServiceAddress;
}

export interface DraftCheckout {
  date?: string;
  time?: string;
  addressId?: string;
  // Set when the chosen address is outside Imperial Avenue Residences.
  // Surfaces the concierge tooltip in the cart and flags the booking
  // record as requiresConfirmation at submit time.
  outsideImperialAvenue?: boolean;
}

export interface Cart {
  items: CartItem[];
  updatedAt: number;
  draftCheckout?: DraftCheckout;
}

export interface LightAccount {
  name: string;
  // Email is the login identity (OTP target). Phone is the contact number.
  email: string;
  phone: string;
  addresses: ServiceAddress[];
  createdAt: number;
  // Backend auth — populated after a successful OTP verify. Older cached
  // accounts (pre-auth integration) won't have these and are treated as
  // logged-out by the storage loader.
  token: string;
  customerId: string;
}

export interface BookingRecord {
  reference: string;
  items: CartItem[];
  date: string;
  time: string;
  totalDuration: number;
  totalPrice: number;
  guest: GuestDetails;
  createdAt: number;
  status: 'confirmed' | 'cancelled';
  serviceLocation: 'at-home';
  paymentMethod: 'card' | 'apple-pay';
  // True when the booking address is outside Imperial Avenue Residences
  // during the transition period. These bookings receive a personal
  // confirmation call from the concierge before being scheduled.
  requiresConfirmation?: boolean;
  // Snapshot of every guest profile referenced by items at booking time.
  // Preserved here so the confirmation/profile view renders correct names
  // even if a guest is later renamed or removed.
  guests?: GuestProfile[];
}
