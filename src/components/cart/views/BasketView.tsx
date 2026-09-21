import { useState } from 'react';
import { X, ArrowRight, ArrowUpRight, Pencil, User, MapPin, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, useCartTotals, formatAed, formatAedPrecise, formatDuration } from '../CartProvider';
import { CartItemRow } from '../CartItemRow';
import { FrequentlyAddedSection } from '../FrequentlyAddedSection';
import { cn } from '@/lib/utils';

function formatDateLabel(key: string): string {
  const [Y, M, D] = key.split('-').map(Number);
  const d = new Date(Y, M - 1, D);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}

interface Props {
  onClose: () => void;
  onContinue: () => void;
}

export function BasketView({ onClose, onContinue }: Props) {
  const {
    cart,
    account,
    setCheckoutStep,
    confirmBooking,
    getSelectedAddress,
    openContactEdit,
  } = useCart();
  const { totalPrice, totalDuration, count } = useCartTotals();
  const navigate = useNavigate();
  const isEmpty = count === 0;

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedAddress = getSelectedAddress();
  const hasAddress = !!selectedAddress;
  const hasTimeSlot = !!(cart.draftCheckout?.date && cart.draftCheckout?.time);
  const isFinalState = hasAddress && hasTimeSlot;

  // Catalog prices are VAT-inclusive (UAE 5%). Derive subtotal + VAT
  // from the inclusive total so menu prices and the cart total match.
  const subtotal = totalPrice / 1.05;
  const vat = totalPrice - subtotal;
  const grandTotal = totalPrice;
  const canPay = isFinalState && policyAccepted && !submitting;

  const handlePay = async () => {
    if (!canPay) return;
    setSubmitting(true);
    try {
      await confirmBooking();
    } catch {
      // confirmBooking already surfaces the failure via toast; just bail
      // out so the user can correct the issue (full slot, expired session,
      // missing address) and retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-black/10 flex-shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1">
            Your cart
          </p>
          <h2 className="font-serif text-2xl text-text-primary leading-none">
            Your <span className="italic">Cart</span>
            {count > 0 && (
              <span className="ml-3 text-sm text-text-secondary align-middle">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close cart"
          className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center text-center px-6 pt-10 pb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary mb-6">
              Your cart is empty
            </p>
            <h3 className="font-serif text-4xl leading-[1.05] text-text-primary mb-4">
              Begin your <span className="italic">visit</span>
            </h3>
            <p className="text-text-secondary text-sm max-w-xs mb-8 leading-relaxed">
              Choose a ritual to begin — we'll take care of the rest.
            </p>
            <button
              type="button"
              onClick={() => { onClose(); navigate('/#services'); }}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-bg-dark text-white px-6 py-3.5 text-sm font-medium hover:bg-bg-darker transition-colors"
            >
              Explore rituals
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        ) : (
          <div className="px-6">
            {/* Contact info for returning users (passive header) */}
            {account && account.name && (
              <div className="flex items-center gap-3 py-4 border-b border-black/10">
                <div className="w-9 h-9 rounded-full bg-bg-dark text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {account.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {account.phone}
                  </p>
                </div>
              </div>
            )}

            {cart.items
              .filter((item) => !item.parentItemId)
              .map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  addOns={cart.items.filter((c) => c.parentItemId === item.id)}
                />
              ))}

            {/* Frequently added together */}
            <FrequentlyAddedSection />

            {/* Inline "Add more services" row */}
            <button
              type="button"
              onClick={() => { onClose(); navigate('/#services'); }}
              className="group w-full flex items-center justify-between gap-4 py-5 border-b border-black/10 text-left"
            >
              <span className="flex flex-col min-w-0">
                <span className="font-serif text-lg text-text-primary leading-tight">
                  Add another <span className="italic">ritual</span>
                </span>
                <span className="text-[11px] uppercase tracking-wider text-text-secondary mt-1">
                  Browse the menu
                </span>
              </span>
              <span className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary group-hover:bg-black/10 transition-colors flex-shrink-0">
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </button>

            {/* Edit your details — only when logged in. Just above the payment
                breakdown. Opens the same EditContactOverlay used by the
                address selector flow. */}
            {account && (
              <div className="flex items-center justify-between gap-4 py-4 border-b border-black/10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-10 h-10 rounded-full bg-circle-light flex items-center justify-center text-text-primary shrink-0">
                    <User className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-0.5">
                      Reservation for
                    </p>
                    <p className="text-sm text-text-primary truncate">
                      {account.name ? `${account.name} · ` : ''}{account.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openContactEdit}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-[11px] uppercase tracking-wider text-text-primary hover:bg-black/5 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
            )}

            {/* Payment breakdown card — always visible when cart has items */}
            <div className="my-5 rounded-2xl border border-black/10 bg-circle-light/40 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-3">
                Payment breakdown
              </p>

              {/* Service line items */}
              <ul className="space-y-2 mb-3 pb-3 border-b border-black/10">
                {cart.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm truncate',
                        item.parentItemId
                          ? 'pl-3 text-text-secondary'
                          : 'text-text-primary',
                      )}
                    >
                      {item.parentItemId ? '+ ' : ''}
                      {item.name}
                      {item.variantLabel && (
                        <span className="text-text-secondary"> · {item.variantLabel}</span>
                      )}
                      {item.units && item.units > 1 && (
                        <span className="text-text-secondary"> × {item.units}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-text-primary tabular-nums">
                      {formatAed(item.price)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Subtotal</span>
                <span className="text-sm text-text-primary tabular-nums">{formatAedPrecise(subtotal)}</span>
              </div>
              <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-black/10">
                <span className="text-xs uppercase tracking-wider text-text-secondary">VAT (5%)</span>
                <span className="text-sm text-text-primary tabular-nums">{formatAedPrecise(vat)}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-text-primary font-medium">Total</span>
                <span className="font-serif text-2xl text-text-primary tabular-nums">{formatAed(grandTotal)}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Duration</span>
                <span className="text-sm text-text-primary tabular-nums">{formatDuration(totalDuration)}</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                All prices in AED. Includes 5% VAT.
              </p>
            </div>

            {/* Good to know */}
            <div className="py-6 border-t border-black/10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-3">
                Good to know
              </p>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li>· Free cancellation up to 4 hours before your visit</li>
                <li>· Pay at home — card accepted (your therapist brings the card machine)</li>
                <li>· Your therapist arrives 10 minutes early to set up</li>
                <li>· Services run sequentially in one visit</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer — address + time chips live here (reverted from body),
          followed by policy + horizontal Pay-via pill + Pay CTA. */}
      {!isEmpty && (
        <div className="flex-shrink-0 border-t border-black/10 bg-bg-primary px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {/* Address row (when set) */}
          {hasAddress && (
            <div className="flex items-center justify-between py-2.5 mb-2 border-b border-black/10">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <p className="text-xs text-text-primary truncate">
                  {selectedAddress.displayAddress} · Flat {selectedAddress.flatVilla}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep('address')}
                className="text-[11px] text-text-secondary hover:text-text-primary transition-colors shrink-0 ml-2"
              >
                Change
              </button>
            </div>
          )}

          {/* Time row (when set) */}
          {hasAddress && hasTimeSlot && (
            <div className="flex items-center justify-between py-2.5 mb-2 border-b border-black/10">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <p className="text-xs text-text-primary truncate">
                  {cart.draftCheckout?.date ? formatDateLabel(cart.draftCheckout.date) : ''} · {cart.draftCheckout?.time ? formatTimeLabel(cart.draftCheckout.time) : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep('date-time')}
                className="text-[11px] text-text-secondary hover:text-text-primary transition-colors shrink-0 ml-2"
              >
                Change
              </button>
            </div>
          )}

          {isFinalState ? (
            <>
              {/* Policy checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-text-secondary mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-0.5 accent-bg-dark"
                />
                <span>
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="underline hover:no-underline text-text-primary"
                  >
                    booking &amp; cancellation policy
                  </a>
                </span>
              </label>

              {/* Pay-at-home informational line — payment is collected on
                  arrival; no in-cart payment method choice. */}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary mb-3">
                <CreditCard className="w-3.5 h-3.5 text-accent-gold" />
                Pay at home — card accepted (your therapist brings the card machine)
              </p>

              <button
                type="button"
                disabled={!canPay}
                onClick={handlePay}
                className={cn(
                  'w-full rounded-full py-4 text-sm font-medium transition-colors',
                  canPay
                    ? 'bg-bg-dark text-white hover:bg-bg-darker'
                    : 'bg-black/10 text-text-muted cursor-not-allowed',
                )}
              >
                {submitting ? 'Confirming...' : `Reserve your experience · ${formatAed(grandTotal)}`}
              </button>
            </>
          ) : hasAddress ? (
            <button
              type="button"
              onClick={() => setCheckoutStep('date-time')}
              className="group w-full rounded-full bg-bg-dark text-white py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-bg-darker transition-colors"
            >
              Select time slot
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinue}
              className="group w-full rounded-full bg-bg-dark text-white py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-bg-darker transition-colors"
            >
              {account ? 'Add address & slot' : 'Continue'}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
