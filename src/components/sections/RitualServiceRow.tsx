import { motion } from 'framer-motion';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import { useCart, formatAed, formatDuration } from '@/components/cart/CartProvider';
import type { Service } from '@/lib/booking/types';
import { pickServiceImage } from '@/lib/booking/types';
import { useAudience } from '@/components/services/useAudience';
import { cn } from '@/lib/utils';

interface Props {
  service: Service;
  index: number;
  inView: boolean;
}

export function RitualServiceRow({ service, index, inView }: Props) {
  const { cart, openServiceDetail } = useCart();
  const [audience] = useAudience();
  const cartItem = cart.items.find((i) => i.serviceId === service.id);
  const inCart = !!cartItem;

  const variants = service.variants ?? [];
  const hasVariants = variants.length > 1;

  const displayDuration = cartItem?.durationMin ?? service.durationMin;
  const displayPrice = cartItem?.price ?? service.price;

  const openDetail = () => openServiceDetail(service.id);

  const priceLabel = hasVariants
    ? `from ${formatAed(variants[0].price)}`
    : formatAed(displayPrice);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 + index * 0.06 }}
      className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center border-b border-black/10 pb-6 lg:pb-8"
    >
      <button
        type="button"
        onClick={openDetail}
        className="md:col-span-4 aspect-[4/3] md:aspect-square overflow-hidden block text-left"
        aria-label={`Open ${service.name} details`}
      >
        <img
          src={pickServiceImage(service, audience)}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
        />
      </button>

      <div className="md:col-span-6 min-w-0">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary/70">
            {String(index + 1).padStart(2, '0')}
          </span>
          {service.requiresConsultation && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-secondary border border-black/15 rounded-full px-2 py-0.5">
              Consultation
            </span>
          )}
          {hasVariants && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-secondary border border-black/15 rounded-full px-2 py-0.5">
              {variants.length} options
            </span>
          )}
        </div>

        <button type="button" onClick={openDetail} className="block text-left group/title">
          <h3 className="font-serif text-2xl lg:text-3xl text-text-primary leading-tight mb-3 group-hover/title:text-text-primary/70 transition-colors">
            {service.name}
          </h3>
        </button>

        <p className="text-sm lg:text-base text-text-secondary leading-relaxed mb-4 max-w-md">
          {service.description}
        </p>

        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            {formatDuration(displayDuration)} · {priceLabel}
          </p>
          <button
            type="button"
            onClick={openDetail}
            className="group/more inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-text-secondary hover:text-text-primary transition-colors"
          >
            Read more
            <ArrowUpRight className="w-3 h-3 transition-transform duration-200 group-hover/more:translate-x-0.5 group-hover/more:-translate-y-0.5" />
          </button>
        </div>
      </div>

      <div className="md:col-span-2 flex md:justify-end">
        <button
          type="button"
          onClick={openDetail}
          aria-label={inCart ? `Edit ${service.name} in cart` : `Add ${service.name} to cart`}
          className={cn(
            'group/add w-10 h-10 rounded-full flex items-center justify-center transition-all',
            inCart
              ? 'bg-bg-dark text-white border border-bg-dark hover:bg-bg-darker'
              : 'border border-black/15 bg-black/[0.03] text-text-primary hover:bg-bg-dark hover:text-white hover:border-bg-dark'
          )}
        >
          {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 transition-transform duration-200 group-hover/add:rotate-90" />}
        </button>
      </div>
    </motion.article>
  );
}
