import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { productsAPI, cartAPI, adminAPI, contentAPI, settingsAPI, API_URL } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, User, MapPin, IndianRupee, Truck, Printer, FileText, Send, Calendar as CalendarIcon, History, Check, Clock, Phone, ShieldAlert } from 'lucide-react';
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
            // Defensive check: Remove leading # if present (from notifications or manual entry)
            const cleanId = id?.startsWith('#') ? id.slice(1) : id;
            const response = await adminAPI.getOrder(cleanId!);
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

    // Site Content (General/Contact/Social)
    const { data: siteContent } = useQuery({
        queryKey: ['site-content'],
        queryFn: async () => {
            try {
                const response = await contentAPI.get('site_settings');
                return response.data;
            } catch (error) {
                return {
                    siteName: 'Happy Hopz',
                    contactEmail: 'happyhopz308@gmail.com',
                    contactPhone: '+91 9711864674',
                    address: '114, Azad Rd, Vivekanand Puri, Sarai Rohilla, New Delhi, Delhi, 110007',
                };
            }
        },
        enabled: isAdmin
    });

    // Dynamic Site Settings (GST)
    const { data: dynamicSettings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const response = await settingsAPI.get();
            return response.data;
        },
        enabled: isAdmin
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

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-xl font-fredoka font-bold text-slate-400 animate-pulse">Synchronizing Order Intelligence...</p>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-red-100/50 ring-1 ring-red-100">
                <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-fredoka font-black text-slate-900 mb-2">Order Manifest Not Found</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                We couldn't retrieve the details for this order. It may have been archived or the ID in the notification might be incorrect.
            </p>
            <BackButton to="/admin/orders" label="Return to Command Center" />
        </div>
    );

    const statusHistory = (order.statusHistory as any[]) || [];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <style>
                {`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    .admin-container {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-compact {
                        padding: 1.5rem !important;
                        margin-bottom: 0 !important;
                    }
                }
                .print-only {
                    display: none;
                }
                `}
            </style>
            <div className="no-print">
                <Navbar />
            </div>

            <main className="container mx-auto px-4 py-8 max-w-7xl admin-container">
                <div className="flex items-center justify-between mb-8 no-print">
                    <div>
                        <BackButton to="/admin/orders" label="Back to Dashboard" />
                        <h1 className="text-3xl font-black mt-2">Order #{order.orderId || order.id.slice(0, 8)}</h1>
                        <p className="text-slate-500 font-medium tracking-tight">System Ref: {order.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-2 border-slate-200" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Print Invoice
                        </Button>
                        <Button variant="outline" className="border-2 border-slate-200" onClick={() => {
                            const token = localStorage.getItem('token');
                            window.open(`${API_URL}/admin/orders/${order.id}/shipping-label?token=${token}`, '_blank');
                        }}>
                            <FileText className="w-4 h-4 mr-2" /> Label
                        </Button>
                        <Button variant="hopz" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
                            <Send className="w-4 h-4 mr-2" /> {resendMutation.isPending ? 'Sending...' : 'Resend Receipt'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
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
                                            {['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(s => (
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
                        <Card className="p-6 border-none shadow-lg bg-slate-50 ring-1 ring-slate-200">
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-4">Dispatcher Note</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-black uppercase text-slate-900 uppercase">{order.address.name}</p>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">
                                        {order.address.line1}, {order.address.line2 && `${order.address.line2}, `}
                                        {order.address.city}, {order.address.state} - {order.address.pincode}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-900">{order.user?.email || order.guestEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Truck className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-900">{order.address.phone}</span>
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
                        <Card className="p-6 border-none shadow-xl bg-slate-50 ring-1 ring-slate-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Notification Handshake</h3>
                            <div className="flex gap-4">
                                <div className={`flex-1 p-4 rounded-xl text-center border-2 ${order.emailSent ? 'border-green-500/50 bg-green-50' : 'border-slate-200 bg-white'}`}>
                                    <p className="text-[10px] font-black uppercase text-slate-500">Email</p>
                                    <p className={`text-xs font-bold mt-1 ${order.emailSent ? 'text-green-600' : 'text-slate-400'}`}>{order.emailSent ? 'Delivered' : 'Pending'}</p>
                                </div>
                                <div className={`flex-1 p-4 rounded-xl text-center border-2 ${order.whatsappSent ? 'border-green-500/50 bg-green-50' : 'border-slate-200 bg-white'}`}>
                                    <p className="text-[10px] font-black uppercase text-slate-500">WhatsApp</p>
                                    <p className={`text-xs font-bold mt-1 ${order.whatsappSent ? 'text-green-600' : 'text-slate-400'}`}>{order.whatsappSent ? 'Delivered' : 'Pending'}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Professional Printable Invoice */}
            <div className="print-only w-full max-w-[210mm] mx-auto bg-white p-6 font-sans text-slate-900 print-compact">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900">HAPPY HOPZ</h1>
                        <p className="text-[10px] font-bold mt-0 text-slate-500 italic">Premium Kids Footwear</p>
                        <div className="mt-2 text-[9px] leading-tight text-slate-500 font-medium">
                            <p>{siteContent?.address || '114, Azad Rd, Vivekanand Puri, Sarai Rohilla, New Delhi, Delhi, 110007'}</p>
                            <p>Phone: {siteContent?.contactPhone || '+91 9711864674'}</p>
                            <p>Email: {siteContent?.contactEmail || 'happyhopz308@gmail.com'}</p>
                            <p className="font-bold text-slate-900 mt-1">GSTIN: {dynamicSettings?.gstin || '07GGIPS6410J1Z0'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Tax Invoice</h2>
                        <div className="mt-2 text-[10px] font-bold space-y-0.5">
                            <p><span className="text-slate-400">ORDER ID:</span> #{order.orderId || order.id.slice(0, 8)}</p>
                            <p><span className="text-slate-400">DATE:</span> {format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                            <p><span className="text-slate-400">PAYMENT:</span> {order.paymentMethod || 'ONLINE'}</p>
                        </div>
                    </div>
                </div>

                {/* Billing Details */}
                <div className="grid grid-cols-2 gap-8 mb-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Billed To</h3>
                        <p className="font-black text-slate-900 text-xs uppercase">{order.address.name}</p>
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-1">
                            {order.address.line1}, {order.address.line2 && `${order.address.line2}, `}
                            {order.address.city}, {order.address.state} - {order.address.pincode}
                        </p>
                        <p className="text-[10px] font-bold text-slate-900 mt-2 flex items-center gap-2">
                            <Phone className="w-2.5 h-2.5" /> {order.address.phone}
                        </p>
                    </div>
                    <div className="flex flex-col justify-center border-l-2 border-slate-100 pl-6">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Shipping Method</p>
                        <p className="text-[11px] font-bold">{order.courierPartner || 'Standard Shipping'}</p>
                        <p className="text-[9px] font-medium text-slate-500 mt-0.5">Status: {order.status}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-2 text-[9px] font-black uppercase tracking-widest">S.No</th>
                                <th className="p-2 text-[9px] font-black uppercase tracking-widest">Product Description</th>
                                <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Qty</th>
                                <th className="p-2 text-[9px] font-black uppercase tracking-widest text-right">Unit Price</th>
                                <th className="p-2 text-[9px] font-black uppercase tracking-widest text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item: any, idx: number) => (
                                <tr key={item.id}>
                                    <td className="p-2 text-[10px] font-bold text-slate-400">{idx + 1}</td>
                                    <td className="p-2">
                                        <p className="text-[10px] font-black text-slate-900 uppercase">{item.name}</p>
                                        <p className="text-[9px] font-bold text-slate-500">Size: {item.size} | Color: {item.color}</p>
                                    </td>
                                    <td className="p-2 text-[10px] font-bold text-center">{item.quantity}</td>
                                    <td className="p-2 text-[10px] font-bold text-right">₹{item.price.toFixed(2)}</td>
                                    <td className="p-2 text-[10px] font-black text-right text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Box */}
                <div className="flex justify-end pr-2">
                    <div className="w-[200px] space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{(order.subtotal || (order.total - (order.shipping || 0))).toFixed(2)}</span>
                        </div>
                        {order.tax > 0 && (
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>GST ({dynamicSettings?.gst_percentage || 18}%)</span>
                                <span>₹{order.tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Shipping</span>
                            <span>{order.shipping > 0 ? `₹${order.shipping.toFixed(2)}` : 'FREE'}</span>
                        </div>
                        {order.couponDiscount > 0 && (
                            <div className="flex justify-between text-[10px] font-bold text-pink-500">
                                <span>Discount ({order.couponCode})</span>
                                <span>-₹{order.couponDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-2 rounded-lg mt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest">Total Payable</span>
                            <span className="text-lg font-black">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Invoice Footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div className="text-[9px] font-medium text-slate-400 italic">
                        <p>Note: This is a computer-generated receipt and does not require a physical signature.</p>
                        <p className="mt-0.5">Generated on {format(new Date(), 'dd MMMM yyyy HH:mm')}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-0.5 bg-slate-900 mb-1 mx-auto"></div>
                        <p className="text-[9px] font-black uppercase tracking-widest">Authorized Signatory</p>
                        <p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase">For Happy Hopz</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetail;
