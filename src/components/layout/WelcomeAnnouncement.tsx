import { useEffect, useState } from 'react';
import { useEnterRaAtHome } from '@/components/analytics/useEnterRaAtHome';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MapPin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { submitLead } from '@/lib/api/leads';
import { trackGenerateLead } from '@/lib/analytics';

const RA_EMBLEM = '/assets/Logo/ra-emblem.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEWSLETTER_KEY = 'mastercuts-newsletter-emails';

interface StoredEmail {
  email: string;
  createdAt: number;
}

export function WelcomeAnnouncement() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const enterRaAtHome = useEnterRaAtHome();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
  };

  const handleExplore = () => {
    setOpen(false);
    enterRaAtHome('welcome_popup');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Please enter a valid email.');
      return;
    }
    try {
      const raw = localStorage.getItem(NEWSLETTER_KEY);
      const list: StoredEmail[] = raw ? JSON.parse(raw) : [];
      list.push({ email: trimmed, createdAt: Date.now() });
      localStorage.setItem(NEWSLETTER_KEY, JSON.stringify(list));
    } catch {
      // storage may be blocked — still show success so we're not hostile
    }
    // Fire-and-forget newsletter lead capture — best-effort, never blocks UX.
    void submitLead({
      source: 'NEWSLETTER',
      email: trimmed,
      lead_source: 'ra_relocation_newsletter',
    }).catch(() => {});
    setSubmitted(true);
    setEmailError('');

    // Reported once validation passed and the submission was made, matching
    // what the customer is told ("Thanks — we'll be in touch"). The lead POST
    // is deliberately fire-and-forget, so its result is not the signal here.
    //
    // Only the form's identity is sent. The email address stays out of the
    // dataLayer entirely — `trackGenerateLead` has no parameter for it.
    trackGenerateLead('ra_relocation_newsletter', 'welcome_popup');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <AnimatePresence>
        {open && (
          <DialogContent
            showCloseButton={false}
            className="bg-bg-primary border-none p-0 sm:max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="grid grid-cols-1 sm:grid-cols-12 max-h-[90vh]"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close announcement"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* LEFT — Ra emblem, large and centered */}
              <div className="sm:col-span-5 bg-circle-light flex items-center justify-center px-8 py-10 sm:py-12">
                <img
                  src={RA_EMBLEM}
                  alt="Ra"
                  className="w-32 h-32 sm:w-52 sm:h-52 object-contain"
                />
              </div>

              {/* RIGHT — editorial copy */}
              <div className="sm:col-span-7 flex flex-col px-6 sm:px-10 pt-8 sm:pt-12 pb-6 sm:pb-10 overflow-y-auto">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                  A note from us
                </p>

                <DialogTitle asChild>
                  <h2 className="font-serif text-text-primary leading-[1.05] text-2xl sm:text-3xl mb-1">
                    We've relocated.
                  </h2>
                </DialogTitle>
                <p className="font-serif italic text-text-primary leading-[1.05] text-2xl sm:text-3xl mb-5">
                  And we're transforming.
                </p>

                <DialogDescription asChild>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-prose">
                    Select at-home services are available now while the new
                    studio takes shape at Imperial Avenue, Downtown Dubai.
                  </p>
                </DialogDescription>

                {/* Location callout — keeps the exclusivity message visible
                    before users have to scroll anywhere else on the site. */}
                <div className="inline-flex items-center gap-2 rounded-full bg-accent-gold/10 border border-accent-gold/30 px-3 py-1.5 mb-6">
                  <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                  <span className="text-[11px] text-text-primary">
                    At-home services ·{' '}
                    <span className="font-medium">
                      Imperial Avenue Residences only
                    </span>
                  </span>
                </div>

                {/* Email capture — primary action */}
                <form onSubmit={handleEmailSubmit} className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                    Be there when we open
                  </p>
                  {submitted ? (
                    <div className="flex items-center gap-2.5 py-1">
                      <span className="w-7 h-7 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0">
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </span>
                      <p className="text-sm text-text-primary">
                        Thanks — we'll be in touch.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        placeholder="you@email.com"
                        className="w-full bg-transparent border-b border-black/15 py-2 text-text-primary placeholder:text-text-muted focus:border-text-primary outline-none transition-colors text-sm"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-full bg-bg-dark text-white py-3.5 text-sm font-medium hover:bg-bg-darker transition-colors"
                      >
                        Notify me
                      </button>
                      {emailError && (
                        <p className="text-xs text-red-600">{emailError}</p>
                      )}
                    </div>
                  )}
                </form>

                {/* Secondary CTAs */}
                <div className="mt-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleExplore}
                    className="flex-1 rounded-full border border-black/15 text-text-primary py-3 text-sm font-medium hover:bg-black/5 transition-colors"
                  >
                    Explore Ra at Home
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="flex-1 rounded-full border border-black/15 text-text-primary py-3 text-sm font-medium hover:bg-black/5 transition-colors"
                  >
                    Continue browsing
                  </button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
