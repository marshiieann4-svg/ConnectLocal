import { useState, useEffect } from 'react';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Android/Chrome install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show manual install instructions if not already installed
    if (isIOS() && !isInStandaloneMode()) {
      const dismissed = sessionStorage.getItem('ios-install-dismissed');
      if (!dismissed) setShowIOSPrompt(true);
    }

    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const dismissInstall = () => setShowInstall(false);

  const dismissIOSPrompt = () => {
    setShowIOSPrompt(false);
    sessionStorage.setItem('ios-install-dismissed', '1');
  };

  return (
    <>
      {isOffline && (
        <div className="alert alert-warning text-center mb-0 rounded-0 py-1" style={{ fontSize: '0.85rem' }}>
          <i className="fas fa-wifi me-1"></i>
          You are offline. Some features may be limited.
        </div>
      )}

      {/* Android/Chrome install prompt */}
      {showInstall && (
        <div className="alert alert-info alert-dismissible d-flex align-items-center mb-0 rounded-0 py-2" role="alert">
          <i className="fas fa-mobile-alt me-2"></i>
          <span className="me-auto" style={{ fontSize: '0.9rem' }}>
            Install ConnectLocal on your device for quick access!
          </span>
          <button className="btn btn-primary btn-sm me-2" onClick={handleInstall}>
            Install
          </button>
          <button type="button" className="btn-close" onClick={dismissInstall} aria-label="Close"></button>
        </div>
      )}

      {/* iOS install instructions */}
      {showIOSPrompt && (
        <div className="alert alert-info alert-dismissible mb-0 rounded-0 py-2" role="alert">
          <div className="d-flex align-items-start">
            <i className="fas fa-mobile-alt me-2 mt-1"></i>
            <span style={{ fontSize: '0.9rem' }}>
              Install ConnectLocal: tap{' '}
              <i className="fas fa-share-square"></i>{' '}
              then <strong>"Add to Home Screen"</strong>
            </span>
          </div>
          <button type="button" className="btn-close" onClick={dismissIOSPrompt} aria-label="Close"></button>
        </div>
      )}
    </>
  );
}
