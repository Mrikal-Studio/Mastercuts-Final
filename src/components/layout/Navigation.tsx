import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  ChevronDown,
  Phone,
  Search as SearchIcon,
  X,
  User as UserIcon,
  Navigation as NavigateIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/components/cart/CartProvider';
import { CartIcon } from '@/components/cart/CartIcon';
import { useAudience } from '@/components/services/useAudience';
import { DesktopMenu } from './DesktopMenu';
import { BrandLockup } from './BrandLockup';
import { ContactMenu } from './ContactMenu';
import { STUDIO_PHONE_DISPLAY, STUDIO_PHONE_E164 } from '@/lib/contact';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mastercutsOpen, setMastercutsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const headerRef = useRef<HTMLElement>(null);
  const { cart, account, openLogin, openProfile, openAudiencePicker, openWellnessHub, openSearch } = useCart();
  const [, setAudience] = useAudience();
  const cartHasItemsRef = useRef(false);
  cartHasItemsRef.current = cart.items.length > 0;
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      // Keep nav visible when cart has items so the cart icon stays accessible
      if (cartHasItemsRef.current) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Expose the nav's effective height as a CSS variable so sticky bars
  // elsewhere can stack below it. When hidden, reset to 0 so sticky bars
  // slide up to the viewport edge.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = headerRef.current;
      const height = el?.offsetHeight ?? 0;
      document.documentElement.style.setProperty(
        '--nav-offset',
        hidden ? '0px' : `${height}px`,
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [hidden, scrolled, heroInView, isHome]);

  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty('--nav-offset', '0px');
    };
  }, []);

  // Track whether the hero section is still in the viewport. Used to gate the
  // desktop announcement strip — it should only appear while the user is on
  // the hero. On non-home pages there is no #hero, so default to false.
  useEffect(() => {
    if (!isHome) {
      setHeroInView(false);
      return;
    }
    const el = document.getElementById('hero');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isHome]);

  // On ritual pages the hero is dark, so treat nav like scrolled (dark chrome).
  const darkChrome = scrolled || !isHome;

  // Initials only ever come from a real name. A guest who signed in with a
  // phone but hasn't given a name falls through to the person glyph — digits
  // from a phone number read as noise, not as an identity.
  const initials = account?.name?.trim()
    ? account.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const goToSection = (sectionId: string) => {
    if (isHome) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  // Shared service handlers — used by both the desktop dropdown and the
  // mobile hamburger Services list. Each closes its own menu before firing.
  const goToSalon = (audience: 'gentlemen' | 'ladies', closeMenu: () => void) => {
    setAudience(audience);
    closeMenu();
    navigate('/explore');
  };

  const goToAtHome = (closeMenu: () => void) => {
    closeMenu();
    setTimeout(() => openAudiencePicker('/at-home', 'nav_mobile_menu'), 220);
  };

  const goToWellnessHub = (closeMenu: () => void) => {
    closeMenu();
    setTimeout(openWellnessHub, 220);
  };

  return (
  <>
    <motion.header
      ref={headerRef}
      initial={{ y: -100 }}
      animate={{ y: hidden ? '-100%' : 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        darkChrome ? 'bg-bg-dark/95 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      {/* Announcement strip — desktop only, visible while the hero is in view */}
      {isHome && heroInView && (
        <Link
          to="/explore"
          className="hidden lg:block bg-bg-dark border-b border-white/10 py-2 px-6 lg:px-12 text-center group"
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/80 group-hover:text-white transition-colors">
            The sanctuary is taking shape · Home services available
            <span className="ml-2 text-accent-gold">→</span>
          </span>
        </Link>
      )}

      <div className={`w-full px-6 lg:px-12 transition-[padding] duration-300 ${darkChrome ? 'py-4' : 'py-6'}`}>
        <nav className="flex items-center justify-between gap-6">
          {/* Logo — Ra by Mastercuts lockup, across all contexts */}
          <Link to="/" className="flex items-center group shrink-0">
            <BrandLockup
              tone="light"
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop primary nav — 4 dedicated items, center-flexed */}
          <div className="hidden lg:flex items-center gap-7">
            {/* Mastercuts dropdown (Gents, Ladies) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMastercutsOpen(!mastercutsOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-white transition-colors duration-200 hover:opacity-70"
              >
                Mastercuts
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mastercutsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {mastercutsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-4 w-72 bg-bg-dark rounded-lg shadow-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => goToSalon('ladies', () => setMastercutsOpen(false))}
                      className="w-full flex flex-col gap-0.5 px-5 py-3 hover:bg-white/10 transition-colors duration-200 group text-left"
                    >
                      <span className="text-sm text-white/80 group-hover:text-white">
                        Ladies' <span className="italic">Studio</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 group-hover:text-white/60">
                        In salon
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToSalon('gentlemen', () => setMastercutsOpen(false))}
                      className="w-full flex flex-col gap-0.5 px-5 py-3 hover:bg-white/10 transition-colors duration-200 group text-left"
                    >
                      <span className="text-sm text-white/80 group-hover:text-white">
                        Gents' <span className="italic">Studio</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 group-hover:text-white/60">
                        In salon
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ra at Home — direct */}
            <button
              type="button"
              onClick={() => openAudiencePicker('/at-home', 'nav_desktop_link')}
              className="text-sm font-medium text-white transition-colors duration-200 hover:opacity-70 whitespace-nowrap"
            >
              Ra at Home
            </button>

            {/* Ra Wellness Hub — direct */}
            <button
              type="button"
              onClick={openWellnessHub}
              className="text-sm font-medium text-white transition-colors duration-200 hover:opacity-70 whitespace-nowrap"
            >
              Ra Wellness Hub
            </button>

            {/* Contact — jumps to the Visit the studio card in the footer */}
            <button
              type="button"
              onClick={() => goToSection('contact')}
              className="text-sm font-medium text-white transition-colors duration-200 hover:opacity-70 whitespace-nowrap"
            >
              Contact
            </button>

            {/* More — opens the full-screen DesktopMenu overlay */}
            <button
              type="button"
              onClick={() => setDesktopMenuOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-white transition-colors duration-200 hover:opacity-70"
            >
              More
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Right cluster — Phone, Contact, Search, Cart, Login */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            {/* Phone + location. The number opens a Call / WhatsApp menu;
                "Dubai" is its own control that jumps to the Visit the studio
                card (address + map) in the footer. */}
            <div className="flex items-center gap-2 text-sm">
              <ContactMenu variant="desktop" />
              <button
                type="button"
                onClick={() => goToSection('contact')}
                title="View the studio address"
                aria-label="View the studio address"
                className="group flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors duration-200"
              >
                <span className="underline-offset-4 group-hover:underline">Dubai</span>
                <NavigateIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={openSearch}
              aria-label="Search rituals"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors duration-200"
            >
              <SearchIcon className="w-4 h-4" />
            </button>

            <CartIcon tone="light" />

            {account ? (
              <button
                type="button"
                onClick={openProfile}
                aria-label="Open profile"
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium tracking-wide bg-white text-text-primary hover:bg-white/90 transition-colors duration-200"
              >
                {initials || <UserIcon className="w-4 h-4" />}
              </button>
            ) : (
              <Button
                onClick={openLogin}
                className="rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 bg-white text-text-primary hover:bg-white/90 transition-colors duration-200"
              >
                <UserIcon className="w-4 h-4" />
                Log in
              </Button>
            )}
          </div>

          {/* Mobile Right Buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Studio address — icon only here; the "Dubai" label it carries on
                desktop would crowd the mobile cluster. */}
            <button
              type="button"
              onClick={() => goToSection('contact')}
              aria-label="View the studio address"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                darkChrome
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
              }`}
            >
              <NavigateIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={openSearch}
              aria-label="Search rituals"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                darkChrome
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
              }`}
            >
              <SearchIcon className="w-4 h-4" />
            </button>

            {/* Phone icon opens the Call / WhatsApp menu — no Contact text
                here, the icon carries both options on mobile. */}
            <ContactMenu variant="mobile" darkChrome={darkChrome} />

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-bg-dark flex items-center justify-center text-white hover:bg-bg-dark/80 transition-colors duration-200">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-96 bg-ra-ivory text-text-primary border-none"
                hideDefaultClose
              >
                <div className="flex flex-col h-full px-8 pt-8 pb-10">
                  <div className="flex-shrink-0 flex items-center justify-between mb-8">
                    <BrandLockup tone="dark" />
                    <SheetClose className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors duration-200">
                      <X className="w-5 h-5" />
                    </SheetClose>
                  </div>

                  <nav className="flex-1 overflow-y-auto -mx-8 px-8 py-2 flex flex-col gap-5">
                    <button
                      type="button"
                      className="text-left text-2xl font-serif text-text-primary hover:opacity-60 transition-opacity"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/');
                      }}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      className="text-left text-2xl font-serif text-text-primary hover:opacity-60 transition-opacity"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => goToSection('about'), 220);
                      }}
                    >
                      About Us
                    </button>
                    <button
                      type="button"
                      className="text-left text-2xl font-serif text-text-primary hover:opacity-60 transition-opacity"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => goToSection('dr-sara'), 220);
                      }}
                    >
                      Dr Sara
                    </button>

                    <div className="pt-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                        Services
                      </p>
                      <div className="flex flex-col gap-4">
                        <button
                          type="button"
                          onClick={() => goToAtHome(() => setMobileMenuOpen(false))}
                          className="flex flex-col gap-0.5 group text-left"
                        >
                          <span className="text-xl font-serif text-text-primary group-hover:opacity-60 transition-opacity">
                            Ra at <span className="italic">Home</span>
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted group-hover:text-text-secondary transition-colors">
                            Nails · Massage · Threading
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => goToSalon('ladies', () => setMobileMenuOpen(false))}
                          className="flex flex-col gap-0.5 group text-left"
                        >
                          <span className="text-xl font-serif text-text-primary group-hover:opacity-60 transition-opacity">
                            Ladies' <span className="italic">Studio</span>
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted group-hover:text-text-secondary transition-colors">
                            In salon
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => goToSalon('gentlemen', () => setMobileMenuOpen(false))}
                          className="flex flex-col gap-0.5 group text-left"
                        >
                          <span className="text-xl font-serif text-text-primary group-hover:opacity-60 transition-opacity">
                            Gents' <span className="italic">Studio</span>
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted group-hover:text-text-secondary transition-colors">
                            In salon
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => goToWellnessHub(() => setMobileMenuOpen(false))}
                          className="flex flex-col gap-0.5 group text-left"
                        >
                          <span className="text-xl font-serif text-text-primary group-hover:opacity-60 transition-opacity">
                            Ra Wellness <span className="italic">Hub</span>
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted group-hover:text-text-secondary transition-colors">
                            By invitation
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-left text-2xl font-serif text-text-primary hover:opacity-60 transition-opacity pt-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => goToSection('team'), 220);
                      }}
                    >
                      Our Therapists
                    </button>
                    <button
                      type="button"
                      className="text-left text-2xl font-serif text-text-primary hover:opacity-60 transition-opacity"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => goToSection('contact'), 220);
                      }}
                    >
                      Contact
                    </button>
                  </nav>

                  <div className="flex-shrink-0 space-y-5 pt-5">
                    {account ? (
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setTimeout(() => openProfile(), 220);
                        }}
                        className="w-full bg-bg-dark text-white hover:bg-bg-dark/90 rounded-full py-6 text-sm font-medium flex items-center justify-center gap-3"
                      >
                        <span className="w-7 h-7 rounded-full bg-white text-bg-dark flex items-center justify-center text-[11px] font-medium">
                          {initials || <UserIcon className="w-3.5 h-3.5" />}
                        </span>
                        <span>
                          {account.name ? account.name.split(/\s+/)[0] : 'Profile'}
                        </span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setTimeout(() => openLogin(), 220);
                        }}
                        className="w-full bg-bg-dark text-white hover:bg-bg-dark/90 rounded-full py-6 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" />
                        Log in
                      </Button>
                    )}
                    <div className="border-t border-black/10 pt-5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-4">
                        Get in touch
                      </p>
                      <a
                        href={`tel:${STUDIO_PHONE_E164}`}
                        className="group flex items-center gap-3"
                      >
                        <span className="shrink-0 w-9 h-9 rounded-full bg-black/[0.04] flex items-center justify-center text-accent-gold group-hover:bg-black/[0.08] transition-colors duration-200">
                          <Phone className="w-4 h-4" />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                            Call
                          </span>
                          <span className="text-sm text-text-primary group-hover:opacity-60 transition-opacity">
                            {STUDIO_PHONE_DISPLAY}
                          </span>
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>

    </motion.header>

    <DesktopMenu open={desktopMenuOpen} onClose={() => setDesktopMenuOpen(false)} />
  </>
  );
}
