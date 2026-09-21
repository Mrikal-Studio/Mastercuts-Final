import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Check, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { useCart, formatAed, formatDuration } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';

function JourneyNotFound() {
  return (
    <div className="min-h-screen bg-ra-ivory text-text-primary flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.22em] text-text-secondary mb-4">404</p>
      <h1 className="font-serif text-5xl mb-6">
        This <span className="italic">journey</span> does not exist
      </h1>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return home
      </Link>
    </div>
  );
}

export function JourneyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cart, addJourneyToCart, removeItem, openServiceDetail } = useCart();
  const { journeys, getJourney, getService, getJourneyTotals } = useCatalog();

  const journey = useMemo(() => (id ? getJourney(id) : undefined), [id, getJourney]);
  const services = useMemo(
    () => (journey ? journey.serviceIds.map(getService).filter(Boolean) : []),
    [journey, getService]
  );
  const totals = useMemo(
    () => (journey ? getJourneyTotals(journey) : null),
    [journey, getJourneyTotals]
  );
  const otherJourneys = useMemo(() => journeys.filter((j) => j.id !== id), [id, journeys]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  if (!journey || !totals) return <JourneyNotFound />;

  const bundleServiceId = `journey:${journey.id}`;
  const cartItem = cart.items.find((i) => i.serviceId === bundleServiceId);
  const inCart = !!cartItem;

  const handleCta = () => {
    if (inCart && cartItem) {
      removeItem(cartItem.id);
      return;
    }
    addJourneyToCart(journey.id);
  };

  return (
    <div className="bg-bg-dark text-white">
      {/* ───────── Hero ───────── */}
      <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden">
        <motion.div
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={journey.image}
            alt={journey.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/40 via-bg-dark/10 to-bg-dark" />
        </motion.div>

        <div className="absolute top-6 left-6 lg:top-10 lg:left-12 z-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 lg:px-16 pb-14 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className="max-w-4xl"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-5">
              {journey.category} · Curated Journey
            </p>
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-[8rem] leading-[0.92] mb-6">
              {journey.name}
            </h1>
            <p className="font-serif italic text-xl lg:text-2xl text-white/70 max-w-xl">
              {journey.philosophy}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ───────── Story + Booking card ───────── */}
      <section className="relative py-20 lg:py-28 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Story */}
          <div className="lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-4">
              The story
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl leading-tight mb-10">
              A considered <span className="italic">arc</span>
            </h2>
            <div className="space-y-6 text-white/75 text-lg leading-relaxed font-light">
              {journey.longDescription.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Sticky booking card */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 border border-white/15 rounded-2xl p-6 lg:p-8 bg-white/[0.02] backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 mb-3">
                Book this journey
              </p>

              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-serif text-4xl lg:text-5xl text-white">
                  {formatAed(totals.totalPriceDiscounted)}
                </span>
                <span className="line-through text-white/40 text-sm">
                  {formatAed(totals.totalPriceFull)}
                </span>
              </div>
              <p className="text-xs text-white/60 mb-6">
                {formatDuration(totals.totalDuration)} · save {formatAed(totals.savingsAed)} ({journey.savings}% off)
              </p>

              <div className="border-t border-white/10 pt-5 mb-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 mb-4">
                  Included ({services.length} services)
                </p>
                <ul className="space-y-3">
                  {services.map((svc) =>
                    svc ? (
                      <li key={svc.id}>
                        <button
                          type="button"
                          onClick={() => openServiceDetail(svc.id)}
                          className="w-full group flex items-start justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-white/90 group-hover:text-white truncate transition-colors">
                              {svc.name}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mt-0.5">
                              {formatDuration(svc.durationMin)} · {formatAed(svc.price)}
                            </p>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 mt-1 flex-shrink-0 transition-colors" />
                        </button>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>

              <Button
                onClick={handleCta}
                className={cn(
                  'group w-full rounded-full py-6 text-sm font-medium flex items-center justify-center gap-2',
                  inCart
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-white text-text-primary hover:bg-white/90'
                )}
              >
                {inCart ? (
                  <>
                    <Check className="w-4 h-4" /> Journey in your cart
                  </>
                ) : (
                  <>
                    Add journey to cart
                    <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                  </>
                )}
              </Button>

              <p className="mt-4 text-[11px] text-white/40 text-center leading-relaxed">
                No payment now — settle when your therapist arrives at your home. Free cancellation up to 4 hours before.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ───────── Other journeys ───────── */}
      {otherJourneys.length > 0 && (
        <section className="py-20 lg:py-28 px-6 lg:px-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-10">
              Also explore
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {otherJourneys.map((j) => (
                <Link
                  key={j.id}
                  to={`/journeys/${j.id}`}
                  className="group relative overflow-hidden aspect-[3/4] block"
                >
                  <img
                    src={j.image}
                    alt={j.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-bg-dark/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/60 mb-1">
                      {j.category}
                    </p>
                    <h3 className="font-serif text-xl text-white leading-tight">{j.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
