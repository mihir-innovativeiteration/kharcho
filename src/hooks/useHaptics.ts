import { useCallback } from 'react';
import { triggerHaptic } from '@/utils/haptics';

export function useHaptics() {
  const selection = useCallback(() => triggerHaptic('selection'), []);
  const light = useCallback(() => triggerHaptic('light'), []);
  const medium = useCallback(() => triggerHaptic('medium'), []);
  const heavy = useCallback(() => triggerHaptic('heavy'), []);
  const success = useCallback(() => triggerHaptic('success'), []);
  const warning = useCallback(() => triggerHaptic('warning'), []);
  const error = useCallback(() => triggerHaptic('error'), []);

  return {
    selection,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
  };
}
