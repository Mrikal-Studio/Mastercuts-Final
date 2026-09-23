import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEnterRaAtHome } from '@/components/analytics/useEnterRaAtHome';
import { useCart } from '@/components/cart/CartProvider';

type MediaType = 'video' | 'image';

interface Slide {
  id: string;
  title: string;
  titleItalic: string;
  tagline: string;
  media: {
    type: MediaType;
    src: string;
    position?:
      | 'top'
      | 'center'
      | 'bottom'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
      | 'left'
      | 'right';
    /** Optional CSS transform on the media element (e.g. 'scale(1.25)') for
     *  fine-grained zoom/crop control when object-position is not enough. */
    transform?: string;
    /** Origin for the transform above. Defaults to 'top left'. */
    transformOrigin?: string;
  };
  /** Brand mark shown at the top of the slide — Ra emblem across all slides. */
  topMark: string;
  /** Per-slide display duration in ms. Video slides should approximate the
   *  video length so the loop doesn't show before transitioning. */
  durationMs?: number;
  primaryCta: { label: string; onClick: () => void };
  secondaryCta: { label: string; onClick: () => void };
}

const AUTO_ADVANCE_MS = 7000;

interface PaginationDotProps {
  active: boolean;
  theme: 'on-dark' | 'on-light';
  onClick: () => void;
  label: string;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}

function PaginationDot({
  active,
  theme,
  onClick,
  label,
  progress,
  reduceMotion,
}: PaginationDotProps) {
  const activeWidth = theme === 'on-dark' ? 'w-8' : 'w-6';
  const fillColor = theme === 'on-dark' ? 'bg-white' : 'bg-text-primary';
  const trackColor = theme === 'on-dark' ? 'bg-white/25' : 'bg-text-primary/25';
  const inactiveColor =
    theme === 'on-dark'
      ? 'bg-white/40 hover:bg-white/60'
      : 'bg-text-primary/30 hover:bg-text-primary/50';

  // When reduced motion is on, the active dot stays solid (no track/fill split)
  // — visually identical to a static design.
  const activeBg = active ? (reduceMotion ? fillColor : trackColor) : inactiveColor;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative overflow-hidden h-1.5 rounded-full transition-all duration-300 ease-out ${
        active ? activeWidth : 'w-1.5'
      } ${activeBg}`}
    >
      {active && !reduceMotion && (
        <motion.span
          aria-hidden="true"
          style={{ scaleX: progress, originX: 0 }}
          className={`absolute inset-0 rounded-full ${fillColor}`}
        />
      )}
    </button>
  );
}

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const enterRaAtHome = useEnterRaAtHome();
  const { openAudiencePicker, openWellnessHub, openExplorePicker } = useCart();
  const progress = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = !!prefersReducedMotion;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleScrollToAbout = useCallback(() => {
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goToSlide = useCallback(
    (delta: number, count: number) => setActiveSlide((i) => (i + delta + count) % count),
    [],
  );

  const slides: Slide[] = [
    {
      id: 'sanctuary',
      title: 'Your Sanctuary of',
      titleItalic: 'beauty & inner power',
      tagline:
        'Where considered care, refined technique, and quiet hospitality come together — for those who notice the difference.',
      media: { type: 'video', src: '/assets/Images/Hero%20Final.mp4' },
      topMark: '/assets/Logo/ra-emblem.png',
      durationMs: 24000,
      primaryCta: { label: 'Reserve your Experience', onClick: openExplorePicker },
      secondaryCta: { label: 'Our story', onClick: handleScrollToAbout },
    },
    {
      id: 'at-home',
      title: 'Curated rituals,',
      titleItalic: 'at home',
      tagline:
        'Curated wellness and beauty rituals brought to the comfort and privacy of your home by trained and certified professionals.',
      media: { type: 'image', src: '/assets/Images/Ra%20at%20home.jpeg' },
      topMark: '/assets/Logo/ra-emblem.png',
      primaryCta: { label: 'Enter Ra at Home', onClick: () => openAudiencePicker('/at-home', 'home_hero_primary_cta') },
      secondaryCta: { label: 'Step inside Ra at Home', onClick: () => enterRaAtHome('home_hero_secondary_cta') },
    },
    {
      id: 'wellness-hub',
      title: 'A journey to',
      titleItalic: 'stillness and renewal',
      tagline:
        'An urban sanctuary for longevity, restoration and elevated wellbeing — where science-led wellness meets stillness, healing and renewal.',
      media: {
        type: 'image',
        src: '/assets/New%20Images/Ra%20Wellness%20hub%20new.jpg',
        position: 'center',
      },
      topMark: '/assets/Logo/ra-emblem.png',
      primaryCta: { label: 'Request an invitation', onClick: openWellnessHub },
      secondaryCta: { label: 'About the Wellness Hub', onClick: () => navigate('/wellness-hub') },
    },
  ];

  const total = slides.length;
  const slide = slides[activeSlide];
  const mediaPosMap: Record<NonNullable<Slide['media']['position']>, string> = {
    top: 'object-top',
    center: 'object-center',
    bottom: 'object-bottom',
    left: 'object-left',
    right: 'object-right',
    'top-left': 'object-left-top',
    'top-right': 'object-right-top',
    'bottom-left': 'object-left-bottom',
    'bottom-right': 'object-right-bottom',
  };
  const mediaPosClass = slide.media.position
    ? mediaPosMap[slide.media.position]
    : 'object-center';
  const mediaStyle: CSSProperties = slide.media.transform
    ? {
        transform: slide.media.transform,
        transformOrigin: slide.media.transformOrigin ?? 'top left',
      }
    : {};

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const SWIPE_THRESHOLD = 60;
    const VELOCITY_THRESHOLD = 300;
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
      setActiveSlide((i) => (i + 1) % total);
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
      setActiveSlide((i) => (i - 1 + total) % total);
    }
    window.setTimeout(() => setIsPaused(false), 150);
  };

  // Reset progress whenever the active slide changes (manual click or auto-advance).
  useEffect(() => {
    progress.set(0);
  }, [activeSlide, progress]);

  // Desktop keyboard nav: ArrowLeft / ArrowRight while hero is in viewport.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const hero = document.getElementById('hero');
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      goToSlide(e.key === 'ArrowLeft' ? -1 : 1, total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToSlide, total]);

  // Single source of truth: the progress motion value drives the visible fill
  // AND fires the next slide on completion — no drift between indicator and slide.
  // Pause = stop animation (freezes current value). Resume = animate the
  // remaining distance. Reduced motion = no auto-advance, manual nav only.
  useEffect(() => {
    if (isPaused || reduceMotion) return;
    const slideDurationMs = slide.durationMs ?? AUTO_ADVANCE_MS;
    const remainingMs = (1 - progress.get()) * slideDurationMs;
    const controls = animate(progress, 1, {
      duration: remainingMs / 1000,
      ease: 'linear',
      onComplete: () => setActiveSlide((i) => (i + 1) % total),
    });
    return () => controls.stop();
  }, [isPaused, activeSlide, total, reduceMotion, progress, slide.durationMs]);

  return (
    <section
      id="hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-auto lg:h-screen bg-bg-primary overflow-hidden"
    >
      <div className="w-full lg:h-full flex flex-col lg:flex-row">

        {/* Mobile Layout — full-bleed carousel with bottom-anchored overlay */}
        <div className="lg:hidden relative w-full min-h-dvh overflow-hidden">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsPaused(true)}
            onDragEnd={handleDragEnd}
            style={{ touchAction: 'pan-y' }}
            className="absolute inset-0"
          >
            {/* z-0 — full-bleed media, crossfades per slide */}
            <AnimatePresence>
              <motion.div
                key={slide.id + '-mobile-media'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                {slide.media.type === 'video' ? (
                  <video
                    src={slide.media.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`w-full h-full object-cover ${mediaPosClass}`}
                    style={mediaStyle}
                  />
                ) : (
                  <img
                    src={slide.media.src}
                    alt=""
                    className={`w-full h-full object-cover ${mediaPosClass}`}
                    style={mediaStyle}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* z-4 — global dim layer for overall text legibility */}
            <div className="absolute inset-0 bg-black/40 z-[4] pointer-events-none" />

            {/* z-5 — gradient scrims to reinforce top + bottom text zones */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/55 via-black/20 to-transparent z-[5] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-dark/95 via-bg-dark/70 to-transparent z-[5] pointer-events-none" />

            {/* z-10 — single vertically-centered stack: eyebrow → mark → headline → tagline → CTAs → dots */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pt-24 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-none"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/80 mb-3 leading-[1.6] text-center">
                Studio opening soon
              </p>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 mb-5 backdrop-blur-md max-w-[90vw]">
                <MapPin className="w-3 h-3 text-accent-gold shrink-0" />
                <span className="text-[11px] text-white text-center">
                  At-home services ·{' '}
                  <span className="font-medium">
                    Imperial Avenue Residences only
                  </span>
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.img
                  key={slide.id + '-mobile-mark'}
                  src={slide.topMark}
                  alt="Ra"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-14 h-14 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)] mb-6"
                />
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id + '-mobile-content'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <h1 className="font-serif text-[2.5rem] text-white leading-[1.05] tracking-tight text-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
                    {slide.title}
                    <br />
                    <span className="italic">{slide.titleItalic}</span>
                  </h1>
                  <p className="font-serif italic text-base text-white/90 leading-snug max-w-[300px] text-center">
                    {slide.tagline}
                  </p>
                  <div className="flex flex-col gap-2.5 w-full max-w-[280px] pointer-events-auto mt-1">
                    <button
                      type="button"
                      onClick={slide.primaryCta.onClick}
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-text-primary px-6 py-3.5 text-sm font-medium hover:bg-white/90 transition-colors"
                    >
                      {slide.primaryCta.label}
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={slide.secondaryCta.onClick}
                      className="rounded-full border border-white/40 text-white px-6 py-3.5 text-sm font-medium hover:bg-white/10 hover:border-white/60 transition-colors"
                    >
                      {slide.secondaryCta.label}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2 pointer-events-auto mt-6">
                {slides.map((s, i) => (
                  <PaginationDot
                    key={s.id}
                    active={i === activeSlide}
                    theme="on-dark"
                    onClick={() => setActiveSlide(i)}
                    label={`Show slide ${i + 1}`}
                    progress={progress}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Desktop full-width media — cross-fades between slides */}
        <div className="hidden lg:block absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence>
            <motion.div
              key={slide.id + '-desktop-media'}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full"
            >
              {slide.media.type === 'video' ? (
                <video
                  src={slide.media.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={`w-full h-full object-cover ${mediaPosClass}`}
                  style={mediaStyle}
                />
              ) : (
                <img
                  src={slide.media.src}
                  alt=""
                  className={`w-full h-full object-cover ${mediaPosClass}`}
                  style={mediaStyle}
                />
              )}
              <div className="absolute inset-0 bg-black/40" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Bottom Info Overlay — Based-in (constant) + tagline (per slide) */}
        <div className="hidden lg:grid grid-cols-2 absolute bottom-12 left-0 w-full z-20 pointer-events-none items-end">
          <div className="px-12 xl:px-20 pointer-events-auto h-fit">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 1.2 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                <span className="text-sm text-white">
                  At-home services ·{' '}
                  <span className="font-medium">
                    Imperial Avenue Residences only
                  </span>
                </span>
              </div>
            </motion.div>
          </div>

          <div className="px-12 xl:px-20 pointer-events-auto h-fit flex justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + '-tagline'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md"
              >
                <p className="font-serif text-lg lg:text-xl xl:text-2xl text-white/90 italic leading-snug max-w-md text-right">
                  {slide.tagline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Main Title + CTAs (per slide) */}
        <div className="hidden lg:flex absolute inset-0 z-10 pointer-events-none flex-col items-center justify-center pt-32 pb-32 px-6 xl:px-12">
          <AnimatePresence mode="wait">
            <motion.img
              key={slide.id + '-desktop-mark'}
              src={slide.topMark}
              alt="Ra"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-28 h-28 object-contain mb-4 drop-shadow-[0_6px_24px_rgba(0,0,0,0.4)]"
            />
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id + '-title'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="relative text-center mix-blend-difference text-white">
                <h1 className="font-serif text-[4.5rem] xl:text-[5.5rem] 2xl:text-[6.5rem] leading-[0.95] tracking-tight pb-2 pr-[0.15em]">
                  {slide.title}
                  <br />
                  <span className="italic">{slide.titleItalic}</span>
                </h1>
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id + '-ctas'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-10 flex items-center gap-3 pointer-events-auto"
            >
              <button
                type="button"
                onClick={slide.primaryCta.onClick}
                className="group inline-flex items-center gap-2 rounded-full bg-white text-text-primary px-7 py-3.5 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                {slide.primaryCta.label}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={slide.secondaryCta.onClick}
                className="rounded-full border border-white/40 text-white px-7 py-3.5 text-sm font-medium hover:bg-white/10 hover:border-white/60 transition-colors"
              >
                {slide.secondaryCta.label}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop pagination dots — bottom-center, replaces scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 hidden lg:flex items-center gap-2 pointer-events-auto">
          {slides.map((s, i) => (
            <PaginationDot
              key={s.id}
              active={i === activeSlide}
              theme="on-dark"
              onClick={() => setActiveSlide(i)}
              label={`Show slide ${i + 1}`}
              progress={progress}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>

        {/* Desktop prev/next arrows — discoverable affordance for the carousel */}
        <button
          type="button"
          onClick={() => goToSlide(-1, total)}
          aria-label="Previous slide"
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-6 xl:left-10 z-30 w-12 h-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/30 text-white hover:bg-white/20 hover:ring-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => goToSlide(1, total)}
          aria-label="Next slide"
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-6 xl:right-10 z-30 w-12 h-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/30 text-white hover:bg-white/20 hover:ring-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
        </button>

      </div>
    </section>
  );
}
