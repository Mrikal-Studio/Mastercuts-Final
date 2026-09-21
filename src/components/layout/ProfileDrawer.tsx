import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, X, LogOut, User as UserIcon, Users, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCart, formatAed, formatAedPrecise, formatDuration } from '@/components/cart/CartProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BookingRecord } from '@/lib/booking/types';
import type { BookingRecord as ApiBooking } from '@/lib/api/bookings';

function formatDateLabel(key: string): string {
  const [Y, M, D] = key.split('-').map(Number);
  const d = new Date(Y, M - 1, D);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

interface CardService {
  name: string;
  durationMin?: number;
  price?: number;
  // Which duration/finish option was booked, e.g. "Classic Nail Polish" vs
  // "Gel Polish". Absent for services with no variant grouping.
  variantLabel?: string;
  // True for add-on lines — rendered indented + tagged. Booking order keeps an
  // add-on directly after its parent service, so no explicit grouping needed.
  isAddon?: boolean;
}

/** Shape both the server and local records normalise into for cards. */
interface CardBooking {
  id: string; // slot id — the key DELETE /bookings/:id expects
  reference: string; // booking_token — the user-facing reference
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  price: number;
  totalDuration?: number;
  cancelled: boolean;
  services: CardService[];
}

// The shared Slot row now stores slot_time as canonical 12h ("hh:mm a"); older
// rows may still be 24h ("HH:mm"). The drawer works internally in 24h (its date
// math `new Date(`${date}T${time}`)` and locally-created bookings all assume
// 24h), so normalise the remote value here.
const to24h = (t: string): string => {
  const s = (t ?? '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (!m) return s; // already 24h (or unknown) → leave as-is
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

const fromRemote = (b: ApiBooking): CardBooking => ({
  id: b.id,
  reference: b.booking_token,
  date: b.date,
  time: to24h(b.slot_time),
  price: b.total_price,
  totalDuration: b.total_duration_min,
  cancelled: !!b.is_cancelled,
  services: (b.services ?? []).map((s) => ({
    name: s.name,
    durationMin: s.duration_min,
    price: s.price,
    variantLabel: s.variant_label,
    isAddon: !!s.is_addon,
  })),
});

const fromLocal = (b: BookingRecord): CardBooking => ({
  // Local (optimistic) records only carry the booking_token; use it as the id
  // fallback. Server cancellation keys on the real slot id, so cancel is only
  // meaningful for remote records — the button is gated on Upcoming status.
  id: b.reference,
  reference: b.reference,
  date: b.date,
  time: b.time,
  price: b.totalPrice,
  totalDuration: b.totalDuration,
  cancelled: b.status !== 'confirmed',
  services: (b.items ?? []).map((i) => ({
    name: i.name,
    durationMin: i.durationMin,
    price: i.price,
    variantLabel: i.variantLabel,
    isAddon: !!i.parentItemId,
  })),
});

function statusLabel(b: CardBooking): string {
  if (b.cancelled) return 'Cancelled';
  return new Date(`${b.date}T${b.time}`).getTime() >= Date.now()
    ? 'Upcoming'
    : 'Completed';
}

function BookingCard({
  b,
  onSelect,
}: {
  b: CardBooking;
  onSelect: (b: CardBooking) => void;
}) {
  const count = b.services.length;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(b)}
        className={`w-full text-left border rounded-xl p-4 transition-colors ${
          b.cancelled
            ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
            : 'border-black/10 hover:bg-black/[0.02]'
        }`}
      >
        <div className="flex items-baseline justify-between mb-2 gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={`font-serif text-lg ${
                b.cancelled ? 'text-text-secondary line-through' : 'text-text-primary'
              }`}
            >
              {formatDateLabel(b.date)}
            </span>
            {b.cancelled && (
              <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] font-medium text-rose-600 bg-rose-100 rounded-full px-2 py-0.5">
                Cancelled
              </span>
            )}
          </span>
          <span className="text-xs text-text-secondary shrink-0">{b.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            {count} {count === 1 ? 'service' : 'services'}
            {b.totalDuration ? ` · ${formatDuration(b.totalDuration)}` : ''}
          </span>
          <span
            className={`text-sm flex items-center gap-1.5 ${
              b.cancelled ? 'text-text-secondary line-through' : 'text-text-primary'
            }`}
          >
            {formatAed(b.price)}
            <ChevronRight className="w-3.5 h-3.5 text-text-secondary no-underline" />
          </span>
        </div>
      </button>
    </li>
  );
}

/** Confirmation popup for cancelling a booking — on-brand, matches the drawer. */
function CancelConfirmDialog({
  booking,
  open,
  cancelling,
  onConfirm,
  onDismiss,
}: {
  booking: CardBooking;
  open: boolean;
  cancelling: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => (v || cancelling ? null : onDismiss())}>
      <DialogContent
        showCloseButton={false}
        className="bg-bg-primary border-none p-0 sm:max-w-sm w-[calc(100%-2rem)] overflow-hidden rounded-2xl shadow-2xl z-[100]"
      >
        <div className="px-6 pt-7 pb-6">
          <DialogTitle asChild>
            <h2 className="font-serif text-2xl text-text-primary leading-[1.1] mb-2">
              Cancel this <span className="italic">visit</span>?
            </h2>
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Your booking on{' '}
              <span className="text-text-primary">{formatDateLabel(booking.date)}</span>{' '}
              at <span className="text-text-primary">{booking.time}</span> will be
              released. This can’t be undone.
            </p>
          </DialogDescription>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDismiss}
              disabled={cancelling}
              className="flex-1 rounded-full border border-black/15 py-3 text-sm font-medium text-text-primary hover:bg-black/[0.03] transition-colors disabled:opacity-50"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 rounded-full bg-bg-dark text-white py-3 text-sm font-medium hover:bg-bg-darker transition-colors disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Shared inner content for the detail popup (used in both Sheet + Dialog). */
function BookingDetailBody({ b, onClose }: { b: CardBooking; onClose: () => void }) {
  const { cancelBooking } = useCart();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = statusLabel(b) === 'Upcoming';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(b.id);
      toast.success('Booking cancelled');
      setConfirmOpen(false);
      onClose();
    } catch {
      toast.error('Could not cancel your booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="px-6 pt-7 pb-7">
        <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-2">
          Booking · {statusLabel(b)}
        </p>
        <DialogTitle asChild>
          <h2 className="font-serif text-3xl text-text-primary leading-[1.05] mb-1">
            {formatDateLabel(b.date)}
          </h2>
        </DialogTitle>
        <p className="text-sm text-text-secondary mb-6">{b.time}</p>

        <div className="space-y-2.5 mb-5">
          {b.services.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No service details available.
            </p>
          ) : (
            b.services.map((s, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className={s.isAddon ? 'text-text-secondary pl-3' : 'text-text-primary'}>
                  {s.isAddon ? '+ ' : ''}
                  {s.name}
                  {s.variantLabel && (
                    <span className="text-text-secondary/60"> · {s.variantLabel}</span>
                  )}
                  {s.isAddon && <span className="text-text-secondary/60"> · add-on</span>}
                </span>
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  {s.durationMin ? `${s.durationMin} min` : ''}
                  {s.price != null
                    ? `${s.durationMin ? ' · ' : ''}${formatAed(s.price)}`
                    : ''}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Prices are VAT-inclusive (UAE 5%). Derive subtotal + VAT out of the
            total so the grand total stays equal to the charged amount. */}
        <div className="border-t border-black/10 pt-3 mb-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Subtotal</span>
            <span className="text-sm text-text-primary tabular-nums">
              {formatAedPrecise(b.price / 1.05)}
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-2.5 pb-2.5 border-b border-black/10">
            <span className="text-xs uppercase tracking-wider text-text-secondary">VAT (5%)</span>
            <span className="text-sm text-text-primary tabular-nums">
              {formatAedPrecise(b.price - b.price / 1.05)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-text-primary">
              Total{b.totalDuration ? ` · ${formatDuration(b.totalDuration)}` : ''}
            </span>
            <span className="text-sm font-medium text-text-primary tabular-nums">
              {formatAed(b.price)}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Ref · <span className="text-text-primary">{b.reference}</span>
        </p>
        <p className="text-[10px] text-text-secondary/80 leading-relaxed mt-1">
          All prices in AED. Includes 5% VAT.
        </p>

        {canCancel && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="mt-6 w-full rounded-full border border-rose-300 text-rose-600 py-3 text-sm font-medium hover:bg-rose-50 transition-colors"
          >
            Cancel booking
          </button>
        )}
      </div>

      {canCancel && (
        <CancelConfirmDialog
          booking={b}
          open={confirmOpen}
          cancelling={cancelling}
          onConfirm={handleCancel}
          onDismiss={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

function BookingDetailDialog({
  booking,
  onClose,
}: {
  booking: CardBooking | null;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const open = !!booking;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => (v ? null : onClose())}>
        <SheetContent
          side="bottom"
          hideDefaultClose
          className="bg-bg-primary border-none p-0 w-full max-w-full rounded-t-3xl h-auto max-h-[88vh] z-[90]"
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/20" />
          {booking && <BookingDetailBody b={booking} onClose={onClose} />}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="bg-bg-primary border-none p-0 sm:max-w-md w-[calc(100%-2rem)] overflow-hidden rounded-2xl shadow-2xl z-[90]"
      >
        {booking && <BookingDetailBody b={booking} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

export function ProfileDrawer() {
  const {
    surface,
    closeAll,
    account,
    bookings,
    remoteBookings,
    bookingsLoading,
    bookingsError,
    refreshBookings,
    signOut,
    openLogin,
    guestProfiles,
    waitlistRequests,
    removeWaitlistRequest,
  } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const open = surface === 'profile';
  const side = isMobile ? 'bottom' : 'right';
  const [selected, setSelected] = useState<CardBooking | null>(null);

  const handleSignIn = () => {
    closeAll();
    setTimeout(openLogin, 220);
  };

  const handleBookNow = () => {
    closeAll();
    navigate('/at-home');
  };

  // Pull fresh server bookings whenever the profile opens.
  useEffect(() => {
    if (open && account) void refreshBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Server is the source of truth when signed in; fall back to the local
  // (optimistic / offline) records while loading or if the fetch failed.
  const source: CardBooking[] = remoteBookings
    ? remoteBookings.map(fromRemote)
    : bookings.map(fromLocal);

  const now = Date.now();
  const tsOf = (b: CardBooking) => new Date(`${b.date}T${b.time}`).getTime();
  const upcoming = source
    .filter((b) => !b.cancelled && tsOf(b) >= now)
    .sort((a, b) => tsOf(a) - tsOf(b));
  const past = source
    .filter((b) => b.cancelled || tsOf(b) < now)
    .sort((a, b) => tsOf(b) - tsOf(a));
  const firstLoad = bookingsLoading && !remoteBookings;

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => (v ? null : closeAll())}>
      <SheetContent
        side={side}
        hideDefaultClose
        className="bg-bg-primary border-none p-0 flex flex-col w-full sm:max-w-md h-full max-h-screen"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-black/10 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1">
              Account
            </p>
            <h2 className="font-serif text-2xl text-text-primary leading-none">
              {account ? (
                <>Hello, <span className="italic">{account.name.split(' ')[0]}</span></>
              ) : (
                <>Your <span className="italic">profile</span></>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeAll}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!account ? (
            /* Defensive fallback — primary entry now routes straight to the phone login sheet. */
            <div className="px-6 pt-10 pb-8">
              <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mb-6">
                <UserIcon className="w-5 h-5 text-text-primary" />
              </div>
              <h3 className="font-serif text-3xl text-text-primary leading-[1.05] mb-3">
                Save your <span className="italic">visits</span>
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Sign in to save your details and view bookings.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full rounded-full bg-bg-dark text-white py-4 text-sm font-medium hover:bg-bg-darker transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : (
            <div className="px-6 py-6 space-y-8">
              {/* Details */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-3">
                  Your details
                </p>
                <div className="space-y-1 text-sm text-text-primary">
                  <p>{account.name || 'Guest'}</p>
                  <p className="text-text-secondary">{account.phone}</p>
                </div>
              </section>

              {/* My Guests — read-only list. Add/edit happens in the cart's
                  per-item guest picker, which is contextual to the booking. */}
              {guestProfiles.filter((g) => !g.isSelf).length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-3 flex items-center gap-2">
                    <Users className="w-3 h-3" strokeWidth={1.5} />
                    My guests
                  </p>
                  <ul className="space-y-2">
                    {guestProfiles
                      .filter((g) => !g.isSelf)
                      .map((g) => (
                        <li
                          key={g.id}
                          className="flex items-center justify-between gap-3 py-2 border-b border-black/5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-text-primary truncate">
                              {g.name}
                            </p>
                            {g.phone && (
                              <p className="text-xs text-text-secondary truncate">
                                {g.phone}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-text-secondary">
                    Add or pick a guest from any cart item.
                  </p>
                </section>
              )}

              {/* On the waitlist — pending notify-me requests */}
              {waitlistRequests.length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-3 flex items-center gap-2">
                    <Bell className="w-3 h-3" strokeWidth={1.5} />
                    On the waitlist
                  </p>
                  <ul className="space-y-2">
                    {waitlistRequests.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 py-2 border-b border-black/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary truncate">
                            {formatDateLabel(r.preferredDate)}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {r.preferredTherapistName ?? 'Any therapist'}
                            {r.preferredTimeOfDay && r.preferredTimeOfDay !== 'any'
                              ? ` · ${r.preferredTimeOfDay}`
                              : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWaitlistRequest(r.id)}
                          aria-label="Remove waitlist entry"
                          className="shrink-0 w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-text-secondary hover:bg-black/10 hover:text-text-primary transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Upcoming / active */}
              <section>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-3">
                  Upcoming visits
                </p>
                {firstLoad ? (
                  <p className="text-sm text-text-secondary">Loading your visits…</p>
                ) : bookingsError && !remoteBookings ? (
                  <p className="text-sm text-text-secondary">
                    {bookingsError}{' '}
                    <button
                      type="button"
                      onClick={() => void refreshBookings()}
                      className="underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </p>
                ) : upcoming.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No upcoming visits.{' '}
                    <button
                      type="button"
                      onClick={handleBookNow}
                      className="underline hover:no-underline"
                    >
                      Book one now
                    </button>
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {upcoming.map((b) => (
                      <BookingCard key={b.reference} b={b} onSelect={setSelected} />
                    ))}
                  </ul>
                )}
              </section>

              {/* Past */}
              {past.length > 0 && (
                <section>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary mb-3">
                    Past visits
                  </p>
                  <ul className="space-y-3">
                    {past.map((b) => (
                      <BookingCard key={b.reference} b={b} onSelect={setSelected} />
                    ))}
                  </ul>
                </section>
              )}

              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />
    </>
  );
}
