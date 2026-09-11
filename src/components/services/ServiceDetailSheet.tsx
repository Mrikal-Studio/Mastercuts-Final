import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Check, ArrowUpRight, HeartHandshake, Hourglass, Leaf } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCart, formatAed, formatDuration } from '@/components/cart/CartProvider';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { pickServiceImage, type PricingUnit } from '@/lib/booking/types';
import { useAudience } from '@/components/services/useAudience';
import { cn } from '@/lib/utils';

/** Counts offered for a unit-priced option. Ten covers a full set of nails. */
const UNIT_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Customer-facing noun for a pricing unit, singular or plural. */
function unitNoun(unit: PricingUnit, count: number): string {
  if (unit === 'nail') return count === 1 ? 'nail' : 'nails';
  if (unit === 'full_hands') return 'full hands';
  return count === 1 ? 'service' : 'services';
}

/**
 * True when a label already reads as a duration ("60 min", "90 mins"), so the
 * pill doesn't print the duration twice. Presentation only — the label itself
 * is never parsed for a value, and a non-match simply shows both parts.
 */
function isDurationLabel(label: string): boolean {
  return /^\s*\d+\s*min/i.test(label);
}

export function ServiceDetailSheet() {
  const {
    surface,
    serviceDetail,
    closeServiceDetail,
    openServiceDetail,
    cart,
    addToCart,
    removeItem,
  } = useCart();
  const open = surface === 'service-detail' && !!serviceDetail;
  const {
    getService,
    getSectionById,
    getSectionServices,
    getTherapistsForSection,
    getAddOnsForService,
  } = useCatalog();

  const service = useMemo(
    () => (serviceDetail ? getService(serviceDetail.serviceId) : undefined),
    [serviceDetail, getService]
  );
  /**
   * The section is derived from the SERVICE, not passed in alongside it. That
   * removes the second argument from openServiceDetail and, more importantly,
   * removes the failure mode where a caller supplying a stale/unknown grouping
   * key made the whole sheet render nothing (see the guard below).
   */
  const section = useMemo(
    () => getSectionById(service?.categoryId),
    [service, getSectionById]
  );
  const therapists = useMemo(
    () => (section ? getTherapistsForSection(section.id) : []),
    [section, getTherapistsForSection]
  );
  const relatedServices = useMemo(() => {
    if (!section || !serviceDetail) return [];
    return getSectionServices(section.id).filter(
      (s) => s.id !== serviceDetail.serviceId
    );
  }, [section, serviceDetail, getSectionServices]);

  const cartItem = cart.items.find((i) => i.serviceId === serviceDetail?.serviceId);
  const inCart = !!cartItem;
  const [audience] = useAudience();

  const variants = service?.variants ?? [];
  const hasVariants = variants.length > 1;
  const defaultVariantId = variants[0]?.id;

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    cartItem?.variantId ?? defaultVariantId
  );

  // How many units of a unit-priced option (e.g. nails). Ignored entirely for
  // ordinary per-service options, which never render the picker.
  const [unitCount, setUnitCount] = useState<number>(cartItem?.units ?? 1);

  // Eligible add-ons for this service (empty for add-ons themselves and for
  // services with no addon_groups). Checkbox selection is local to the sheet
  // and reset whenever a different service is opened.
  const addOns = service ? getAddOnsForService(service) : [];
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    setSelectedVariantId(cartItem?.variantId ?? defaultVariantId);
  }, [cartItem?.variantId, defaultVariantId, serviceDetail?.serviceId]);

  useEffect(() => {
    setSelectedAddOnIds(new Set());
  }, [serviceDetail?.serviceId]);

  // Reset the unit count when a different option (or service) is opened —
  // "5 nails" must not carry over onto an unrelated selection.
  useEffect(() => {
    setUnitCount(cartItem?.units ?? 1);
  }, [selectedVariantId, serviceDetail?.serviceId, cartItem?.units]);

  // Deliberately NOT gated on `section`. It used to be gated on `ritual`, which
  // meant an unresolvable grouping key blanked the entire sheet — price,
  // variants, add-ons and the Add button included — rather than degrading. The
  // section only supplies the breadcrumb, FAQs and related list, each of which
  // is individually optional below.
  if (!service || !serviceDetail) return null;

  const toggleAddOn = (id: string) =>
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;
  const displayDuration = selectedVariant?.durationMin ?? service.durationMin;

  // Unit-priced options (per nail) quote a RATE, so the price shown depends on
  // how many units the customer picks. Ordinary options have no unit and this
  // whole branch stays inert.
  const pricingUnit = selectedVariant?.pricingUnit;
  const isUnitPriced = !!pricingUnit && pricingUnit !== 'service';
  const unitRate = selectedVariant?.price ?? service.price;
  const displayPrice = isUnitPriced ? unitRate * unitCount : unitRate;

  const handlePillClick = (variantId: string) => {
    setSelectedVariantId(variantId);
    if (inCart && variantId !== cartItem?.variantId) {
      // Switching option while in-cart re-adds at the new option; a unit count
      // from the previous option does not carry over (the effect above resets
      // it), so this intentionally re-adds at the default quantity.
      // Not reported as `add_to_cart`: the guest is amending a line already in
      // the cart, not adding a new one.
      addToCart(service.id, 'any', variantId, undefined, undefined, {
        silentAnalytics: true,
      });
    }
  };

  const handleCta = () => {
    if (inCart && cartItem) {
      removeItem(cartItem.id);
      return;
    }
    // Add the parent first; its returned cart-item id links the checked add-ons.
    const parentItemId = addToCart(
      service.id,
      'any',
      selectedVariantId,
      undefined,
      isUnitPriced ? unitCount : undefined,
    );
    if (parentItemId) {
      for (const addOn of addOns) {
        if (selectedAddOnIds.has(addOn.id)) {
          addToCart(addOn.id, 'any', addOn.variants?.[0]?.id, parentItemId);
        }
      }
      closeServiceDetail();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : closeServiceDetail())}>
      <SheetContent
        side="bottom"
        hideDefaultClose
        className="bg-bg-primary text-text-primary border-none p-0 flex flex-col max-h-[92vh] rounded-t-3xl overflow-hidden"
      >
        {/* Close button — dark glass pill so the white icon is visible against
            both the dark hero image and the light body once scrolled past. */}
        <button
          type="button"
          onClick={closeServiceDetail}
          aria-label="Close"
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Grabber handle */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-10 h-1 rounded-full bg-black/25" />

        <div className="overflow-y-auto overflow-x-hidden flex-1">
          {/* ───────── Hero ───────── */}
          <section className="relative h-[52vh] min-h-[360px] w-full overflow-hidden">
            <motion.div
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={pickServiceImage(service, audience)}
                alt={service.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/20 via-bg-dark/10 to-bg-dark" />
            </motion.div>

            {/* Hero content */}
            <div className="absolute inset-x-0 bottom-0 px-6 lg:px-10 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                className="max-w-3xl"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/60 mb-3">
                  {[section?.shortName, section?.name].filter(Boolean).join(" · ")}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[0.98] mb-4 text-white">
                  {service.name}
                </h1>
                <p className="text-sm lg:text-base text-white/70 max-w-xl leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            </div>
          </section>

          {/* ───────── Body grid: booking aside + descriptive content ───────── */}
          <div className="px-6 lg:px-10 pt-8 pb-10 lg:grid lg:grid-cols-12 lg:gap-12">
            {/* Booking aside — DOM-first so mobile shows it above content, visually right-column on lg */}
            <aside className="mb-10 lg:mb-0 lg:col-span-5 lg:col-start-8 lg:row-start-1">
              <div className="lg:sticky lg:top-6">
                <div className="border border-black/10 rounded-2xl p-6 lg:p-7 bg-white">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                    Reserve this service
                  </p>
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-serif text-4xl lg:text-5xl text-text-primary">
                      {formatAed(displayPrice)}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {formatDuration(displayDuration)}
                    </span>
                  </div>

                  {hasVariants && (
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-3">
                        Choose an option
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((v) => {
                          const isActive = v.id === selectedVariantId;
                          const perUnit = !!v.pricingUnit && v.pricingUnit !== 'service';
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handlePillClick(v.id)}
                              className={cn(
                                'flex flex-col items-center px-4 py-3 rounded-xl border transition-all min-w-[5rem]',
                                isActive
                                  ? 'bg-bg-dark text-white border-bg-dark'
                                  : 'bg-transparent text-text-primary/80 border-black/15 hover:border-black/40 hover:text-text-primary'
                              )}
                            >
                              {/* The option's own label, rendered verbatim —
                                  "90 min", "Gel Polish", "Short — Curl". Never
                                  parsed, and never replaced by the duration. */}
                              <span className="text-sm font-medium">{v.label}</span>
                              <span
                                className={cn(
                                  'text-[10px] uppercase tracking-[0.16em] mt-1',
                                  isActive ? 'text-white/60' : 'text-text-secondary'
                                )}
                              >
                                {formatAed(v.price)}
                                {perUnit ? ` / ${unitNoun(v.pricingUnit!, 1)}` : ''}
                                {/* Duration is shown alongside the label only
                                    when the label isn't already the duration,
                                    so pure duration variants don't read
                                    "60 min · 60 min". */}
                                {v.durationMin && !isDurationLabel(v.label)
                                  ? ` · ${v.durationMin} min`
                                  : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isUnitPriced && (
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-3">
                        How many {unitNoun(pricingUnit!, 2)}?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {UNIT_CHOICES.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setUnitCount(n)}
                            className={cn(
                              'w-11 h-11 rounded-xl border text-sm font-medium transition-all',
                              n === unitCount
                                ? 'bg-bg-dark text-white border-bg-dark'
                                : 'bg-transparent text-text-primary/80 border-black/15 hover:border-black/40'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-text-secondary mt-3">
                        {formatAed(unitRate)} / {unitNoun(pricingUnit!, 1)} × {unitCount} ={' '}
                        <span className="text-text-primary font-medium">
                          {formatAed(displayPrice)}
                        </span>
                      </p>
                    </div>
                  )}

                  {!inCart && addOns.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-3">
                        Enhance your ritual
                      </p>
                      <div className="space-y-2">
                        {addOns.map((addOn) => {
                          const checked = selectedAddOnIds.has(addOn.id);
                          const v = addOn.variants?.[0];
                          const addPrice = v?.price ?? addOn.price;
                          const addDur = v?.durationMin ?? addOn.durationMin;
                          return (
                            <button
                              key={addOn.id}
                              type="button"
                              onClick={() => toggleAddOn(addOn.id)}
                              className={cn(
                                'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                                checked
                                  ? 'border-bg-dark bg-black/[0.03]'
                                  : 'border-black/15 hover:border-black/30'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                                  checked
                                    ? 'bg-bg-dark border-bg-dark text-white'
                                    : 'border-black/25'
                                )}
                              >
                                {checked && (
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                )}
                              </span>
                              <span className="w-12 h-12 rounded-lg overflow-hidden bg-black/[0.03] shrink-0">
                                <img
                                  src={pickServiceImage(addOn, audience)}
                                  alt={addOn.name}
                                  className="w-full h-full object-cover"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm text-text-primary">
                                  {addOn.name}
                                </span>
                                <span className="block text-[11px] text-text-secondary">
                                  {formatDuration(addDur)} · +{formatAed(addPrice)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCta}
                    className={cn(
                      'group w-full rounded-full py-6 text-sm font-medium flex items-center justify-center gap-2',
                      inCart
                        ? 'bg-black/5 text-text-primary hover:bg-black/10 border border-black/15'
                        : 'bg-bg-dark text-white hover:bg-bg-dark/90'
                    )}
                  >
                    {inCart ? (
                      <>
                        <span className="group-hover:hidden inline-flex items-center gap-2">
                          <Check className="w-4 h-4" /> In your cart
                        </span>
                        <span className="hidden group-hover:inline-flex items-center gap-2">
                          <X className="w-4 h-4" /> Remove from cart
                        </span>
                      </>
                    ) : (
                      <>
                        Add to cart
                        <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                      </>
                    )}
                  </Button>

                  <p className="mt-4 text-[11px] text-text-muted text-center leading-relaxed">
                    No payment now — settle when your therapist arrives at your home. Free cancellation up to 4 hours before.
                  </p>
                </div>
              </div>
            </aside>

            {/* Descriptive content column */}
            <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 space-y-12">
              {/* What to expect — highlights */}
              {service.highlights && service.highlights.length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                    What to expect
                  </p>
                  <ul className="space-y-3">
                    {service.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-base text-text-primary/85 leading-relaxed"
                      >
                        <Check className="w-4 h-4 text-accent-gold flex-shrink-0 mt-[6px]" strokeWidth={2.5} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Story */}
              <section className={service.highlights?.length ? 'pt-10 border-t border-black/5' : ''}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                  The detail
                </p>
                <h2 className="font-serif text-3xl lg:text-4xl leading-tight mb-6 text-text-primary">
                  What this <span className="italic">includes</span>
                </h2>
                <div className="space-y-5 text-text-primary/75 text-base leading-relaxed font-light">
                  {(service.detail ?? service.description).split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {service.requiresConsultation && (
                  <div className="mt-8 border border-black/10 rounded-2xl p-5">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-2">
                      Consultation required
                    </p>
                    <p className="text-sm text-text-primary/70 leading-relaxed">
                      This service requires a complimentary consultation before booking. We will
                      reach out after you confirm to schedule a fifteen-minute call.
                    </p>
                  </div>
                )}
              </section>

              {/* The Ra Promise — static trust tiles */}
              <section className="pt-10 border-t border-black/5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                  The Ra promise
                </p>
                <h2 className="font-serif text-3xl lg:text-4xl leading-tight mb-8 text-text-primary">
                  Care that <span className="italic">holds</span>
                </h2>
                <div className="flex flex-col gap-3 lg:gap-4">
                  {[
                    {
                      icon: HeartHandshake,
                      title: 'Trained hands',
                      body: 'Professionally certified and trained to Ra Standards.',
                    },
                    {
                      icon: Hourglass,
                      title: 'Unhurried time',
                      body: 'Dedicated wellness sessions delivered with care, privacy and unhurried attention.',
                    },
                    {
                      icon: Leaf,
                      title: 'Clean formulations',
                      body: 'Products chosen for health as much as results.',
                    },
                  ].map(({ icon: Icon, title, body }) => (
                    <div
                      key={title}
                      className="rounded-xl border border-black/10 bg-white p-5 flex items-start gap-4"
                    >
                      <Icon
                        className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1"
                        strokeWidth={1.5}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg text-text-primary leading-tight mb-1">
                          {title}
                        </p>
                        <p className="text-sm text-text-secondary leading-snug">
                          {body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Therapists — name + designation only, no photos per client. */}
              {therapists.length > 0 && (
                <section className="pt-10 border-t border-black/5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                    The hands
                  </p>
                  <h2 className="font-serif text-3xl lg:text-4xl leading-tight mb-6 text-text-primary">
                    Performed by your <span className="italic">therapists</span>
                  </h2>
                  <ul className="divide-y divide-black/10 border-y border-black/10">
                    {therapists.map((therapist) => (
                      <li
                        key={therapist.id}
                        className="flex items-baseline justify-between gap-4 py-4"
                      >
                        <h3 className="font-serif text-lg lg:text-xl text-text-primary leading-tight">
                          {therapist.name}
                        </h3>
                        <p className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-text-secondary text-right">
                          {therapist.title}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Questions we're often asked — backend-driven, per sub-category */}
              {section && section.faqs.length > 0 && (
                <section className="pt-10 border-t border-black/5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                    Questions we're often asked
                  </p>
                  <h2 className="font-serif text-3xl lg:text-4xl leading-tight mb-6 text-text-primary">
                    Before you <span className="italic">book</span>
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {section.faqs.map((faq, i) => (
                      <AccordionItem
                        key={i}
                        value={`faq-${i}`}
                        className="border-black/10"
                      >
                        <AccordionTrigger className="text-left text-text-primary hover:text-text-primary text-base font-sans font-normal hover:no-underline py-5">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-text-primary/70 text-sm leading-relaxed pb-5">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              )}

              {/* Related services */}
              {relatedServices.length > 0 && (
                <section className="pt-10 border-t border-black/5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                    Also in this category
                  </p>
                  <h2 className="font-serif text-3xl lg:text-4xl leading-tight mb-8 text-text-primary">
                    Other <span className="italic">{(section?.shortName ?? "").toLowerCase()}</span> services
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {relatedServices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => openServiceDetail(s.id)}
                        className="group text-left"
                      >
                        <div className="aspect-[4/3] overflow-hidden mb-3">
                          <img
                            src={pickServiceImage(s, audience)}
                            alt={s.name}
                            className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                          />
                        </div>
                        <h3 className="font-serif text-xl text-text-primary leading-tight mb-2">
                          {s.name}
                        </h3>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                          {formatDuration(s.durationMin)} · {formatAed(s.price)}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-text-secondary group-hover:text-text-primary transition-colors">
                          Read more
                          <ArrowUpRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
