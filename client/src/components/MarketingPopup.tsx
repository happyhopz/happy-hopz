import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Mail, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { marketingAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import pandaLogo from '@/assets/panda-logo.png';

const MarketingPopup = () => {
    const { user, loading: authLoading, onLoginSuccess } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        // Don't show if user is logged in or on admin routes
        if (user || location.pathname.startsWith('/admin')) {
            setIsOpen(false);
            return;
        }

        const hasSeen = localStorage.getItem('hh_popup_v3_seen');
        const hasSubscribed = localStorage.getItem('hh_is_subscribed');

        if (!hasSeen && !hasSubscribed) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [user, location.pathname, authLoading]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hh_popup_v3_seen', 'true');
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await marketingAPI.subscribe({ email, source: 'POPUP' });
            setOtpSent(true);
            toast.success('Verification code sent to your email!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) return;
        setLoading(true);
        try {
            const response = await marketingAPI.verifySubscription({ email, otp });
            const { user: userData, token, message } = response.data;

            if (token && userData) {
                onLoginSuccess(userData, token);
                toast.success('Logged in successfully!');
            }

            localStorage.setItem('hh_is_subscribed', 'true');
            setSubmitted(true);
            toast.success(message || 'Subscribed successfully!');

            setTimeout(() => {
                handleClose();
            }, 4000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Verification failed');
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
                        className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/20"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-gray-100/50 hover:bg-gray-100 transition-all hover:rotate-90"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Top Accent / Logo Section */}
                        <div className="bg-gradient-to-b from-pink-50 to-white pt-8 pb-4 flex flex-col items-center relative">
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="relative mb-4"
                            >
                                <div className="absolute inset-0 bg-pink-200 blur-2xl opacity-30 rounded-full animate-pulse" />
                                <img
                                    src={pandaLogo}
                                    alt="Happy panda"
                                    className="w-24 h-24 md:w-28 md:h-28 object-contain relative z-10"
                                />
                            </motion.div>

                            <div className="flex items-center gap-2 px-4 py-1.5 bg-pink-500/10 rounded-full border border-pink-500/20">
                                <Sparkles className="w-3.5 h-3.5 text-pink-600 fill-pink-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600">Exclusive Offer</span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-8 pb-10 text-center">
                            {!submitted ? (
                                <>
                                    <h2 className="text-3xl md:text-3xl font-fredoka font-bold text-gray-900 leading-tight mb-3">
                                        <span className="text-pink-500">5% OFF</span> For You! 🎁
                                    </h2>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        {otpSent
                                            ? `Enter the 6-digit code sent to ${email}`
                                            : "Join our family for early access to sales and exclusive discounts."
                                        }
                                    </p>

                                    {!otpSent ? (
                                        <form onSubmit={handleSubscribe} className="space-y-4 max-w-[280px] mx-auto">
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="your@email.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:bg-white focus:border-pink-500 transition-all text-sm text-center"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full py-4 bg-[#FF4D8D] text-white font-black rounded-2xl shadow-xl shadow-pink-200 hover:shadow-pink-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
                                                style={{ backgroundColor: '#FF4D8D' }}
                                            >
                                                {loading ? 'Sending...' : (
                                                    <>
                                                        <Gift className="w-4 h-4 text-white" />
                                                        <span className="text-sm uppercase tracking-widest text-white">Get My Discount</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleVerify} className="space-y-4 max-w-[280px] mx-auto">
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={6}
                                                    placeholder="0 0 0 0 0 0"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:bg-white focus:border-pink-500 transition-all text-2xl font-bold tracking-[0.5em] text-center"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading || otp.length !== 6}
                                                className="w-full py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:shadow-green-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
                                            >
                                                {loading ? 'Verifying...' : 'Unlock My Code'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOtpSent(false)}
                                                className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-pink-500 transition-colors"
                                            >
                                                Change Email
                                            </button>
                                        </form>
                                    )}

                                    {!otpSent && (
                                        <div className="mt-6 flex flex-col items-center gap-4">
                                            <button
                                                onClick={handleClose}
                                                className="text-[10px] text-gray-400 font-medium uppercase tracking-widest hover:text-gray-600 transition-colors underline decoration-gray-200 underline-offset-4"
                                            >
                                                No thanks, maybe later
                                            </button>

                                            <div className="h-px w-20 bg-gray-100" />

                                            <p className="text-[11px] text-gray-500 font-medium">
                                                Already have an account? {' '}
                                                <a href="/login" className="text-pink-500 font-bold hover:underline" onClick={(e) => {
                                                    e.preventDefault();
                                                    handleClose();
                                                    window.location.href = '/login';
                                                }}>Log In</a>
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-[9px] text-gray-300 mt-6 max-w-[240px] mx-auto leading-tight">
                                        By joining you agree to our newsletter policies. <br />You can unsubscribe at any time.
                                    </p>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-10"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-[2rem] rotate-12 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Gift className="w-10 h-10 text-green-600 -rotate-12" />
                                    </div>
                                    <h2 className="text-3xl font-fredoka font-bold text-gray-900 mb-2">Welcome to the family! 🎉</h2>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        Your 5% discount code is:
                                    </p>
                                    <div className="py-4 px-8 bg-gray-50 rounded-2xl border-2 border-dashed border-pink-200 inline-block mb-8 group cursor-pointer hover:bg-white transition-all shadow-sm" onClick={() => {
                                        navigator.clipboard.writeText('WELCOME5');
                                        toast.success('Code copied!');
                                    }}>
                                        <span className="text-2xl font-black text-pink-500 tracking-wider">WELCOME5</span>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest group-hover:text-pink-400 transition-colors">Click to copy</p>
                                    </div>
                                    <div className="py-2.5 px-6 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Code Active for first order</span>
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
