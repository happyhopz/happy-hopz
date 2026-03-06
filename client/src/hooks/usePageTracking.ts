import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
    const { user } = useAuth();

    useEffect(() => {
        const path = location.pathname;

        // Skip admin routes — we don't want to pollute visitor stats with admin traffic
        if (path.startsWith('/admin')) return;

        const sessionId = getSessionId();

        // Collect client-side metadata + user info if logged in
        const payload: any = {
            path,
            sessionId,
            referrer: document.referrer || null,
            screenWidth: window.screen?.width || null,
            screenHeight: window.screen?.height || null,
            language: navigator.language || null,
        };

        // Attach user identity when logged in
        if (user?.id) payload.userId = user.id;
        if (user?.email) payload.userEmail = user.email;

        // Fire-and-forget — never await, never throw
        api.post('/analytics/pageview', payload).catch(() => { });
    }, [location.pathname, user?.id]);
};

export default usePageTracking;
