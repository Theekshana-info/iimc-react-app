import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  appearance?: 'always' | 'execute' | 'interaction-only';
}

/**
 * Reusable Cloudflare Turnstile CAPTCHA widget.
 * Loads the script dynamically and renders via explicit API.
 */
const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onVerify, onExpire, onError, appearance = 'always' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Expose reset method to parent via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!SITE_KEY) {
        console.warn('[Turnstile] VITE_TURNSTILE_SITE_KEY is not set.');
        return;
      }

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile) return;

        // Prevent double-render
        if (widgetIdRef.current !== null) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onError,
          appearance,
          theme: 'auto',
        });
      };

      // Check if script is already loaded
      if (window.turnstile) {
        renderWidget();
        return;
      }

      // Check if script tag already exists (from another widget instance)
      const existingScript = document.querySelector(
        `script[src="${TURNSTILE_SCRIPT_URL}"]`
      );

      if (existingScript) {
        // Script exists but hasn't loaded yet — wait for it
        existingScript.addEventListener('load', renderWidget);
        return;
      }

      // Load the Turnstile script
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget);
      document.head.appendChild(script);

      return () => {
        // Cleanup: remove widget on unmount
        if (widgetIdRef.current !== null && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [onVerify, onExpire, onError, appearance]);

    return <div ref={containerRef} className="cf-turnstile my-2" />;
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          appearance?: string;
          theme?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}
