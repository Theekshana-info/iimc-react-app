import { useState, useRef, useCallback } from 'react';
import type { TurnstileWidgetRef } from '@/components/TurnstileWidget';

/**
 * Custom hook for managing Turnstile CAPTCHA state and server-side verification.
 */
export function useTurnstile() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const clearTurnstileToken = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  }, []);

  /**
   * Verify the Turnstile token server-side via the Vercel API route.
   * Returns true if verification passes, false otherwise.
   */
  const verifyTurnstile = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/turnstile/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('[Turnstile] Verification request failed:', error);
      return false;
    }
  }, []);

  const isTurnstileReady = turnstileToken !== null;

  return {
    turnstileToken,
    setTurnstileToken,
    clearTurnstileToken,
    resetTurnstile,
    verifyTurnstile,
    isTurnstileReady,
    turnstileRef,
  };
}
