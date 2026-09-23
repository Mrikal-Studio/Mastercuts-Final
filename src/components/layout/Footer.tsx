import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { useAudience } from '@/components/services/useAudience';
import {
  STUDIO_ADDRESS,
  STUDIO_EMAIL,
  STUDIO_PHONE_DISPLAY,
  STUDIO_PHONE_E164,
} from '@/lib/contact';

const STUDIO_PHONE = STUDIO_PHONE_DISPLAY;
const STUDIO_PHONE_HREF = STUDIO_PHONE_E164;
const STUDIO_HOURS = '10:00 AM – 10:00 PM · Monday – Sunday';
const AT_HOME_HOURS = '10:00 AM – 8:00 PM · Monday – Sunday';
const STORE_MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3610.4484125620006!2d55.2738043!3d25.1880962!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f690dc8f8025d%3A0xb76a5aca87edadd3!2sMastercuts%20Beauty%20Salon!5e0!3m2!1sen!2sin!4v1779082369113!5m2!1sen!2sin';

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { cart, surface, openExplorePicker, openAudiencePicker, openWellnessHub } = useCart();
  // Mirrors CartStrip's own visibility rule.
  const cartStripVisible = cart.items.length > 0 && surface === 'none';
  const [, setAudience] = useAudience();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const goToSalon = (audience: 'gentlemen' | 'ladies') => {
    setAudience(audience);
    navigate('/explore');
  };
  const goToAtHome = () => openAudiencePicker('/at-home', 'footer_link');

  const goToSection = (id: string) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const goHome = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const clinicLinks: { label: string; onClick: () => void }[] = [
    { label: 'Home', onClick: goHome },
    { label: 'About us', onClick: () => goToSection('about') },
    { label: 'A note from Dr Sara', onClick: () => goToSection('dr-sara') },
    { label: 'Our team', onClick: () => goToSection('team') },
    { label: 'Contact', onClick: () => goToSection('contact') },
  ];

  return (
    <footer ref={ref}>

      {/* CTA Section — title + button on a full-bleed image background */}
      <section
        className="relative w-full bg-cover bg-center bg-no-repeat px-6 lg:px-12 xl:px-20 pt-20 lg:pt-[100px] pb-48 lg:pb-64"
        style={{ backgroundImage: "url('/assets/Images/cta-background.jpg')" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-stretch gap-6 sm:gap-12 lg:gap-20"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[34px] sm:leading-tight text-center sm:text-left"
          >
            We don't simply provide services. we <span className="italic">create experiences.</span>
          </motion.h2>

          {/* Pill-shaped button — height stretches to match h2, width is fixed for pill proportion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex-shrink-0 w-full sm:w-72 lg:w-96 h-20 sm:h-auto"
          >
            <button
              type="button"
              onClick={openExplorePicker}
              className="group relative w-full h-full rounded-full border border-white/30 flex items-center justify-center overflow-hidden transition-colors duration-500"
            >
              {/* Fill layer — always filled on mobile, scales in on hover at sm+ */}
              <span
                className="absolute inset-0 rounded-full bg-white scale-100 sm:scale-0 sm:group-hover:scale-100 transition-transform duration-500 ease-in-out origin-center"
              />
              {/* Label — dark on mobile (matches filled state), white→dark on hover at sm+ */}
              <span className="relative z-10 font-serif text-2xl italic text-text-primary sm:text-white sm:group-hover:text-text-primary transition-colors duration-300">
                Schedule your Ritual
              </span>
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Dark surface — Links + Visit + Copyright. The cart strip is fixed to
          the bottom edge, so while it is showing the legal row needs extra
          room to scroll clear of it — padded here rather than with a spacer so
          the dark surface keeps running to the page end. */}
      <div className={cartStripVisible ? 'bg-bg-dark pb-32 lg:pb-28' : 'bg-bg-dark pb-8'}>
        <div className="w-full px-6 lg:px-12 xl:px-20">

        {/* Footer Links — Services | Our Salon | Social (Contact now lives below with the map) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12 border-t border-white/10">

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-white/50 text-sm mb-6">Services</p>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  onClick={goToAtHome}
                  className="text-white hover:text-white/70 transition-colors duration-200 text-left"
                >
                  Ra at Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goToSalon('ladies')}
                  className="text-white hover:text-white/70 transition-colors duration-200 text-left"
                >
                  Ladies' Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goToSalon('gentlemen')}
                  className="text-white hover:text-white/70 transition-colors duration-200 text-left"
                >
                  Gents' Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openWellnessHub}
                  className="text-white hover:text-white/70 transition-colors duration-200 text-left"
                >
                  Ra Wellness Hub
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Our Salon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p className="text-white/50 text-sm mb-6">Our Salon</p>
            <ul className="space-y-3">
              {clinicLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={link.onClick}
                    className="text-white hover:text-white/70 transition-colors duration-200 text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-white/50 text-sm mb-6">Follow us</p>
            <div className="flex gap-4">
              <a
                href="#"
                aria-label="Instagram"
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Visit the studio — Contact card + map paired as one composition.
            Imperial Avenue is for at-home delivery during the transition;
            the embedded map points to the salon being revamped. */}
        <div id="contact" className="mt-12 pt-12 border-t border-white/10 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:items-stretch">

            {/* Contact card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:p-8 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <h3 className="font-serif text-2xl lg:text-3xl text-white leading-tight">
                  Visit the studio
                </h3>
                <span className="text-[10px] uppercase tracking-[0.22em] text-accent-gold border border-accent-gold/40 rounded-full px-3 py-1 whitespace-nowrap">
                  Opening soon
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent-gold shrink-0 mt-1" />
                  <p className="text-white text-sm leading-relaxed">
                    {STUDIO_ADDRESS}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-accent-gold shrink-0" />
                  <a
                    href={`tel:${STUDIO_PHONE_HREF}`}
                    className="text-white text-sm hover:text-white/70 transition-colors"
                  >
                    {STUDIO_PHONE}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-accent-gold shrink-0" />
                  <a
                    href={`mailto:${STUDIO_EMAIL}`}
                    className="text-white text-sm hover:text-white/70 transition-colors"
                  >
                    {STUDIO_EMAIL}
                  </a>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Studio hours
                </p>
                <p className="text-white/80 text-xs leading-snug">{STUDIO_HOURS}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 pt-2">
                  Ra at Home hours
                </p>
                <p className="text-white/80 text-xs leading-snug">{AT_HOME_HOURS}</p>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] lg:aspect-auto lg:min-h-[420px]"
            >
              <iframe
                title="Map of Mastercuts Beauty Salon"
                src={STORE_MAP_SRC}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  filter:
                    'invert(0.92) hue-rotate(180deg) saturate(0.55) brightness(0.95) contrast(0.95)',
                }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </motion.div>
          </div>
        </div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div className="text-white/50 text-sm">
            <p>Copyright 2026</p>
            <p>Mastercuts</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm items-center sm:items-start">
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="text-white/50 hover:text-white transition-colors duration-200"
            >
              Terms &amp; Conditions
            </button>
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="text-white/50 hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('/refund-policy')}
              className="text-white/50 hover:text-white transition-colors duration-200"
            >
              Refund Policy
            </button>
          </div>

          <p className="text-white/50 text-sm">
            Developed by <span className="text-white">Mrikal</span>
          </p>
        </motion.div>

        </div>
      </div>
    </footer>
  );
}
