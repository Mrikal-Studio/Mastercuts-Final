import { AnimatePresence, motion } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCart } from './CartProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { BasketView } from './views/BasketView';
import { RitualIndexView } from './views/RitualIndexView';
import { RitualServicesView } from './views/RitualServicesView';
import { JourneyIndexView } from './views/JourneyIndexView';
import { JourneyDetailView } from './views/JourneyDetailView';
import { CartCheckoutOverlay } from './CartCheckoutOverlay';
import { SuccessState } from '@/components/checkout/SuccessState';

export function CartDrawer() {
  const {
    surface,
    closeCart,
    closeAll,
    drawerStack,
    currentDrawerView,
    popDrawerView,
    openCheckout,
    bookingResult,
    resetCheckout,
  } = useCart();
  const isMobile = useIsMobile();
  const open = surface === 'cart';

  const side = isMobile ? 'bottom' : 'right';
  const canGoBack = drawerStack.length > 1;

  const viewKey =
    currentDrawerView.name === 'section-services'
      ? `section-services:${currentDrawerView.sectionId}`
      : currentDrawerView.name === 'journey-detail'
        ? `journey-detail:${currentDrawerView.journeyId}`
        : currentDrawerView.name;

  const handleSuccessDone = () => {
    resetCheckout();
    closeAll();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : closeCart())}>
      <SheetContent
        side={side}
        hideDefaultClose
        className="bg-bg-primary border-none p-0 flex flex-col w-full sm:max-w-md h-full max-h-screen overflow-hidden"
      >
        {bookingResult ? (
          <SuccessState booking={bookingResult} onDone={handleSuccessDone} />
        ) : (
          <div className="relative flex flex-col h-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={viewKey}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex flex-col h-full"
              >
                {currentDrawerView.name === 'basket' && (
                  <BasketView onClose={closeCart} onContinue={openCheckout} />
                )}
                {currentDrawerView.name === 'section-index' && (
                  <RitualIndexView
                    onClose={closeCart}
                    canGoBack={canGoBack}
                    onBack={popDrawerView}
                  />
                )}
                {currentDrawerView.name === 'section-services' && (
                  <RitualServicesView
                    sectionId={currentDrawerView.sectionId}
                    onClose={closeCart}
                    onBack={popDrawerView}
                  />
                )}
                {currentDrawerView.name === 'journey-index' && (
                  <JourneyIndexView
                    onClose={closeCart}
                    canGoBack={canGoBack}
                    onBack={popDrawerView}
                  />
                )}
                {currentDrawerView.name === 'journey-detail' && (
                  <JourneyDetailView
                    journeyId={currentDrawerView.journeyId}
                    onClose={closeCart}
                    onBack={popDrawerView}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Checkout bottom sheet overlays */}
            <CartCheckoutOverlay />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
