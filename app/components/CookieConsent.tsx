'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function CookieConsent() {
  const [consent, setConsent] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const saved = document.cookie.split(';').find(c => c.trim().startsWith('cookie_consent='));
    if (saved) {
      const value = saved.split('=')[1];
      setConsent(value === 'accepted' ? 'accepted' : 'rejected');
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    document.cookie = 'cookie_consent=accepted; path=/; max-age=15552000; Secure; SameSite=Lax';
    setConsent('accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    document.cookie = 'cookie_consent=rejected; path=/; max-age=15552000; Secure; SameSite=Lax';
    setConsent('rejected');
    setShowBanner(false);
    // Remove existing GA cookies
    document.cookie = '_ga=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = '_ga_QECRTJC5LH=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  return (
    <>
      {consent === 'accepted' && (
        <>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-QECRTJC5LH" strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QECRTJC5LH', {
              cookie_flags: 'SameSite=Lax;Secure',
              cookie_expires: 15552000
            });`}
          </Script>
        </>
      )}

      {showBanner && (
        <div className="cookie-banner">
          <div className="cookie-banner-content">
            <p>
              Utilizamos cookies para análise de tráfego. Ao aceitar, concorda com a utilização de cookies analíticos.
              <a href="/privacidade" className="cookie-banner-link">Saber mais</a>
            </p>
            <div className="cookie-banner-actions">
              <button className="cookie-btn cookie-btn-reject" onClick={handleReject}>Rejeitar</button>
              <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>Aceitar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
