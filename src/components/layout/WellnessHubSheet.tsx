import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/components/cart/CartProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { submitLead, type LeadInterest } from '@/lib/api/leads';
import { STUDIO_PHONE_DISPLAY, STUDIO_WHATSAPP } from '@/lib/contact';
import { trackContactClick } from '@/lib/analytics';

const STORAGE_KEY = 'ra-membership-requests';
const WHATSAPP_PHONE = STUDIO_WHATSAPP;

// Map the form's interest keys to the backend leads enum.
const INTEREST_TO_LEAD: Record<Interest, LeadInterest> = {
  'hair-skin': 'HAIR_SKIN',
  'wellness-recovery': 'WELLNESS_RECOVERY',
  'bridal-special': 'BRIDAL_SPECIAL',
  all: 'ALL',
};

const PHONE_REGEX = /^\+971\s?\d{2}\s?\d{3}\s?\d{4}$|^05\d\s?\d{3}\s?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Interest = 'hair-skin' | 'wellness-recovery' | 'bridal-special' | 'all';

const INTERESTS: { key: Interest; label: string }[] = [
  { key: 'hair-skin', label: 'Hair & Skin' },
  { key: 'wellness-recovery', label: 'Wellness & Recovery' },
  { key: 'bridal-special', label: 'Bridal & Special Events' },
  { key: 'all', label: 'All of the above' },
];

interface StoredRequest {
  name: string;
  phone: string;
  email: string;
  interest: Interest;
  createdAt: number;
}

function saveRequest(req: StoredRequest) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: StoredRequest[] = raw ? JSON.parse(raw) : [];
    list.push(req);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage may be blocked — fall through silently
  }
}

function buildWhatsAppLink(req: StoredRequest): string {
  const label = INTERESTS.find((i) => i.key === req.interest)?.label ?? '';
  const msg =
    `Hello Mastercuts, I'd like to request Ra Wellness Hub membership.\n\n` +
    `Name: ${req.name}\n` +
    `Phone: ${req.phone}\n` +
    `Email: ${req.email}\n` +
    `Interest: ${label}`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
}

interface BodyProps {
  onClose: () => void;
}

function Body({ onClose }: BodyProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState<Interest>('all');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Please share your name.';
    if (!PHONE_REGEX.test(phone.trim())) next.phone = 'Please enter a valid UAE mobile number.';
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Please enter a valid email.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const req: StoredRequest = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      interest,
      createdAt: Date.now(),
    };
    saveRequest(req);
    // Fire-and-forget lead capture — best-effort, must not block the WhatsApp
    // flow or surface errors to the user.
    void submitLead({
      source: 'WELLNESS_HUB',
      name: req.name,
      phone: req.phone,
      email: req.email,
      interest: INTEREST_TO_LEAD[req.interest],
      lead_source: 'ra_wellness_hub',
    }).catch(() => {});
    const url = buildWhatsAppLink(req);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitted(true);

    // A GTM Click trigger cannot see this — WhatsApp is opened
    // programmatically, so no anchor is ever clicked. Hence the explicit push
    // here, unlike the plain Call/WhatsApp anchors elsewhere in the app.
    //
    // `link_url` is deliberately omitted: `url` carries the customer's name,
    // phone and email in its prefilled `?text=` message.
    trackContactClick({ method: 'whatsapp', cta_location: 'wellness_hub_sheet' });
  };

  return (
    <div className="flex flex-col max-h-[88vh]">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="overflow-y-auto px-6 pt-7 pb-7">
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold mb-5">
              <Check className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-2">
              Request sent
            </p>
            <h3 className="font-serif text-3xl text-text-primary leading-[1.05] mb-3">
              We'll be in <span className="italic">touch</span>.
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-6">
              Our concierge will reach out within 24 hours. If WhatsApp didn't
              open, you can also message us at {STUDIO_PHONE_DISPLAY}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-bg-dark text-white px-6 py-2.5 text-sm font-medium hover:bg-bg-darker transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-2">
              By invitation
            </p>
            <DialogTitle asChild>
              <h2 className="font-serif text-3xl text-text-primary leading-[1.05] mb-3">
                Ra Wellness <span className="italic">Hub</span>
              </h2>
            </DialogTitle>
            <p className="text-sm text-text-secondary leading-relaxed mb-7">
              Send a quiet note — our concierge will reach out within 24 hours.
            </p>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent border-b border-black/15 py-2.5 text-text-primary placeholder:text-text-muted focus:border-text-primary outline-none transition-colors"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2">
                  Mobile (UAE)
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full bg-transparent border-b border-black/15 py-2.5 text-text-primary placeholder:text-text-muted focus:border-text-primary outline-none transition-colors"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-transparent border-b border-black/15 py-2.5 text-text-primary placeholder:text-text-muted focus:border-text-primary outline-none transition-colors"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>
                )}
              </div>

              {/* Interest */}
              <div>
                <p className="block text-xs uppercase tracking-wider text-text-secondary mb-2.5">
                  Interest
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTERESTS.map(({ key, label }) => {
                    const selected = interest === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInterest(key)}
                        className={cn(
                          'rounded-full border px-4 py-2.5 text-sm text-left transition-colors',
                          selected
                            ? 'border-text-primary bg-text-primary text-white'
                            : 'border-black/15 text-text-primary hover:border-text-primary/40',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-full bg-bg-dark text-white py-3.5 text-sm font-medium hover:bg-bg-darker transition-colors"
            >
              Send via WhatsApp
            </button>
            <p className="mt-3 text-[11px] text-text-secondary text-center leading-relaxed">
              We'll open WhatsApp with your details pre-filled.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export function WellnessHubSheet() {
  const { surface, closeAll } = useCart();
  const isMobile = useIsMobile();
  const open = surface === 'wellness-hub';

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => (v ? null : closeAll())}>
        <SheetContent
          side="bottom"
          hideDefaultClose
          className="bg-bg-primary border-none p-0 w-full max-w-full rounded-t-3xl h-auto max-h-[88vh]"
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/20 z-10" />
          <Body onClose={closeAll} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : closeAll())}>
      <DialogContent
        showCloseButton={false}
        className="bg-bg-primary border-none p-0 sm:max-w-md w-[calc(100%-2rem)] overflow-hidden rounded-2xl shadow-2xl"
      >
        <Body onClose={closeAll} />
      </DialogContent>
    </Dialog>
  );
}
