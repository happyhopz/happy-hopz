import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
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
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [order, setOrder] = useState<any>(null);

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
            CONFIRMED: <CheckCircle2 className="w-5 h-5 text-pink-500" />,
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
            CONFIRMED: 'bg-pink-500',
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
                        {/* Status Timeline Card */}
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
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Placed {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <Badge className={`${getStatusColor(order.status)} text-white px-6 py-2 text-[10px] uppercase font-black tracking-widest rounded-full shadow-lg h-auto`}>
                                    {order.status}
                                </Badge>
                            </div>

                            {/* Tracking Timeline */}
                            <div className="relative mb-12 px-2">
                                <div className="absolute top-6 left-6 right-6 h-1 bg-slate-100 hidden md:block" />
                                {currentStep !== -1 && (
                                    <div
                                        className="absolute top-6 left-6 h-1 bg-primary/30 transition-all duration-1000 hidden md:block"
                                        style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                    />
                                )}

                                <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                                    {statusSteps.map((step, index) => {
                                        const isCompleted = index <= currentStep;
                                        const isActive = index === currentStep;

                                        return (
                                            <div key={step} className="flex md:flex-col items-center gap-4 md:gap-4 relative z-10 bg-white pr-4 md:pr-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-110' : 'bg-slate-50 text-slate-300'
                                                    } ${isActive ? 'ring-8 ring-primary/10' : ''}`}>
                                                    {getStatusIcon(step)}
                                                </div>
                                                <div className="text-left md:text-center">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
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
                                    <Button variant="outline" className="rounded-2xl font-black text-xs uppercase tracking-widest border-2 hover:bg-white transition-all">
                                        Track on Courier Site
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="p-8 rounded-[2rem] border-2 border-slate-100 shadow-xl bg-white space-y-6">
                                <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-pink-500" />
                                    Shipping To
                                </h3>
                                <div className="space-y-1">
                                    <p className="font-black text-slate-900">{order.address?.name}</p>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                        {order.address?.line1}<br />
                                        {order.address?.line2 && <>{order.address.line2}<br /></>}
                                        {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        <Phone className="w-3 h-3" />
                                        {order.address?.phone || order.guestPhone}
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 rounded-[2rem] border-2 border-slate-100 shadow-xl bg-white space-y-6">
                                <h3 className="font-fredoka font-black text-lg text-slate-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-500" />
                                    Order Summary
                                </h3>
                                <div className="space-y-4">
                                    {order.items?.map((item: any) => (
                                        <div key={item.id} className="flex gap-4">
                                            {item.product?.image && (
                                                <img src={item.product.image} className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</p>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                                    EU {item.size} • Qty {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-black text-slate-900 text-sm">₹{item.price}</p>
                                        </div>
                                    ))}
                                    <Separator className="bg-slate-100" />
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                        <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Total Amount</p>
                                        <p className="font-black text-2xl text-primary leading-none">₹{order.total}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-fade-in">
                        <div className="relative inline-block">
                            <Package className="w-40 h-40 text-slate-50 mx-auto" strokeWidth={0.5} />
                            <Search className="w-12 h-12 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-fredoka font-black text-slate-300 uppercase tracking-widest">No Results Yet</h3>
                            <p className="text-slate-300 font-bold uppercase tracking-[2px] text-xs">Enter your details above to start tracking</p>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default TrackOrder;
