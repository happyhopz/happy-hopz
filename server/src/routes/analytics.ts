import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import UAParser from 'ua-parser-js';
import axios from 'axios';

const router = Router();

// Known bot user-agent patterns
const BOT_PATTERNS = /bot|crawler|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|semrush|ahref|mj12bot|dotbot|petalbot|bytespider/i;

/**
 * Resolve IP to city/region/country using ip-api.com (free, no key needed).
 * Non-blocking — runs AFTER sending the response.
 */
async function resolveGeo(ip: string): Promise<{ city?: string; region?: string; country?: string }> {
    try {
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return {};
        }
        const { data } = await axios.get(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
            timeout: 2000
        });
        if (data && data.city) {
            return { city: data.city, region: data.regionName, country: data.country };
        }
    } catch {
        // Silently ignore
    }
    return {};
}

// POST /analytics/pageview — public, no auth required
router.post('/pageview', async (req: Request, res: Response) => {
    try {
        const { path, sessionId, referrer, screenWidth, screenHeight, language, userId, userEmail } = req.body;

        if (!path || !sessionId) {
            return res.status(400).json({ error: 'path and sessionId are required' });
        }

        // Skip admin routes
        if (path.startsWith('/admin')) {
            return res.status(204).send();
        }

        // Extract IP
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string'
            ? forwarded.split(',')[0].trim()
            : req.socket?.remoteAddress || '';

        // Parse User-Agent
        const uaString = req.headers['user-agent'] || '';

        // Filter out bots — don't pollute analytics
        if (BOT_PATTERNS.test(uaString)) {
            return res.status(204).send();
        }

        const ua = new (UAParser as any)(uaString);
        const browser = ua.getBrowser().name || null;
        const os = ua.getOS().name || null;
        const deviceType = ua.getDevice().type || 'desktop';

        // Create the record immediately
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
                userId: userId ? String(userId).slice(0, 100) : null,
                userEmail: userEmail ? String(userEmail).slice(0, 200) : null,
            }
        });

        // Respond immediately
        res.status(204).send();

        // Background geo resolution
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
                } catch { /* ignore */ }
            }
        });

    } catch (error) {
        res.status(204).send();
    }
});

export default router;
