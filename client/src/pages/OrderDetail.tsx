import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, MapPin, Phone, ArrowLeft, Truck, CheckCircle2, Clock, XCircle, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await ordersAPI.getById(id!);
            return response.data;
        },
        enabled: !!id && !!user
    });

    const [showReasonInput, setShowReasonInput] = useState<'CANCEL' | 'RETURN' | null>(null);
    const [reason, setReason] = useState('');

    const cancelOrderMutation = useMutation({
        mutationFn: (data: { reason: string }) => ordersAPI.cancel(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            toast.success('Order cancelled successfully');
            setShowReasonInput(null);
            setReason('');
        },
        onError: (error: { response?: { data?: { error?: string } } }) => {
            toast.error(error.response?.data?.error || 'Failed to cancel order');
        }
    });

    const returnOrderMutation = useMutation({
        mutationFn: (data: { reason: string }) => ordersAPI.return(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            toast.success('Return request submitted');
            setShowReasonInput(null);
            setReason('');
        },
        onError: (error: { response?: { data?: { error?: string } } }) => {
            toast.error(error.response?.data?.error || 'Failed to submit return request');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            const response = await ordersAPI.updateStatus(id!, { status: newStatus });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            toast.success('Order status updated');
        },
        onError: (error: { response?: { data?: { error?: string } } }) => {
            toast.error(error.response?.data?.error || 'Failed to update status');
        }
    });

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

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            CONFIRMED: 'Confirmed',
            SHIPPED: 'Shipped',
            OUT_FOR_DELIVERY: 'Out for Delivery',
            DELIVERED: 'Delivered',
            CANCELLED: 'Cancelled',
            REFUNDED: 'Refunded'
        };
        return labels[status] || status;
    };

    const statusSteps = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <Package className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-3xl font-fredoka font-bold mb-4">Order not found</h1>
                    <Button variant="hopz" onClick={() => navigate('/orders')}>
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const currentStep = statusSteps.indexOf(order.status);

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Navbar />

            <main className="container mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/orders')}
                        className="mb-6 hover:bg-white hover:shadow-sm rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-slate-600">Back to Orders</span>
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-3">
                            <h1 className="text-5xl font-fredoka font-black text-slate-900 tracking-tight leading-none">
                                Order #{order.orderId || String(order.id || '').slice(-8)}
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-slate-400 flex items-center gap-2 text-xs font-black uppercase tracking-[2px]">
                                    <Calendar className="w-4 h-4 text-pink-500" />
                                    Placed {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                                </p>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <Badge className={`${getStatusColor(order.status)} text-white px-4 py-1.5 uppercase tracking-widest font-black text-[9px] rounded-full shadow-lg shadow-pink-100 ring-4 ring-white`}>
                                    {getStatusLabel(order.status)}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {order.paymentStatus === 'PENDING' ? (
                                <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Payment Status</p>
                                        <p className="font-black text-orange-600 text-sm">Awaiting Settlement</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Payment Status</p>
                                        <p className="font-black text-green-600 text-sm">{order.paymentStatus}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    {/* Main Tracker & Items */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Cancellation Display */}
                        {order.status === 'CANCELLED' && (
                            <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[32px] flex items-start gap-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-red-100/50">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-red-100 shadow-sm flex-shrink-0">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[4px] mb-2">Order Terminated</h3>
                                    <p className="text-lg font-black text-slate-900 mb-1">Cancellation Reason</p>
                                    <p className="text-slate-600 font-medium italic">"{order.cancellationReason || order.cancelReason || 'Customer choice'}"</p>
                                </div>
                            </div>
                        )}

                        {/* Return Request Display */}
                        {order.returnStatus && (
                            <div className="p-8 bg-orange-50 border-2 border-orange-100 rounded-[32px] flex items-start gap-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-orange-100/50">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-orange-100 shadow-sm flex-shrink-0">
                                    <Package className="w-8 h-8 text-orange-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[4px]">Return Active</h3>
                                        <Badge className="bg-orange-500 text-white text-[8px] font-black uppercase">{order.returnStatus}</Badge>
                                    </div>
                                    <p className="text-lg font-black text-slate-900 mb-1">Return Request Details</p>
                                    <p className="text-slate-600 font-medium italic">"{order.returnReason || 'Product issues'}"</p>
                                </div>
                            </div>
                        )}

                        {/* Customer Action Inputs */}
                        {!['CANCELLED', 'SHIPPED', 'DELIVERED', 'REFUNDED'].includes(order.status) && !showReasonInput && (
                            <Button
                                variant="outline"
                                className="w-full py-8 border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500 rounded-[32px] transition-all font-black uppercase tracking-widest text-xs"
                                onClick={() => setShowReasonInput('CANCEL')}
                            >
                                <XCircle className="w-5 h-5 mr-3" />
                                Need to Cancel this order?
                            </Button>
                        )}

                        {order.status === 'DELIVERED' && !order.returnReason && !showReasonInput && (
                            <Button
                                variant="outline"
                                className="w-full py-8 border-2 border-dashed border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-500 rounded-[32px] transition-all font-black uppercase tracking-widest text-xs"
                                onClick={() => setShowReasonInput('RETURN')}
                            >
                                <Package className="w-5 h-5 mr-3" />
                                Request Return or Exchange
                            </Button>
                        )}

                        {showReasonInput && (
                            <Card className="p-8 border-none bg-white shadow-2xl shadow-slate-200 rounded-[32px] border-t-4 border-pink-500">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                            {showReasonInput === 'CANCEL' ? 'Order Cancellation' : 'Return Request'}
                                        </h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Please provide details</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowReasonInput(null)} className="rounded-full">
                                        <XCircle className="w-6 h-6 text-slate-300" />
                                    </Button>
                                </div>
                                <textarea
                                    className="w-full min-h-[140px] p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-pink-500 focus:ring-0 transition-all text-slate-900 font-medium text-lg placeholder:text-slate-300 mb-6"
                                    placeholder={showReasonInput === 'CANCEL' ? "Why do you want to cancel?" : "What's wrong with the product?"}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-pink-600 transition-all text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200"
                                        disabled={reason.length < (showReasonInput === 'CANCEL' ? 5 : 10)}
                                        onClick={() => showReasonInput === 'CANCEL' ? cancelOrderMutation.mutate({ reason }) : returnOrderMutation.mutate({ reason })}
                                    >
                                        Submit Request
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="h-14 rounded-2xl font-bold px-8"
                                        onClick={() => setShowReasonInput(null)}
                                    >
                                        Nevermind
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Shipping Progress Tracker */}
                        {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
                            <Card className="p-10 border-none bg-white shadow-2xl shadow-slate-200/50 rounded-[40px] relative overflow-hidden ring-1 ring-slate-100">
                                <div className="absolute top-0 left-0 w-2 h-full bg-pink-500" />
                                <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shipping Progress</h2>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-2">Real-time status updates</p>
                                    </div>
                                    {order.trackingNumber && (
                                        <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col items-center gap-2 shadow-2xl shadow-slate-300 scale-90 md:scale-100 origin-right">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[4px]">AWB Tracking</span>
                                            <p className="text-xl font-mono font-black tracking-tighter">{order.trackingNumber}</p>
                                            <Badge className="bg-white/10 text-pink-400 text-[8px] font-black uppercase border-none tracking-widest px-3">
                                                {order.courierPartner || 'Delhivery'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="relative pt-6 pb-12 mb-8">
                                    <div className="flex justify-between items-center relative z-10 px-2 lg:px-8">
                                        {statusSteps.map((step, index) => {
                                            const isCompleted = index <= currentStep;
                                            const isActive = index === currentStep;
                                            return (
                                                <div key={step} className="flex flex-col items-center relative group">
                                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-2xl border-4 ${isCompleted ? 'bg-slate-900 border-white text-white rotate-[10deg] scale-110 shadow-slate-300' : 'bg-white border-slate-50 text-slate-200'
                                                        }`}>
                                                        {isCompleted && index < currentStep ? (
                                                            <CheckCircle2 className="w-8 h-8 text-pink-400" />
                                                        ) : (
                                                            getStatusIcon(step)
                                                        )}
                                                    </div>
                                                    <div className={`mt-5 text-center transition-all ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                                        <p className={`text-[10px] font-black uppercase tracking-[2px] ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                                            {getStatusLabel(step)}
                                                        </p>
                                                        {isActive && <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mx-auto mt-2 animate-ping" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="absolute top-[52px] left-10 right-10 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className="h-full bg-slate-900 transition-all duration-[2000ms] shadow-[0_0_15px_rgba(0,0,0,0.1)] ease-out rounded-full"
                                            style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {order.estimatedDelivery && order.status !== 'DELIVERED' && (
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white overflow-hidden relative shadow-2xl shadow-slate-300 ring-1 ring-white/10">
                                        <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500 opacity-10 rounded-full blur-[80px] -mr-32 -mt-32" />
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                                                <Truck className="w-8 h-8 text-pink-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[4px] mb-2">Estimated Arrival</h4>
                                                <p className="text-3xl font-fredoka font-black">
                                                    {format(new Date(order.estimatedDelivery), 'EEEE, MMM dd')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative z-10 px-6 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-medium text-white/60 hidden md:block italic">
                                            "Our fleet is currently moving at maximum speed..."
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Items Section */}
                        <Card className="p-10 border-none bg-white shadow-2xl shadow-slate-200/50 rounded-[40px] ring-1 ring-slate-100">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Items</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-2">Pack of {order.items?.length || 0} products</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {order.items?.map((item: {
                                    id: string;
                                    name: string;
                                    size: string;
                                    color: string;
                                    quantity: number;
                                    price: number;
                                    product?: { images?: string | string[] }
                                }) => (
                                    <div key={item.id} className="group p-6 rounded-[32px] bg-slate-50/50 border border-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row items-center gap-8">
                                        <div className="w-32 h-32 bg-white rounded-[24px] overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-100 flex-shrink-0 group-hover:rotate-6 transition-all">
                                            {(() => {
                                                let imageUrl = '';
                                                try {
                                                    const images = typeof item.product?.images === 'string'
                                                        ? JSON.parse(item.product.images)
                                                        : item.product?.images;
                                                    imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : '';
                                                } catch (e) {
                                                    console.error('Image parse error', e);
                                                }
                                                return imageUrl ? (
                                                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                ) : <div className="w-full h-full bg-slate-50 flex items-center justify-center"><Package className="w-10 h-10 text-slate-200" /></div>;
                                            })()}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-pink-600 transition-colors">{item.name}</h3>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                <span className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm border border-slate-100 italic">SIZE: {item.size}</span>
                                                <span className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm border border-slate-100 italic">COLOR: {item.color}</span>
                                                <Badge className="bg-slate-900 text-white font-black text-[9px] px-3 py-1 rounded-full uppercase">QTY: {item.quantity}</Badge>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-center md:items-end justify-center">
                                            <p className="text-3xl font-black text-slate-900 flex items-center mb-1">
                                                <IndianRupee className="w-5 h-5 mr-1 text-slate-300" />
                                                {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                            </p>
                                            <p className="text-[10px] font-black text-pink-500/50 uppercase tracking-[2px]">₹{(item.price || 0).toFixed(2)} / UNIT</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Admin Controls Area */}
                        {isAdmin && (
                            <Card className="p-10 border-none bg-slate-900 shadow-2xl shadow-slate-300 rounded-[40px] text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500 opacity-10 rounded-full blur-[100px] -mr-32 -mt-32" />
                                <div className="flex items-center gap-4 mb-8 relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                        <CheckCircle2 className="w-6 h-6 text-pink-400" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">Administrator Panel</h2>
                                </div>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mb-6 mb-8 relative z-10">Control fulfillment status</p>
                                <div className="flex flex-wrap gap-4 relative z-10">
                                    {statusSteps.map((status) => (
                                        <Button
                                            key={status}
                                            variant={order.status === status ? 'default' : 'outline'}
                                            className={`h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${order.status === status ? 'bg-pink-500 border-pink-500 text-white shadow-xl shadow-pink-500/50' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                            onClick={() => updateStatusMutation.mutate(status)}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className={`h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-red-500/50 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white`}
                                        onClick={() => updateStatusMutation.mutate('CANCELLED')}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        CANCELLED
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar section */}
                    <div className="space-y-8">
                        {/* Receipt Details */}
                        <Card className="p-10 border-none bg-white shadow-2xl shadow-slate-200/50 rounded-[40px] ring-1 ring-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700 opacity-50" />
                            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Order Receipt</h2>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Subtotal Amount</span>
                                    <span className="text-lg font-black text-slate-900 leading-none">₹{(order.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Logistics Tier</span>
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-full ring-1 ring-green-100">Free Air Shipping</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Handling Fee</span>
                                    <span className="text-xs font-black text-slate-900 uppercase italic">WAIVED</span>
                                </div>
                                <div className="pt-8 border-t-4 border-dashed border-slate-50">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[4px] text-pink-500 mb-2">Grand Total</p>
                                            <p className="text-4xl font-fredoka font-black text-slate-900 leading-none">
                                                ₹{(order.total || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[2px]">Taxes Inclusive</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Shipping Destination */}
                        <Card className="p-10 border-none bg-slate-900 shadow-2xl shadow-slate-300 rounded-[40px] text-white relative overflow-hidden group">
                            <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="w-14 h-14 bg-white/10 rounded-[22px] flex items-center justify-center border border-white/20 group-hover:bg-pink-500 group-hover:border-pink-500 transition-all duration-500">
                                    <MapPin className="w-7 h-7 text-pink-400 group-hover:text-white transition-colors" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight leading-none">Delivery Destination</h2>
                            </div>

                            {order.address ? (
                                <div className="space-y-8 relative z-10">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[4px] text-pink-400 mb-3">Recipient Identity</p>
                                        <p className="text-xl font-black text-white leading-tight">{order.address.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[4px] text-pink-400 mb-3">Verified Location</p>
                                        <div className="space-y-1">
                                            <p className="text-base font-medium text-white/90 leading-tight uppercase tracking-wider">{order.address.line1}</p>
                                            {order.address.line2 && <p className="text-base font-medium text-white/70 leading-tight uppercase tracking-wider">{order.address.line2}</p>}
                                            <p className="text-base font-black text-white uppercase tracking-widest mt-2">
                                                {order.address.city}, {order.address.state}
                                            </p>
                                            <p className="text-xs font-black text-white/40 uppercase tracking-[4px] mt-1">{order.address.pincode}</p>
                                        </div>
                                    </div>
                                    <div className="pt-8 border-t border-white/10">
                                        <div className="flex items-center gap-4 group/phone">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover/phone:bg-white/20 transition-all">
                                                <Phone className="w-5 h-5 text-pink-400" />
                                            </div>
                                            <p className="text-lg font-black tracking-widest group-hover/phone:text-pink-400 transition-colors uppercase">{order.address.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center relative z-10">
                                    <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">No delivery coordinates provided</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderDetail;
