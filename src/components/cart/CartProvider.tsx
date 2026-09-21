import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Cart, CartItem, DraftCheckout, GuestDetails, GuestProfile, LightAccount, BookingRecord, ServiceAddress, WaitlistRequest } from '@/lib/booking/types';
import { pickServiceImage } from '@/lib/booking/types';
import { useAudience } from '@/components/services/useAudience';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import {
  CART_KEY,
  loadCart,
  saveCart,
  clearCart,
  loadAccount,
  saveAccount,
  clearAccount,
  loadBookings,
  addBooking,
  cartWasExpired,
  loadGuests,
  saveGuests,
  clearGuests,
  loadWaitlist,
  saveWaitlist,
  clearWaitlist,
} from '@/lib/booking/storage';
import { toDateKey } from '@/lib/booking/availability';
import {
  createBooking,
  listBookings,
  cancelBooking as cancelBookingApi,
  type BookingRecord as ApiBooking,
  type ServiceLink,
  type ServiceUnits,
} from '@/lib/api/bookings';
import { ApiError, NetworkError, toErrorMessage } from '@/lib/api/errors';
import { trackAddToCart } from '@/lib/analytics';

const SELF_GUEST_ID = 'self';

type Surface =
  | 'none'
  | 'cart'
  | 'profile'
  | 'audience-picker'
  | 'service-detail'
  | 'login'
  | 'explore-picker'
  | 'wellness-hub';

export type CheckoutStep = 'none' | 'email-login' | 'otp-verify' | 'address' | 'date-time';

export type DrawerView =
  | { name: 'basket' }
  | { name: 'section-index' }
  | { name: 'section-services'; sectionId: string }
  | { name: 'journey-index' }
  | { name: 'journey-detail'; journeyId: string };

export interface ServiceDetailContext {
  serviceId: string;
}

interface CartContextValue {
  cart: Cart;
  account: LightAccount | null;
  bookings: BookingRecord[];
  surface: Surface;
  serviceDetail: ServiceDetailContext | null;

  // checkout overlay state
  checkoutStep: CheckoutStep;
  setCheckoutStep: (step: CheckoutStep) => void;
  bookingResult: BookingRecord | null;
  resetCheckout: () => void;

  // payment
  paymentMethod: 'card' | 'apple-pay';
  setPaymentMethod: (m: 'card' | 'apple-pay') => void;

  // layered modals (don't disturb the underlying surface)
  isContactEditOpen: boolean;
  openContactEdit: () => void;
  closeContactEdit: () => void;
  isPaymentMethodOpen: boolean;
  closePaymentMethod: () => void;
  // Global search overlay — top-nav search icon opens this full-screen sheet.
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  drawerStack: DrawerView[];
  currentDrawerView: DrawerView;

  // surface control
  openCart: (initialView?: DrawerView) => void;
  closeCart: () => void;
  openCheckout: () => void;
  openLogin: () => void;
  openProfile: () => void;
  openAudiencePicker: (destination?: string) => void;
  audiencePickerDestination: string;
  openExplorePicker: () => void;
  openPaymentMethod: () => void;
  openWellnessHub: () => void;
  openServiceDetail: (serviceId: string) => void;
  closeServiceDetail: () => void;
  closeAll: () => void;
  pushDrawerView: (view: DrawerView) => void;
  popDrawerView: () => void;

  // cart actions
  /**
   * `units` applies only to a unit-priced variant (per nail); it is ignored for
   * ordinary services, whose price already covers the whole line.
   *
   * `options.silentAnalytics` suppresses the `add_to_cart` event for adds that
   * are not a new purchase intent — currently only swapping the variant on a
   * line already in the cart. The cart behaviour is unchanged either way.
   */
  addToCart: (serviceId: string, therapistPref?: string | 'any', variantId?: string, parentItemId?: string, units?: number, options?: { silentAnalytics?: boolean }) => string | null;
  addJourneyToCart: (journeyId: string) => boolean;
  removeItem: (itemId: string) => void;
  updateTherapistPref: (itemId: string, therapistPref: string | 'any') => void;
  clearAll: () => void;

  // guest profiles — saved name/phone records for booking on behalf of others.
  // The "self" profile is auto-derived from the LightAccount and pinned.
  guestProfiles: GuestProfile[];
  addGuestProfile: (input: { name: string; phone?: string; relation?: string; notes?: string }) => string;
  updateGuestProfile: (id: string, patch: Partial<Omit<GuestProfile, 'id' | 'isSelf'>>) => void;
  removeGuestProfile: (id: string) => void;
  setItemGuest: (itemId: string, guestId: string) => void;
  getGuestForItem: (item: CartItem) => GuestProfile | undefined;

  // waitlist — persisted requests to be notified if a slot opens up on a
  // specific date (with optional therapist preference).
  waitlistRequests: WaitlistRequest[];
  addWaitlistRequest: (input: Omit<WaitlistRequest, 'id' | 'createdAt'>) => WaitlistRequest;
  removeWaitlistRequest: (id: string) => void;
  hasWaitlistFor: (dateKey: string, therapistId?: string) => boolean;

  // checkout state
  updateDraftCheckout: (draft: Partial<DraftCheckout>) => void;
  confirmBooking: () => Promise<BookingRecord>;
  getSelectedAddress: () => ServiceAddress | null;

  // account
  saveLightAccount: (account: LightAccount) => void;
  signOut: () => void;

  // server-fetched bookings (source of truth when signed in)
  remoteBookings: ApiBooking[] | null;
  bookingsLoading: boolean;
  bookingsError: string | null;
  refreshBookings: () => void;
  /** Cancel a future booking by its id, then refresh the server list. */
  cancelBooking: (id: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const emptyCart: Cart = { items: [], updatedAt: Date.now() };
const BASKET_VIEW: DrawerView = { name: 'basket' };
const SECTION_INDEX_VIEW: DrawerView = { name: 'section-index' };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getService, getJourney, getSectionById } = useCatalog();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [account, setAccount] = useState<LightAccount | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [remoteBookings, setRemoteBookings] = useState<ApiBooking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [surface, setSurface] = useState<Surface>('none');
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('none');
  const [bookingResult, setBookingResult] = useState<BookingRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay'>('card');
  const [isContactEditOpen, setIsContactEditOpen] = useState(false);
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [drawerStack, setDrawerStack] = useState<DrawerView[]>([]);
  const [serviceDetail, setServiceDetail] = useState<ServiceDetailContext | null>(null);
  const [audiencePickerDestination, setAudiencePickerDestination] = useState<string>('/explore');
  const [guestProfiles, setGuestProfiles] = useState<GuestProfile[]>([]);
  const [waitlistRequests, setWaitlistRequests] = useState<WaitlistRequest[]>([]);
  const [audience] = useAudience();
  const audienceRef = useRef(audience);
  audienceRef.current = audience;
  const hydratedRef = useRef(false);
  const guestsHydratedRef = useRef(false);
  const waitlistHydratedRef = useRef(false);
  const cartItemCountRef = useRef(0);

  cartItemCountRef.current = cart.items.length;

  // Hydrate from localStorage on mount
  useEffect(() => {
    const expired = cartWasExpired();
    const loaded = loadCart();
    if (loaded) {
      setCart(loaded);
    } else if (expired) {
      toast.info('Your cart has been cleared after 24 hours of rest.');
    }
    setAccount(loadAccount());
    setBookings(loadBookings());
    setGuestProfiles(loadGuests());
    // Drop waitlist entries whose preferred date has already passed so the
    // list stays meaningful on return visits.
    const todayKey = toDateKey(new Date());
    const loadedWaitlist = loadWaitlist().filter(
      (r) => r.preferredDate >= todayKey
    );
    setWaitlistRequests(loadedWaitlist);
    hydratedRef.current = true;
    guestsHydratedRef.current = true;
    waitlistHydratedRef.current = true;
  }, []);

  // Persist cart whenever it changes (but not on the initial hydration pass)
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (cart.items.length === 0 && !cart.draftCheckout) {
      clearCart();
    } else {
      saveCart(cart);
    }
  }, [cart]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CART_KEY) return;
      const next = loadCart();
      if (next) setCart(next);
      else setCart(emptyCart);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Body scroll lock when any surface is open
  useEffect(() => {
    if (surface === 'none') {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [surface]);

  const addToCart = useCallback<CartContextValue['addToCart']>(
    (serviceId, therapistPref = 'any', variantId, parentItemId, units, options) => {
      const service = getService(serviceId);
      if (!service) {
        toast.error('Service not found');
        return null;
      }

      // Resolve variant (if any) — variantId > default first variant > flat service values
      const variants = service.variants ?? [];
      const selectedVariant =
        variants.find((v) => v.id === variantId) ?? variants[0] ?? null;
      const effectiveDuration = selectedVariant?.durationMin ?? service.durationMin;
      const effectiveVariantId = selectedVariant?.id;
      const effectiveVariantLabel = selectedVariant?.label;

      // Unit pricing: the variant's `price` is a RATE, so the line price is
      // rate x units. Ordinary variants have no pricingUnit and keep their
      // price verbatim, exactly as before.
      const unit = selectedVariant?.pricingUnit;
      const isUnitPriced = !!unit && unit !== 'service';
      const unitRate = selectedVariant?.price ?? service.price;
      const unitQty = isUnitPriced ? Math.max(1, Math.floor(units ?? 1)) : 1;
      const effectivePrice = isUnitPriced ? unitRate * unitQty : unitRate;

      // Generate the id up front so we can return it — the caller links add-ons
      // to their parent via this id (passed back in as parentItemId).
      const newId = crypto.randomUUID();
      let added = false;
      setCart((prev) => {
        if (prev.items.length >= 10) {
          toast.warning('Your cart is generously full \u2014 please complete this booking first.');
          return prev;
        }
        const item: CartItem = {
          id: newId,
          serviceId: service.id,          name: service.name,
          durationMin: effectiveDuration,
          price: effectivePrice,
          image: pickServiceImage(service, audienceRef.current),
          therapistPref,
          variantId: effectiveVariantId,
          variantLabel: effectiveVariantLabel,
          // Only on genuinely unit-priced lines, so ordinary items persist the
          // same shape they always have (and older carts hydrate unchanged).
          ...(isUnitPriced
            ? { pricingUnit: unit, unitPrice: unitRate, units: unitQty }
            : {}),
          parentItemId,
          addedAt: Date.now(),
        };
        added = true;
        // Add-ons are added alongside their parent — the parent's toast covers
        // the action, so stay quiet for the attached add-on lines.
        if (!parentItemId) {
          toast.success(
            effectiveVariantLabel
              ? `Added · ${service.name} · ${effectiveVariantLabel}`
              : `Added · ${service.name}`
          );
        }
        return { ...prev, items: [...prev.items, item], updatedAt: Date.now() };
      });

      // Analytics — outside the updater on purpose. `<StrictMode>` double-
      // invokes state updaters in development, so pushing from inside would
      // double-count every add. `added` is false when a guard above rejected
      // the add (cart full), so a blocked add reports nothing.
      if (added && !options?.silentAnalytics) {
        // Unit-priced lines quote a RATE: send the rate as `price` and the unit
        // count as `quantity`, never the line total, because GA4 multiplies the
        // two. Ordinary lines are a flat price at quantity 1.
        trackAddToCart([
          {
            item_id: service.id,
            item_name: service.name,
            price: isUnitPriced ? unitRate : effectivePrice,
            quantity: unitQty,
            item_variant: effectiveVariantLabel,
            item_category: getSectionById(service.categoryId)?.name,
          },
        ]);
      }

      return added ? newId : null;
    },
    [getService, getSectionById]
  );

  const addJourneyToCart = useCallback<CartContextValue['addJourneyToCart']>(
    (journeyId) => {
      const journey = getJourney(journeyId);
      if (!journey) {
        toast.error('Journey not found');
        return false;
      }
      // The backend rejects a package whose member was deactivated or deleted
      // (400, naming the member) rather than booking a shrunken package. Catch
      // it at add-to-cart so the customer is not told at checkout.
      if (journey.incomplete) {
        toast.error(`${journey.name} is temporarily unavailable`);
        return false;
      }

      let added = false;
      setCart((prev) => {
        // The package id IS a real service id since Phase 6.6 — no synthetic
        // `journey:<id>` prefix, because the booking now sends this id itself.
        const existing = prev.items.find((i) => i.serviceId === journey.id);
        if (existing) {
          toast.info(`${journey.name} is already in your cart`);
          return prev;
        }
        if (prev.items.length >= 10) {
          toast.warning('Your cart is generously full — please complete this booking first.');
          return prev;
        }
        const item: CartItem = {
          id: crypto.randomUUID(),
          serviceId: journey.id,
          name: journey.name,
          // Backend-authoritative, copied verbatim. The package row carries its
          // own duration (a combo is scheduled tighter than its parts) and its
          // own price (the combo price the booking actually charges).
          durationMin: journey.durationMin,
          price: journey.price,
          image: journey.image,
          therapistPref: 'any',
          journeyId: journey.id,
          journeyServiceIds: journey.serviceIds,
          addedAt: Date.now(),
        };
        added = true;
        toast.success(`Added · ${journey.name}`);
        return { ...prev, items: [...prev.items, item], updatedAt: Date.now() };
      });

      // See the note in `addToCart`. `added` stays false when the journey was
      // already in the cart or the cart was full, so neither reports an add.
      // A package is reported as ONE item at its combo price — the price the
      // customer is charged. Its members are display-only and never priced
      // independently, so emitting them would double-count the revenue.
      if (added) {
        trackAddToCart([
          {
            item_id: journey.id,
            item_name: journey.name,
            price: journey.price,
            quantity: 1,
            item_category: journey.category,
          },
        ]);
      }

      return added;
    },
    [getJourney]
  );

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      // Remove the item and cascade to any add-ons attached to it — an add-on
      // line can never outlive the parent service it was booked with.
      const items = prev.items.filter(
        (i) => i.id !== itemId && i.parentItemId !== itemId,
      );
      return { ...prev, items, updatedAt: Date.now() };
    });
  }, []);

  const updateTherapistPref = useCallback((itemId: string, therapistPref: string | 'any') => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, therapistPref } : i)),
      updatedAt: Date.now(),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setCart({ items: [], updatedAt: Date.now() });
  }, []);

  // Persist guest profiles after hydration.
  useEffect(() => {
    if (!guestsHydratedRef.current) return;
    if (guestProfiles.length === 0) {
      clearGuests();
    } else {
      saveGuests(guestProfiles);
    }
  }, [guestProfiles]);

  // Mirror the account holder into a pinned "self" guest profile. Created
  // on first login and kept in sync if the user edits their name/phone.
  useEffect(() => {
    if (!account) return;
    setGuestProfiles((prev) => {
      const idx = prev.findIndex((g) => g.isSelf);
      const selfDraft: GuestProfile = {
        id: SELF_GUEST_ID,
        name: account.name?.trim() || 'You',
        phone: account.phone,
        isSelf: true,
      };
      if (idx === -1) return [selfDraft, ...prev];
      const existing = prev[idx];
      if (existing.name === selfDraft.name && existing.phone === selfDraft.phone) {
        return prev;
      }
      return prev.map((g, i) => (i === idx ? { ...g, ...selfDraft } : g));
    });
  }, [account]);

  const addGuestProfile = useCallback<CartContextValue['addGuestProfile']>(
    ({ name, phone, relation, notes }) => {
      const id = crypto.randomUUID();
      setGuestProfiles((prev) => [
        ...prev,
        { id, name: name.trim(), phone: phone?.trim(), relation, notes },
      ]);
      return id;
    },
    []
  );

  const updateGuestProfile = useCallback<CartContextValue['updateGuestProfile']>(
    (id, patch) => {
      setGuestProfiles((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
      );
    },
    []
  );

  const removeGuestProfile = useCallback((id: string) => {
    if (id === SELF_GUEST_ID) return; // self profile is not removable
    setGuestProfiles((prev) => prev.filter((g) => g.id !== id));
    // Clear forGuestId on any cart items pointing at this guest — they
    // fall back to the self default.
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.forGuestId === id ? { ...i, forGuestId: undefined } : i
      ),
      updatedAt: Date.now(),
    }));
  }, []);

  const setItemGuest = useCallback((itemId: string, guestId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, forGuestId: guestId } : i
      ),
      updatedAt: Date.now(),
    }));
  }, []);

  const getGuestForItem = useCallback(
    (item: CartItem): GuestProfile | undefined => {
      const targetId = item.forGuestId ?? SELF_GUEST_ID;
      return guestProfiles.find((g) => g.id === targetId);
    },
    [guestProfiles]
  );

  // Persist waitlist after hydration. Cleared key (not empty array) when the
  // list is empty so the localStorage stays tidy.
  useEffect(() => {
    if (!waitlistHydratedRef.current) return;
    if (waitlistRequests.length === 0) {
      clearWaitlist();
    } else {
      saveWaitlist(waitlistRequests);
    }
  }, [waitlistRequests]);

  const addWaitlistRequest = useCallback<CartContextValue['addWaitlistRequest']>(
    (input) => {
      const entry: WaitlistRequest = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      setWaitlistRequests((prev) => [entry, ...prev]);
      return entry;
    },
    []
  );

  const removeWaitlistRequest = useCallback((id: string) => {
    setWaitlistRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const hasWaitlistFor = useCallback(
    (dateKey: string, therapistId?: string): boolean => {
      return waitlistRequests.some((r) => {
        if (r.preferredDate !== dateKey) return false;
        if (therapistId) {
          return r.preferredTherapistId === therapistId;
        }
        // date-only query: match the date-full source (no therapist scope).
        return !r.preferredTherapistId;
      });
    },
    [waitlistRequests]
  );

  const updateDraftCheckout = useCallback((draft: Partial<DraftCheckout>) => {
    setCart((prev) => ({
      ...prev,
      draftCheckout: { ...(prev.draftCheckout ?? {}), ...draft },
      updatedAt: Date.now(),
    }));
  }, []);

  const getSelectedAddress = useCallback((): ServiceAddress | null => {
    const addressId = cart.draftCheckout?.addressId;
    if (!addressId || !account) return null;
    return account.addresses.find((a) => a.id === addressId) ?? null;
  }, [cart, account]);

  const confirmBooking = useCallback(async (): Promise<BookingRecord> => {
    const items = cart.items;
    if (items.length === 0) {
      throw new Error('Cannot confirm — cart is empty');
    }
    const draft = cart.draftCheckout;
    const date = draft?.date;
    const time = draft?.time;
    if (!date || !time) {
      throw new Error('Cannot confirm — date/time not selected');
    }
    if (!account) {
      throw new Error('Cannot confirm — no account');
    }
    if (!account.token) {
      throw new Error('Cannot confirm — not signed in (no auth token)');
    }

    const address = getSelectedAddress();

    const guest: GuestDetails = {
      name: account.name,
      phone: account.phone,
      address: address ?? undefined,
    };

    // Build the API payload. Book the selected variant's REAL backend id.
    // `serviceId` is the stable variant_group slug (UI identity), so it is not
    // bookable on its own — `variantId` carries the chosen duration's backend
    // service id. Every cart item has a variantId (adapter always builds
    // variants[]); the `?? serviceId` guard is a defensive fallback only.
    const bookedId = (it: CartItem) => it.variantId ?? it.serviceId;
    // Shared with the availability grid (see resolveBookedServiceIds) so the
    // slots we offered are computed from the exact ids we now reserve.
    const serviceIds = resolveBookedServiceIds(items);
    const serviceLinks: ServiceLink[] = [];
    for (const item of items) {
      // Add-on line → record its parent's booked id so the backend persists the
      // grouping (both still ship as flat service_ids for capacity/pricing).
      // Journey items never carry parentItemId, so skipping them here matches
      // the expansion resolveBookedServiceIds already did.
      if (item.parentItemId) {
        const parent = items.find((i) => i.id === item.parentItemId);
        if (parent) {
          serviceLinks.push({
            service_id: bookedId(item),
            parent_service_id: bookedId(parent),
          });
        }
      }
    }

    // Unit quantities for unit-priced lines (per nail). Ordinary lines carry no
    // `units`, so an ordinary cart produces an empty list and the field is
    // omitted from the payload entirely.
    const serviceUnits: ServiceUnits[] = items
      .filter((it) => it.pricingUnit && it.pricingUnit !== 'service' && (it.units ?? 1) > 1)
      .map((it) => ({ service_id: bookedId(it), units: it.units as number }));

    // Address is a structured ServiceAddress on the frontend; the backend
    // accepts an opaque string today. Serialise to a one-line label.
    const addressLine = address
      ? [address.flatVilla, address.landmark, address.displayAddress]
          .filter(Boolean)
          .join(', ')
      : undefined;

    let apiResult;
    try {
      apiResult = await createBooking(
        {
          service_ids: serviceIds,
          date,
          slot_time: time,
          customer_name: account.name || guest.name,
          customer_email: account.email || undefined,
          customer_mobile: account.phone || guest.phone || undefined,
          customer_address: addressLine,
          service_links: serviceLinks.length > 0 ? serviceLinks : undefined,
          service_units: serviceUnits.length > 0 ? serviceUnits : undefined,
        },
        account.token,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          toast.error('That slot just filled up — pick another time.');
        } else if (err.statusCode === 400) {
          toast.error(err.message || 'Booking details were rejected.');
        } else if (err.statusCode === 401) {
          toast.error('Session expired. Please sign in again.');
        } else {
          toast.error(`Booking failed (${err.statusCode}): ${err.message}`);
        }
      } else if (err instanceof NetworkError) {
        toast.error(err.message);
      } else {
        toast.error('Booking failed. Please try again.');
      }
      throw err;
    }

    const subtotal = items.reduce((s, i) => s + i.price, 0);

    // Snapshot the set of guest profiles actually referenced by items in
    // this booking — keeps the confirmation/profile view correct even if
    // the user later renames or removes a guest.
    const referencedGuestIds = new Set(
      items.map((i) => i.forGuestId ?? SELF_GUEST_ID)
    );
    const guestSnapshot = guestProfiles.filter((g) =>
      referencedGuestIds.has(g.id)
    );

    const requiresConfirmation = !!cart.draftCheckout?.outsideImperialAvenue;

    // Use the API booking_token as the user-facing reference. Keep cart
    // items snapshot locally so SuccessState can show line-item detail
    // (the API only returns the per-service snapshot, not the cart-level
    // guest/variant labels we want to render back).
    const booking: BookingRecord = {
      reference: apiResult.booking.booking_token,
      items,
      date,
      time,
      totalDuration: apiResult.booking.total_duration_min,
      totalPrice: apiResult.booking.total_price || subtotal,
      guest,
      createdAt: Date.now(),
      status: 'confirmed',
      serviceLocation: 'at-home',
      paymentMethod,
      requiresConfirmation: requiresConfirmation || undefined,
      guests: guestSnapshot.length > 0 ? guestSnapshot : undefined,
    };
    addBooking(booking);
    setBookings(loadBookings());
    setCart({ items: [], updatedAt: Date.now() });
    setBookingResult(booking);
    return booking;
  }, [cart, account, paymentMethod, getSelectedAddress, guestProfiles]);

  const saveLightAccount = useCallback((next: LightAccount) => {
    saveAccount(next);
    setAccount(next);
  }, []);

  const signOut = useCallback(() => {
    clearAccount();
    setAccount(null);
    setGuestProfiles([]);
    clearGuests();
    setWaitlistRequests([]);
    clearWaitlist();
    setRemoteBookings(null);
    setBookingsError(null);
  }, []);

  // Fetch the customer's bookings from the server (source of truth when signed
  // in). Local bookings remain an offline fallback if this fails.
  const refreshBookings = useCallback(async () => {
    const token = account?.token;
    if (!token) {
      setRemoteBookings(null);
      return;
    }
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const { bookings: list } = await listBookings(token);
      setRemoteBookings(list);
    } catch (err) {
      setBookingsError(toErrorMessage(err, 'Could not load your bookings.'));
    } finally {
      setBookingsLoading(false);
    }
  }, [account?.token]);

  const cancelBooking = useCallback(
    async (id: string) => {
      const token = account?.token;
      if (!token) throw new Error('Cannot cancel — not signed in');
      await cancelBookingApi(id, token);
      await refreshBookings();
    },
    [account?.token, refreshBookings],
  );

  // Auto-load on login / token change; clear on sign-out.
  useEffect(() => {
    if (account?.token) void refreshBookings();
    else setRemoteBookings(null);
  }, [account?.token, refreshBookings]);

  // openCart picks a sensible default based on cart state, and when opening
  // directly into a section-services view it prepends section-index so the back
  // button has a natural destination.
  const openCart = useCallback((initialView?: DrawerView) => {
    const view =
      initialView ??
      (cartItemCountRef.current === 0 ? SECTION_INDEX_VIEW : BASKET_VIEW);

    const stack: DrawerView[] =
      view.name === 'section-services' ? [SECTION_INDEX_VIEW, view] : [view];

    setDrawerStack(stack);
    setSurface('cart');
  }, []);

  const closeCart = useCallback(() => {
    setSurface('none');
    setDrawerStack([]);
    setCheckoutStep('none');
    setBookingResult(null);
  }, []);

  const openCheckout = useCallback(() => {
    if (!account) {
      setCheckoutStep('email-login');
    } else if (account.addresses.length > 0) {
      // Auto-select first saved address and skip to date-time
      const firstAddr = account.addresses[0];
      setCart((prev) => ({
        ...prev,
        draftCheckout: { ...(prev.draftCheckout ?? {}), addressId: firstAddr.id },
        updatedAt: Date.now(),
      }));
      setCheckoutStep('date-time');
    } else {
      setCheckoutStep('address');
    }
  }, [account]);

  const resetCheckout = useCallback(() => {
    setCheckoutStep('none');
    setBookingResult(null);
    setPaymentMethod('card');
  }, []);
  const openLogin = useCallback(() => {
    setSurface('login');
    setCheckoutStep('email-login');
  }, []);
  const openProfile = useCallback(() => setSurface('profile'), []);
  const openAudiencePicker = useCallback((destination = '/explore') => {
    setAudiencePickerDestination(destination);
    setSurface('audience-picker');
  }, []);
  const openExplorePicker = useCallback(() => setSurface('explore-picker'), []);
  const openPaymentMethod = useCallback(() => setIsPaymentMethodOpen(true), []);
  const closePaymentMethod = useCallback(() => setIsPaymentMethodOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openContactEdit = useCallback(() => setIsContactEditOpen(true), []);
  const closeContactEdit = useCallback(() => setIsContactEditOpen(false), []);
  const openWellnessHub = useCallback(() => setSurface('wellness-hub'), []);
  const openServiceDetail = useCallback<CartContextValue['openServiceDetail']>(
    (serviceId) => {
      setServiceDetail({ serviceId });
      setSurface('service-detail');
    },
    []
  );
  const closeServiceDetail = useCallback(() => {
    setSurface('none');
    setServiceDetail(null);
  }, []);
  const closeAll = useCallback(() => {
    setSurface('none');
    setDrawerStack([]);
    setServiceDetail(null);
    setCheckoutStep('none');
    setBookingResult(null);
    setPaymentMethod('card');
    setIsContactEditOpen(false);
    setIsPaymentMethodOpen(false);
  }, []);

  const pushDrawerView = useCallback((view: DrawerView) => {
    setDrawerStack((prev) => [...prev, view]);
  }, []);

  const popDrawerView = useCallback(() => {
    setDrawerStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const currentDrawerView = useMemo<DrawerView>(
    () => drawerStack[drawerStack.length - 1] ?? BASKET_VIEW,
    [drawerStack]
  );

  const value: CartContextValue = {
    cart,
    account,
    bookings,
    remoteBookings,
    bookingsLoading,
    bookingsError,
    refreshBookings,
    cancelBooking,
    surface,
    serviceDetail,
    checkoutStep,
    setCheckoutStep,
    bookingResult,
    resetCheckout,
    paymentMethod,
    setPaymentMethod,
    isContactEditOpen,
    openContactEdit,
    closeContactEdit,
    isPaymentMethodOpen,
    closePaymentMethod,
    isSearchOpen,
    openSearch,
    closeSearch,
    drawerStack,
    currentDrawerView,
    openCart,
    closeCart,
    openCheckout,
    openLogin,
    openProfile,
    openAudiencePicker,
    audiencePickerDestination,
    openExplorePicker,
    openPaymentMethod,
    openWellnessHub,
    openServiceDetail,
    closeServiceDetail,
    closeAll,
    pushDrawerView,
    popDrawerView,
    addToCart,
    addJourneyToCart,
    removeItem,
    updateTherapistPref,
    clearAll,
    guestProfiles,
    addGuestProfile,
    updateGuestProfile,
    removeGuestProfile,
    setItemGuest,
    getGuestForItem,
    waitlistRequests,
    addWaitlistRequest,
    removeWaitlistRequest,
    hasWaitlistFor,
    updateDraftCheckout,
    confirmBooking,
    getSelectedAddress,
    saveLightAccount,
    signOut,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export function useCartTotals() {
  const { cart } = useCart();
  return useMemo(() => {
    const totalPrice = cart.items.reduce((s, i) => s + i.price, 0);
    const totalDuration = cart.items.reduce((s, i) => s + i.durationMin, 0);
    return {
      totalPrice,
      totalDuration,
      count: cart.items.length,
    };
  }, [cart]);
}

/**
 * The flat list of REAL backend service ids this cart books, in order and
 * keeping duplicates — the same list `confirmBooking` posts as `service_ids`.
 *
 * Shared deliberately: `/availability` must be asked about the exact same set
 * of services the booking will reserve, or the grid offers start times that
 * `reserveSpan` then rejects with a 409. Since Phase 6.6 a package books under
 * its own id (one line, combo price, package duration); every other item books
 * its selected variant's id.
 */
export function resolveBookedServiceIds(items: CartItem[]): string[] {
  const bookedId = (it: CartItem) => it.variantId ?? it.serviceId;
  // A package books as ONE line under its own id — it is a real service row
  // whose price IS the combo price and whose duration is what the appointment
  // occupies. It is NOT expanded into its members.
  //
  // Expanding was the old behaviour, and it was a live pricing bug: the cart
  // displayed the discounted total while the booking sent the member ids, so
  // the backend priced each one at full rate and the discount was never
  // actually charged. It also reserved the sum of member durations instead of
  // the (shorter) package duration.
  //
  // `journeyServiceIds` is still carried on the item for display, and older
  // carts rehydrated from localStorage may still hold a synthetic
  // `journey:<id>` serviceId — those resolve to nothing server-side and are
  // rejected as an invalid service id rather than silently mispriced.
  return items.map(bookedId);
}

/** Stable, memoised `resolveBookedServiceIds` over the live cart. */
export function useCartServiceIds(): string[] {
  const { cart } = useCart();
  return useMemo(() => resolveBookedServiceIds(cart.items), [cart.items]);
}

export function formatAed(value: number): string {
  return `AED ${(value ?? 0).toLocaleString('en-AE')}`;
}

// 2-decimal variant for VAT-inclusive payment breakdowns, where the
// derived subtotal and VAT have fractional values.
export function formatAedPrecise(value: number): string {
  return `AED ${(value ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
