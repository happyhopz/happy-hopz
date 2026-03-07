import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

// Generate or retrieve a persistent anonymous session ID (lasts for the browser session)
const getSessionId = (): string => {
    const key = 'hh_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(key, id);
    }
    return id;
};

// Check if this is a first-time visitor (lasts forever on this browser)
const checkIsNewVisitor = (): boolean => {
    const key = 'hh_returning_visitor';
    const isReturning = localStorage.getItem(key);
    if (!isReturning) {
        localStorage.setItem(key, 'true');
        return true;
    }
    return false;
};

const usePageTracking = () => {
    const location = useLocation();
    const { user } = useAuth();
    const pageViewIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const path = location.pathname;

        // Skip admin routes
        if (path.startsWith('/admin')) return;

        const sessionId = getSessionId();
        const isNewVisitor = checkIsNewVisitor();
        startTimeRef.current = Date.now();

        // Collect client-side metadata
        const searchParams = new URLSearchParams(window.location.search);
        const payload: any = {
            path,
            sessionId,
            referrer: document.referrer || null,
            screenWidth: window.screen?.width || null,
            screenHeight: window.screen?.height || null,
            language: navigator.language || null,
            isNewVisitor,
            // UTM marketing attribution
            utmSource: searchParams.get('utm_source') || null,
            utmMedium: searchParams.get('utm_medium') || null,
            utmCampaign: searchParams.get('utm_campaign') || null,
            utmTerm: searchParams.get('utm_term') || null,
            utmContent: searchParams.get('utm_content') || null,
        };

        // Attach user identity when logged in
        if (user?.id) payload.userId = user.id;
        if (user?.email) payload.userEmail = user.email;

        // Initial Page View
        api.post('/analytics/pageview', payload)
            .then(res => {
                if (res.data?.id) {
                    pageViewIdRef.current = res.data.id;
                }
            })
            .catch(() => { });

        // Pulse mechanism: Update duration every 20 seconds
        const pulseInterval = setInterval(() => {
            if (pageViewIdRef.current) {
                const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
                api.post('/analytics/pulse', {
                    pageViewId: pageViewIdRef.current,
                    duration: elapsedSeconds
                }).catch(() => { });
            }
        }, 20000);

        // Final Pulse on Navigation
        return () => {
            clearInterval(pulseInterval);
            if (pageViewIdRef.current) {
                const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
                // Use navigator.sendBeacon for more reliable delivery on unload if needed, 
                // but for SPA navigation, a standard fire-and-forget post is fine.
                api.post('/analytics/pulse', {
                    pageViewId: pageViewIdRef.current,
                    duration: elapsedSeconds
                }).catch(() => { });
            }
            pageViewIdRef.current = null;
        };
    }, [location.pathname, user?.id]);
};

export default usePageTracking;
