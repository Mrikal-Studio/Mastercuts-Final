import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CalendarHeart,
  Wind,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STUDIO_PHONE_DISPLAY, STUDIO_WHATSAPP } from '@/lib/contact';
import { trackContactClick } from '@/lib/analytics';

const STORAGE_KEY = 'ra-membership-requests';
const WHATSAPP_PHONE = STUDIO_WHATSAPP;

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

const BENEFITS = [
  {
    icon: Sparkles,
    title: 'Priority access',
    body: 'First invitations to new rituals, residencies, and limited treatments before public release.',
  },
  {
    icon: CalendarHeart,
    title: 'Concierge booking',
    body: 'A dedicated coordinator to plan your visits, your therapists, and your travel weeks.',
  },
  {
    icon: Wind,
    title: 'Members-only rituals',
    body: 'Sound baths, holistic consultations, and curated at-home extras reserved for the Hub.',
  },
];

export function WellnessHubPage() {
  const navigate = useNavigate();
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
    const url = buildWhatsAppLink(req);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitted(true);

    // A GTM Click trigger cannot see this — WhatsApp is opened
    // programmatically, so no anchor is ever clicked. Hence the explicit push
    // here, unlike the plain Call/WhatsApp anchors elsewhere in the app.
    //
    // `link_url` is deliberately omitted: `url` carries the customer's name,
    // phone and email in its prefilled `?text=` message.
    trackContactClick({ method: 'whatsapp', cta_location: 'wellness_hub_page' });
  };

  return (
    <main
      className="min-h-screen bg-bg-primary text-text-primary pb-28 lg:pb-16"
      style={{ paddingTop: 'var(--nav-offset, 0px)' }}
    >
      {/* Hero */}
      <section className="px-6 lg:px-16 pt-10 pb-12 border-b border-black/10">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </button>

          <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-3">
            By invitation
          </p>
          <h1 className="font-serif text-4xl lg:text-6xl text-text-primary leading-[1.02] mb-5">
            Ra Wellness <span className="italic">Hub</span>
          </h1>
          <p className="text-base text-text-secondary leading-relaxed max-w-prose">
            Members-only rituals, curated for you — a quieter, more considered
            relationship with the Mastercuts team. Priority access, concierge booking,
            and experiences reserved for the Hub.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 lg:px-16 pt-14 pb-14 border-b border-black/10">
        <div className="mx-auto max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-4">
            What's inside
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl text-text-primary leading-[1.05] mb-10">
            Three quiet <span className="italic">privileges</span>
          </h2>

          <div className="space-y-6">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-5 border-t border-black/10 pt-6 first:border-t-0 first:pt-0"
              >
                <div className="shrink-0 w-12 h-12 rounded-full bg-circle-light flex items-center justify-center text-accent-gold">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-text-primary leading-tight mb-1.5">
                    {title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership request form */}
      <section className="px-6 lg:px-16 pt-14 pb-20">
        <div className="mx-auto max-w-2xl">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold mb-6">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                Request sent
              </p>
              <h3 className="font-serif text-3xl lg:text-4xl text-text-primary leading-[1.05] mb-4">
                We'll be in <span className="italic">touch</span>.
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto mb-8">
                Our concierge team will reach out within 24 hours to walk you
                through the Hub. If WhatsApp didn't open automatically, you can
                also message us directly at {STUDIO_PHONE_DISPLAY}.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full bg-bg-dark text-white px-6 py-3 text-sm font-medium hover:bg-bg-darker transition-colors"
              >
                Back to home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-3">
                Request membership
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl text-text-primary leading-[1.05] mb-3">
                Send a quiet <span className="italic">note</span>.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-prose mb-10">
                Fill the short form below and we'll be in touch via WhatsApp
                within 24 hours.
              </p>

              <div className="space-y-7">
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
                  <p className="block text-xs uppercase tracking-wider text-text-secondary mb-3">
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
                            'rounded-full border px-4 py-3 text-sm text-left transition-colors',
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
                className="mt-12 w-full rounded-full bg-bg-dark text-white py-4 text-sm font-medium hover:bg-bg-darker transition-colors"
              >
                Send via WhatsApp
              </button>
              <p className="mt-4 text-[11px] text-text-secondary text-center leading-relaxed">
                We'll open WhatsApp with your details pre-filled. You confirm
                by sending the message.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
