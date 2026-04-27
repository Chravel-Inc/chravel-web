import React from 'react';
import { TripLinksDisplay } from './TripLinksDisplay';

export interface LinksPanelProps {
  tripId: string;
}

/**
 * ⚡ PERFORMANCE: Slimmed down from 48 → 12 lines of body code.
 * The previous version accepted 8 unused props (places, basecamp, onAddToLinks,
 * linkedPlaceIds, etc.) and mounted an `AddPlaceModal` that could never be
 * opened (no setter exposed). All of that was loaded eagerly on every Places
 * visit. Now this is a pure pass-through to TripLinksDisplay.
 */
export const LinksPanel: React.FC<LinksPanelProps> = ({ tripId }) => {
  return (
    <div className="space-y-6">
      <TripLinksDisplay tripId={tripId} />
    </div>
  );
};
