import { Suspense, lazy, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { BrandBootSplash } from '@/components/BrandBootSplash';
import { AuthModal } from '@/components/AuthModal';
import { FullPageLanding } from '@/components/landing/FullPageLanding';

const App = lazy(() => import('./App'));

export default function MarketingApp() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loadFullShell, setLoadFullShell] = useState(false);

  const fallback = useMemo(() => <BrandBootSplash />, []);

  if (loadFullShell) {
    return (
      <Suspense fallback={fallback}>
        <App />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <FullPageLanding onSignUp={() => setIsAuthModalOpen(true)} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          oauthReturnTo="/"
          onAuthSuccess={() => {
            setIsAuthModalOpen(false);
            setLoadFullShell(true);
          }}
        />
      </Suspense>
    </BrowserRouter>
  );
}
