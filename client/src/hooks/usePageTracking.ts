import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/lib/api';

// Generate or retrieve a persistent anonymous session ID
const getSessionId = (): string => {
    const key = 'hh_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(key, id);
    }
    return id;
};

const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;

        // Skip admin routes — we don't want to pollute visitor stats with admin traffic
        if (path.startsWith('/admin')) return;

        const sessionId = getSessionId();

        // Fire-and-forget — never await, never throw
        api.post('/analytics/pageview', { path, sessionId }).catch(() => { });
    }, [location.pathname]);
};

export default usePageTracking;
