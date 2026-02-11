import axios from 'axios';

/**
 * Sends a WhatsApp message using Meta Cloud API.
 * This implementation uses Official WhatsApp Templates.
 */
export const sendOrderWhatsApp = async (to: string, templateName: string, components: any[]) => {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !phoneNumberId) {
        console.warn('⚠️ [WHATSAPP] API Token or Phone Number ID not configured.');
        return { success: false, error: 'Configuration missing' };
    }

    try {
        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

        // Efficient formatting for Indian numbers
        let formattedTo = to.replace(/\D/g, ''); // Strip non-numeric
        if (formattedTo.length === 10) {
            formattedTo = '91' + formattedTo;
        } else if (formattedTo.length === 12 && formattedTo.startsWith('0')) {
            formattedTo = '91' + formattedTo.slice(2);
        } else if (formattedTo.length === 11 && formattedTo.startsWith('0')) {
            formattedTo = '91' + formattedTo.slice(1);
        }

        const data = {
            messaging_product: 'whatsapp',
            to: formattedTo,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' },
                components: components
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ [WHATSAPP] Message sent successfully to ${formattedTo}. ID: ${response.data.messages[0].id}`);
        return { success: true, messageId: response.data.messages[0].id };
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('❌ [WHATSAPP] Meta API Error:', errorMsg);
        return { success: false, error: errorMsg };
    }
};

/**
 * Legacy admin notification (keeping for internal alerts if needed, or upgrading later)
 */
export const sendAdminWhatsApp = async (message: string) => {
    // For now, reuse the new system with a generic text template if available
    // OR keep CallMeBot for admin's personal simple alerts as it doesn't require templates
    try {
        const { prisma } = await import('../lib/prisma');
        const setting = await prisma.siteSettings.findUnique({ where: { key: 'callmebot_apikey' } });
        const number = await prisma.siteSettings.findUnique({ where: { key: 'whatsapp_number' } });

        if (setting?.value && number?.value) {
            const url = `https://api.callmebot.com/whatsapp.php?phone=${number.value}&text=${encodeURIComponent(message)}&apikey=${setting.value}`;
            await axios.get(url);
            console.log('✅ [WHATSAPP] Admin Alert sent via CallMeBot');
        }
    } catch (error: any) {
        console.error('❌ [WHATSAPP] Admin Alert failed:', error.message);
    }
};
