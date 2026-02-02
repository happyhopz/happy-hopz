import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import upiQr from '@/assets/upi-qr.jpg';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI, ordersAPI, addressAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
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
    Wallet,
    Package,
    ChevronRight,
    Shield,
    Truck,
    Plus,
    Edit2
} from 'lucide-react';
import { toast } from 'sonner';

type CheckoutStep = 'login' | 'address' | 'payment' | 'review';

const Checkout = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');

    // UI State
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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

    // Fetch addresses from database
    const { data: savedAddresses = [] } = useQuery({
        queryKey: ['addresses'],
        queryFn: async () => {
            const response = await addressAPI.getAll();
            return response.data;
        },
        enabled: !!user
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
        }
    });

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            toast.info('Please login to continue checkout');
            navigate('/login?redirect=/checkout');
        }
    }, [user, loading, navigate]);

    const { data: cartItems, isLoading: cartLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartAPI.get();
            return response.data;
        },
        enabled: !!user
    });

    const createOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            console.log('Sending Order To API:', orderData);
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
            console.error('API Error:', error.response?.data);
            toast.error(msg);
        }
    });

    const total = cartItems?.reduce((sum: number, item: any) => {
        const price = item.product?.discountPrice || item.product?.price || 0;
        return sum + (price * item.quantity);
    }, 0) || 0;

    const itemCount = cartItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const savings = cartItems?.reduce((sum: number, item: any) => {
        if (item.product?.discountPrice) {
            return sum + ((item.product.price - item.product.discountPrice) * item.quantity);
        }
        return sum;
    }, 0) || 0;

    const steps = [
        { id: 'login', label: 'LOGIN', icon: Check },
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
        if (!selectedAddressId && savedAddresses.length === 0) {
            toast.error('Please add a delivery address');
            return;
        }
        if (!selectedAddressId && savedAddresses.length > 0) {
            setSelectedAddressId(savedAddresses[0]?.id);
        }
        setCurrentStep('payment');
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error('Please select a shipping address');
            return;
        }

        setIsProcessing(true);
        try {
            const orderData = {
                items: cartItems.map((item: any) => ({
                    productId: item.productId,
                    name: item.product.name,
                    price: item.product.discountPrice || item.product.price,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color
                })),
                total: total,
                addressId: selectedAddressId
            };

            await createOrderMutation.mutateAsync(orderData);
        } catch (error) {
            console.error('Order placement failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user) return null;

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
                            <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span className="font-bold text-gray-800">LOGIN</span>
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="font-bold text-gray-900">{user.name}</span>
                                    <span className="text-gray-600 ml-2">{user.email}</span>
                                </div>
                            </div>
                        </Card>

                        {/* 2. Address Step */}
                        <Card className="overflow-hidden border-none shadow-sm">
                            <div className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-colors ${currentStep === 'address' ? 'bg-pink-600 text-white' : 'bg-white border-b'}`} onClick={() => setCurrentStep('address')}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${currentStep === 'address' ? 'bg-white text-pink-600' : selectedAddressId ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                                        {selectedAddressId && currentStep !== 'address' ? <Check className="w-4 h-4" /> : '2'}
                                    </span>
                                    <span className={`font-bold ${currentStep === 'address' ? 'text-white' : 'text-gray-800'}`}>DELIVERY ADDRESS</span>
                                </div>
                                {currentStep !== 'address' && selectedAddressId && <Button variant="ghost" size="sm" className="text-pink-600 font-bold hover:bg-pink-50">CHANGE</Button>}
                            </div>

                            {currentStep === 'address' && (
                                <div className="p-6 space-y-4 bg-white">
                                    {savedAddresses.map((addr: any) => (
                                        <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-100' : 'border-gray-200 hover:border-pink-200'}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-pink-600 bg-pink-600' : 'border-gray-300'}`}>
                                                        {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{addr.name}</div>
                                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                                            {addr.line1}, {addr.line2 && `${addr.line2}, `}<br />
                                                            {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-700 mt-2 font-medium">Mobile: {addr.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedAddressId === addr.id && (
                                                <Button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold w-full sm:w-auto" onClick={handleContinueToPayment}>DELIVER HERE</Button>
                                            )}
                                        </div>
                                    ))}

                                    {(showAddForm || savedAddresses.length === 0) ? (
                                        <div className="p-6 border-2 border-pink-200 rounded-xl bg-pink-50/50">
                                            <h3 className="font-bold text-pink-600 mb-4 tracking-tight">ADD A NEW ADDRESS</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Name *</Label><Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Mobile *</Label><Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Pincode *</Label><Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} maxLength={6} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">State *</Label><Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">Address *</Label><Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="bg-white border-pink-100" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-600 uppercase">City *</Label><Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="bg-white border-pink-100" /></div>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <Button className="bg-pink-600 hover:bg-pink-700 text-white font-bold" onClick={handleAddAddress} disabled={addAddressMutation.isPending}>{addAddressMutation.isPending ? 'SAVING...' : 'SAVE AND DELIVER HERE'}</Button>
                                                {savedAddresses.length > 0 && <Button variant="ghost" className="font-bold text-gray-600" onClick={() => setShowAddForm(false)}>CANCEL</Button>}
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowAddForm(true)} className="w-full p-6 border-2 border-dashed border-pink-200 rounded-xl text-pink-600 font-bold flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"><Plus className="w-5 h-5" />Add New Address</button>
                                    )}
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
                                            const Icon = option.icon;
                                            const isSelected = paymentMethod === option.id;
                                            return (
                                                <div key={option.id} className="space-y-3">
                                                    <div onClick={() => setPaymentMethod(option.id)}
                                                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-100' : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'}`}>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-pink-600 bg-pink-600' : 'border-gray-300'}`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                        </div>
                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-pink-600' : 'text-gray-400'}`} />
                                                        <div className="flex-1">
                                                            <div className={`font-bold ${isSelected ? 'text-pink-900' : 'text-gray-900'}`}>{option.label}</div>
                                                            <div className="text-sm text-gray-500 font-medium">{option.description}</div>
                                                        </div>
                                                        {option.id === 'COD' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wider">Available</span>}
                                                    </div>
                                                    {isSelected && option.id === 'UPI' && (
                                                        <div className="p-6 border-2 border-pink-200 rounded-xl bg-white flex flex-col items-center text-center animate-in fade-in slide-in-from-top-2">
                                                            <div className="mb-4 p-2 bg-gray-50 rounded-xl border-2 border-dashed border-pink-100"><img src={upiQr} alt="UPI QR" className="w-48 h-48 object-contain" /></div>
                                                            <p className="font-bold text-gray-900">Scan to Pay via UPI</p>
                                                            <div className="flex items-center gap-2 py-1 px-3 mt-2 bg-pink-50 rounded-full text-pink-600 text-xs font-bold"><Smartphone className="w-3 h-3" />SECURE MECHANT</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Separator className="my-8" />
                                    <Button onClick={handlePlaceOrder} disabled={createOrderMutation.isPending || isProcessing} className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black shadow-lg shadow-orange-200">
                                        {createOrderMutation.isPending || isProcessing ? 'PROCESSING...' : paymentMethod === 'COD' ? `PAY ₹${total.toFixed(0)} ON DELIVERY` : `CONFIRM PAYMENT ₹${total.toFixed(0)}`}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Price Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-40 border-none shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-white"><div className="flex items-center justify-between text-gray-900 font-bold"><div className="flex items-center gap-2">🏷️ Coupons</div><ChevronRight className="w-4 h-4 text-gray-400" /></div></div>
                            <div className="p-5 bg-white">
                                <h3 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Price Details</h3>
                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex justify-between text-gray-600"><span>Price ({itemCount} items)</span><span>₹{(total + savings).toFixed(0)}</span></div>
                                    {savings > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{savings.toFixed(0)}</span></div>}
                                    <div className="flex justify-between text-gray-600"><span>Delivery Charges</span><span className="text-green-600 font-bold">FREE</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-black text-xl text-gray-900"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
                                </div>
                            </div>
                            <div className="px-5 py-4 bg-gray-50 text-[10px] text-gray-400 flex justify-between font-bold border-t italic uppercase tracking-widest">
                                <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</div>
                                <div className="flex items-center gap-1"><Truck className="w-3 h-3" /> Fast Delivery</div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Checkout;
