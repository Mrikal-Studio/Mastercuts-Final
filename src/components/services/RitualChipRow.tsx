import { useEffect, useRef, type ComponentType } from 'react';
import {
  Scissors,
  Sunrise,
  Flower2,
  Sparkles,
  Activity,
  Feather,
  Wand2,
  Gift,
} from 'lucide-react';
/**
 * A chip id is a backend sub-category id, or the 'curated-journeys' sentinel
 * for the packages entry point. An open string rather than a union: which
 * sections exist is a backend fact now.
 */
export type ChipId = string;

export interface RitualChip {
  id: ChipId;
  title: string;
  subtitle: string;
  /** Backend icon_key; unknown values fall back to a default glyph. */
  iconKey?: string;
}

// `HOME_CHIPS` is gone — it mirrored catalog.ts's rituals[] by hand and had to
// be kept in sync with it. Callers build chips from `useCatalog().sections`,
// which is ordered by the backend `sort_order`.

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * Backend `icon_key` → component. The key is catalog configuration; the
 * component cannot live in DynamoDB, so the mapping stays here. Unknown keys
 * (including "") fall back to Sparkles, so a section added from the admin
 * portal renders a chip rather than a hole.
 */
const CHIP_ICONS: Record<string, IconComponent> = {
  sun: Sunrise,
  'hand-heart': Flower2,
  'flower-2': Sparkles,
  scissors: Scissors,
  gift: Gift,
  activity: Activity,
  feather: Feather,
  wand: Wand2,
};

interface RitualChipRowProps {
  chips: RitualChip[];
  activeId: ChipId;
  onChange: (id: ChipId) => void;
  variant?: 'dark' | 'light';
  className?: string;
}

export function RitualChipRow({
  chips,
  activeId,
  onChange,
  variant = 'dark',
  className = 'pl-6',
}: RitualChipRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep active chip scrolled into view as it changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
    }
  }, [activeId]);

  const isDark = variant === 'dark';

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto snap-x snap-mandatory scroll-pl-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className={`flex gap-2 ${className}`}>

        {chips.map((chip) => {
          const Icon = CHIP_ICONS[chip.iconKey ?? ""] ?? Sparkles;
          const active = chip.id === activeId;

          // Dark section: inactive chips recede on bg-dark (translucent surface,
          // muted border, white text). Active chip flips to the card surface
          // (beige + dark text + gold border) so it reads as the parent of the
          // card stack below. Light variant keeps the original beige-on-white.
          const chipClasses = isDark
            ? active
              ? 'bg-bg-primary text-text-primary border-2 border-accent-gold'
              : 'bg-white/[0.04] text-white/85 border border-white/15 hover:bg-white/[0.08] hover:border-white/25'
            : active
              ? 'bg-bg-primary text-text-primary border-2 border-accent-gold'
              : 'bg-white text-text-primary border border-black/5';

          const iconTone = isDark
            ? active
              ? 'text-text-primary'
              : 'text-white/85'
            : 'text-text-primary/80';

          const titleTone = isDark
            ? active
              ? 'text-text-primary'
              : 'text-white'
            : 'text-text-primary';

          const subtitleTone = isDark
            ? active
              ? 'text-text-primary/60'
              : 'text-white/50'
            : 'text-text-primary/60';

          return (
            <button
              key={chip.id}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onChange(chip.id)}
              aria-pressed={active}
              className={`${chipClasses} shrink-0 snap-start rounded-md flex items-center gap-1.5 px-2.5 py-2 w-[168px] transition-colors duration-150`}
            >
              <span className={`flex items-center justify-center w-8 h-8 rounded-sm ${iconTone}`}>
                <Icon className="w-5 h-5" strokeWidth={1.25} />
              </span>
              <span className="flex flex-col items-start min-w-0 text-left">
                <span className={`font-serif text-[15px] leading-[19px] truncate max-w-[110px] ${titleTone}`}>
                  {chip.title}
                </span>
                <span className={`font-sans text-[11px] leading-[14px] truncate max-w-[110px] ${subtitleTone}`}>
                  {chip.subtitle}
                </span>
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
}
