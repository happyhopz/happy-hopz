import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Search, Truck, CheckCircle2, Clock, XCircle, IndianRupee, MapPin, Calendar, Phone, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TrackOrder = () => {
    const { user } = useAuth();
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [order, setOrder] = useState<any>(null);

    // Auto-fetch user's latest order if logged in
    const { data: userOrders, isLoading: isLoadingUserOrders } = useQuery({
        queryKey: ['my-orders', user?.id],
        queryFn: async () => {
            const res = await ordersAPI.getMyOrders();
            return res.data;
        },
        enabled: !!user
    });

    useEffect(() => {
        if (userOrders && userOrders.length > 0 && !order) {
            setOrder(userOrders[0]);
        }
    }, [userOrders]);

    const trackMutation = useMutation({
        mutationFn: ordersAPI.track,
        onSuccess: (res) => {
            setOrder(res.data);
            window.scrollTo({ top: 400, behavior: 'smooth' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Could not find order. Please check your details.');
            setOrder(null);
        }
    });

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId || !phone) {
            toast.error('Please enter both Order ID and Phone Number');
            return;
        }
        trackMutation.mutate({ orderId, phone });
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, React.ReactNode> = {
            CONFIRMED: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            SHIPPED: <Truck className="w-5 h-5 text-purple-500" />,
            OUT_FOR_DELIVERY: <Truck className="w-5 h-5 text-orange-500" />,
            DELIVERED: <CheckCircle2 className="w-5 h-5 text-green-500" />,
            CANCELLED: <XCircle className="w-5 h-5 text-slate-400" />,
            REFUNDED: <IndianRupee className="w-5 h-5 text-slate-400" />
        };
        return icons[status] || <Clock className="w-5 h-5 text-gray-400" />;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            CONFIRMED: 'bg-blue-600',
            SHIPPED: 'bg-purple-600',
            OUT_FOR_DELIVERY: 'bg-orange-500',
            DELIVERED: 'bg-green-600',
            CANCELLED: 'bg-slate-500',
            REFUNDED: 'bg-slate-900'
        };
        return colors[status] || 'bg-gray-500';
    };

    const statusSteps = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentStep = order ? statusSteps.indexOf(order.status) : -1;

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Navbar />

            <div className="relative overflow-hidden bg-white border-b border-border py-20">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-pink-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />

                <div className="container mx-auto px-4 relative">
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                        <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] font-black rounded-full">
                            Fast & Secure
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-fredoka font-black text-slate-900 tracking-tight leading-none">
                            Track Your <span className="text-primary italic">Happiness</span> 📦
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                            Enter your order details below to see the live status of your Happy Hopz shipment.
                        </p>

                        <Card className="p-2 mt-8 rounded-[2rem] border-2 border-slate-100 shadow-2xl shadow-pink-100/50 bg-white/80 backdrop-blur-xl">
                            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 relative group">
                                    <Input
                                        placeholder="Order ID (e.g. HH1234)"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        className="h-14 px-6 rounded-2xl border-none bg-slate-50/50 focus-visible:ring-primary/20 font-bold placeholder:text-slate-300 transition-all"
                                    />
                                </div>
                                <div className="flex-1 relative group">
                                    <Input
                                        placeholder="Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-14 px-6 rounded-2xl border-none bg-slate-50/50 focus-visible:ring-primary/20 font-bold placeholder:text-slate-300 transition-all"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={trackMutation.isPending}
                                    className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                                >
                                    {trackMutation.isPending ? 'Tracking...' : 'Track Now'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-16">
                {order ? (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
                        {/* 1. Status & Timeline Card */}
                        <Card className="p-8 md:p-12 rounded-[2.5rem] border-2 border-slate-100 shadow-xl bg-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] opacity-50" />

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-100 rounded-xl">
                                            <Package className="w-5 h-5 text-pink-500" />
                                        </div>
                                        <h2 className="text-2xl font-fredoka font-black text-slate-900">Order #{order.orderId || order.id.slice(-8)}</h2>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            Placed {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                        </p>
                                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                            <IndianRupee className="w-3 h-3" />
                                            Total: ₹{order.total}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Current Status</p>
                                        <Badge className={`${getStatusColor(order.status)} text-white px-8 py-3 text-sm uppercase font-black tracking-widest rounded-2xl shadow-xl ${order.status === 'CONFIRMED' ? 'shadow-blue-200' : 'shadow-slate-200'} h-auto ring-8 ring-slate-50 border-2 border-white`}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Payment: {order.paymentStatus}
                                    </p>
                                </div>
                            </div>

                            {/* Tracking Timeline */}
                            <div className="relative mb-12 px-2">
                                <div className="absolute top-7 left-6 right-6 h-1.5 bg-slate-100 hidden md:block rounded-full" />
                                {currentStep !== -1 && (
                                    <div
                                        className="absolute top-7 left-6 h-1.5 bg-primary transition-all duration-1000 hidden md:block rounded-full shadow-[0_0_15px_rgba(255,107,157,0.3)]"
                                        style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                    />
                                )}

                                <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                                    {statusSteps.map((step, index) => {
                                        const isCompleted = index <= currentStep;
                                        const isActive = index === currentStep;

                                        return (
                                            <div key={step} className="flex md:flex-col items-center gap-4 md:gap-4 relative z-10 bg-white pr-4 md:pr-0">
                                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${isCompleted ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-110' : 'bg-slate-50 text-slate-500'
                                                    } ${isActive ? 'ring-[15px] ring-primary/20 animate-pulse border-4 border-white' : ''}`}>
                                                    {getStatusIcon(step)}
                                                </div>
                                                <div className="text-left md:text-center mt-2">
                                                    <p className={`text-[11px] font-black uppercase tracking-[0.1em] ${isActive ? 'text-primary scale-110 transform transition-all' : (isCompleted ? 'text-slate-900' : 'text-slate-400')}`}>
                                                        {step.replace(/_/g, ' ')}
                                                    </p>
                                                    {isCompleted && (
                                                        <p className="text-[10px] font-black text-slate-400 mt-0.5">
                                                            {order.statusHistory?.find((h: any) => h.status === step)
                                                                ? format(new Date(order.statusHistory.find((h: any) => h.status === step).updatedAt), 'MMM dd')
                                                                : 'Check Updates'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {order.trackingNumber && (
                                <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                            <Truck className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courier: {order.courierPartner || 'Logistics Partner'}</p>
                                            <p className="text-lg font-black text-slate-900">#{order.trackingNumber}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="rounded-2xl font-black text-xs uppercase tracking-widest border-2 hover:bg-white transition-all shadow-sm">
                                        Track Shipment
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* 2. Full Order Details Card */}
                        <Card className="rounded-[2.5rem] border-2 border-slate-100 shadow-xl bg-white overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                {/* Shipping Info Section */}
                                <div className="p-8 space-y-6 md:col-span-1">
                                    <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                        Shipping To
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-black text-slate-900 text-base">{order.address?.name || order.guestName || 'Customer'}</p>
                                            <p className="text-slate-500 font-medium text-sm leading-relaxed mt-1">
                                                {order.address?.line1}<br />
                                                {order.address?.line2 && <>{order.address.line2}<br /></>}
                                                {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                                            </p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center gap-3 text-slate-900 font-bold text-sm">
                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                            </div>
                                            {order.address?.phone || order.guestPhone || 'No phone provided'}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Section */}
                                <div className="p-8 space-y-6 md:col-span-2 bg-slate-50/30">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                            <Package className="w-5 h-5 text-blue-500" />
                                            Items Summary
                                        </h3>
                                        <Badge variant="secondary" className="bg-white text-slate-900 font-black border-2 border-slate-100">
                                            {order.items?.length || 0} Items
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                                                {(() => {
                                                    let imageUrl = '';
                                                    try {
                                                        const images = typeof item.product?.images === 'string'
                                                            ? JSON.parse(item.product.images)
                                                            : item.product?.images;
                                                        imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : '';
                                                    } catch (e) { /* ignore parse errors */ }
                                                    return imageUrl ? (
                                                        <img src={imageUrl} className="w-20 h-20 rounded-xl object-cover bg-slate-50" alt={item.name} />
                                                    ) : (
                                                        <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                                                            <Package className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                    );
                                                })()}
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-black text-slate-900 text-base line-clamp-1">{item.name}</p>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter bg-slate-50">Size: {item.size}</Badge>
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter bg-slate-50">Qty: {item.quantity}</Badge>
                                                    </div>
                                                    <p className="font-black text-slate-400 text-xs mt-2">Price: ₹{item.price}</p>
                                                </div>
                                                <div className="text-right flex flex-col justify-center">
                                                    <p className="font-black text-lg text-slate-900 tracking-tighter">₹{item.price * item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Full Pricing Breakdown */}
                                        <div className="mt-8 p-6 bg-white rounded-3xl border-2 border-slate-100 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                                <span className="font-black text-slate-900">₹{order.subtotal || (order.total - (order.tax || 0) - (order.shipping || 0) + (order.couponDiscount || 0))}</span>
                                            </div>
                                            {order.shipping > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Delivery Charges</span>
                                                    <span className="font-black text-green-600">₹{order.shipping}</span>
                                                </div>
                                            )}
                                            {order.couponDiscount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Coupon Discount</span>
                                                    <span className="font-black text-pink-500">-₹{order.couponDiscount}</span>
                                                </div>
                                            )}
                                            {order.tax > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Taxes & Fees</span>
                                                    <span className="font-black text-slate-900">₹{order.tax}</span>
                                                </div>
                                            )}
                                            <Separator className="bg-slate-100 my-2" />
                                            <div className="flex justify-between items-center bg-pink-500/5 -mx-6 -mb-6 p-6 rounded-b-3xl">
                                                <span className="text-slate-900 font-black uppercase tracking-widest text-xs">Total Amount Paid</span>
                                                <span className="font-black text-3xl text-primary tracking-tighter leading-none">₹{order.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-fade-in">
                        <div className="relative inline-block">
                            <Package className="w-40 h-40 text-slate-50 mx-auto" strokeWidth={0.5} />
                            <Search className="w-12 h-12 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-fredoka font-black text-slate-300 uppercase tracking-widest">
                                {user ? "No Orders Found" : "No Results Yet"}
                            </h3>
                            <p className="text-slate-300 font-bold uppercase tracking-[2px] text-xs">
                                {user ? "You haven't placed any orders yet." : "Enter your details above to start tracking"}
                            </p>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default TrackOrder;
