import { useNavigate } from 'react-router-dom';
import { useCart } from '@/components/cart/CartProvider';
import { useAudience } from '@/components/services/useAudience';
import { CategoryCard } from '@/components/services/CategoryCard';

const IMG_AT_HOME = '/assets/Images/Ra-at-home-new.jpeg';
const IMG_GENTS = '/assets/New Images/Mastercuts Gentlemen New.JPG';
const IMG_LADIES = '/assets/New Images/Mastercuts Ladies New.jpg';
const IMG_WELLNESS = '/assets/New Images/Ra Wellness hub new.jpg';

export function ExploreCategoriesSection() {
  const navigate = useNavigate();
  const [, setAudience] = useAudience();
  const { openAudiencePicker } = useCart();

  const handleSalon = (audience: 'gentlemen' | 'ladies') => {
    setAudience(audience);
    navigate('/explore');
  };

  return (
    <section id="services" className="bg-bg-primary py-8 lg:py-40">
      <div className="px-6 lg:px-16 max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="mb-6 lg:mb-9 max-w-2xl mx-auto lg:mx-0">
          <h2 className="font-serif text-[32px] lg:text-6xl text-text-primary leading-[1.05] text-center lg:text-left">
            Choose your <span className="italic font-medium">Experience</span>.
          </h2>
        </div>

        {/* Mobile stacks vertically; desktop renders all 4 cards equal-width
            in a single horizontal row. */}
        <div className="grid grid-cols-12 gap-3 lg:gap-4">
          {/* Mobile-only: Home Experiences eyebrow */}
          <p className="col-span-12 lg:hidden text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary mb-1 text-center">
            Home Experiences
          </p>

          {/* Ra at Home — full width on mobile, equal column on desktop */}
          <div className="col-span-12 lg:col-span-3">
            <CategoryCard
              eyebrow="Begin with our Signature Introduction"
              titleStart="Ra at"
              titleItalic="Home"
              image={IMG_AT_HOME}
              aspectClass="aspect-[2/1] lg:aspect-[5/6]"
              raBadge
              titleAlign="center"
              imageObjectPosition="object-[50%_71%] lg:object-[53%_67%]"
              onClick={() => openAudiencePicker('/at-home', 'home_explore_categories_card')}
            />
          </div>

          {/* Mobile-only: Salon Experiences eyebrow */}
          <p className="col-span-12 lg:hidden text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary mt-2 mb-1 text-center">
            Salon Experiences{' '}
            <span className="text-text-muted">( Coming soon )</span>
          </p>

          {/* Ladies' Studio */}
          <div className="col-span-6 lg:col-span-3">
            <CategoryCard
              titleStart="Ladies'"
              titleItalic="Studio"
              image={IMG_LADIES}
              aspectClass="aspect-[5/6]"
              gradient="heavy"
              onClick={() => handleSalon('ladies')}
            />
          </div>

          {/* Gents' Studio */}
          <div className="col-span-6 lg:col-span-3">
            <CategoryCard
              titleStart="Gents'"
              titleItalic="Studio"
              image={IMG_GENTS}
              aspectClass="aspect-[5/6]"
              gradient="heavy"
              onClick={() => handleSalon('gentlemen')}
            />
          </div>

          {/* Mobile-only: For Invited members only eyebrow */}
          <p className="col-span-12 lg:hidden text-[10px] font-medium uppercase tracking-[0.22em] text-text-secondary mt-2 mb-1 text-center">
            For Invited members only
          </p>

          {/* Wellness Hub */}
          <div className="col-span-12 lg:col-span-3">
            <CategoryCard
              eyebrow="By invitation only"
              titleStart="Ra Wellness"
              titleItalic="Hub"
              image={IMG_WELLNESS}
              aspectClass="aspect-[2/1] lg:aspect-[5/6]"
              raBadge
              titleAlign="center"
              imageObjectPosition="object-[61%_47%] lg:object-[63%_53%]"
              onClick={() => navigate('/wellness-hub')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
