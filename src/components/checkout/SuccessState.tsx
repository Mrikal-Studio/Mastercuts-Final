import { motion } from 'framer-motion';
import { Check, Calendar, Share2, MapPin } from 'lucide-react';
import type { BookingRecord } from '@/lib/booking/types';
import { formatAed, formatAedPrecise, formatDuration } from '@/components/cart/CartProvider';

interface Props {
  booking: BookingRecord;
  onDone: () => void;
}

function formatDateLabel(key: string): string {
  const [Y, M, D] = key.split('-').map(Number);
  const d = new Date(Y, M - 1, D);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}

export function SuccessState({ booking, onDone }: Props) {
  const firstName = booking.guest.name.split(' ')[0] ?? 'friend';

  // Prices are VAT-inclusive (UAE 5%). Derive subtotal + VAT out of the
  // total so the grand total stays equal to the charged amount.
  const subtotal = booking.totalPrice / 1.05;
  const vat = booking.totalPrice - subtotal;

  return (
    <div className="flex-1 overflow-y-auto bg-bg-primary">
      <div className="px-6 pt-10 pb-8">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-14 h-14 rounded-full bg-bg-dark flex items-center justify-center mb-6"
        >
          <Check className="w-6 h-6 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-3">
            {booking.requiresConfirmation ? 'Request received' : "You're booked"}
          </p>
          <h2 className="font-serif text-4xl text-text-primary leading-[1.05] mb-2">
            {booking.requiresConfirmation ? (
              <>
                Thank you,
                <br />
                <span className="italic">{firstName}</span>
              </>
            ) : (
              <>
                See you soon,
                <br />
                <span className="italic">{firstName}</span>
              </>
            )}
          </h2>
          {booking.requiresConfirmation && (
            <p className="text-sm text-text-secondary leading-relaxed mt-3 max-w-sm">
              Our concierge will reach out personally to confirm your booking
              and arrange your at-home experience.
            </p>
          )}
          <p className="text-xs text-text-secondary mt-3">
            Booking reference · <span className="text-text-primary">{booking.reference}</span>
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mx-6 bg-bg-dark text-white rounded-2xl p-5"
      >
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Your appointment</p>
            <p className="text-sm">{formatDateLabel(booking.date)}</p>
            <p className="text-sm text-white/70">
              {formatTimeLabel(booking.time)} · {formatDuration(booking.totalDuration)}
            </p>
          </div>

          {booking.guest.address && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1">
                <MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                Service address
              </p>
              <p className="text-sm">
                {booking.guest.address.displayAddress}
              </p>
              <p className="text-sm text-white/70">
                Flat {booking.guest.address.flatVilla}
                {booking.guest.address.landmark ? ` · ${booking.guest.address.landmark}` : ''}
              </p>
            </div>
          )}

          <div className="border-t border-white/10 pt-4 space-y-2">
            {booking.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <p
                  className={`text-sm truncate ${
                    item.parentItemId ? 'text-white/55 pl-3' : 'text-white/80'
                  }`}
                >
                  {item.parentItemId ? '+ ' : ''}
                  {item.name}
                  {item.variantLabel && (
                    <span className="text-white/50"> · {item.variantLabel}</span>
                  )}
                </p>
                <p className="text-sm text-white/60 shrink-0">{formatDuration(item.durationMin)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-white/50">Subtotal</span>
              <span className="text-sm text-white/80">{formatAedPrecise(subtotal)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-white/50">VAT (5%)</span>
              <span className="text-sm text-white/80">{formatAedPrecise(vat)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
              <span className="text-xs uppercase tracking-wider text-white">Total</span>
              <span className="font-serif text-2xl">{formatAed(booking.totalPrice)}</span>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed pt-1">
              All prices in AED. Includes 5% VAT.
            </p>
          </div>

          <p className="text-[11px] text-white/50 pt-1">We'll text you 24h and 2h before your appointment.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="px-6 pt-6 pb-4 grid grid-cols-3 gap-3"
      >
        {[
          { icon: Calendar, label: 'Add to calendar' },
          { icon: MapPin, label: 'View address' },
          { icon: Share2, label: 'Share' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            disabled
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-black/10 text-text-secondary opacity-60"
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] text-center leading-tight">{label}</span>
          </button>
        ))}
      </motion.div>

      <div className="sticky bottom-0 bg-bg-primary border-t border-black/10 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-full py-4 text-sm font-medium bg-bg-dark text-white hover:bg-bg-darker transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
