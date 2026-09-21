import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Flower2, HandHeart, Scissors, Sparkles, Sun } from 'lucide-react';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { useAudience } from '@/components/services/useAudience';
import { AudienceToggle } from '@/components/services/AudienceToggle';
import { ServiceCard } from '@/components/services/ServiceCard';
import { cn } from '@/lib/utils';

const RA_EMBLEM = '/assets/Logo/ra-emblem.png';

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * Backend `icon_key` → component. The KEY is catalog configuration and lives in
 * DynamoDB; the component cannot, so the mapping stays here. An unrecognised
 * key falls back to Sparkles rather than rendering nothing, so adding a section
 * from the admin portal never produces a broken chip.
 */
const ICONS: Record<string, IconComponent> = {
  sun: Sun,
  'hand-heart': HandHeart,
  'flower-2': Flower2,
  scissors: Scissors,
};
const iconFor = (key: string): IconComponent => ICONS[key] ?? Sparkles;

/**
 * The section list, its order, titles, copy, icons and which are "coming soon"
 * all come from the backend now — see
 * docs/master-cuts/05-catalog-backend-driven-refactor.md. This page renders
 * whatever `/services` says is deliverable at home; it does not decide.
 */
const SCROLL_BREATHING = 12;

export function AtHomePage() {
  const [audience, setAudience] = useAudience();
  // Scroll-spy owns this once the user moves; before that (and whenever the
  // selected section disappears) it is DERIVED from the catalog below rather
  // than synced with an effect, which would cascade an extra render.
  const [selectedId, setSelectedId] = useState<string>('');

  const filterRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reduceMotion = useReducedMotion();

  const { getSections } = useCatalog();
  // Everything deliverable at home, in backend order, already audience-filtered.
  // `coming_soon` sections are included and render as placeholders.
  const sections = useMemo(
    () => getSections('home', audience),
    [audience, getSections],
  );

  // The catalog arrives asynchronously, so the first active chip cannot be a
  // constant. Falling back to the first section here also covers a section
  // vanishing mid-session (an admin disabling it), with no effect required.
  const activeId =
    selectedId && sections.some((s) => s.id === selectedId)
      ? selectedId
      : (sections[0]?.id ?? '');

  useLayoutEffect(() => {
    const update = () => {
      const h = filterRef.current?.offsetHeight ?? 120;
      document.documentElement.style.setProperty('--athome-filter-h', `${h}px`);
    };
    update();
    if (!filterRef.current) return;
    const ro = new ResizeObserver(update);
    ro.observe(filterRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--athome-filter-h');
    };
  }, []);

  const scrollToSection = useCallback((id: string, behavior: ScrollBehavior = 'smooth') => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const filter = filterRef.current;
    const filterBottom = filter?.getBoundingClientRect().bottom ?? 120;
    const y = window.scrollY + el.getBoundingClientRect().top - filterBottom - SCROLL_BREATHING;
    window.scrollTo({ top: y, behavior });
  }, []);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const filterBottom = filterRef.current?.getBoundingClientRect().bottom ?? 120;
      const threshold = filterBottom + SCROLL_BREATHING + 4;
      let candidate = sections[0]?.id ?? '';
      for (const sec of sections) {
        const el = sectionRefs.current[sec.id];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) candidate = sec.id;
      }
      setSelectedId((prev) => (prev === candidate ? prev : candidate));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        compute();
        raf = 0;
      });
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections]);

  // Keep the active chip centered in its horizontally-scrollable container.
  // Fires whenever the active id changes — either from scroll-spy or a tap.
  // Manual math (not scrollIntoView) so it cannot disturb the page's vertical
  // scroll position; only the chip row's horizontal scroll is touched.
  useEffect(() => {
    const container = chipScrollRef.current;
    const chip = chipRefs.current[activeId];
    if (!container || !chip) return;
    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const chipCenter =
      chipRect.left - containerRect.left + container.scrollLeft + chipRect.width / 2;
    const target = chipCenter - container.clientWidth / 2;
    const max = container.scrollWidth - container.clientWidth;
    const clamped = Math.max(0, Math.min(target, max));
    container.scrollTo({ left: clamped, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeId, reduceMotion]);

  const handleChipClick = (id: string) => {
    setSelectedId(id);
    scrollToSection(id);
  };

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <main
      className="min-h-screen bg-ra-ivory text-text-primary pb-28 lg:pb-16"
      style={{ paddingTop: 'var(--nav-offset, 0px)' }}
    >
      {/* Exclusivity strapline — emblem + eyebrow + italic note. Scrolls
          away as users move into the filter bar and service list. */}
      <div className="px-6 lg:px-16 pt-6 pb-4">
        {/* Mobile: centered emblem → eyebrow → italic note (2 lines) */}
        <div className="flex flex-col items-center text-center lg:hidden">
          <img
            src={RA_EMBLEM}
            alt="Ra"
            className="h-20 w-auto object-contain mb-3"
          />
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent-gold mb-3">
            Ra at Home
          </p>
          <p className="text-sm italic text-text-secondary max-w-prose">
            Currently available exclusively to residents of
            <br />
            <span className="text-accent-gold">Imperial Avenue Residences</span>.
          </p>
        </div>

        {/* Desktop: emblem on left, eyebrow + italic note stacked on right, centered */}
        <div className="hidden lg:flex items-center justify-center gap-5">
          <img
            src={RA_EMBLEM}
            alt="Ra"
            className="h-20 w-auto object-contain shrink-0"
          />
          <div className="flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent-gold">
              Ra at Home
            </p>
            <p className="mt-1 text-base italic text-text-secondary">
              Currently available exclusively to residents of{' '}
              <span className="text-accent-gold">Imperial Avenue Residences.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky filter bar — back link, audience toggle, category chips. */}
      <div
        ref={filterRef}
        className="sticky z-30 bg-ra-ivory/95 backdrop-blur-md border-b border-black/10 pt-4 pb-4"
        style={{ top: 'var(--nav-offset, 0px)' }}
      >
        {/* Audience toggle row — full width on desktop (with generous 320px
            outer padding to keep the row visually contained), capped on mobile */}
        <div className="mx-auto max-w-lg lg:max-w-none px-6 lg:px-[320px] flex items-center justify-between gap-4 mb-3">
          <p className="text-text-secondary text-[11px] uppercase tracking-[0.18em] whitespace-nowrap">
            Home services for
          </p>
          <AudienceToggle value={audience} onChange={setAudience} size="sm" variant="light" />
        </div>

        {/* Category chip row — full width container. Inner uses w-max so it
            centers when content fits and overflows-scrolls when it doesn't. */}
        {sections.length > 0 && (
          <div className="px-6 lg:px-16 flex justify-center">
            <div
              ref={chipScrollRef}
              className="flex gap-2 w-max max-w-full overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {sections.map((section) => {
                const active = section.id === activeId;
                const Icon = iconFor(section.iconKey);
                // A section with nothing bookable yet says so on the chip; the
                // backend `status` is what decides, not an empty service list.
                const eyebrow =
                  section.status === 'coming_soon'
                    ? 'Coming soon'
                    : section.tagline || section.shortName;
                return (
                  <button
                    key={section.id}
                    ref={(el) => {
                      chipRefs.current[section.id] = el;
                    }}
                    type="button"
                    onClick={() => handleChipClick(section.id)}
                    className={cn(
                      'shrink-0 rounded-2xl border px-3 py-2.5 transition-colors text-left flex items-center gap-2.5 min-w-[140px]',
                      active
                        ? 'bg-bg-dark text-white border-bg-dark'
                        : 'bg-white/60 text-text-primary border-black/15 hover:border-black/40 hover:bg-white',
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        active ? 'bg-white text-bg-dark' : 'bg-bg-dark/[0.06] text-accent-gold',
                      )}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span
                        className={cn(
                          'font-sans text-[13px] leading-[18px] whitespace-nowrap',
                          active ? 'text-white' : 'text-text-primary',
                        )}
                      >
                        {section.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] uppercase tracking-[0.18em] leading-tight mt-0.5',
                          active ? 'text-white/60' : 'text-text-secondary',
                        )}
                      >
                        {eyebrow}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sections, straight from the backend hierarchy */}
      {sections.length === 0 ? (
        <div className="px-6 lg:px-16 pt-16 pb-20">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm text-text-secondary">
              No at-home services available for this audience yet. Try
              switching the filter above.
            </p>
          </div>
        </div>
      ) : (
        sections.map((section) => {
          // Two distinct reasons a section shows no cards, and they read
          // differently: the backend says it is not live yet, or this audience
          // filter happens to exclude everything in it.
          const comingSoon = section.status !== 'active';
          const bookable = comingSoon ? [] : section.services;
          return (
            <section
              key={section.id}
              ref={setSectionRef(section.id)}
              id={section.id}
              className="px-6 lg:px-16 pt-10 pb-14 border-b border-black/5"
              style={{ scrollMarginTop: 'calc(var(--athome-filter-h, 120px) + 12px)' }}
            >
              <div className="mx-auto max-w-lg">
                <div className="mb-6">
                  {bookable.length > 0 ? (
                    /* Live section: thin gold rules flank a small uppercase title */
                    <div className="flex items-center gap-3">
                      <span className="flex-1 h-px bg-accent-gold/60" />
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary whitespace-nowrap">
                        {section.name}
                      </p>
                      <span className="flex-1 h-px bg-accent-gold/60" />
                    </div>
                  ) : (
                    /* Coming-soon / empty section: full editorial header */
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold">
                        {comingSoon ? 'Coming soon' : section.tagline || section.shortName}
                      </p>
                      <h2 className="font-serif text-[32px] text-text-primary leading-[1.05]">
                        {section.name}
                      </h2>
                      {section.description && (
                        <p className="text-text-secondary text-sm lg:text-base leading-6 max-w-prose">
                          {section.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {bookable.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-3">
                        {comingSoon ? 'Coming soon' : 'Nothing here yet'}
                      </p>
                      <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                        {comingSoon
                          ? `We're finalising this menu. ${section.name} will be available shortly, check back ahead of the full studio opening.`
                          : `No ${section.name} services match this filter — try switching between Ladies and Gentlemen above.`}
                      </p>
                    </div>
                  ) : (
                    bookable.map((svc) => (
                      <ServiceCard key={svc.id} service={svc} />
                    ))
                  )}
                </div>
              </div>
            </section>
          );
        })
      )}

    </main>
  );
}
