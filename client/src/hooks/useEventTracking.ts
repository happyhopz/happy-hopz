import { useCallback } from 'react';
import api from '@/lib/api';

const getSessionId = (): string => {
    return sessionStorage.getItem('hh_session_id') || 'anonymous';
};

export const useEventTracking = () => {
    const trackEvent = useCallback((type: string, label?: string, value?: string) => {
        const sessionId = getSessionId();
        const payload = {
            sessionId,
            type: type.toUpperCase(),
            label,
            value,
            path: window.location.pathname
        };

        // Fire-and-forget
        api.post('/analytics/event', payload).catch(() => { });
    }, []);

    return { trackEvent };
};

export default useEventTracking;
