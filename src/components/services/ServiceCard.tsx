import { ArrowUpRight, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, formatAed, formatDuration } from '@/components/cart/CartProvider';
import type { Service, Package } from '@/lib/booking/types';
import { pickServiceImage } from '@/lib/booking/types';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { useAudience } from '@/components/services/useAudience';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  onReadMore?: (service: Service) => void;
  label?: string;
  className?: string;
}

export function ServiceCard({
  service,
  onReadMore,
  label,
  className,
}: ServiceCardProps) {
  const { openServiceDetail, addToCart, removeItem, cart } = useCart();
  const [audience] = useAudience();
  const serviceImage = pickServiceImage(service, audience);

  const itemsOfService = cart.items.filter((i) => i.serviceId === service.id);
  const count = itemsOfService.length;
  const inCart = count > 0;

  const hasVariants = (service.variants?.length ?? 0) > 1;
  // Services that offer add-ons open the selection sheet too (so single-variant
  // services with add-ons still get the "Enhance your ritual" step).
  const hasAddOns = (service.addonGroups?.length ?? 0) > 0;
  const startingPrice = hasVariants
    ? Math.min(...(service.variants ?? []).map((v) => v.price))
    : service.price;
  const displayDuration = service.durationMin;

  const effectiveLabel =
    label ?? (service.requiresConsultation ? 'Consultation' : undefined);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants || hasAddOns) {
      openServiceDetail(service.id);
      return;
    }
    addToCart(service.id, 'any');
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For variant services, re-add the same variant as the most recently added
    // instance so the user can quickly stack more of the same. To pick a
    // different variant, they'd open the detail sheet via Read more.
    const last = itemsOfService[itemsOfService.length - 1];
    addToCart(service.id, 'any', last?.variantId);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const last = itemsOfService[itemsOfService.length - 1];
    if (last) removeItem(last.id);
  };

  const handleReadMore = () => {
    if (onReadMore) onReadMore(service);
    else openServiceDetail(service.id);
  };

  const bullets =
    service.highlights && service.highlights.length > 0
      ? service.highlights
      : [service.description];

  return (
    <article
      className={cn(
        'relative w-full rounded-xl border border-black/5 bg-bg-primary px-4 pt-4 pb-7 text-text-primary',
        className,
      )}
    >
      {effectiveLabel && (
        <div className="mb-2">
          <span className="inline-block text-[10px] font-sans uppercase tracking-[0.18em] text-accent-gold font-medium">
            {effectiveLabel}
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Left: content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[22px] leading-[26px] text-text-primary">
            {service.name}
          </h3>
          <p className="font-sans text-[14px] leading-[18px] text-text-primary mt-2 font-medium">
            {hasVariants ? 'Starts at ' : ''}
            {formatAed(startingPrice)}
            <span className="text-text-primary/50 font-normal">
              {' · '}
              {formatDuration(displayDuration)}
            </span>
          </p>

          <div className="my-3 border-t border-dashed border-text-primary/20" />

          <ul className="space-y-1.5">
            {bullets.slice(0, 3).map((b, i) => (
              <li
                key={i}
                className="flex gap-2 text-[13px] leading-[18px] text-text-primary/75 font-sans"
              >
                <span aria-hidden className="text-text-primary/40 mt-[1px]">
                  •
                </span>
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleReadMore}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-text-primary/90 hover:text-text-primary underline underline-offset-[6px] decoration-accent-gold decoration-[1.5px] hover:decoration-text-primary transition-colors"
          >
            Read more
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right: thumbnail wrapper (no clipping) + inner image clip + floating Add pill */}
        <div className="shrink-0 w-[112px]">
          <div className="relative w-[112px]">
            <div className="w-[112px] h-[112px] rounded-lg overflow-hidden bg-black/5">
              <img
                src={serviceImage}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>
            {inCart ? (
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 -bottom-[14px] z-10',
                  'flex items-stretch rounded-md',
                  'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-accent-gold',
                  'font-sans text-[13px] font-semibold tracking-[0.02em]',
                )}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label={`Remove one ${service.name}`}
                  className="w-8 h-9 flex items-center justify-center text-accent-gold hover:text-text-primary transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <span
                  className="min-w-[28px] flex items-center justify-center text-text-primary border-x border-accent-gold/30 select-none"
                  aria-live="polite"
                >
                  {count}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label={`Add another ${service.name}`}
                  className="w-8 h-9 flex items-center justify-center text-accent-gold hover:text-text-primary transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={`Add ${service.name} to cart`}
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 -bottom-[14px] z-10',
                  'min-w-[76px] rounded-md px-3 py-2',
                  'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]',
                  'font-sans text-[13px] font-semibold tracking-[0.02em]',
                  'transition-colors duration-150',
                  inCart
                    ? 'text-text-primary border border-accent-gold'
                    : 'text-accent-gold hover:text-text-primary',
                )}
              >
                {inCart ? 'Added' : 'Add'}
              </button>
            )}
          </div>
          {hasVariants && (
            <p className="mt-6 text-center text-[11px] font-sans text-text-primary/50">
              {service.variants?.length} options
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

// ────────────────────────────────────────────────
// Curated Journey variant — same visual language,
// adapted for a Package (not a Service).
// ────────────────────────────────────────────────

interface JourneyCardProps {
  journey: Package;
  className?: string;
}

export function JourneyCard({ journey, className }: JourneyCardProps) {
  const navigate = useNavigate();
  const { getJourneyTotals } = useCatalog();
  const totals = getJourneyTotals(journey);

  const bullets = [
    journey.description,
    `${journey.serviceIds.length} services · save ${journey.savings}%`,
  ];

  const handleExplore = () => navigate(`/journeys/${journey.id}`);

  return (
    <article
      className={cn(
        'relative w-full rounded-xl border border-black/5 bg-bg-primary px-4 pt-4 pb-7 text-text-primary',
        className,
      )}
    >
      <div className="mb-2">
        <span className="inline-block text-[10px] font-sans uppercase tracking-[0.18em] text-accent-gold font-medium">
          {journey.category}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[22px] leading-[26px] text-text-primary">
            {journey.name}
          </h3>
          <p className="font-sans text-[12px] leading-[16px] text-text-primary/55 mt-1">
            {journey.tagline}
          </p>
          <p className="font-sans text-[14px] leading-[18px] text-text-primary mt-2 font-medium">
            {formatAed(totals.totalPriceDiscounted)}
            <span className="text-text-primary/40 line-through font-normal ml-2">
              {formatAed(totals.totalPriceFull)}
            </span>
            <span className="text-text-primary/50 font-normal">
              {' · '}
              {formatDuration(totals.totalDuration)}
            </span>
          </p>

          <div className="my-3 border-t border-dashed border-text-primary/20" />

          <ul className="space-y-1.5">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex gap-2 text-[13px] leading-[18px] text-text-primary/75 font-sans"
              >
                <span aria-hidden className="text-text-primary/40 mt-[1px]">
                  •
                </span>
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleExplore}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-text-primary/90 hover:text-text-primary underline underline-offset-[6px] decoration-accent-gold decoration-[1.5px] hover:decoration-text-primary transition-colors"
          >
            Read more
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="shrink-0 w-[112px]">
          <div className="relative w-[112px]">
            <div className="w-[112px] h-[112px] rounded-lg overflow-hidden bg-black/5">
              <img
                src={journey.image}
                alt={journey.name}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleExplore}
              aria-label={`Explore ${journey.name}`}
              className={cn(
                'absolute left-1/2 -translate-x-1/2 -bottom-[14px] z-10',
                'min-w-[76px] rounded-md px-3 py-2',
                'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]',
                'font-sans text-[13px] font-semibold tracking-[0.02em]',
                'text-accent-gold hover:text-text-primary transition-colors duration-150',
              )}
            >
              View
            </button>
          </div>
          <p className="mt-6 text-center text-[11px] font-sans text-text-primary/50">
            save {journey.savings}%
          </p>
        </div>
      </div>
    </article>
  );
}
