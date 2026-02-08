import { Tag, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface PremiumCouponCardProps {
    code: string;
    discount: string;
    description: string;
    subtotal: number;
    user: any;
    isGuest: boolean;
    guestEmail: string | null;
    onApply: (couponData: any) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
}

export const PremiumCouponCard = ({
    code,
    discount,
    description,
    subtotal,
    user,
    isGuest,
    guestEmail,
    onApply,
    loading,
    setLoading
}: PremiumCouponCardProps) => {
    const handleApply = async () => {
        setLoading(true);
        try {
            const userEmail = user?.email || (isGuest ? guestEmail : null);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify({
                    code: code,
                    cartTotal: subtotal,
                    guestEmail: userEmail
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to apply coupon');
            }

            const data = await response.json();
            onApply(data);
            toast.success(`Coupon applied! You saved ₹${data.discountAmount}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to apply coupon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleApply}
            disabled={loading}
            className="w-full relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
        >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600"></div>

            {/* Decorative Circles */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

            {/* Sparkle Effect */}
            <div className="absolute top-4 right-4 text-yellow-300 text-2xl animate-pulse">✨</div>

            {/* Content */}
            <div className="relative p-5">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                                <Tag className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-3xl font-black text-white tracking-wider drop-shadow-lg">{code}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm bg-white/95 text-pink-700 px-4 py-1.5 rounded-full font-black shadow-md">
                                {discount}
                            </span>
                            <span className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-md">
                                ✨ NEW USER
                            </span>
                        </div>
                        <p className="text-sm text-white/95 font-semibold mt-2 drop-shadow">
                            {description}
                        </p>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white/25 backdrop-blur-md rounded-xl px-4 py-3 ml-3 shadow-lg">
                        <span className="text-xs text-white/90 font-bold uppercase tracking-wide">Click to</span>
                        <span className="text-base text-white font-black">Apply</span>
                        <ChevronRight className="w-6 h-6 text-white mt-1 group-hover:translate-x-1 transition-transform drop-shadow" />
                    </div>
                </div>
            </div>

            {/* Dotted Border Effect */}
            <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none"></div>
        </button>
    );
};
