import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import UAParser from 'ua-parser-js';
import axios from 'axios';

const router = Router();

/**
 * Resolve IP to city/region/country using ip-api.com (free, no key needed).
 * Non-blocking — we fire this AFTER sending the response so it never slows
 * down the visitor's experience.  Falls back gracefully on any error.
 */
async function resolveGeo(ip: string): Promise<{ city?: string; region?: string; country?: string }> {
    try {
        // Skip private / localhost IPs
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return {};
        }
        const { data } = await axios.get(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
            timeout: 2000 // 2s max — never hang
        });
        if (data && data.city) {
            return { city: data.city, region: data.regionName, country: data.country };
        }
    } catch {
        // Silently ignore — geo is best-effort
    }
    return {};
}

// POST /analytics/pageview — public, no auth required
// Called by the client on every page navigation
router.post('/pageview', async (req: Request, res: Response) => {
    try {
        const { path, sessionId, referrer, screenWidth, screenHeight, language } = req.body;

        if (!path || !sessionId) {
            return res.status(400).json({ error: 'path and sessionId are required' });
        }

        // Skip admin routes from tracking
        if (path.startsWith('/admin')) {
            return res.status(204).send();
        }

        // Extract IP from proxy headers or socket
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string'
            ? forwarded.split(',')[0].trim()
            : req.socket?.remoteAddress || '';

        // Parse User-Agent on the server (more reliable than client-side)
        const uaString = req.headers['user-agent'] || '';
        const ua = new (UAParser as any)(uaString);
        const browser = ua.getBrowser().name || null;
        const os = ua.getOS().name || null;
        const deviceType = ua.getDevice().type || 'desktop'; // defaults to desktop if not mobile/tablet

        // Create the page view immediately (respond fast)
        const pageView = await (prisma as any).pageView.create({
            data: {
                path: String(path).slice(0, 500),
                sessionId: String(sessionId).slice(0, 100),
                ip: String(ip).slice(0, 45),
                userAgent: String(uaString).slice(0, 500),
                browser: browser ? String(browser).slice(0, 50) : null,
                os: os ? String(os).slice(0, 50) : null,
                device: String(deviceType).slice(0, 20),
                referrer: referrer ? String(referrer).slice(0, 500) : null,
                screenWidth: screenWidth ? parseInt(String(screenWidth)) || null : null,
                screenHeight: screenHeight ? parseInt(String(screenHeight)) || null : null,
                language: language ? String(language).slice(0, 20) : null,
            }
        });

        // Send response immediately — don't make the visitor wait
        res.status(204).send();

        // Async: resolve geo in background, then update the record
        resolveGeo(ip).then(async (geo) => {
            if (geo.city || geo.country) {
                try {
                    await (prisma as any).pageView.update({
                        where: { id: pageView.id },
                        data: {
                            city: geo.city ? String(geo.city).slice(0, 100) : null,
                            region: geo.region ? String(geo.region).slice(0, 100) : null,
                            country: geo.country ? String(geo.country).slice(0, 100) : null,
                        }
                    });
                } catch {
                    // silently ignore update failures
                }
            }
        });

    } catch (error) {
        // Fail silently — never break the client for analytics errors
        res.status(204).send();
    }
});

export default router;
