import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { SeoHead } from '@/components/seo/SeoHead';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('404 Error: User attempted to access non-existent route:', location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SeoHead
        title="Page Not Found | ChravelApp"
        description="The page you requested was not found."
        path={location.pathname}
        noindex
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
