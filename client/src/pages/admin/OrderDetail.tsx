import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, User, MapPin, IndianRupee, Truck, Printer } from 'lucide-react';
import { toast } from 'sonner';

const AdminOrderDetail = () => {
    const { id } = useParams();
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');

    const { data: order, isLoading } = useQuery({
        queryKey: ['admin-order', id],
        queryFn: async () => {
            const response = await adminAPI.getOrder(id!);
            if (response.data) {
                setStatus(response.data.status || '');
                setPaymentStatus(response.data.paymentStatus || '');
                setTrackingNumber(response.data.trackingNumber || '');
            }
            return response.data;
        },
        enabled: isAdmin && !!id
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return adminAPI.updateOrderStatus(id!, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Order updated successfully');
        },
        onError: () => {
            toast.error('Failed to update order');
        }
    });

    const { data: timelineLogs } = useQuery({
        queryKey: ['admin-order-logs', id],
        queryFn: async () => {
            const response = await adminAPI.getAuditLogs({ entity: 'ORDER', entityId: id });
            return response.data;
        },
        enabled: isAdmin && !!id
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" />;
    }

    const handleUpdate = () => {
        updateMutation.mutate({
            status,
            paymentStatus,
            trackingNumber: trackingNumber || null
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                </main>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <BackButton label="Back to Orders" to="/admin/orders" />
                    <Card className="p-12 text-center mt-8">
                        <h3 className="text-xl font-sans font-bold mb-2">Order not found</h3>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="font-sans">
            <main className="py-8">
                <div className="print:hidden">
                    <BackButton label="Back to Orders" to="/admin/orders" />
                </div>

                {/* Print Only Header */}
                <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold uppercase tracking-tight">Invoice</h1>
                            <p className="text-sm mt-1">Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm">Order ID: {order.id}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">Happy Hopz</h2>
                            <p className="text-sm italic">Kids Footwear Premium Collection</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8 print:mb-4">
                    <div className="text-black">
                        <h1 className="text-4xl print:text-2xl font-bold">
                            Order #{String(order.id || '').slice(0, 8)}
                        </h1>
                        <p className="text-muted-foreground print:text-black mt-1">
                            Placed {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 print:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="flex items-center gap-2 border-black text-black hover:bg-black/5"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </Button>
                        <Badge variant="outline" className="border-black text-black font-bold">
                            {order.status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Items & Customer Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card className="p-6 border-black/10 shadow-none print:border-none print:p-0">
                            <h2 className="text-2xl print:text-lg font-bold mb-4 flex items-center gap-2 text-black">
                                <Package className="w-6 h-6 print:hidden" />
                                Order Items
                            </h2>

                            {/* Formal Table for Print & Screen */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black text-black font-bold text-sm uppercase">
                                            <th className="py-3 px-2">Item</th>
                                            <th className="py-3 px-2">Details</th>
                                            <th className="py-3 px-2 text-center">Qty</th>
                                            <th className="py-3 px-2 text-right">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-black">
                                        {order.items?.map((item: any) => (
                                            <tr key={item.id} className="border-b border-black/10">
                                                <td className="py-4 px-2 font-medium">{item.name}</td>
                                                <td className="py-4 px-2 text-sm">
                                                    Size: {item.size} | Color: {item.color}
                                                </td>
                                                <td className="py-4 px-2 text-center">{item.quantity}</td>
                                                <td className="py-4 px-2 text-right font-bold">
                                                    ₹{(item.price || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 pt-4 text-black border-t-2 border-black">
                                <div className="flex justify-end gap-10">
                                    <div className="space-y-1 text-right">
                                        <p className="text-sm font-medium">Subtotal:</p>
                                        <p className="text-sm font-medium">Shipping:</p>
                                        <p className="text-lg font-bold uppercase mt-2">Total:</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-sm">₹{(order.total || 0).toFixed(2)}</p>
                                        <p className="text-sm">Free</p>
                                        <p className="text-lg font-bold mt-2">₹{(order.total || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Information */}
                            <Card className="p-6 border-black/10 shadow-none print:border-none print:p-0">
                                <h2 className="text-xl print:text-base font-bold mb-4 flex items-center gap-2 text-black underline print:no-underline">
                                    <User className="w-5 h-5 print:hidden" />
                                    Customer
                                </h2>
                                <div className="space-y-2 text-black">
                                    <p className="text-sm"><span className="font-bold print:hidden">Name:</span> {order.user?.name || 'N/A'}</p>
                                    <p className="text-sm"><span className="font-bold print:hidden">Email:</span> {order.user?.email}</p>
                                    <p className="text-sm"><span className="font-bold print:hidden">Phone:</span> {order.user?.phone || 'N/A'}</p>
                                </div>
                            </Card>

                            {/* Shipping Address */}
                            <Card className="p-6 border-black/10 shadow-none print:border-none print:p-0">
                                <h2 className="text-xl print:text-base font-bold mb-4 flex items-center gap-2 text-black underline print:no-underline">
                                    <MapPin className="w-5 h-5 print:hidden" />
                                    Shipping Address
                                </h2>
                                <div className="text-black text-sm space-y-1">
                                    <p className="font-bold">{order.address?.name}</p>
                                    <p>{order.address?.phone}</p>
                                    <p className="mt-1">{order.address?.line1}</p>
                                    {order.address?.line2 && <p>{order.address.line2}</p>}
                                    <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                                </div>
                            </Card>
                        </div>

                        <div className="hidden print:block mt-12 pt-8 border-t border-black text-sm text-center italic text-black">
                            <p>Thank you for choosing Happy Hopz! For support, visit www.happyhopz.com or contact us at +91 9876543210.</p>
                        </div>
                    </div>

                    {/* Right Column - Order Management */}
                    <div className="space-y-6 print:hidden">
                        <Card className="p-6 border-black/10 shadow-none">
                            <h2 className="text-xl font-bold mb-6 text-black">Order Actions</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-black">Update Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="border-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PLACED">Placed</SelectItem>
                                            <SelectItem value="PACKED">Packed</SelectItem>
                                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-black">Payment Status</Label>
                                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                        <SelectTrigger className="border-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="FAILED">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="flex items-center gap-2 text-black">
                                        <Truck className="w-4 h-4" />
                                        Tracking Number
                                    </Label>
                                    <Input
                                        className="border-black"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Order Tracking ID"
                                    />
                                </div>

                                <Button
                                    className="w-full bg-black text-white hover:bg-black/90"
                                    onClick={handleUpdate}
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-6 border-black/10 shadow-none">
                            <h2 className="text-xl font-bold mb-6 text-black underline">Order History</h2>
                            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-black/10">
                                {timelineLogs && timelineLogs.length > 0 ? timelineLogs.map((log: any) => (
                                    <div key={log.id} className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-white border-2 border-black flex items-center justify-center z-10">
                                            <div className="w-2 h-2 rounded-full bg-black" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-black">
                                                {log.action.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                            {log.details && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded text-[10px] font-mono border border-black/5 leading-relaxed overflow-x-auto">
                                                    {(() => {
                                                        try {
                                                            const details = JSON.parse(log.details);
                                                            return Object.entries(details).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between gap-4">
                                                                    <span className="font-bold opacity-60 lowercase">{key}:</span>
                                                                    <span className="text-right">{String(value)}</span>
                                                                </div>
                                                            ));
                                                        } catch (e) {
                                                            return log.details;
                                                        }
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-white border-2 border-black flex items-center justify-center z-10">
                                            <div className="w-2 h-2 rounded-full bg-black" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-black">ORDER PLACED</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminOrderDetail;
