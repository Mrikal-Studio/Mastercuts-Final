import { ArrowLeft, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartProvider';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { DrawerStickyFooter } from './DrawerStickyFooter';

interface Props {
  onClose: () => void;
  canGoBack: boolean;
  onBack: () => void;
}

export function RitualIndexView({ onClose, canGoBack, onBack }: Props) {
  const { closeAll } = useCart();
  const navigate = useNavigate();
  const { sections, journeys } = useCatalog();

  // Anchor on the readable slug rather than the sub-category UUID.
  const goToSection = (slug: string) => {
    closeAll();
    setTimeout(() => navigate(`/explore#${slug}`), 220);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-5 border-b border-black/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1">
              Our rituals
            </p>
            <h2 className="font-serif text-2xl text-text-primary leading-none">
              Choose <span className="italic">one</span>
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* Journey entry point — hand-assembled experiences above the à la carte menu */}
        <button
          type="button"
          onClick={() => goToSection('curated-journeys')}
          className="group w-full mt-5 mb-2 flex items-center gap-4 p-4 rounded-2xl bg-bg-dark text-white text-left hover:bg-bg-darker transition-colors"
        >
          <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1">
              Hand-assembled · save up to 15%
            </span>
            <span className="block font-serif text-lg leading-tight">
              Start with a <span className="italic">curated journey</span>
            </span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-white/70 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>

        <p className="px-1 pt-4 pb-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary">
          Or browse à la carte · {journeys.length} journeys available
        </p>

        <ul className="divide-y divide-black/10">
          {sections.map((section) => {
            const count = section.services.filter((sv) => !sv.isAddon).length;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => goToSection(section.slug)}
                  className="group w-full flex items-center gap-4 py-5 text-left"
                >
                  <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-black/5">
                    <img src={section.imageUrl} alt={section.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-xl text-text-primary leading-tight">
                      {section.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-text-secondary mt-1">
                      {section.tagline || section.shortName}
                    </p>
                    <p className="text-xs text-text-secondary mt-2">
                      {count} services
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary group-hover:bg-black/10 transition-colors flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <DrawerStickyFooter />
    </div>
  );
}
