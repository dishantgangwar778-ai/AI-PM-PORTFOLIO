import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import posthog from 'posthog-js';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('returniq_cookie_consent');
    if (!consent) {
      setShow(true);
    } else if (consent === 'granted') {
      initializePostHog();
    }
  }, []);

  const initializePostHog = () => {
    // Check if PostHog is already initialized to avoid warnings
    if (!posthog.__loaded) {
      const meta = import.meta as any;
      const phKey = meta.env?.VITE_POSTHOG_KEY || 'phc_dummy_key_for_demo';
      posthog.init(phKey, {
        api_host: meta.env?.VITE_POSTHOG_HOST || 'https://app.posthog.com',
        autocapture: false, // Privacy first, explicit capture
        persistence: 'localStorage+cookie',
      });
    }
  };

  const handleAccept = () => {
    localStorage.setItem('returniq_cookie_consent', 'granted');
    setShow(false);
    initializePostHog();
    posthog.capture('cookie_consent_granted');
  };

  const handleDecline = () => {
    localStorage.setItem('returniq_cookie_consent', 'denied');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-slate-200 shadow-2xl rounded-xl p-5 z-50">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-slate-900">Cookie Consent</h3>
        <button onClick={handleDecline} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
        We use cookies and analytics to improve your experience and track feature usage to build a better product. Do you accept our use of cookies?
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={handleDecline}
          className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
