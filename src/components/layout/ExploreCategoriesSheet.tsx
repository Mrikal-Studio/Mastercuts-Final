import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/components/cart/CartProvider';
import { useAudience } from '@/components/services/useAudience';
import { useIsMobile } from '@/hooks/use-mobile';
import { CategoryCard } from '@/components/services/CategoryCard';

function Body({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [, setAudience] = useAudience();
  const { openAudiencePicker, openWellnessHub } = useCart();

  const handleSalon = (audience: 'gentlemen' | 'ladies') => {
    setAudience(audience, 'explore_categories_sheet');
    onClose();
    setTimeout(() => navigate('/explore'), 220);
  };

  const handleAtHome = () => {
    onClose();
    setTimeout(() => openAudiencePicker('/at-home', 'explore_categories_sheet'), 220);
  };

  const handleHub = () => {
    onClose();
    setTimeout(openWellnessHub, 220);
  };

  return (
    <div className="px-6 pt-10 pb-7 max-h-[92vh] overflow-y-auto">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/5 backdrop-blur text-text-primary flex items-center justify-center hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <DialogTitle asChild>
        <h2 className="font-serif-regular text-[32px] lg:text-4xl text-text-primary leading-[1.05] mb-6">
          Choose your <span className="italic">Experience</span>.
        </h2>
      </DialogTitle>

      {/* Home Experiences */}
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary mb-2 text-center">
          Home Experiences
        </p>
        <CategoryCard
          eyebrow="Begin with our Signature Introduction"
          titleStart="Ra at"
          titleItalic="Home"
          image="/assets/Images/Ra-at-home-new.jpeg"
          aspectClass="aspect-[2/1] lg:aspect-[5/2]"
          raBadge
          titleAlign="center"
          imageObjectPosition="object-[50%_71%] lg:object-[53%_67%]"
          onClick={handleAtHome}
        />
      </div>

      {/* Salon Experiences */}
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary mb-2 text-center">
          Salon Experiences{' '}
          <span className="text-text-muted">( Coming soon )</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <CategoryCard
            titleStart="Ladies'"
            titleItalic="Studio"
            image="/assets/New Images/Mastercuts Ladies New.jpg"
            aspectClass="aspect-[23/25] lg:aspect-[113/100]"
            onClick={() => handleSalon('ladies')}
          />
          <CategoryCard
            titleStart="Gents'"
            titleItalic="Studio"
            image="/assets/New Images/Mastercuts Gentlemen New.JPG"
            aspectClass="aspect-[23/25] lg:aspect-[113/100]"
            onClick={() => handleSalon('gentlemen')}
          />
        </div>
      </div>

      {/* For Invited members only */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary mb-2 text-center">
          For Invited members only
        </p>
        <CategoryCard
          eyebrow="By invitation only"
          titleStart="Ra Wellness"
          titleItalic="Hub"
          image="/assets/New Images/Ra Wellness hub new.jpg"
          aspectClass="aspect-[2/1] lg:aspect-[5/2]"
          raBadge
          titleAlign="center"
          imageObjectPosition="object-[61%_47%] lg:object-[63%_53%]"
          onClick={handleHub}
        />
      </div>
    </div>
  );
}

export function ExploreCategoriesSheet() {
  const { surface, closeAll } = useCart();
  const isMobile = useIsMobile();
  const open = surface === 'explore-picker';

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => (v ? null : closeAll())}>
        <SheetContent
          side="bottom"
          hideDefaultClose
          className="bg-bg-primary border-none p-0 w-full max-w-full rounded-t-3xl h-auto max-h-[92vh]"
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/25 z-10" />
          <Body onClose={closeAll} />
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
        <Body onClose={closeAll} />
      </DialogContent>
    </Dialog>
  );
}
