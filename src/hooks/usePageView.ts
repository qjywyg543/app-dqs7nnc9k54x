import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/services/analytics';

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    void trackEvent('page_view', location.pathname);
  }, [location.pathname]);
}
