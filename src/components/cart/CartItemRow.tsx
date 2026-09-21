import { X, Sparkles } from 'lucide-react';
import type { CartItem } from '@/lib/booking/types';
import { useCart, formatAed, formatDuration } from './CartProvider';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  item: CartItem;
  // Add-on lines attached to this item — rendered nested beneath it so the UI
  // shows which add-on was booked with which service.
  addOns?: CartItem[];
}

export function CartItemRow({ item, addOns = [] }: Props) {
  const { removeItem, updateTherapistPref, openServiceDetail } = useCart();
  const { getTherapistsForSection, getTherapist, getService } = useCatalog();
  const isJourney = !!item.journeyId;

  if (isJourney) {
    const constituentServices = (item.journeyServiceIds ?? [])
      .map(getService)
      .filter(Boolean);
    return (
      <div className="flex gap-4 py-5 border-b border-black/10">
        <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-circle-light relative">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <span className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-bg-dark text-white flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-1">
                Curated journey · {constituentServices.length} services
              </p>
              <h3 className="font-serif text-lg leading-tight text-text-primary">
                {item.name}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {formatDuration(item.durationMin)} · {formatAed(item.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Remove ${item.name}`}
              className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-text-secondary hover:bg-black/10 hover:text-text-primary transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {constituentServices.length > 0 && (
            <ul className="mt-3 space-y-1 border-l border-black/10 pl-3">
              {constituentServices.map((svc) =>
                svc ? (
                  <li key={svc.id} className="text-[11px] text-text-secondary truncate">
                    · {svc.name}
                  </li>
                ) : null
              )}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // The cart line no longer stores a grouping key; resolve it from the service.
  const eligibleTherapists = getTherapistsForSection(
    getService(item.serviceId)?.categoryId ?? "",
  );
  const currentTherapist = item.therapistPref !== 'any' ? getTherapist(item.therapistPref) : null;

  return (
    <div className="flex gap-4 py-5 border-b border-black/10">
      <button
        type="button"
        onClick={() => openServiceDetail(item.serviceId)}
        className="w-20 h-24 flex-shrink-0 overflow-hidden bg-circle-light"
        aria-label={`View details for ${item.name}`}
      >
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => openServiceDetail(item.serviceId)}
            className="min-w-0 text-left"
          >
            <h3 className="font-serif text-lg leading-tight text-text-primary truncate">
              {item.name}
            </h3>
            {item.variantLabel && (
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mt-1">
                {item.variantLabel}
              </p>
            )}
            <p className="text-xs text-text-secondary mt-1">
              {formatDuration(item.durationMin)} · {formatAed(item.price)}
              {/* Unit-priced line: show how the total was reached, so the
                  customer can see the rate they were quoted. */}
              {item.units && item.units > 1 && item.unitPrice
                ? ` (${formatAed(item.unitPrice)} × ${item.units})`
                : ''}
            </p>
          </button>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            aria-label={`Remove ${item.name}`}
            className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-text-secondary hover:bg-black/10 hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <Select
            value={item.therapistPref}
            onValueChange={(v) => updateTherapistPref(item.id, v)}
          >
            <SelectTrigger className="h-9 w-full border-black/15 bg-transparent text-xs text-text-primary rounded-full px-4 [&>svg]:opacity-50">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span className="text-text-secondary">Therapist:</span>
                  <span>{currentTherapist ? currentTherapist.name : 'Any available'}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any available (recommended)</SelectItem>
              {eligibleTherapists.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {addOns.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-l border-black/10 pl-3">
              {addOns.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="min-w-0 text-xs text-text-secondary truncate">
                    <span className="text-text-primary">+ {a.name}</span> ·{' '}
                    {formatAed(a.price)}
                    <span className="text-text-secondary/70"> · add-on</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(a.id)}
                    aria-label={`Remove ${a.name}`}
                    className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-text-secondary hover:bg-black/10 transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Per-service guest picker is hidden for now — multi-guest
              selection lives at the booking-contact level instead. Keep the
              GuestPickerSheet wiring intact so we can re-enable per-service
              assignment without a refactor when the client confirms. */}
        </div>
      </div>
    </div>
  );
}
