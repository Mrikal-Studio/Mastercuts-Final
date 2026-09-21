import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useCart, formatAed, formatDuration } from './CartProvider';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { pickServiceImage } from '@/lib/booking/types';
import { useAudience } from '@/components/services/useAudience';

// Enhancement add-ons (Hot Stone, Cupping) cannot be booked on their own.
// This section only renders once a parent massage is in the cart, surfacing
// the add-ons so the guest can attach them to their ritual.
export function AddOnSection() {
  const { cart, addToCart } = useCart();
  const { getAddOnSuggestions } = useCatalog();
  const [audience] = useAudience();

  const cartServiceIds = useMemo(
    () => cart.items.map((i) => i.serviceId),
    [cart.items]
  );

  const addOns = useMemo(
    () => getAddOnSuggestions(cartServiceIds),
    [cartServiceIds, getAddOnSuggestions]
  );

  if (addOns.length === 0) return null;

  return (
    <div className="py-5 border-b border-black/10">
      <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1">
        Enhance your ritual
      </p>
      <p className="text-xs text-text-secondary/80 mb-3">
        Add-ons for your massage — they can't be booked on their own.
      </p>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
        {addOns.map((svc) => (
          <div
            key={svc.id}
            className="flex-shrink-0 w-[140px] rounded-xl border border-black/10 overflow-hidden"
          >
            <div className="h-20 bg-black/[0.03] overflow-hidden">
              <img
                src={pickServiceImage(svc, audience)}
                alt={svc.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-text-primary leading-tight line-clamp-2 mb-1">
                {svc.name}
              </p>
              <p className="text-[10px] text-text-secondary mb-2">
                {formatDuration(svc.durationMin)} · +{formatAed(svc.price)}
              </p>
              <button
                type="button"
                onClick={() => addToCart(svc.id)}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-full border border-bg-dark text-bg-dark text-[11px] font-medium hover:bg-bg-dark hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
