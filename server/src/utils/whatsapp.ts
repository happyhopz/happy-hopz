import axios from 'axios';

/**
 * WhatsApp Business API Utility
 * Uses Meta Cloud API to send template-based messages
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';

export interface WhatsAppPayload {
    messaging_product: "whatsapp";
    to: string;
    type: "template";
    template: {
        name: string;
        language: {
            code: string;
        };
        components: Array<{
            type: "body" | "header" | "button";
            parameters: Array<{
                type: "text";
                text: string;
            }>;
        }>;
    };
}

/**
 * Send a WhatsApp notification using a Meta template
 * @param phone Recipient phone number (with country code, no +)
 * @param templateName Approved Meta template name
 * @param parameters Array of strings for template placeholders {{1}}, {{2}}, etc.
 */
export const sendWhatsAppNotification = async (
    phone: string,
    templateName: string,
    parameters: string[]
) => {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        console.warn('⚠️ WhatsApp credentials missing. Notification skipped.');
        return;
    }

    // Format phone number: remove non-digits and ensure it starts with country code
    // Assuming Indian numbers if no country code provided (adds 91)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
    }

    const payload: WhatsAppPayload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: parameters.map(text => ({
                        type: "text",
                        text: String(text).substring(0, 1024) // Meta limit
                    }))
                }
            ]
        }
    };

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${phoneId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ WhatsApp sent to ${formattedPhone} (${templateName})`);
        return response.data;
    } catch (error: any) {
        console.error('❌ WhatsApp API Error:', error.response?.data || error.message);
        throw error;
    }
};
