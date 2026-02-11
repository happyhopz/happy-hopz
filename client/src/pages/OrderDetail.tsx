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
        onError: (error: any) => {
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
        onError: (error: any) => {
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
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update status');
        }
    });

    const getStatusIcon = (status: string) => {
        const icons: any = {
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
        const colors: any = {
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
        const labels: any = {
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
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/orders')}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                    </Button>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-fredoka font-black text-slate-900 tracking-tight">
                                Order #{order.orderId || String(order.id || '').slice(-8)}
                            </h1>
                            <p className="text-slate-400 flex items-center gap-2 mt-2 text-sm font-bold uppercase tracking-wider">
                                <Calendar className="w-4 h-4 text-pink-500" />
                                Placed on {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className={`${getStatusColor(order.status)} text-white px-4 py-1.5 uppercase tracking-widest font-black text-[10px] rounded-full shadow-lg shadow-pink-200/50`}>
                                {getStatusLabel(order.status)}
                            </Badge>
                            {order.paymentStatus === 'PENDING' ? (
                                <Badge variant="outline" className="uppercase font-black text-[10px] tracking-widest border-2 border-orange-100 bg-orange-50/50 text-orange-600 px-3 py-1.5 rounded-full">
                                    Awaiting Payment
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="uppercase font-black text-[10px] tracking-widest border-2 border-green-100 bg-green-50/50 text-green-600 px-3 py-1.5 rounded-full">
                                    {order.paymentStatus}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* CUSTOMER/ADMIN ACTIONS */}
                    {!['CANCELLED', 'SHIPPED', 'DELIVERED'].includes(order.status) && !showReasonInput && (
                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowReasonInput('CANCEL')}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Order
                            </Button>
                        </div>
                    )}

                    {order.status === 'DELIVERED' && !order.returnStatus && !showReasonInput && (
                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                onClick={() => setShowReasonInput('RETURN')}
                            >
                                <Package className="w-4 h-4 mr-2" />
                                Return Order
                            </Button>
                        </div>
                    )}

                    {showReasonInput && (
                        <Card className="mt-6 p-6 border-2 border-pink-100 bg-pink-50/20">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                {showReasonInput === 'CANCEL' ? <XCircle className="w-5 h-5 text-red-500" /> : <Package className="w-5 h-5 text-orange-500" />}
                                {showReasonInput === 'CANCEL' ? 'Cancel Order' : 'Return Order'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 font-medium italic">
                                {showReasonInput === 'CANCEL' ? 'Please provide a reason for cancellation (min 5 characters)' : 'Please describe the reason for return (min 10 characters)'}
                            </p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Type your reason here..."
                                className="w-full min-h-[100px] p-4 rounded-xl border-2 border-pink-100 focus:border-pink-500 focus:ring-0 transition-all text-sm mb-4"
                            />
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 rounded-full font-bold"
                                    onClick={() => {
                                        if (showReasonInput === 'CANCEL') {
                                            cancelOrderMutation.mutate({ reason });
                                        } else {
                                            returnOrderMutation.mutate({ reason });
                                        }
                                    }}
                                    disabled={cancelOrderMutation.isPending || returnOrderMutation.isPending || (showReasonInput === 'CANCEL' ? reason.length < 5 : reason.length < 10)}
                                >
                                    Confirm {showReasonInput === 'CANCEL' ? 'Cancellation' : 'Return Request'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="rounded-full"
                                    onClick={() => {
                                        setShowReasonInput(null);
                                        setReason('');
                                    }}
                                >
                                    Wait, No!
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Display Cancellation/Return Info if exists */}
                    {(order.cancellationReason || order.returnReason) && (
                        <Card className={`mt-6 p-4 border-2 ${order.status === 'CANCELLED' ? 'border-red-100 bg-red-50/30' : 'border-orange-100 bg-orange-50/30'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {order.status === 'CANCELLED' ? <XCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-gray-800">
                                        {order.status === 'CANCELLED' ? 'Cancellation Details' : 'Return Details'}
                                        {order.returnStatus && <Badge className="ml-2 bg-orange-500">{order.returnStatus}</Badge>}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1 italic font-medium">"{order.cancellationReason || order.returnReason}"</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Progress */}
                        {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
                            <Card className="p-8 overflow-hidden relative border-none shadow-2xl shadow-slate-200/50 bg-white ring-1 ring-slate-100 rounded-3xl">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-purple-600" />
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900">Shipping Journey</h2>
                                    {order.trackingNumber && (
                                        <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border-2 border-slate-100 flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Live Tracking</span>
                                                <code className="text-sm font-black text-slate-900">{order.trackingNumber}</code>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-200">
                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative pt-6 pb-10">
                                    <div className="flex justify-between relative z-10">
                                        {statusSteps.map((step, index) => (
                                            <div key={step} className="flex flex-col items-center">
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 shadow-xl border-4 ${index <= currentStep
                                                    ? 'bg-slate-900 border-white text-white scale-110 shadow-slate-300'
                                                    : 'bg-white border-slate-50 text-slate-200'
                                                    }`}>
                                                    {index < currentStep ? (
                                                        <CheckCircle2 className="w-7 h-7" />
                                                    ) : (
                                                        getStatusIcon(step)
                                                    )}
                                                </div>
                                                <span className={`text-[10px] mt-4 font-black uppercase tracking-[2px] ${index <= currentStep ? 'text-slate-900' : 'text-slate-300'
                                                    }`}>
                                                    {step.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-[52px] left-8 right-8 h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 transition-all duration-[1500ms] ease-in-out"
                                            style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {order.estimatedDelivery && order.status !== 'DELIVERED' && (
                                    <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl flex items-center justify-between text-white shadow-2xl shadow-slate-300 group overflow-hidden relative">
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                <Truck className="w-7 h-7 text-pink-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-pink-400 uppercase tracking-[3px] mb-1">Arrival Window</p>
                                                <p className="text-xl font-fredoka font-bold">
                                                    {format(new Date(order.estimatedDelivery), 'EEEE, MMMM dd')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="hidden md:block text-right relative z-10">
                                            <p className="text-xs text-white/60 font-medium tracking-wide">"Our fleet is moving at top speed"</p>
                                        </div>
                                    </div>
                                )}
                            </Card>

                                {order.status === 'SHIPPED' && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                <Truck className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-sm text-blue-700 font-bold">Your package is on its way!</p>
                                    <p className="text-xs text-blue-600">{order.courierPartner || 'Standard Courier Service'}</p>
                                </div>
                            </div>
                        )}
                    </Card>
                        )}

                    {/* Order Items */}
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white ring-1 ring-slate-100 rounded-3xl">
                        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Order Items</h2>
                        <div className="space-y-6">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="flex gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-pink-200 transition-colors group">
                                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-500">
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
                                                <img
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : <Package className="w-10 h-10 text-slate-200" />;
                                        })()}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{item.name}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
                                            <span>Size: {item.size}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>Color: {item.color}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-pink-500">QTY: {item.quantity}</span>
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col justify-center">
                                        <p className="text-xl font-black text-slate-900 flex items-center justify-end">
                                            <IndianRupee className="w-4 h-4 mr-1 text-slate-400" />
                                            {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            ₹{(item.price || 0).toFixed(2)} / Unit
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <Card className="p-6">
                            <h2 className="text-xl font-fredoka font-bold mb-4">Admin Controls</h2>
                            <div className="flex flex-wrap gap-2">
                                {statusSteps.map((status) => (
                                    <Button
                                        key={status}
                                        variant={order.status === status ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateStatusMutation.mutate(status)}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        {status}
                                    </Button>
                                ))}
                                <Button
                                    variant={order.status === 'CANCELLED' ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate('CANCELLED')}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    CANCELLED
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Order Summary */}
                    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white ring-1 ring-slate-100 rounded-3xl overflow-hidden relative">
                        <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Order Receipt</h2>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Subtotal</span>
                                <span className="font-black text-slate-900">₹{(order.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Shipping Mode</span>
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Standard Courier</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Delivery Fee</span>
                                <span className="text-xs font-black text-slate-900 uppercase">FREE</span>
                            </div>
                            <div className="pt-6 border-t-2 border-dashed border-slate-100">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-pink-500 mb-1">Total Payable</p>
                                        <p className="text-4xl font-fredoka font-black text-slate-900">
                                            ₹{(order.total || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right pb-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Inclusive of taxes</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-slate-900 text-white rounded-3xl relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mb-16 group-hover:scale-110 transition-transform duration-700" />
                        <h2 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                <MapPin className="w-5 h-5 text-pink-400" />
                            </div>
                            Delivery Details
                        </h2>
                        {order.address ? (
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest text-pink-400 mb-2">Recipient</p>
                                    <p className="text-lg font-bold leading-tight">{order.address.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest text-pink-400 mb-2">Location</p>
                                    <p className="text-sm font-medium text-white/80 leading-relaxed uppercase tracking-wide">
                                        {order.address.line1}<br />
                                        {order.address.line2 && <>{order.address.line2}<br /></>}
                                        {order.address.city}, {order.address.state} - {order.address.pincode}
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                    <p className="flex items-center gap-3 text-sm font-black">
                                        <Phone className="w-4 h-4 text-pink-400" />
                                        {order.address.phone}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-white/40 italic relative z-10">No shipping identity verified</p>
                        )}
                    </Card>
                </div>
        </div>
            </main >

    <Footer />
        </div >
    );
};

export default OrderDetail;
