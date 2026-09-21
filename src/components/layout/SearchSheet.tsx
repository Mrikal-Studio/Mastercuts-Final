import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search as SearchIcon,
  X,
  ArrowUpRight,
  Sun,
  HandHeart,
  Flower2,
  Scissors,
  Navigation as NavigateIcon,
  MapPin,
  Phone,
} from 'lucide-react';
import { useCart, formatAed, formatDuration } from '@/components/cart/CartProvider';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import {
  STUDIO_ADDRESS,
  STUDIO_PHONE_E164,
  STUDIO_WHATSAPP,
} from '@/lib/contact';

const QUERY_DEBOUNCE_MS = 120;

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

interface Category {
  id: string;
  name: string;
  subtitle: string;
  icon: IconComponent;
  path: string;
}

// Mirrors the AtHomePage chip row so the search surface and the page agree
// on what a "category" is. Paths point at the page anchors so a click lands
// the user directly in that section.
const CATEGORIES: Category[] = [
  {
    id: 'signature',
    name: 'Signature Rituals',
    subtitle: 'Begin your Ra Experience',
    icon: Sun,
    path: '/at-home#signature',
  },
  {
    id: 'massage',
    name: 'Body Rituals — Massages',
    subtitle: 'Wellness',
    icon: HandHeart,
    path: '/at-home#massage',
  },
  {
    id: 'nails',
    name: 'Hand & Feet Rituals',
    subtitle: 'Coming soon',
    icon: Flower2,
    path: '/at-home#nails',
  },
  {
    id: 'threading',
    name: 'Threading Rituals',
    subtitle: 'Coming soon',
    icon: Scissors,
    path: '/at-home#threading',
  },
];

// Renders `text` with the portion matching `query` in normal weight, and the
// surrounding (non-typed) characters in bold. Falls back to fully bold when
// the query doesn't appear in the visible text — e.g. when a match came from
// the description, not the name.
function HighlightUntyped({ text, query }: { text: string; query: string }) {
  if (!query) return <span className="font-semibold">{text}</span>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <span className="font-semibold">{text}</span>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before && <span className="font-semibold">{before}</span>}
      <span className="font-normal">{match}</span>
      {after && <span className="font-semibold">{after}</span>}
    </>
  );
}

export function SearchSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSearchOpen, closeSearch, openServiceDetail } = useCart();
  const { getAtHomeServices } = useCatalog();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Open/close lifecycle: aggressively try to take focus so the user can
  // start typing immediately. Multiple attempts cover the cases where the
  // input is still being mounted by AnimatePresence on the first tick.
  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setDebounced('');
      return;
    }
    const tryFocus = () => inputRef.current?.focus();
    tryFocus();
    const r = requestAnimationFrame(tryFocus);
    const t = window.setTimeout(tryFocus, 80);
    return () => {
      cancelAnimationFrame(r);
      window.clearTimeout(t);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebounced(query.trim().toLowerCase()),
      QUERY_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSearchOpen, closeSearch]);

  const categoryResults = useMemo(() => {
    if (!debounced) return [];
    return CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(debounced) ||
        c.subtitle.toLowerCase().includes(debounced),
    );
  }, [debounced]);

  const serviceResults = useMemo(() => {
    if (!debounced) return [];
    const services = getAtHomeServices();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(debounced) ||
        s.description.toLowerCase().includes(debounced),
    );
  }, [debounced, getAtHomeServices]);

  const hasAny = categoryResults.length > 0 || serviceResults.length > 0;

  const handleOpenService = (serviceId: string) => {
    closeSearch();
    // Defer so the sheet's exit animation can begin before the service
    // detail sheet opens — avoids two stacked transitions.
    window.setTimeout(() => openServiceDetail(serviceId), 180);
  };

  const handleOpenCategory = (path: string) => {
    closeSearch();
    window.setTimeout(() => navigate(path), 180);
  };

  // The sheet covers the page, so the address card can only be reached by
  // closing first. Same destination and fallback as the header's control.
  const handleGoToContact = () => {
    closeSearch();
    window.setTimeout(() => {
      if (location.pathname === '/') {
        document
          .getElementById('contact')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/#contact');
      }
    }, 180);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          key="search-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          // Column layout so the contact bar stays pinned to the bottom edge
          // and the results scroll between it and the search field.
          className="fixed inset-0 z-[80] bg-bg-primary flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Search rituals"
        >
          {/* Top bar */}
          <div className="flex-shrink-0 bg-bg-primary border-b border-black/10">
            <div
              className="flex items-center gap-3 px-6 py-4 max-w-3xl mx-auto"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            >
              <SearchIcon className="w-4 h-4 text-text-secondary shrink-0" />
              <input
                ref={inputRef}
                id="universal-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rituals…"
                autoFocus
                className="flex-1 bg-transparent outline-none text-base text-text-primary placeholder:text-text-secondary [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                autoComplete="off"
                aria-label="Search rituals"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-text-secondary hover:bg-black/10 hover:text-text-primary transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="ml-1 text-xs uppercase tracking-[0.18em] text-text-secondary hover:text-text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Body — the only scrolling region */}
          <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-8 max-w-3xl mx-auto">
            {!debounced ? (
              <div className="py-10 text-center">
                <h2 className="font-serif text-3xl lg:text-4xl text-text-primary leading-[1.05] mb-3">
                  What are you looking <span className="italic">for?</span>
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Try &ldquo;Balinese&rdquo;, &ldquo;signature&rdquo;, &ldquo;threading&rdquo;.
                </p>
              </div>
            ) : !hasAny ? (
              <div className="py-10 text-center">
                <h2 className="font-serif text-2xl lg:text-3xl text-text-primary leading-[1.05]">
                  We don&apos;t have that <span className="italic">yet</span>.
                </h2>
              </div>
            ) : (
              <div className="space-y-8">
                {categoryResults.length > 0 && (
                  <section>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                      Experience Categories
                    </p>
                    <ul className="divide-y divide-black/10 border-y border-black/10">
                      {categoryResults.map((c) => {
                        const Icon = c.icon;
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => handleOpenCategory(c.path)}
                              className="group w-full flex items-center gap-4 py-3.5 text-left"
                            >
                              <span className="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-bg-dark/[0.06] flex items-center justify-center text-accent-gold">
                                <Icon className="w-5 h-5" strokeWidth={1.5} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-serif text-lg text-text-primary leading-tight truncate">
                                  <HighlightUntyped text={c.name} query={debounced} />
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5 truncate">
                                  {c.subtitle}
                                </p>
                              </div>
                              <span className="shrink-0 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-text-primary group-hover:bg-black/10 transition-colors">
                                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {serviceResults.length > 0 && (
                  <section>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                      Experiences
                    </p>
                    <ul className="divide-y divide-black/10 border-y border-black/10">
                      {serviceResults.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => handleOpenService(s.id)}
                            className="group w-full flex items-center gap-4 py-3.5 text-left"
                          >
                            <img
                              src={s.image}
                              alt=""
                              className="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-lg object-cover bg-black/5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-lg text-text-primary leading-tight truncate">
                                <HighlightUntyped text={s.name} query={debounced} />
                              </p>
                              <p className="text-xs text-text-secondary mt-0.5 truncate">
                                {formatDuration(s.durationMin)} · {formatAed(s.price)}
                              </p>
                            </div>
                            <span className="shrink-0 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-text-primary group-hover:bg-black/10 transition-colors">
                              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Visit-the-studio card — pinned to the bottom edge. A compact
              echo of the footer's contact card: dark on the ivory sheet so it
              reads as a distinct surface, gold eyebrow, serif place name, and
              the three things someone actually wants from here — call, chat,
              or the map. */}
          <div
            className="flex-shrink-0 px-4 pt-2 sm:px-6"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-3xl mx-auto rounded-2xl bg-bg-dark text-white overflow-hidden shadow-xl shadow-black/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:px-6 sm:py-5">

                {/* Identity — who and where */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-accent-gold">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-1">
                      Visit the studio
                    </p>
                    <p className="font-serif text-lg leading-tight text-white">
                      Downtown <span className="italic">Dubai</span>
                    </p>
                    <p className="text-xs text-white/50 leading-snug mt-0.5 line-clamp-2">
                      {STUDIO_ADDRESS}
                    </p>
                  </div>
                </div>

                {/* Actions — chips fill the row on mobile, hug right on desktop */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${STUDIO_PHONE_E164}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 sm:px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${STUDIO_WHATSAPP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 sm:px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={handleGoToContact}
                    title="View the studio address"
                    className="group flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full bg-white px-3 sm:px-4 py-2.5 text-xs font-medium text-text-primary hover:bg-white/90 transition-colors whitespace-nowrap"
                  >
                    <NavigateIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                    Map
                    <span className="hidden sm:inline"> &amp; details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
