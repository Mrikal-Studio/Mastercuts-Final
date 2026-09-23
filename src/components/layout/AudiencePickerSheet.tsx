import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/components/cart/CartProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudience } from '@/components/services/useAudience';
import type { ServiceAudience } from '@/lib/booking/types';
import { cn } from '@/lib/utils';

// The two cards. "unisex" is not offered here — selections are gendered by
// design; unisex services still surface inside both tabs on the destination.
const OPTIONS: {
  key: Exclude<ServiceAudience, 'unisex'>;
  label: string;
  tagline: string;
  image: string;
}[] = [
  {
    key: 'ladies',
    label: 'Ladies',
    tagline: 'Experiences for',
    image: '/assets/New Images/Experience-for-ladies.jpeg',
  },
  {
    key: 'gentlemen',
    label: 'Gentlemen',
    tagline: 'Experiences for',
    image: '/assets/New Images/Experience-for-Gents.jpeg',
  },
];

interface PickerBodyProps {
  onSelect: (key: Exclude<ServiceAudience, 'unisex'>) => void;
  onClose: () => void;
  tone: 'mobile' | 'desktop';
}

function PickerBody({ onSelect, onClose, tone }: PickerBodyProps) {
  const isMobile = tone === 'mobile';
  return (
    <div
      className={cn(
        'flex flex-col',
        isMobile ? 'px-6 pt-12 pb-10' : 'px-8 pt-10 pb-10',
      )}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/5 backdrop-blur text-text-primary flex items-center justify-center hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Heading */}
      <div className="mb-8 max-w-sm">
        <DialogTitle asChild>
          <h2 className="font-serif-regular text-[32px] lg:text-4xl leading-[1.06] text-text-primary">
            Who is this <span className="italic">visit</span> for?
          </h2>
        </DialogTitle>
      </div>

      {/* Option cards */}
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 + i * 0.06, ease: 'easeOut' }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden rounded-2xl bg-bg-primary text-left border border-transparent hover:border-accent-gold transition-colors"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src={opt.image}
                alt=""
                className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-accent-gold mb-1.5">
                {opt.tagline}
              </p>
              <p className="font-serif text-3xl text-white leading-none">{opt.label}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-text-muted leading-relaxed">
        Unisex services appear in both selections.
      </p>
    </div>
  );
}

export function AudiencePickerSheet() {
  const { surface, closeAll, audiencePickerDestination } = useCart();
  const [, setAudience] = useAudience();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const open = surface === 'audience-picker';

  const handleSelect = (key: Exclude<ServiceAudience, 'unisex'>) => {
    setAudience(key, 'audience_picker_sheet');
    closeAll();
    // Delay navigation until the close animation completes so the transition
    // feels intentional instead of jarring.
    setTimeout(() => navigate(audiencePickerDestination), 220);
  };

  // Mobile: bottom sheet preserved. Desktop: centered Dialog.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => (v ? null : closeAll())}>
        <SheetContent
          side="bottom"
          hideDefaultClose
          className="bg-bg-primary border-none p-0 flex flex-col overflow-hidden w-full max-w-full rounded-t-3xl h-auto max-h-[88vh]"
        >
          {/* Grabber handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-10 h-1 rounded-full bg-black/25" />
          <PickerBody onSelect={handleSelect} onClose={closeAll} tone="mobile" />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : closeAll())}>
      <DialogContent
        showCloseButton={false}
        className="bg-bg-primary border-none p-0 sm:max-w-lg w-[calc(100%-2rem)] overflow-hidden rounded-2xl shadow-2xl"
      >
        <PickerBody onSelect={handleSelect} onClose={closeAll} tone="desktop" />
      </DialogContent>
    </Dialog>
  );
}
