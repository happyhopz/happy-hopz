import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Mail, Sparkles } from 'lucide-react';
import { marketingAPI } from '@/lib/api';
import { toast } from 'sonner';
import pandaLogo from '@/assets/panda-logo.png';

const MarketingPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // Check if already seen or dismissed
        const hasSeen = localStorage.getItem('hh_popup_seen');
        const hasSubscribed = localStorage.getItem('hh_is_subscribed');

        if (!hasSeen && !hasSubscribed) {
            // Show after 10 seconds of browsing
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hh_popup_seen', 'true');
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await marketingAPI.subscribe({ email, source: 'POPUP' });
            localStorage.setItem('hh_is_subscribed', 'true');
            setSubmitted(true);
            setTimeout(() => {
                handleClose();
            }, 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to subscribe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto scrollbar-hide"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-black/5 hover:bg-white shadow-sm transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        {/* Image Section */}
                        <div className="md:w-2/5 bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center p-6 md:p-8 flex-shrink-0">
                            <motion.img
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                src={pandaLogo}
                                alt="Happy panda"
                                className="w-24 h-24 md:w-full md:h-auto object-contain shadow-premium rounded-2xl"
                            />
                        </div>

                        {/* Content Section */}
                        <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
                            {!submitted ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-600">Special Welcome Offer</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-fredoka font-bold text-gray-900 leading-tight mb-2 md:mb-4">
                                        Unlock <span className="text-pink-500">10% OFF</span>! 🎁
                                    </h2>
                                    <p className="text-gray-600 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed">
                                        Join our club for new arrivals and exclusive deals for your little ones.
                                    </p>

                                    <form onSubmit={handleSubscribe} className="space-y-3">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 md:py-3.5 bg-pink-500 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-black rounded-xl shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative z-10"
                                        >
                                            {loading ? 'Processing...' : (
                                                <>
                                                    <Gift className="w-4 h-4" />
                                                    <span className="text-sm md:text-base uppercase tracking-tight">Claim My Discount</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                    <p className="text-[9px] text-center text-gray-400 mt-4 leading-tight">
                                        By subscribing you agree to our promo policies. Unsubscribe anytime.
                                    </p>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 md:py-8"
                                >
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-fredoka font-bold text-gray-900 mb-2">You're on the list! 🎉</h2>
                                    <p className="text-gray-600 text-xs md:text-sm mb-4">Check your email for your code.</p>
                                    <div className="py-2 px-4 bg-green-50 border border-green-200 rounded-lg inline-block">
                                        <span className="text-[10px] md:text-xs font-bold text-green-700 uppercase">Code Sent ✨</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MarketingPopup;
