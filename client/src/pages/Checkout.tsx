import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import upiQr from '@/assets/upi-qr.jpg';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI, ordersAPI } from '@/lib/api';
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
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
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

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            toast.info('Please login to continue checkout');
            navigate('/login?redirect=/checkout');
        }
    }, [user, navigate]);

    const { data: cartItems, isLoading: cartLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartAPI.get();
            return response.data;
        },
        enabled: !!user
    });

    const [isProcessing, setIsProcessing] = useState(false);

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
        onError: () => {
            toast.error('Failed to place order');
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
        const newAddress = { ...address, id: Date.now().toString() };
        setSavedAddresses([...savedAddresses, newAddress]);
        setSelectedAddressId(newAddress.id);
        setShowAddForm(false);
        setAddress({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
        toast.success('Address added successfully');
    };

    const handleContinueToPayment = () => {
        if (!selectedAddressId && savedAddresses.length === 0) {
            toast.error('Please add a delivery address');
            return;
        }
        if (!selectedAddressId) {
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
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

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
            // Error toast is handled in mutation onError
        } finally {
            setIsProcessing(false);
        }
    };


    if (!user) {
        return null;
    }

    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <Package className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Your bag is empty</h1>
                    <p className="text-muted-foreground mb-6">Add items to your bag to checkout</p>
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

            {/* Back Button */}
            <div className="container mx-auto px-4 pt-4">
                <BackButton />
            </div>

            {/* Progress Steps */}
            <div className="bg-white shadow-sm sticky top-16 z-40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center py-4 gap-0">
                        {steps.map((step, index) => {
                            const isCompleted =
                                (step.id === 'login') ||
                                (step.id === 'address' && currentStep === 'payment');
                            const isActive = step.id === currentStep;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer transition-all ${isActive ? 'text-pink-500 font-bold' :
                                            isCompleted ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                        onClick={() => {
                                            if (step.id === 'address') setCurrentStep('address');
                                            if (step.id === 'payment' && (selectedAddressId || savedAddresses.length > 0)) {
                                                setCurrentStep('payment');
                                            }
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-green-600 text-white' :
                                            isActive ? 'border-2 border-pink-500' : 'border border-gray-300'
                                            }`}>
                                            {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                                        </div>
                                        <span className="text-sm uppercase tracking-wide">{step.label}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="w-16 h-[1px] bg-gray-300 mx-2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Steps Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Login Step (Always Completed) */}
                        <Card className="overflow-hidden">
                            <div className="bg-pink-500 text-white px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-white text-pink-500 rounded-sm flex items-center justify-center text-sm font-bold">1</span>
                                    <span className="font-bold">LOGIN</span>
                                    <Check className="w-5 h-5 ml-2" />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <span className="font-bold">{user.name}</span>
                                    <span className="text-gray-600 ml-2">{user.email}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-pink-500">
                                    CHANGE
                                </Button>
                            </div>
                        </Card>

                        {/* Address Step */}
                        <Card className="overflow-hidden">
                            <div
                                className={`px-6 py-3 flex items-center justify-between cursor-pointer ${currentStep === 'address' ? 'bg-pink-500 text-white' : 'bg-gray-100'
                                    }`}
                                onClick={() => setCurrentStep('address')}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-sm font-bold ${currentStep === 'address' ? 'bg-white text-pink-500' :
                                        selectedAddressId ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                                        }`}>
                                        {selectedAddressId && currentStep !== 'address' ? <Check className="w-4 h-4" /> : '2'}
                                    </span>
                                    <span className="font-bold">DELIVERY ADDRESS</span>
                                </div>
                                {currentStep !== 'address' && selectedAddressId && (
                                    <Button variant="ghost" size="sm" className="text-pink-500">
                                        CHANGE
                                    </Button>
                                )}
                            </div>

                            {currentStep === 'address' && (
                                <div className="p-6 space-y-4">
                                    {/* Saved Addresses */}
                                    {savedAddresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => setSelectedAddressId(addr.id)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id
                                                ? 'border-pink-500 bg-pink-50'
                                                : 'border-gray-200 hover:border-pink-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-pink-500' : 'border-gray-300'
                                                        }`}>
                                                        {selectedAddressId === addr.id && (
                                                            <div className="w-3 h-3 rounded-full bg-pink-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{addr.name}</div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {addr.line1}, {addr.line2 && `${addr.line2}, `}
                                                            {addr.city}, {addr.state} - {addr.pincode}
                                                        </p>
                                                        <p className="text-sm text-gray-600">Mobile: {addr.phone}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {selectedAddressId === addr.id && (
                                                <Button
                                                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                                                    onClick={handleContinueToPayment}
                                                >
                                                    DELIVER HERE
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add New Address Form */}
                                    {(showAddForm || savedAddresses.length === 0) ? (
                                        <div className="p-4 border-2 border-pink-500 rounded-lg bg-pink-50">
                                            <h3 className="font-bold text-pink-500 mb-4">ADD A NEW ADDRESS</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm font-bold text-gray-700">Name *</Label>
                                                    <Input
                                                        value={address.name}
                                                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                                        placeholder="Enter name"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-bold text-gray-700">Mobile Number *</Label>
                                                    <Input
                                                        value={address.phone}
                                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                                        placeholder="10-digit mobile number"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-bold text-gray-700">Pincode *</Label>
                                                    <Input
                                                        value={address.pincode}
                                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                                        placeholder="6-digit pincode"
                                                        className="mt-1"
                                                        maxLength={6}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-bold text-gray-700">State *</Label>
                                                    <Input
                                                        value={address.state}
                                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                                        placeholder="State"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-sm font-bold text-gray-700">Address (House No, Building, Street) *</Label>
                                                    <Input
                                                        value={address.line1}
                                                        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                                                        placeholder="Enter address"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-sm font-bold text-gray-700">Locality / Area</Label>
                                                    <Input
                                                        value={address.line2}
                                                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                                                        placeholder="Enter locality"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-bold text-gray-700">City / District *</Label>
                                                    <Input
                                                        value={address.city}
                                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                                        placeholder="Enter city"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <Button
                                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                                    onClick={handleAddAddress}
                                                >
                                                    SAVE AND DELIVER HERE
                                                </Button>
                                                {savedAddresses.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setShowAddForm(false)}
                                                    >
                                                        CANCEL
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowAddForm(true)}
                                            className="w-full p-4 border-2 border-dashed border-pink-300 rounded-lg text-pink-500 font-bold flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add a new address
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Collapsed Address View */}
                            {currentStep === 'payment' && selectedAddressId && (
                                <div className="px-6 py-4 bg-gray-50">
                                    {(() => {
                                        const addr = savedAddresses.find(a => a.id === selectedAddressId);
                                        return addr ? (
                                            <div className="text-sm">
                                                <span className="font-bold">{addr.name}</span>
                                                <span className="text-gray-600 ml-2">
                                                    {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                                                </span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </Card>

                        {/* Payment Step */}
                        <Card className="overflow-hidden">
                            <div
                                className={`px-6 py-3 flex items-center justify-between ${currentStep === 'payment' ? 'bg-pink-500 text-white' : 'bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-sm font-bold ${currentStep === 'payment' ? 'bg-white text-pink-500' : 'bg-gray-300 text-gray-600'
                                        }`}>3</span>
                                    <span className="font-bold">PAYMENT OPTIONS</span>
                                </div>
                            </div>

                            {currentStep === 'payment' && (
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {paymentOptions.map((option) => {
                                            const Icon = option.icon;
                                            const isSelected = paymentMethod === option.id;
                                            return (
                                                <div key={option.id} className="space-y-3">
                                                    <div
                                                        onClick={() => setPaymentMethod(option.id)}
                                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-4 ${isSelected
                                                            ? 'border-pink-500 bg-pink-50'
                                                            : 'border-gray-200 hover:border-pink-300'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-pink-500' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <div className="w-3 h-3 rounded-full bg-pink-500" />
                                                            )}
                                                        </div>
                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-pink-500' : 'text-gray-400'}`} />
                                                        <div className="flex-1">
                                                            <div className="font-bold">{option.label}</div>
                                                            <div className="text-sm text-gray-500">{option.description}</div>
                                                        </div>
                                                        {option.id === 'COD' && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                                Available
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* UPI QR Code Display */}
                                                    {isSelected && option.id === 'UPI' && (
                                                        <div className="p-6 border-2 border-pink-200 rounded-lg bg-white flex flex-col items-center text-center animate-in fade-in slide-in-from-top-2">
                                                            <div className="mb-4 p-2 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                                <img
                                                                    src={upiQr}
                                                                    alt="UPI QR Code"
                                                                    className="w-48 h-48 object-contain"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="font-bold text-gray-800">Scan to Pay using any UPI app</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Open GPay, PhonePe, or Paytm and scan the code above.
                                                                </p>
                                                                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-pink-50 rounded-full text-pink-600 text-xs font-bold border border-pink-100">
                                                                    <Smartphone className="w-3 h-3" />
                                                                    VERIFIED MERCHANT
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Separator className="my-6" />

                                    <Button
                                        onClick={handlePlaceOrder}
                                        disabled={createOrderMutation.isPending || isProcessing}
                                        className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold"
                                    >
                                        {createOrderMutation.isPending || isProcessing
                                            ? 'Processing Order...'
                                            : paymentMethod === 'COD'
                                                ? `PAY ₹${total.toFixed(0)} ON DELIVERY`
                                                : `PAY ₹${total.toFixed(0)}`
                                        }
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Side - Price Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-36 p-0 overflow-hidden">
                            {/* Coupons */}
                            <div className="p-4 border-b">
                                <button className="w-full flex items-center justify-between text-left">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🏷️</span>
                                        <span className="font-bold">Apply Coupons</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Price Details */}
                            <div className="p-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">
                                    Price Details ({itemCount} Item{itemCount > 1 ? 's' : ''})
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total MRP</span>
                                        <span>₹{(total + savings).toFixed(0)}</span>
                                    </div>
                                    {savings > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount on MRP</span>
                                            <span>-₹{savings.toFixed(0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Convenience Fee</span>
                                        <span className="text-green-600">FREE</span>
                                    </div>
                                </div>
                                <Separator className="my-4" />
                                <div className="flex justify-between font-bold text-lg text-cyan-600">
                                    <span>Total Amount</span>
                                    <span>₹{total.toFixed(0)}</span>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex items-center gap-3 mb-3">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    <span className="font-bold text-sm">Items in Bag</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {cartItems?.map((item: any) => (
                                        <div key={item.id} className="w-16 h-20 flex-shrink-0 bg-white rounded border overflow-hidden">
                                            <img
                                                src={item.product?.images?.[0]}
                                                alt={item.product?.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Shield className="w-4 h-4" />
                                        <span>Secure Payment</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Truck className="w-4 h-4" />
                                        <span>Free Delivery</span>
                                    </div>
                                </div>
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
