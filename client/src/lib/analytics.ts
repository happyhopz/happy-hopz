/**
 * Analytics utility for Happy Hopz
 * Handles Google Ads (gtag) events
 */

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

/**
 * Track a purchase conversion in Google Ads
 * @param transactionId Unique order ID (to prevent deduplication)
 * @param value Monitary value of the order
 * @param currency Currency code (default: INR)
 */
export const trackPurchase = (transactionId: string, value: number, currency: string = 'INR') => {
    if (typeof window.gtag === 'function') {
        console.log(`📊 [Analytics] Tracking Purchase: ${transactionId} | Value: ${value}`);
        window.gtag('event', 'conversion', {
            'send_to': 'AW-17906293277/ttUnCJDDzfQbEJ20sdpC',
            'value': value,
            'currency': currency,
            'transaction_id': transactionId
        });
    } else {
        console.warn('📊 [Analytics] gtag not found. Tracking skipped.');
    }
};
