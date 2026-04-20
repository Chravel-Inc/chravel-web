import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Branded invite URLs use `/j/:code` on p.chravel.app while the SPA join flow lives at
 * `/join/:token`. This route bridges any client that still lands on `/j/...` on the app host.
 */
const InviteSlugRedirect: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={`/join/${encodeURIComponent(token)}`} replace />;
};

export default InviteSlugRedirect;
