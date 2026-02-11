import { useState, useEffect } from 'react';
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
import { Package, User, MapPin, IndianRupee, Truck, Printer, FileText, Send, Calendar as CalendarIcon, History, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminOrderDetail = () => {
    const { id } = useParams();
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierPartner, setCourierPartner] = useState('');
    const [estimatedDelivery, setEstimatedDelivery] = useState('');

    const { data: order, isLoading } = useQuery({
        queryKey: ['admin-order', id],
        queryFn: async () => {
            const response = await adminAPI.getOrder(id!);
            if (response.data) {
                setStatus(response.data.status || '');
                setTrackingNumber(response.data.trackingNumber || '');
                setCourierPartner(response.data.courierPartner || '');
                if (response.data.estimatedDelivery) {
                    setEstimatedDelivery(new Date(response.data.estimatedDelivery).toISOString().slice(0, 16));
                }
            }
            return response.data;
        },
        enabled: isAdmin && !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (data: any) => {
            return adminAPI.updateOrderStatusNew(id!, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
            toast.success('Order status updated and notification triggered');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Failed to update order');
        }
    });

    const resendMutation = useMutation({
        mutationFn: () => adminAPI.resendOrderNotification(id!),
        onSuccess: () => toast.success('Confirming order notification re-sent'),
        onError: () => toast.error('Failed to resend notification')
    });

    if (loading) return <div className="p-20 text-center">Loading...</div>;
    if (!user || !isAdmin) return <Navigate to="/" />;

    const handleUpdate = () => {
        updateStatusMutation.mutate({
            status,
            trackingNumber: trackingNumber || undefined,
            courierPartner: courierPartner || undefined,
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined
        });
    };

    if (isLoading) return <div className="p-20 text-center">Loading Order...</div>;
    if (!order) return <div className="p-20 text-center">Order Not Found</div>;

    const statusHistory = (order.statusHistory as any[]) || [];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <BackButton to="/admin/orders" label="Back to Dashboard" />
                        <h1 className="text-3xl font-black mt-2">Order #{order.orderId || order.id.slice(0, 8)}</h1>
                        <p className="text-slate-500 font-medium tracking-tight">System Ref: {order.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-2 border-slate-200" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Print Invoice
                        </Button>
                        <Button variant="hopz" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
                            <Send className="w-4 h-4 mr-2" /> {resendMutation.isPending ? 'Sending...' : 'Resend Receipt'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Manager */}
                        <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white ring-1 ring-slate-100">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <History className="w-5 h-5 text-pink-500" /> Update Order Status
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Current Phase</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="border-2 h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Estimated Delivery</Label>
                                    <Input
                                        type="datetime-local"
                                        className="border-2 h-12"
                                        value={estimatedDelivery}
                                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Courier Partner</Label>
                                    <Input
                                        placeholder="e.g. Delhivery, BlueDart"
                                        className="border-2 h-12"
                                        value={courierPartner}
                                        onChange={(e) => setCourierPartner(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Tracking ID</Label>
                                    <Input
                                        placeholder="Enter AWB Number"
                                        className="border-2 h-12"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full mt-8 h-12 font-bold text-base"
                                variant="hopz"
                                onClick={handleUpdate}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? 'Propagating Updates...' : 'Update Status & Notify Customer'}
                            </Button>
                        </Card>

                        {/* Order Items */}
                        <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white ring-1 ring-slate-100">
                            <h2 className="text-xl font-bold mb-6">Product Manifesto</h2>
                            <div className="divide-y-2 divide-slate-50">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="py-4 flex justify-between items-center group">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-slate-100">
                                                <Package className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.name}</p>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">₹{item.price} Unit</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-8 border-t-4 border-slate-900">
                                <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl">
                                    <span className="text-sm font-bold uppercase tracking-[3px]">Total Payable</span>
                                    <span className="text-3xl font-black">₹{order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* Customer Sidebar */}
                        <Card className="p-6 border-none shadow-lg bg-pink-600 text-white">
                            <h3 className="font-black uppercase tracking-widest text-[10px] opacity-60 mb-4">Dispatcher Note</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-black uppercase">{order.address.name}</p>
                                    <p className="text-xs opacity-90 leading-relaxed font-medium mt-1">
                                        {order.address.line1}, {order.address.line2 && `${order.address.line2}, `}
                                        {order.address.city}, {order.address.state} - {order.address.pincode}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-white/20">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 opacity-60" />
                                        <span className="text-xs font-bold">{order.user?.email || order.guestEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Truck className="w-4 h-4 opacity-60" />
                                        <span className="text-xs font-bold">{order.address.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Status Timeline */}
                        <Card className="p-6 border-none shadow-xl bg-white border-2 border-slate-100">
                            <h3 className="text-lg font-bold mb-6">Status Timeline</h3>
                            <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                {statusHistory.length > 0 ? [...statusHistory].reverse().map((h: any, i: number) => (
                                    <div key={i} className="relative pl-10">
                                        <div className={`absolute left-0 top-1.5 w-[32px] h-[32px] rounded-full flex items-center justify-center z-10 transition-all ${i === 0 ? 'bg-pink-600 text-white ring-4 ring-pink-100' : 'bg-white border-2 border-slate-200 text-slate-400 scale-90'}`}>
                                            {i === 0 ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase text-[10px] tracking-widest ${i === 0 ? 'text-pink-600' : 'text-slate-400'}`}>{h.status}</p>
                                            <p className="text-[10px] font-bold text-slate-900 mt-1">{format(new Date(h.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                                            <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase">Authored by {h.updatedBy || 'System'}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-slate-400 italic text-sm">No history available</div>
                                )}
                            </div>
                        </Card>

                        {/* Notification Status */}
                        <Card className="p-6 border-none shadow-xl bg-slate-900 text-white">
                            <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4 text-center">Notification Handshake</h3>
                            <div className="flex gap-4">
                                <div className={`flex-1 p-4 rounded-xl text-center border-2 ${order.emailSent ? 'border-green-500/50 bg-green-500/10' : 'border-slate-800 bg-slate-800'}`}>
                                    <p className="text-[10px] font-black uppercase">Email</p>
                                    <p className={`text-xs font-bold mt-1 ${order.emailSent ? 'text-green-400' : 'text-slate-500'}`}>{order.emailSent ? 'Delivered' : 'Pending'}</p>
                                </div>
                                <div className={`flex-1 p-4 rounded-xl text-center border-2 ${order.whatsappSent ? 'border-green-500/50 bg-green-500/10' : 'border-slate-800 bg-slate-800'}`}>
                                    <p className="text-[10px] font-black uppercase">WhatsApp</p>
                                    <p className={`text-xs font-bold mt-1 ${order.whatsappSent ? 'text-green-400' : 'text-slate-500'}`}>{order.whatsappSent ? 'Delivered' : 'Pending'}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminOrderDetail;
