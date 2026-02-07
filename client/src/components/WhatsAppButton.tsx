import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const WhatsAppButton = () => {
    const location = useLocation();
    const phoneNumber = "919711864674"; // Happy Hopz WhatsApp number

    const getWhatsAppMessage = () => {
        const path = location.pathname;
        const baseMessage = "Hi Happy Hopz! I have a question.";

        if (path.startsWith('/products/')) {
            // In a real scenario, we might want to fetch the product name from a store or the window object
            // For now, providing a smart context message based on URL
            return encodeURIComponent(`Hi Happy Hopz team! I was looking at this product: ${window.location.href} and I have a question about it.`);
        }

        return encodeURIComponent(baseMessage);
    };

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${getWhatsAppMessage()}`;

    return (
        <AnimatePresence>
            <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#20ba5a] transition-colors group print:hidden"
                aria-label="Chat with us on WhatsApp"
            >
                <MessageCircle className="w-6 h-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold text-sm whitespace-nowrap">
                    Chat with us
                </span>
            </motion.a>
        </AnimatePresence>
    );
};

export default WhatsAppButton;
