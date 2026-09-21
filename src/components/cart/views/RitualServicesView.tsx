import { ArrowLeft, X } from 'lucide-react';
import { formatAed, formatDuration } from '../CartProvider';
import { useCatalog } from '@/lib/booking/CatalogProvider';
import { pickServiceImage } from '@/lib/booking/types';
import { useAudience } from '@/components/services/useAudience';
import { AddToCartButton } from '../AddToCartButton';
import { DrawerStickyFooter } from './DrawerStickyFooter';

interface Props {
  sectionId: string;
  onClose: () => void;
  onBack: () => void;
}

export function RitualServicesView({ sectionId, onClose, onBack }: Props) {
  const { getSectionById, getSectionServices, getTherapistsForSection } = useCatalog();
  const section = getSectionById(sectionId);
  const services = getSectionServices(sectionId);
  const therapistCount = getTherapistsForSection(sectionId).length;
  const [audience] = useAudience();

  if (!section) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-5 border-b border-black/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-primary hover:bg-black/10 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1">
              {section.tagline || section.shortName}
            </p>
            <h2 className="font-serif text-2xl text-text-primary leading-none truncate">
              {section.name}
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
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm text-text-secondary leading-relaxed">
            {section.description}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-text-secondary mt-3">
            {services.length} services · {therapistCount} {therapistCount === 1 ? 'specialist' : 'specialists'}
          </p>
        </div>

        <ul className="px-6 pb-8">
          {services.map((svc) => (
            <li
              key={svc.id}
              className="flex items-start gap-4 py-5 border-b border-black/10"
            >
              <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-black/5">
                <img src={pickServiceImage(svc, audience)} alt={svc.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-text-primary leading-tight">
                  {svc.name}
                </h3>
                <p className="text-[11px] uppercase tracking-wider text-text-secondary mt-1">
                  {formatDuration(svc.durationMin)} · {formatAed(svc.price)}
                </p>
                <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                  {svc.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <AddToCartButton serviceId={svc.id} variant="icon" tone="light" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <DrawerStickyFooter />
    </div>
  );
}
