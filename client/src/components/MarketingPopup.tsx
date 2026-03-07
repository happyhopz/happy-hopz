import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Mail, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { marketingAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import pandaLogo from '@/assets/panda-logo.png';

const MarketingPopup = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // Don't show if user is logged in or on admin routes
        if (user || location.pathname.startsWith('/admin')) {
            setIsOpen(false);
            return;
        }

        // Check if already seen or dismissed
        const hasSeen = localStorage.getItem('hh_popup_seen');
        const hasSubscribed = localStorage.getItem('hh_is_subscribed');

        if (!hasSeen && !hasSubscribed) {
            // Show after 4 seconds of browsing
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [user, location.pathname]);

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
                        className="relative w-full max-w-lg md:max-w-3xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto scrollbar-hide border border-white/20"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 hover:bg-white shadow-md transition-all hover:scale-110 active:scale-90group"
                        >
                            <X className="w-5 h-5 text-gray-500 group-hover:text-pink-500 transition-colors" />
                        </button>

                        {/* Image Section */}
                        <div className="md:w-5/12 bg-gradient-to-br from-pink-50 via-orange-50 to-pink-100 flex items-center justify-center p-8 md:p-12 flex-shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-pink-300 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-orange-300 rounded-full blur-3xl animate-pulse delay-1000" />
                            </div>

                            <motion.div
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                                className="relative z-10"
                            >
                                <img
                                    src={pandaLogo}
                                    alt="Happy panda"
                                    className="w-40 h-40 md:w-64 md:h-64 object-contain drop-shadow-2xl"
                                />
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-premium border border-pink-50"
                                >
                                    <Sparkles className="w-6 h-6 text-orange-400 fill-orange-400" />
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Content Section */}
                        <div className="md:w-7/12 p-8 md:p-14 flex flex-col justify-center bg-white relative">
                            {!submitted ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-3 py-1 bg-orange-100/50 rounded-full flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-700">Special Welcome Offer</span>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-fredoka font-bold text-gray-900 leading-[1.1] mb-4">
                                        Unlock <span className="text-pink-500">10% OFF</span> Your First Pair! 🎁
                                    </h2>
                                    <p className="text-gray-500 text-sm md:text-lg mb-8 leading-relaxed max-w-md">
                                        Join over <span className="text-gray-900 font-bold">10,000+</span> Happy Hopz members and get exclusive early access to new collections.
                                    </p>

                                    <form onSubmit={handleSubscribe} className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300" />
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="Enter your email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:bg-white transition-all text-base"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4.5 md:py-5 bg-[#FF4D8D] text-white font-black rounded-2xl shadow-xl shadow-pink-200 hover:shadow-pink-400 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative z-10 overflow-hidden group"
                                            style={{ backgroundColor: '#FF4D8D' }}
                                        >
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                                            {loading ? 'Processing...' : (
                                                <>
                                                    <Gift className="w-5 h-5 text-white animate-bounce" />
                                                    <span className="text-base md:text-lg uppercase tracking-wider text-white">Claim My Discount Now</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                    <p className="text-[11px] text-center text-gray-400 mt-6 leading-tight">
                                        No spam, just sprinkles. ✨ Unsubscribe at any time.
                                    </p>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8 md:py-12"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-[2rem] rotate-12 flex items-center justify-center mx-auto mb-6 shadow-premium">
                                        <Sparkles className="w-10 h-10 text-green-600 -rotate-12" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-gray-900 mb-4">Check your inbox! 🎉</h2>
                                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">Your 10% discount code is on its way to <br /><span className="text-pink-500 font-bold">{email}</span></p>
                                    <div className="py-3 px-6 bg-green-50 border border-green-200 rounded-2xl inline-flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                        <span className="text-sm font-bold text-green-700 uppercase tracking-widest">Discount Active</span>
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
