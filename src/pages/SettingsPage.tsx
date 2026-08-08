import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SettingsMenu } from '../components/SettingsMenu';

const UpgradeModal = lazy(() =>
  import('../components/UpgradeModal').then(m => ({ default: m.UpgradeModal })),
);

const SettingsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Support deep-linking to a specific consumer section (e.g., 'integrations')
  const initialSection =
    (location.state as { section?: string } | null)?.section ||
    new URLSearchParams(location.search).get('section') ||
    undefined;

  // featurePaywall navigates here with ?gate=…&section=billing and/or state.modal='upgrade'.
  // Open PlusUpsell so the purchase path is not a Settings dead-end.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gate = params.get('gate');
    const modal = (location.state as { modal?: string } | null)?.modal;
    if (gate || modal === 'upgrade') {
      setShowUpsellModal(true);
    }
  }, [location.search, location.state]);

  const handleClose = useCallback(() => {
    setIsMenuOpen(false);
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <SettingsMenu
        isOpen={isMenuOpen}
        onClose={handleClose}
        initialConsumerSection={initialSection}
      />
      {showUpsellModal && (
        <Suspense fallback={null}>
          <UpgradeModal isOpen={showUpsellModal} onClose={() => setShowUpsellModal(false)} />
        </Suspense>
      )}
    </>
  );
};

export default SettingsPage;
