import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import upiQr from '@/assets/upi-qr.jpg';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI, ordersAPI, addressAPI, paymentAPI, settingsAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { PremiumCouponCard } from '@/components/PremiumCouponCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    CreditCard,
    Smartphone,
    Banknote,
    Landmark,
    Check,
    MapPin,
    Mail,
    Wallet,
    Package,
    ChevronRight,
    Shield,
    Truck,
    Plus,
    Edit2,
    Tag,
    X,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';

type CheckoutStep = 'login' | 'address' | 'payment' | 'review';

const Checkout = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');

    // UI State
    // UI State
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState<any>({
        COD: true,
        UPI: false,
        CARD: false,
        NETBANKING: false
    });

    const [address, setAddress] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [isGuest, setIsGuest] = useState(false);
    const [guestInfo, setGuestInfo] = useState({
        email: '',
        name: '',
        phone: ''
    });

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponExpiry, setCouponExpiry] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Fetch payment settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use public content API so guests can also see available methods
                const res = await fetch(`${import.meta.env.VITE_API_URL}/content/payment_methods`);
                if (res.ok) {
                    const data = await res.json();
                    setPaymentSettings(data);
                }
            } catch (error) {
                console.error('Failed to fetch payment settings');
            }
        };
        fetchSettings();
    }, []);

    // Load coupon from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('appliedCoupon');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const expiry = new Date(data.expiresAt);
                if (expiry > new Date()) {
                    setAppliedCoupon(data);
                    setCouponExpiry(expiry);
                } else {
                    localStorage.removeItem('appliedCoupon');
                }
            } catch (e) {
                localStorage.removeItem('appliedCoupon');
            }
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!couponExpiry) {
            setTimeRemaining(0);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expiry = couponExpiry.getTime();
            const remaining = Math.max(0, expiry - now);

            setTimeRemaining(remaining);

            if (remaining === 0) {
                setAppliedCoupon(null);
                setCouponExpiry(null);
                localStorage.removeItem('appliedCoupon');
                toast.error('Coupon expired! Please apply again.');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [couponExpiry]);

    // Fetch addresses from database
    const { data: savedAddresses = [] } = useQuery({
        queryKey: ['addresses'],
        queryFn: async () => {
            const response = await addressAPI.getAll();
            return response.data;
        },
        enabled: !!user && !isGuest
    });

    // Save address mutation
    const addAddressMutation = useMutation({
        mutationFn: (data: any) => addressAPI.create(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            setSelectedAddressId(res.data.id);
            setShowAddForm(false);
            setAddress({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
            toast.success('Address saved successfully');
            setCurrentStep('payment'); // Auto-proceed to payment
        }
    });

    // Auto-select first address if available
    useEffect(() => {
        if (savedAddresses.length > 0 && !selectedAddressId) {
            setSelectedAddressId(savedAddresses[0].id);
        }
    }, [savedAddresses, selectedAddressId]);

    // Check authentication and set step
    useEffect(() => {
        if (!loading && !user && !isGuest) {
            setCurrentStep('login' as any);
        }
    }, [user, loading, isGuest]);

    const { data: cartItems, isLoading: cartLoading } = useQuery({
        queryKey: ['cart', user?.id, isGuest],
        queryFn: async () => {
            if (isGuest) {
                const localCart = localStorage.getItem('cart');
                return localCart ? JSON.parse(localCart) : [];
            }
            const response = await cartAPI.get();
            return response.data;
        },
        enabled: !loading
    });

    // Fetch dynamic site settings (GST, Delivery)
    const { data: dynamicSettings } = useQuery({
        queryKey: ['site-settings-public'],
        queryFn: async () => {
            const response = await settingsAPI.get();
            return response.data;
        }
    });

    const createOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            const response = await ordersAPI.create(orderData);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Order placed successfully! 🎊');
            navigate(`/orders/${data.id}`);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || 'Order placement failed';
            toast.error(msg);
        }
    });

    const subtotal = cartItems?.reduce((sum: number, item: any) => {
        const price = item.product?.discountPrice || item.product?.price || 0;
        return sum + (price * item.quantity);
    }, 0) || 0;

    // Use dynamic settings with fallbacks
    const gstRate = (dynamicSettings?.gst_percentage || 18) / 100;
    const deliveryCharge = dynamicSettings?.delivery_charge || 99;
    const freeThreshold = dynamicSettings?.free_delivery_threshold || 999;

    const tax = Math.round(subtotal * gstRate);
    const shipping = subtotal >= freeThreshold ? 0 : deliveryCharge;
    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = subtotal + tax + shipping - couponDiscount;

    const itemCount = cartItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const savings = cartItems?.reduce((sum: number, item: any) => {
        if (item.product?.discountPrice) {
            return sum + ((item.product.price - item.product.discountPrice) * item.quantity);
        }
        return sum;
    }, 0) || 0;

    const steps = [
        { id: 'login', label: 'AUTH / GUEST', icon: Check },
        { id: 'address', label: 'DELIVERY ADDRESS', icon: MapPin },
        { id: 'payment', label: 'PAYMENT OPTIONS', icon: Wallet },
    ];

    const paymentOptions = [
        { id: 'COD', label: 'Cash on Delivery', description: 'Pay when you receive', icon: Banknote },
        { id: 'CARD', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', icon: CreditCard },
        { id: 'UPI', label: 'UPI', description: 'GPay, PhonePe, Paytm', icon: Smartphone },
        { id: 'NETBANKING', label: 'Net Banking', description: 'All major banks', icon: Landmark },
    ];

    const handleAddAddress = () => {
        if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
            toast.error('Please fill all required fields');
            return;
        }
        addAddressMutation.mutate(address);
    };

    const handleContinueToPayment = () => {
        // Validation for Guest
        if (isGuest) {
            if (!guestInfo.email || !guestInfo.name || !guestInfo.phone) {
                toast.error('Please fill in your contact information');
                return;
            }
            if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
                toast.error('Please fill in your delivery address');
                return;
            }
        }
        // Validation for Logged-in User
        else {
            // Case 1: Filling New Address Form
            if (showAddForm || (savedAddresses.length === 0 && !selectedAddressId)) {
                handleAddAddress();
                return; // handleAddAddress will handle the next step on success
            }
            // Case 2: Selected from List
            if (!selectedAddressId) {
                toast.error('Please select or add a delivery address');
                return;
            }
        }

        setCurrentStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        try {
            const userEmail = user?.email || (isGuest ? guestInfo.email : null);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify({
                    code: couponCode,
                    cartTotal: subtotal,
                    guestEmail: userEmail
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to apply coupon');
            }

            const data = await response.json();
            setAppliedCoupon(data);
            setCouponExpiry(new Date(data.expiresAt));
            localStorage.setItem('appliedCoupon', JSON.stringify(data));
            toast.success(`Coupon applied! You saved ₹${data.discountAmount}`);
            setCouponCode('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = async () => {
        if (!appliedCoupon) return;

        try {
            const userEmail = user?.email || (isGuest ? guestInfo.email : null);
            await fetch(`${import.meta.env.VITE_API_URL}/coupons/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify({
                    code: appliedCoupon.code,
                    guestEmail: userEmail
                })
            });

            setAppliedCoupon(null);
            setCouponExpiry(null);
            localStorage.removeItem('appliedCoupon');
            toast.success('Coupon removed');
        } catch (error) {
            toast.error('Failed to remove coupon');
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId && !isGuest) {
            toast.error('Please select a shipping address');
            return;
        }

        setIsProcessing(true);
        try {
            const orderItems = cartItems.map((item: any) => ({
                productId: item.productId,
                name: item.product.name,
                price: item.product.discountPrice || item.product.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color
            }));

            const baseOrderData = {
                items: orderItems,
                subtotal: subtotal,
                tax: tax,
                shipping: shipping,
                total: total,
                addressId: selectedAddressId,
                isGuest: isGuest,
                guestEmail: isGuest ? guestInfo.email : null,
                guestName: isGuest ? guestInfo.name : null,
                guestPhone: isGuest ? guestInfo.phone : null,
                address: isGuest ? address : null,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined
            };

            if (paymentMethod === 'COD') {
                await createOrderMutation.mutateAsync(baseOrderData);
                if (isGuest) localStorage.removeItem('cart');
            } else {
                // Online Payment Flow (Razorpay)
                const tempOrderId = `tmp_${Date.now()}`;
                const intentRes = await paymentAPI.createIntent({
                    amount: total,
                    orderId: tempOrderId
                });

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                    amount: intentRes.data.amount,
                    currency: intentRes.data.currency,
                    name: 'Happy Hopz',
                    description: 'Order Payment',
                    order_id: intentRes.data.id,
                    handler: async (response: any) => {
                        try {
                            // Verify Signature
                            await paymentAPI.verify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            // Create Order on Success
                            await createOrderMutation.mutateAsync({
                                ...baseOrderData,
                                paymentStatus: 'COMPLETED'
                            });

                            if (isGuest) localStorage.removeItem('cart');
                        } catch (err) {
                            toast.error('Payment verification failed. Please contact support.');
                        }
                    },
                    prefill: {
                        name: user?.name || guestInfo.name,
                        email: user?.email || guestInfo.email,
                        contact: user?.phone || guestInfo.phone
                    },
                    theme: {
                        color: '#DB2777' // pink-600
                    },
                    modal: {
                        ondismiss: () => {
                            setIsProcessing(false);
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error('Order placement failed:', error);
            setIsProcessing(false);
        }
    };

    // Remove the blocking if (!user) check
    if (loading && !isGuest) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <Package className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">Your bag is empty</h1>
                    <Link to="/products">
                        <Button variant="hopz">Continue Shopping</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto px-4 pt-4"><BackButton /></div>

            {/* Progress Steps */}
            <div className="bg-white shadow-sm sticky top-16 z-40 border-b">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center py-4 gap-0">
                        {steps.map((step, index) => {
                            const isCompleted = (step.id === 'login') || (step.id === 'address' && currentStep === 'payment');
                            const isActive = step.id === currentStep;
                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${isActive ? 'text-pink-600 font-bold' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-green-600 text-white' : isActive ? 'border-2 border-pink-600 text-pink-600' : 'border border-gray-300'}`}>
                                            {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                                        </div>
                                        <span className="text-xs sm:text-sm uppercase tracking-wider">{step.label}</span>
                                    </div>
                                    {index < steps.length - 1 && <div className="w-8 sm:w-16 h-[1px] bg-gray-300 mx-1" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {/* 1. Login Step */}
                        <Card className="overflow-hidden border-none shadow-sm">
                            <div className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-colors ${currentStep === 'login' ? 'bg-pink-600 text-white shadow-md' : 'bg-white border-b'}`} onClick={() => !user && !isGuest && setCurrentStep('login' as any)}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${user || isGuest ? 'bg-green-600 text-white' : 'bg-pink-600 text-white'}`}>
                                        {user || isGuest ? <Check className="w-4 h-4" /> : '1'}
                                    </span>
                                    <span className={`font-bold ${currentStep === 'login' ? 'text-white' : 'text-gray-800'}`}>LOGIN OR GUEST CHECKOUT</span>
                                </div>
                            </div>

                            {currentStep === 'login' && !user && !isGuest && (
                                <div className="p-8 bg-white text-center space-y-6">
                                    <div className="max-w-xs mx-auto space-y-4">
                                        <h3 className="text-xl font-fredoka font-bold text-gray-900">Let's get started</h3>
                                        <p className="text-gray-500 text-sm">Sign in for a better experience or continue as a guest.</p>
                                        <Button
                                            onClick={() => navigate('/login?redirect=/checkout')}
                                            className="w-full h-12 rounded-full font-bold text-base"
                                            variant="hopz"
                                        >
                                            Login / Sign Up
                                        </Button>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or</span></div>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setIsGuest(true);
                                                setCurrentStep('address');
                                            }}
                                            variant="outline"
                                            className="w-full h-12 rounded-full font-bold border-2"
                                        >
                                            Checkout as Guest
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {(user || isGuest) && currentStep !== 'login' && (
                                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-900">{user?.name || guestInfo.name || 'Guest User'}</span>
                                        <span className="text-gray-600 ml-2">{user?.email || guestInfo.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isGuest && <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase">GUEST</span>}
                                        <Button variant="ghost" size="sm" className="text-pink-600 font-bold hover:bg-pink-50" onClick={() => {
                                            if (user) {
                                                // If logged in, maybe show a toast or just allow them to toggle to guest if they want
                                                toast.info("You're already logged in as " + user.name);
                                            } else {
                                                setIsGuest(false);
                                                setCurrentStep('login' as any);
                                            }
                                        }}>{user ? 'LOGGED IN' : 'CHANGE'}</Button>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* 2. Address Step */}
                        <Card className="overflow-hidden border-none shadow-sm">
                            <div className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-colors ${currentStep === 'address' ? 'bg-pink-300' : 'bg-gray-50'}`} onClick={() => setCurrentStep('address')}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${currentStep === 'address' ? 'bg-white text-pink-600' : selectedAddressId ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                                        {selectedAddressId && currentStep !== 'address' ? <Check className="w-4 h-4" /> : '2'}
                                    </span>
                                    <span className={`font-bold text-sm ${currentStep === 'address' ? 'text-gray-900' : 'text-gray-900'}`}>DELIVERY ADDRESS</span>
                                </div>
                                {currentStep !== 'address' && selectedAddressId && <Button variant="ghost" size="sm" className="text-pink-600 font-bold hover:bg-pink-50">CHANGE</Button>}
                            </div>

                            {currentStep === 'address' && (
                                <div className="p-6 space-y-4 bg-white">
                                    {isGuest && (
                                        <div className="p-6 border-2 border-pink-100 rounded-2xl bg-white mb-6 space-y-4 shadow-sm">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-pink-600" />
                                                CONTACT INFORMATION
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-gray-600 uppercase">Full Name *</Label>
                                                    <Input
                                                        value={guestInfo.name}
                                                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                                        placeholder="John Doe"
                                                        className="bg-gray-50/50 border-gray-100 h-11"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-gray-600 uppercase">Email Address *</Label>
                                                    <Input
                                                        type="email"
                                                        value={guestInfo.email}
                                                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                                        placeholder="john@example.com"
                                                        className="bg-gray-50/50 border-gray-100 h-11"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-gray-600 uppercase">Phone Number *</Label>
                                                    <Input
                                                        value={guestInfo.phone}
                                                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                                        placeholder="+91 98765 43210"
                                                        className="bg-gray-50/50 border-gray-100 h-11"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {savedAddresses.map((addr: any) => (
                                        <div key={addr.id}
                                            onClick={() => setSelectedAddressId(addr.id)}
                                            className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 relative group ${selectedAddressId === addr.id
                                                ? 'border-pink-500 bg-pink-50/50 ring-4 ring-pink-100'
                                                : 'border-gray-100 hover:border-pink-200 hover:bg-gray-50/50'}`}>

                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedAddressId === addr.id ? 'border-pink-600 bg-pink-600' : 'border-gray-300 group-hover:border-pink-300'}`}>
                                                    {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-gray-900 uppercase tracking-tight">{addr.name}</span>
                                                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase">HOME</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                                                        {addr.line1}, {addr.line2 && `${addr.line2}, `}
                                                        <span className="block">{addr.city}, {addr.state} - <span className="font-bold text-gray-900">{addr.pincode}</span></span>
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                                        <span className="text-gray-400 font-medium">Mobile:</span>
                                                        <span className="font-bold text-gray-900">{addr.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(showAddForm || (savedAddresses.length === 0 && !selectedAddressId)) ? (
                                        <div className="p-6 border-2 border-pink-200 rounded-xl bg-pink-50/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-pink-600 tracking-tight uppercase">Enter Delivery Address</h3>
                                                {savedAddresses.length > 0 && <Button variant="ghost" size="sm" className="font-bold text-gray-600" onClick={() => setShowAddForm(false)}>Back to saved</Button>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Name *</Label><Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Mobile *</Label><Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Pincode *</Label><Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} maxLength={6} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">State *</Label><Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Address *</Label><Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">City *</Label><Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="bg-white border-pink-100" /></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowAddForm(true)} className="w-full p-6 border-2 border-dashed border-pink-200 rounded-xl text-pink-600 font-bold flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"><Plus className="w-5 h-5" />Add New Address</button>
                                    )}

                                    <div className="pt-8 border-t border-pink-50 mt-8">
                                        <Button
                                            onClick={handleContinueToPayment}
                                            disabled={addAddressMutation.isPending}
                                            className="w-full h-16 bg-primary text-primary-foreground font-black text-xl shadow-2xl shadow-primary/20 rounded-3xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                        >
                                            {addAddressMutation.isPending ? 'Saving Address...' : 'Continue to Payment'}
                                            <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                        <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Shield className="w-3 h-3 text-green-500" />
                                            SSL Secure Checkout
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 'payment' && selectedAddressId && (
                                <div className="px-6 py-4 bg-gray-50 border-t">
                                    {(() => {
                                        const addr = savedAddresses.find((a: any) => a.id === selectedAddressId);
                                        return addr ? <div className="text-sm"><span className="font-bold text-gray-900">{addr.name}</span><span className="text-gray-600 ml-2">{addr.line1}, {addr.city}</span></div> : null;
                                    })()}
                                </div>
                            )}
                        </Card>

                        {/* 3. Payment Step */}
                        <Card className="overflow-hidden border-none shadow-sm">
                            <div className={`px-6 py-3 flex items-center justify-between transition-colors ${currentStep === 'payment' ? 'bg-pink-600 text-white shadow-md' : 'bg-white border-b'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${currentStep === 'payment' ? 'bg-white text-pink-600' : 'bg-gray-400 text-white'}`}>3</span>
                                    <span className={`font-bold ${currentStep === 'payment' ? 'text-white' : 'text-gray-800'}`}>PAYMENT OPTIONS</span>
                                </div>
                            </div>

                            {currentStep === 'payment' && (
                                <div className="p-6 bg-white">
                                    <div className="space-y-3">
                                        {paymentOptions.map((option) => {
                                            const isAvailable = paymentSettings[option.id] !== false;
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => isAvailable && setPaymentMethod(option.id)}
                                                    disabled={!isAvailable}
                                                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${!isAvailable
                                                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                        : paymentMethod === option.id
                                                            ? 'border-pink-500 bg-pink-50'
                                                            : 'border-pink-100 hover:border-pink-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${!isAvailable ? 'bg-gray-200 text-gray-400' : 'bg-pink-100 text-pink-600'}`}>
                                                            <option.icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                                {option.label}
                                                                {!isAvailable && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase">Not Available</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{option.description}</div>
                                                        </div>
                                                    </div>
                                                    {isAvailable && paymentMethod === option.id && (
                                                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                                            <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {paymentMethod === 'UPI' && paymentSettings.UPI && (
                                        <div className="mt-6 p-6 border-2 border-pink-100 rounded-2xl bg-pink-50/30 text-center animate-in fade-in slide-in-from-top-4 duration-300">
                                            <p className="text-sm font-bold text-pink-600 mb-4">Scan QR to pay ₹{total.toFixed(2)}</p>
                                            <img src={upiQr} alt="UPI QR" className="w-48 h-48 mx-auto rounded-xl shadow-lg border-4 border-white" />
                                            <p className="text-[10px] text-gray-400 mt-4 italic">Order will be processed after payment verification</p>
                                        </div>
                                    )}
                                    <Separator className="my-8" />
                                    <Button onClick={handlePlaceOrder} disabled={createOrderMutation.isPending || isProcessing} className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white text-sm md:text-lg font-black shadow-lg shadow-orange-200">
                                        {createOrderMutation.isPending || isProcessing ? 'PROCESSING...' : paymentMethod === 'COD' ? `PAY ₹${total.toFixed(0)} ON DELIVERY` : `CONFIRM PAYMENT ₹${total.toFixed(0)}`}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Price Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            {/* ITEM SUMMARY */}
                            <Card className="p-4 border-none shadow-sm overflow-hidden bg-white">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Package className="w-4 h-4 text-pink-500" />
                                    Order Summary ({itemCount})
                                </h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItems?.map((item: any) => {
                                        let imageUrl = '';
                                        try {
                                            const images = typeof item.product.images === 'string'
                                                ? JSON.parse(item.product.images)
                                                : item.product.images;
                                            imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : '';
                                        } catch (e) {
                                            console.error('Image parse error', e);
                                        }

                                        return (
                                            <Link key={item.id} to={`/products/${item.product.id}`}>
                                                <div className="flex gap-3 items-center p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-50 cursor-pointer">
                                                    <div className="w-14 h-14 rounded-md bg-pink-50 overflow-hidden flex-shrink-0 border border-pink-50">
                                                        {imageUrl ? (
                                                            <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-pink-200">
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[11px] font-bold text-gray-800 truncate leading-tight">{item.product.name}</h4>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.size} | Qty: {item.quantity}</p>
                                                        <p className="text-[11px] font-bold text-pink-600">₹{(item.product.discountPrice || item.product.price).toFixed(0)}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="border-none shadow-sm overflow-hidden">
                                <div className="p-5 bg-white">
                                    <h3 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Price Details</h3>
                                    <div className="space-y-4 text-sm font-medium">
                                        <div className="flex justify-between text-gray-600"><span>Bag Total ({itemCount} items)</span><span>₹{subtotal.toFixed(0)}</span></div>
                                        {savings > 0 && <div className="flex justify-between text-green-600"><span>Bag Discount</span><span>-₹{savings.toFixed(0)}</span></div>}
                                        <div className="flex justify-between text-gray-600"><span>GST ({dynamicSettings?.gst_percentage || 18}%)</span><span>₹{tax.toFixed(0)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>Delivery Charges</span>{shipping === 0 ? <span className="text-green-600 font-bold">FREE</span> : <span>₹{shipping}</span>}</div>
                                        <Separator />
                                        <div className="flex justify-between font-black text-xl text-gray-900 pt-2"><span>Order Total</span><span>₹{total.toFixed(0)}</span></div>
                                    </div>
                                    {shipping > 0 && <p className="mt-4 text-[10px] text-orange-600 font-bold bg-orange-50 p-2 rounded text-center">Add ₹{(freeThreshold - subtotal).toFixed(0)} more for FREE delivery!</p>}
                                </div>
                                <div className="px-5 py-4 bg-gray-50 text-[10px] text-gray-400 flex justify-between font-bold border-t italic uppercase tracking-widest">
                                    <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</div>
                                    <div className="flex items-center gap-1"><Truck className="w-3 h-3" /> Fast Delivery</div>
                                </div>
                            </Card>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Checkout;
