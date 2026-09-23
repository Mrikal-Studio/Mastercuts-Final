import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasChosenAudience } from '@/components/services/useAudience';
import { trackExploreRaAtHome } from '@/lib/analytics';

/**
 * Enter Ra at Home DIRECTLY, without the audience picker.
 *
 * Several CTAs navigate straight to `/at-home` and never touch
 * `openAudiencePicker`, which is where the gated CTAs are reported. This hook
 * is the counterpart for those: it reports the entry and performs the same
 * `navigate('/at-home')` the call sites already did.
 *
 * Keeping it in one place means `audience_known` is derived identically on
 * every path — and it is frequently FALSE here, because these are exactly the
 * routes that skip the Ladies/Gentlemen choice.
 *
 * Returns a stable callback; call it from an onClick, never from a render.
 */
export function useEnterRaAtHome(): (ctaLocation: string) => void {
  const navigate = useNavigate();
  return useCallback(
    (ctaLocation: string) => {
      trackExploreRaAtHome(ctaLocation, hasChosenAudience());
      navigate('/at-home');
    },
    [navigate],
  );
}
