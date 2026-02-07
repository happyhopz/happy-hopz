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
        onError: () => {
            toast.error('Failed to update status');
        }
    });

    const getStatusIcon = (status: string) => {
        const icons: any = {
            PLACED: <Clock className="w-5 h-5" />,
            PACKED: <Package className="w-5 h-5" />,
            SHIPPED: <Truck className="w-5 h-5" />,
            DELIVERED: <CheckCircle2 className="w-5 h-5" />,
            CANCELLED: <XCircle className="w-5 h-5" />
        };
        return icons[status] || <Clock className="w-5 h-5" />;
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            PLACED: 'bg-pink-500',
            PACKED: 'bg-purple-500',
            SHIPPED: 'bg-indigo-600',
            DELIVERED: 'bg-green-500',
            CANCELLED: 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusLabel = (status: string) => {
        const labels: any = {
            PLACED: 'Order Placed',
            PACKED: 'Packed',
            SHIPPED: 'Shipped',
            DELIVERED: 'Delivered',
            CANCELLED: 'Cancelled'
        };
        return labels[status] || status;
    };

    const statusSteps = ['PLACED', 'PACKED', 'SHIPPED', 'DELIVERED'];

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
                            <h1 className="text-4xl font-fredoka font-bold text-foreground">
                                Order #{String(order.id || '').slice(0, 8)}
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4" />
                                Placed on {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={`${getStatusColor(order.status)} text-white px-3 py-1 uppercase tracking-wider font-extrabold`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-2">{getStatusLabel(order.status)}</span>
                            </Badge>
                            <Badge variant="outline" className="uppercase font-bold">
                                {order.paymentStatus === 'PENDING' ? 'Awaiting Payment' : order.paymentStatus}
                            </Badge>
                        </div>
                    </div>

                    {/* NEW: CUSTOMER ACTIONS */}
                    {!isAdmin && !['CANCELLED', 'DELIVERED'].includes(order.status) && !showReasonInput && (
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
                        {order.status !== 'CANCELLED' && (
                            <Card className="p-6 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-fredoka font-bold">Shipping Progress</h2>
                                    {order.trackingNumber && (
                                        <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Tracking:</span>
                                            <code className="text-sm font-bold text-primary">{order.trackingNumber}</code>
                                        </div>
                                    )}
                                </div>
                                <div className="relative pt-4 pb-8">
                                    <div className="flex justify-between relative z-10">
                                        {statusSteps.map((step, index) => (
                                            <div key={step} className="flex flex-col items-center">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border-4 ${index <= currentStep
                                                    ? 'bg-primary border-primary/20 text-white scale-110'
                                                    : 'bg-white border-muted text-muted-foreground'
                                                    }`}>
                                                    {index < currentStep ? (
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    ) : (
                                                        getStatusIcon(step)
                                                    )}
                                                </div>
                                                <span className={`text-xs mt-3 font-bold uppercase tracking-wider ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                                                    }`}>
                                                    {step}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-[42px] left-6 right-6 h-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {order.expectedDelivery && order.status !== 'DELIVERED' && (
                                    <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                                                <Truck className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Expected Delivery</p>
                                                <p className="text-lg font-fredoka font-bold text-blue-900">
                                                    {format(new Date(order.expectedDelivery), 'EEEE, MMMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="hidden md:block text-right">
                                            <p className="text-xs text-blue-600 font-medium italic">"On track for timely arrival"</p>
                                        </div>
                                    </div>
                                )}

                                {order.status === 'SHIPPED' && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-blue-500" />
                                        <p className="text-sm text-blue-700 font-medium">
                                            Your package is on its way! Use the tracking number above for more details.
                                        </p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Order Items */}
                        <Card className="p-6">
                            <h2 className="text-xl font-fredoka font-bold mb-6">Order Items</h2>
                            <div className="space-y-4">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-muted rounded-xl">
                                        <div className="w-20 h-20 bg-gradient-soft rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border">
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
                                                ) : <Package className="w-8 h-8 text-muted-foreground" />;
                                            })()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-fredoka font-bold">{item.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-fredoka font-bold text-primary flex items-center justify-end gap-1">
                                                <IndianRupee className="w-4 h-4" />
                                                {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                                <IndianRupee className="w-3 h-3" />
                                                {(item.price || 0).toFixed(2)} each
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
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card className="p-6">
                            <h2 className="text-xl font-fredoka font-bold mb-4">Order Summary</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-nunito font-semibold flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" />
                                        {(order.total || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="font-nunito font-semibold text-primary">Free</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-xl font-fredoka font-bold">Total</span>
                                    <span className="text-2xl font-fredoka font-bold text-primary flex items-center gap-1">
                                        <IndianRupee className="w-5 h-5" />
                                        {(order.total || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Shipping Address */}
                        <Card className="p-6">
                            <h2 className="text-xl font-fredoka font-bold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Shipping Address
                            </h2>
                            {order.address ? (
                                <div className="space-y-2 text-sm">
                                    <p className="font-nunito font-semibold">{order.address.name}</p>
                                    <p className="text-muted-foreground">{order.address.line1}</p>
                                    {order.address.line2 && (
                                        <p className="text-muted-foreground">{order.address.line2}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {order.address.city}, {order.address.state} - {order.address.pincode}
                                    </p>
                                    <p className="flex items-center gap-2 text-muted-foreground mt-2">
                                        <Phone className="w-4 h-4" />
                                        {order.address.phone}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No address provided</p>
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
