import React, { useState } from 'react';
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
import { Package, Calendar, MapPin, Phone, ArrowLeft, Truck, CheckCircle2, Clock, XCircle, IndianRupee, HelpCircle } from 'lucide-react';
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
            CONFIRMED: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            SHIPPED: <Truck className="w-5 h-5 text-purple-500" />,
            OUT_FOR_DELIVERY: <Truck className="w-5 h-5 text-orange-500" />,
            DELIVERED: <CheckCircle2 className="w-5 h-5 text-green-500" />,
            CANCELLED: <XCircle className="w-5 h-5 text-slate-500" />,
            REFUNDED: <IndianRupee className="w-5 h-5 text-slate-500" />
        };
        return icons[status] || <Clock className="w-5 h-5 text-slate-500" />;
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
                            <h1 className="text-3xl font-fredoka font-black text-slate-900 tracking-tight leading-none">
                                Order #{order.orderId || String(order.id || '').slice(-8)}
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-slate-400 flex items-center gap-2 text-xs font-black uppercase tracking-[2px]">
                                    <Calendar className="w-4 h-4 text-pink-500" />
                                    Placed {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                                </p>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <Badge variant="default" className={`${getStatusColor(order.status)} text-white px-4 py-1.5 uppercase tracking-widest font-black text-[9px] rounded-full shadow-lg shadow-blue-100 ring-4 ring-white border-none`}>
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
                            <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-red-100 shadow-sm flex-shrink-0">
                                    <XCircle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-[9px] font-black text-red-500 uppercase tracking-[3px] mb-1">Order Terminated</h3>
                                    <p className="text-base font-black text-slate-900 mb-0.5">Cancellation Reason</p>
                                    <p className="text-slate-600 text-sm font-medium italic">"{order.cancellationReason || order.cancelReason || 'Customer choice'}"</p>
                                </div>
                            </div>
                        )}

                        {/* Return Request Display */}
                        {order.returnStatus && (
                            <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-orange-100 shadow-sm flex-shrink-0">
                                    <Package className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-[9px] font-black text-orange-500 uppercase tracking-[3px]">Return Active</h3>
                                        <Badge className="bg-orange-500 text-white text-[7px] font-black uppercase">{order.returnStatus}</Badge>
                                    </div>
                                    <p className="text-base font-black text-slate-900 mb-0.5">Return Request Details</p>
                                    <p className="text-slate-600 text-sm font-medium italic">"{order.returnReason || 'Product issues'}"</p>
                                </div>
                            </div>
                        )}

                        {/* Customer Action Inputs */}
                        {!['CANCELLED', 'SHIPPED', 'DELIVERED', 'REFUNDED'].includes(order.status) && !showReasonInput && (
                            <Button
                                variant="outline"
                                className="w-full py-6 border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500 rounded-3xl transition-all font-black uppercase tracking-widest text-[10px]"
                                onClick={() => setShowReasonInput('CANCEL')}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
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
                            <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Shipping Progress</h2>
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[2px] mt-1">Real-time status updates</p>
                                    </div>
                                    {order.trackingNumber && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm transition-all hover:bg-white hover:shadow-md">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[3px]">AWB Tracking</span>
                                            <p className="text-base font-mono font-black tracking-tighter text-slate-900">{order.trackingNumber}</p>
                                            <Badge className="bg-pink-100 text-pink-600 text-[7px] font-black uppercase border-none tracking-widest px-2">
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
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-md border-2 ${isCompleted ? 'bg-slate-900 border-white text-white rotate-[5deg] scale-105' : 'bg-white border-slate-50 text-slate-200'
                                                        }`}>
                                                        {isCompleted && index < currentStep ? (
                                                            <CheckCircle2 className="w-6 h-6 text-blue-400" />
                                                        ) : (
                                                            getStatusIcon(step)
                                                        )}
                                                    </div>
                                                    <div className={`mt-3 text-center transition-all ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                                        <p className={`text-[8px] font-black uppercase tracking-[1px] ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                                            {getStatusLabel(step)}
                                                        </p>
                                                        {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-1 animate-ping" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="absolute top-[42px] left-10 right-10 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                        <div
                                            className="h-full bg-slate-900 transition-all duration-[2000ms] shadow-sm ease-out rounded-full"
                                            style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {order.estimatedDelivery && order.status !== 'DELIVERED' && (
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white overflow-hidden relative shadow-2xl shadow-slate-300 ring-1 ring-white/10">
                                        <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500 opacity-10 rounded-full blur-[80px] -mr-32 -mt-32" />
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                                                <Truck className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[4px] mb-2">Estimated Arrival</h4>
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
                        <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Order Items</h2>
                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[2px] mt-1">Pack of {order.items?.length || 0} products</p>
                                </div>
                                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {order.items?.map((item: {
                                    id: string;
                                    name: string;
                                    size: string;
                                    color: string;
                                    quantity: number;
                                    price: number;
                                    product?: { images?: string | string[] }
                                }) => (
                                    <div key={item.id} className="group p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 group-hover:scale-105 transition-all">
                                            {(() => {
                                                let imageUrl = '';
                                                try {
                                                    const images = typeof item.product?.images === 'string'
                                                        ? JSON.parse(item.product.images)
                                                        : item.product?.images;
                                                    imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : '';
                                                } catch (e) {
                                                    // console.error('Image parse error', e);
                                                }
                                                return imageUrl ? (
                                                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                ) : <div className="w-full h-full bg-slate-50 flex items-center justify-center"><Package className="w-6 h-6 text-slate-200" /></div>;
                                            })()}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-pink-600 transition-colors">{item.name}</h3>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black uppercase tracking-wider text-slate-400 shadow-sm border border-slate-100">SIZE: {item.size}</span>
                                                <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black uppercase tracking-wider text-slate-400 shadow-sm border border-slate-100">COLOR: {item.color}</span>
                                                <Badge className="bg-slate-900 text-white font-black text-[8px] px-2 py-0.5 rounded-full">QTY: {item.quantity}</Badge>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-center md:items-end justify-center">
                                            <p className="text-xl font-black text-slate-900 flex items-center mb-0.5">
                                                <IndianRupee className="w-4 h-4 mr-0.5 text-slate-300" />
                                                {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                            </p>
                                            <p className="text-[8px] font-black text-pink-500/50 uppercase tracking-[1px]">₹{(item.price || 0).toFixed(2)} / UNIT</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Admin Controls Area */}
                        {isAdmin && (
                            <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-[40px] -mr-16 -mt-16" />
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 transition-all hover:bg-pink-50 hover:border-pink-100">
                                        <CheckCircle2 className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900">Administrator Panel</h2>
                                </div>
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[2px] mb-6 relative z-10">Control fulfillment status</p>
                                <div className="flex flex-wrap gap-3 relative z-10">
                                    {statusSteps.map((status) => (
                                        <Button
                                            key={status}
                                            variant={order.status === status ? 'default' : 'outline'}
                                            className={`h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-sm ${order.status === status ? 'bg-pink-500 border-pink-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:text-slate-900'
                                                }`}
                                            onClick={() => updateStatusMutation.mutate(status)}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className={`h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all border-red-100 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white shadow-sm`}
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
                        <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-12 -mt-12 opacity-50 transition-transform group-hover:scale-110" />
                            <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Order Receipt</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal Amount</span>
                                    <span className="text-base font-black text-slate-900">₹{(order.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logistics Tier</span>
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[7px] font-black uppercase tracking-widest rounded-full ring-1 ring-green-100">Free Air Shipping</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Handling Fee</span>
                                    <span className="text-[10px] font-black text-slate-900 uppercase italic">WAIVED</span>
                                </div>
                                <div className="pt-6 border-t-2 border-dashed border-slate-50">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[3px] text-pink-500 mb-1">Grand Total</p>
                                            <p className="text-2xl font-fredoka font-black text-slate-900">
                                                ₹{(order.total || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[7px] font-black text-slate-300 uppercase tracking-[1px]">Taxes Inclusive</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Shipping Destination */}
                        <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl relative overflow-hidden group">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mb-16 opacity-50 transition-all duration-700 group-hover:scale-110" />
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                    <MapPin className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Delivery Destination</h2>
                            </div>

                            {order.address ? (
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Recipient Identity</p>
                                        <p className="text-lg font-black text-slate-900 leading-tight">{order.address.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Verified Location</p>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-slate-600 leading-tight uppercase tracking-wider">{order.address.line1}</p>
                                            {order.address.line2 && <p className="text-sm font-medium text-slate-500 leading-tight uppercase tracking-wider">{order.address.line2}</p>}
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest mt-1">
                                                {order.address.city}, {order.address.state}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] mt-0.5">{order.address.pincode}</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-3 group/phone">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 group-hover/phone:bg-primary group-hover/phone:text-white transition-all">
                                                <Phone className="w-4 h-4 text-primary group-hover/phone:text-white" />
                                            </div>
                                            <p className="text-base font-black tracking-widest text-slate-700 group-hover/phone:text-primary transition-colors uppercase">{order.address.phone}</p>
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

                        {/* Customer Info */}
                        <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Customer Contact</h2>
                            </div>
                            <div className="space-y-4 relative z-10">
                                {order.guestEmail || (order.user && order.user.email) ? (
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Email Address</p>
                                        <p className="text-sm font-medium text-slate-900 truncate">{order.guestEmail || order.user?.email}</p>
                                    </div>
                                ) : null}
                                {order.guestPhone || (order.user && order.user.phone) ? (
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Contact Phone</p>
                                        <p className="text-sm font-medium text-slate-900">{order.guestPhone || order.user?.phone}</p>
                                    </div>
                                ) : null}
                            </div>
                        </Card>

                        {/* Activity Timeline */}
                        {order.statusHistory && Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
                            <Card className="p-6 border border-slate-100 bg-white shadow-sm rounded-3xl relative overflow-hidden">
                                <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight leading-none">Order Activity</h2>
                                <div className="space-y-6 relative ml-2">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
                                    {order.statusHistory.slice().reverse().map((history: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 relative z-10">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 mt-1 ${idx === 0 ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`}>
                                                <div className="w-1 h-1 rounded-full bg-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-900 leading-none mb-1">
                                                    {getStatusLabel(history.status)}
                                                </p>
                                                <p className="text-[8px] text-slate-400 font-medium">
                                                    {history.updatedAt ? format(new Date(history.updatedAt), 'MMM dd, hh:mm a') : 'Recently'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderDetail;
