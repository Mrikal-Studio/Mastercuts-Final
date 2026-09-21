import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { forwardRef, useRef, useState, useEffect, useCallback, useMemo, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Flower2, HandHeart, Scissors, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import type { ServiceAudience } from '@/lib/booking/types';
import { useAudience } from '@/components/services/useAudience';
import { AudienceToggle } from '@/components/services/AudienceToggle';
import { ServiceCard } from '@/components/services/ServiceCard';
import { cn } from '@/lib/utils';

const RA_EMBLEM = '/assets/Logo/ra-emblem.png';
const WIPE_START = 0.5;

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * The category list, its order, titles, copy and which are "coming soon" all
 * come from `/services` — see
 * docs/master-cuts/05-catalog-backend-driven-refactor.md.
 *
 * What stays here is the bespoke landing-page ARTWORK, which the backend does
 * not model: `Department` carries a single `image_url`, while this section needs
 * a distinct hero per audience. Keyed on the backend's `icon_key` (a stable,
 * human-readable value already stored on each sub-category) rather than on a
 * UUID, so the mapping stays readable and a newly created section degrades
 * gracefully instead of rendering a broken hero.
 *
 * KNOWN GAP: making this fully backend-driven needs `image_url_gents` /
 * `image_url_ladies` on Department. Until then, a section whose icon_key is not
 * listed below is hidden from this landing section (it still appears on
 * /at-home, which does not depend on bespoke art).
 */
interface SectionMedia {
  icon: IconComponent;
  /** Empty string hides the category for that audience — the pre-existing rule. */
  imageGents: string;
  imageLadies: string;
}

const SECTION_MEDIA: Record<string, SectionMedia> = {
  sun: {
    icon: Sun,
    imageGents: '/assets/Images/Ra%20at%20home.jpeg',
    imageLadies: '/assets/Images/Ra%20at%20home.jpeg',
  },
  'hand-heart': {
    icon: HandHeart,
    imageGents: '/assets/New%20Images/Ra%20at%20home%20Gentlemen%20Body%20Ritual.jpg',
    imageLadies: '/assets/New%20Images/Ra%20at%20home%20Ladies%20Body%20Ritual.jpg',
  },
  'flower-2': {
    icon: Flower2,
    imageGents:
      '/assets/Images/young-hispanic-man-relaxed-having-manicure-session-beauty-center.jpg',
    imageLadies: '/assets/Images/manicure-process.jpg',
  },
  scissors: {
    icon: Scissors,
    imageGents: '/assets/New%20Images/Ra%20at%20home%20Gents%20Threading.jpg',
    imageLadies: '/assets/New%20Images/Ra%20at%20home%20Ladies%20Threading%20Ritual.jpg',
  },
};

/** A backend section joined to its local artwork, ready to render. */
interface Category {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconComponent;
  imageGents: string;
  imageLadies: string;
}

function imageFor(cat: Category, audience: ServiceAudience): string {
  return audience === 'gentlemen' ? cat.imageGents : cat.imageLadies;
}

interface ChipProps {
  category: Category;
  active: boolean;
  onClick: () => void;
}

const CategoryChip = forwardRef<HTMLButtonElement, ChipProps>(function CategoryChip(
  { category, active, onClick },
  ref,
) {
  const Icon = category.icon;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 transition-colors text-left flex items-center gap-2',
        active
          ? 'bg-white text-bg-dark border-white'
          : 'bg-white/[0.03] text-white/80 border-white/15 hover:border-white/40 hover:text-white',
      )}
    >
      <Icon
        className={cn('w-4 h-4 shrink-0', active ? 'text-bg-dark' : 'text-accent-gold')}
        strokeWidth={1.5}
      />
      <span
        className={cn(
          'font-sans text-[13px] leading-[18px] whitespace-nowrap',
          active ? 'text-bg-dark' : 'text-white',
        )}
      >
        {category.title}
      </span>
    </button>
  );
});

export function RaAtHomeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [audience, setAudience] = useAudience();
  const { getAtHomeServices, getSections } = useCatalog();
  const reduceMotion = useReducedMotion();

  // Refs for the two horizontal chip rows + their per-chip buttons. Used to
  // center the active chip in view whenever the active id changes (scroll-spy
  // on desktop, tap on mobile).
  const desktopChipScrollRef = useRef<HTMLDivElement>(null);
  const desktopChipRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {} as never,
  );
  const mobileChipScrollRef = useRef<HTMLDivElement>(null);
  const mobileChipRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {} as never,
  );

  // Backend sections joined to their local artwork. A section whose icon_key
  // has no entry in SECTION_MEDIA is skipped rather than rendered without a
  // hero — see the KNOWN GAP note above. The audience filter is the
  // pre-existing rule: an empty image for that audience hides the category.
  const visibleCategories = useMemo<Category[]>(
    () =>
      getSections('home')
        .map((sec) => {
          const media = SECTION_MEDIA[sec.iconKey];
          if (!media) return null;
          return {
            id: sec.id,
            title: sec.name,
            eyebrow:
              sec.status === 'coming_soon'
                ? 'Coming soon'
                : sec.tagline || sec.shortName,
            description: sec.description,
            icon: media.icon,
            imageGents: media.imageGents,
            imageLadies: media.imageLadies,
          };
        })
        .filter((c): c is Category => c !== null)
        .filter((c) => (audience === 'gentlemen' ? c.imageGents !== '' : c.imageLadies !== '')),
    [audience, getSections],
  );

  const [mobileCategoryId, setMobileCategoryId] = useState<string>('');

  // Desktop scroll-driven wipe state
  const [currentService, setCurrentService] = useState(0);
  const [bgService, setBgService] = useState(0);
  const [nextService, setNextService] = useState<number | null>(null);
  const [wipeProgress, setWipeProgress] = useState(0);

  // If audience change makes the current desktop index out of range, reset.
  useEffect(() => {
    if (currentService >= visibleCategories.length) {
      setCurrentService(0);
      setBgService(0);
      setNextService(null);
      setWipeProgress(0);
    }
  }, [visibleCategories.length, currentService]);

  // If audience change removes the current mobile category, fall back to first.
  useEffect(() => {
    if (!visibleCategories.find((c) => c.id === mobileCategoryId)) {
      setMobileCategoryId(visibleCategories[0]?.id ?? '');
    }
  }, [visibleCategories, mobileCategoryId]);

  useEffect(() => {
    const total = visibleCategories.length;
    const handleScroll = () => {
      if (!sectionRef.current || total === 0) return;
      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;

      if (rect.top <= 0 && rect.bottom >= viewportHeight) {
        const scrollProgress = Math.abs(rect.top) / (sectionHeight - viewportHeight);
        const serviceFloat = scrollProgress * total;
        const baseIndex = Math.min(Math.floor(serviceFloat), total - 1);
        const subProgress = serviceFloat - Math.floor(serviceFloat);
        const canWipe = baseIndex < total - 1;

        if (canWipe && subProgress >= WIPE_START) {
          const progress = (subProgress - WIPE_START) / (1 - WIPE_START);
          setNextService(baseIndex + 1);
          setWipeProgress(progress);
          setBgService(baseIndex);
          setCurrentService(progress >= 0.5 ? baseIndex + 1 : baseIndex);
        } else {
          setCurrentService(baseIndex);
          setBgService(baseIndex);
          setNextService(null);
          setWipeProgress(0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCategories.length]);

  const handleDesktopChipChange = useCallback(
    (id: string) => {
      const idx = visibleCategories.findIndex((c) => c.id === id);
      if (idx < 0 || !sectionRef.current) return;
      const section = sectionRef.current;
      const scrollable = section.offsetHeight - window.innerHeight;
      const target = section.offsetTop + (idx / visibleCategories.length) * scrollable + 2;
      window.scrollTo({ top: target, behavior: 'smooth' });
    },
    [visibleCategories],
  );

  const handleMobileChipChange = useCallback((id: string) => {
    setMobileCategoryId(id);
  }, []);

  const activeDesktopId: string = visibleCategories[currentService]?.id ?? '';

  // Centers the active chip horizontally in its container. Manual math
  // (not scrollIntoView) so the page's vertical scroll cannot be disturbed —
  // important because the desktop active id updates *during* a vertical scroll.
  useEffect(() => {
    const container = desktopChipScrollRef.current;
    const chip = desktopChipRefs.current[activeDesktopId];
    if (!container || !chip) return;
    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const chipCenter =
      chipRect.left - containerRect.left + container.scrollLeft + chipRect.width / 2;
    const target = chipCenter - container.clientWidth / 2;
    const max = container.scrollWidth - container.clientWidth;
    const clamped = Math.max(0, Math.min(target, max));
    container.scrollTo({ left: clamped, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeDesktopId, reduceMotion]);

  useEffect(() => {
    const container = mobileChipScrollRef.current;
    const chip = mobileChipRefs.current[mobileCategoryId];
    if (!container || !chip) return;
    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const chipCenter =
      chipRect.left - containerRect.left + container.scrollLeft + chipRect.width / 2;
    const target = chipCenter - container.clientWidth / 2;
    const max = container.scrollWidth - container.clientWidth;
    const clamped = Math.max(0, Math.min(target, max));
    container.scrollTo({ left: clamped, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [mobileCategoryId, reduceMotion]);
  // May be undefined on the first render, before the catalog resolves — there
  // is no hardcoded category list to fall back to any more.
  const mobileCategory = useMemo(
    () =>
      visibleCategories.find((c) => c.id === mobileCategoryId) ??
      visibleCategories[0],
    [mobileCategoryId, visibleCategories],
  );

  /**
   * Membership is now the backend relationship (`Service.categoryId` ===
   * sub-category id), not a `ritualId` predicate the frontend maintained.
   */
  const servicesForCategory = useCallback(
    (cat: Category) =>
      getAtHomeServices(audience).filter((s) => s.categoryId === cat.id),
    [audience, getAtHomeServices],
  );

  return (
    <section id="ra-at-home" className="bg-bg-indigo">
      {/* Section title — emblem + heading + (desktop only) Explore CTA */}
      <div className="px-6 lg:px-16 pt-12 pb-8 lg:pt-14 lg:pb-10">
        {/* Mobile: emblem on top, title + subtitle centered */}
        <div className="flex flex-col items-center text-center lg:hidden">
          <img
            src={RA_EMBLEM}
            alt="Ra"
            className="h-20 w-auto object-contain mb-4"
          />
          <h2 className="font-serif text-4xl text-white leading-[1.05]">
            Care, at your <span className="italic">door</span>.
          </h2>
          <p className="mt-4 text-[13px] italic leading-5 text-white/60 max-w-prose">
            Currently available exclusively to residents of
            <br />
            <span className="text-accent-gold">Imperial Avenue Residences</span>.
          </p>
        </div>

        {/* Desktop: emblem | title + subtitle | spacer | Explore CTA */}
        <div className="hidden lg:flex items-center gap-6">
          <img
            src={RA_EMBLEM}
            alt="Ra"
            className="h-[120px] w-auto object-contain shrink-0"
          />
          <div className="flex flex-col">
            <h2 className="font-serif text-6xl text-white leading-[1.05]">
              Care, at your <span className="italic">door</span>.
            </h2>
            <p className="mt-2 text-[15px] italic leading-6 text-white/60">
              Currently available exclusively to residents of{' '}
              <span className="text-accent-gold">Imperial Avenue Residences.</span>
            </p>
          </div>
          <div className="ml-auto">
            <Button
              onClick={() => navigate('/at-home')}
              className="bg-white text-text-primary hover:bg-white/90 rounded-full px-7 py-4 text-sm font-medium flex items-center gap-3 group"
            >
              Explore Ra at Home
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          DESKTOP — scroll-driven wipe animation + chip row
      ───────────────────────────────────────────── */}
      <div
        ref={sectionRef as React.RefObject<HTMLDivElement>}
        className="hidden lg:block relative"
        style={{ minHeight: `${Math.max(1, visibleCategories.length) * 100}vh` }}
      >
        <div
          className="sticky overflow-hidden relative transition-[top,height] duration-300 ease-out"
          style={{
            top: 'var(--nav-offset, 0px)',
            height: 'calc(100vh - var(--nav-offset, 0px))',
          }}
        >
          <div className="h-full grid grid-cols-1 lg:grid-cols-2">
            {/* Left panel — image wipe + bottom-right category title block */}
            <div className="relative h-full hidden lg:block overflow-hidden">
              <div className="absolute inset-0">
                {visibleCategories[bgService] && (
                  <img
                    src={imageFor(visibleCategories[bgService], audience)}
                    alt={visibleCategories[bgService].title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {nextService !== null && visibleCategories[nextService] && (
                <div
                  className="absolute inset-0"
                  style={{ transform: `translateY(${(1 - wipeProgress) * 100}%)` }}
                >
                  <img
                    src={imageFor(visibleCategories[nextService], audience)}
                    alt={visibleCategories[nextService].title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Readability gradient — pinned to bottom, behind text */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent" />

              {/* Category title block — bottom-right */}
              <motion.div
                key={currentService}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute bottom-10 right-10 z-10 max-w-md text-right"
              >
                <h2 className="font-serif text-6xl xl:text-7xl leading-[0.95] text-white">
                  {visibleCategories[currentService]?.title}
                </h2>
                <p className="mt-5 text-sm xl:text-base text-white/75 leading-relaxed">
                  {visibleCategories[currentService]?.description}
                </p>
              </motion.div>
            </div>

            {/* Right panel — sticky chrome (audience toggle + chips) + ServiceCard stack */}
            <div className="h-full flex flex-col px-8 lg:px-16 pb-10 overflow-y-auto">
              {/* Combined sticky chrome — audience toggle on top, chips below.
                  Single fully-opaque block so no cards bleed through. Negative
                  horizontal margins extend the bg to the right panel's full width. */}
              <div className="sticky top-0 z-20 -mx-8 lg:-mx-16 px-8 lg:px-16 pt-5 pb-3 bg-bg-indigo">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/50 text-xs uppercase tracking-[0.18em]">
                      Home services for
                    </p>
                    <AudienceToggle value={audience} onChange={setAudience} size="sm" />
                  </div>
                  <div
                    ref={desktopChipScrollRef}
                    className="flex gap-2 overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {visibleCategories.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        ref={(el) => {
                          desktopChipRefs.current[cat.id] = el;
                        }}
                        category={cat}
                        active={cat.id === activeDesktopId}
                        onClick={() => handleDesktopChipChange(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                key={(visibleCategories[currentService]?.id ?? 'none') + ':' + audience}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md mx-auto space-y-4 pt-4"
              >
                {(() => {
                  const cat = visibleCategories[currentService];
                  const list = cat ? servicesForCategory(cat).slice(0, 4) : [];
                  if (list.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-8 px-5 text-center">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-2">
                          Coming soon
                        </p>
                        <p className="text-sm text-white/70 leading-relaxed">
                          Launching ahead of the full studio opening.
                        </p>
                      </div>
                    );
                  }
                  return list.map((svc) => <ServiceCard key={svc.id} service={svc} />);
                })()}
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MOBILE — chip row + active preview card
      ───────────────────────────────────────────── */}
      <div className="lg:hidden pb-14">
        <div
          className="sticky z-20 bg-bg-indigo pt-4 pb-3 transition-[top] duration-300 ease-out"
          style={{ top: 'var(--nav-offset, 0px)' }}
        >
          <div className="px-6 mb-3">
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-xs uppercase tracking-[0.18em]">
                Home services for
              </p>
              <AudienceToggle value={audience} onChange={setAudience} size="sm" />
            </div>
          </div>
          <div className="px-6">
            <div
              ref={mobileChipScrollRef}
              className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleCategories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  ref={(el) => {
                    mobileChipRefs.current[cat.id] = el;
                  }}
                  category={cat}
                  active={cat.id === mobileCategoryId}
                  onClick={() => handleMobileChipChange(cat.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* The catalog is fetched, so there is no category on the first render
            and none at all if the request fails. Previously this fell back to a
            hardcoded CATEGORIES[0], which always existed. */}
        <div className="px-6 pt-8">
          <AnimatePresence mode="wait">
            {mobileCategory && (
            <motion.div
              key={mobileCategory.id + ':' + audience}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-3"
            >
              <div className="space-y-3">
                {(() => {
                  const list = servicesForCategory(mobileCategory).slice(0, 4);
                  if (list.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-8 px-5 text-center">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-2">
                          Coming soon
                        </p>
                        <p className="text-sm text-white/70 leading-relaxed">
                          Launching ahead of the full studio opening.
                        </p>
                      </div>
                    );
                  }
                  return list.map((svc) => <ServiceCard key={svc.id} service={svc} />);
                })()}
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 mt-12">
          <Button
            onClick={() => navigate('/at-home')}
            className="bg-white text-text-primary hover:bg-white/90 rounded-full px-8 py-6 text-sm font-medium flex items-center justify-center gap-3 group w-full"
          >
            Explore Ra at Home
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
