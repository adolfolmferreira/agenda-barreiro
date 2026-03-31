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
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1234003752174455');
            fbq('track', 'PageView');`}
          </Script>
          <noscript>
            <img height="1" width="1" style={{display:'none'}}
              src="https://www.facebook.com/tr?id=1234003752174455&ev=PageView&noscript=1" />
          </noscript>
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
