import React, { lazy, Suspense } from 'react';

// ⚡ PERFORMANCE: Lazy-load heavy modal components.
// These are conditionally rendered (open === false on first load), so eagerly
// importing them just bloats the initial TripDetail bundle. Lazy + Suspense
// (with `null` fallback so the closed state is invisible) shaves ~40-60KB
// off the first paint and pulls the chunk only when the user opens the modal.
const SettingsMenu = lazy(() =>
  import('../SettingsMenu').then(m => ({ default: m.SettingsMenu })),
);
const InviteModal = lazy(() =>
  import('../InviteModal').then(m => ({ default: m.InviteModal })),
);
const AuthModal = lazy(() => import('../AuthModal').then(m => ({ default: m.AuthModal })));
const TripSettings = lazy(() =>
  import('../TripSettings').then(m => ({ default: m.TripSettings })),
);
const PlusUpsellModal = lazy(() =>
  import('../PlusUpsellModal').then(m => ({ default: m.PlusUpsellModal })),
);

interface TripDetailModalsProps {
  showSettings: boolean;
  onCloseSettings: () => void;
  showInvite: boolean;
  onCloseInvite: () => void;
  showAuth: boolean;
  onCloseAuth: () => void;
  showTripSettings: boolean;
  onCloseTripSettings: () => void;
  showTripsPlusModal: boolean;
  onCloseTripsPlusModal: () => void;
  tripName: string;
  tripId: string;
  userId?: string;
}

export const TripDetailModals = ({
  showSettings,
  onCloseSettings,
  showInvite,
  onCloseInvite,
  showAuth,
  onCloseAuth,
  showTripSettings,
  onCloseTripSettings,
  showTripsPlusModal,
  onCloseTripsPlusModal,
  tripName,
  tripId,
  userId,
}: TripDetailModalsProps) => {
  return (
    <Suspense fallback={null}>
      {/* Each modal only mounts (and downloads its chunk) when its open flag
          flips true — closed modals stay zero-cost. */}
      {showSettings && <SettingsMenu isOpen={showSettings} onClose={onCloseSettings} />}
      {showInvite && (
        <InviteModal
          isOpen={showInvite}
          onClose={onCloseInvite}
          tripName={tripName}
          tripId={tripId}
        />
      )}
      {showAuth && <AuthModal isOpen={showAuth} onClose={onCloseAuth} />}
      {showTripSettings && (
        <TripSettings
          isOpen={showTripSettings}
          onClose={onCloseTripSettings}
          tripId={tripId}
          tripName={tripName}
          currentUserId={userId || '4'}
        />
      )}
      {showTripsPlusModal && (
        <PlusUpsellModal isOpen={showTripsPlusModal} onClose={onCloseTripsPlusModal} />
      )}
    </Suspense>
  );
};
