import axios from 'axios';

/**
 * Sends a WhatsApp message to the admin.
 * Current implementation uses CallMeBot (free for personal use) as a default.
 * For professional use, this should be replaced with Twilio or Meta WhatsApp Business API.
 */
export const sendAdminWhatsApp = async (message: string) => {
    try {
        const { prisma } = await import('../lib/prisma');

        // Fetch WhatsApp settings from the database
        const settings = await prisma.siteSettings.findMany({
            where: {
                key: {
                    in: ['whatsapp_number', 'whatsapp_notifications_enabled', 'callmebot_apikey']
                }
            }
        });

        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        const isEnabled = settingsMap['whatsapp_notifications_enabled'] === 'true';
        const phoneNumber = settingsMap['whatsapp_number'];
        const apiKey = settingsMap['callmebot_apikey']; // Optional: For CallMeBot users

        if (!isEnabled || !phoneNumber) {
            return;
        }

        console.log(`📱 [WHATSAPP] Attempting to send message to ${phoneNumber}`);

        // If apikey is present, use CallMeBot (Free & easy for personal alerts)
        if (apiKey) {
            const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
            await axios.get(url);
            console.log('✅ [WHATSAPP] Sent via CallMeBot');
        } else {
            // Placeholder for other providers or just logging for now
            console.log('⚠️ [WHATSAPP] WhatsApp notifications are enabled but no API key (e.g., CallMeBot) is configured.');
            console.log('📝 [WHATSAPP] Message content:', message);
        }
    } catch (error: any) {
        console.error('❌ [WHATSAPP] Failed to send notification:', error.message);
    }
};
