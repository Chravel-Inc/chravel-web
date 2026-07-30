import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { SeoHead } from '@/components/seo/SeoHead';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('404 Error: User attempted to access non-existent route:', location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <SeoHead
        title="Page Not Found | ChravelApp"
        description="The page you requested was not found."
        path={location.pathname}
        noindex
      />
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
          <MapPin size={26} className="text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-3">404</h1>
        <p className="text-lg text-muted-foreground mb-6">This page wandered off the itinerary.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to your trips
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
