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
import { Package, User, MapPin, IndianRupee, Truck, Printer, FileText } from 'lucide-react';
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
        <div className="font-sans min-h-screen bg-background print:bg-white">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                    .print-hidden { display: none !important; }
                    .print-only { display: block !important; }
                    .invoice-container { color: black !important; background: white !important; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                }
            ` }} />

            {/* Final High-Fidelity Tax Invoice - Visible ONLY on Print */}
            <div className="hidden print:block invoice-container max-w-4xl mx-auto p-0 font-sans text-black bg-white leading-relaxed">
                {/* Header Section - Centered & Professional */}
                <div className="text-center border-b-4 border-black pb-4 mb-4 avoid-break">
                    <h1 className="text-3xl font-black uppercase tracking-[0.25em] mb-2">TAX INVOICE</h1>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black uppercase tracking-tight">Happy Hopz</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Premium Kids Footwear & Lifestyle Store</p>
                        <div className="flex justify-center gap-6 text-[10px] uppercase font-black text-black pt-1">
                            <span>Proprietorship Firm</span>
                            <span className="opacity-40">|</span>
                            <span>GSTIN: XXXXXXXXXXXXXXX</span>
                        </div>
                        <div className="flex justify-center gap-4 text-[9px] uppercase font-bold text-gray-500">
                            <span>Email: support@happyhopz.com</span>
                            <span>|</span>
                            <span>Website: www.happyhopz.com</span>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6 mb-4 avoid-break">
                    {/* Invoice & Order Details */}
                    <div className="border border-black p-4 rounded-none">
                        <h3 className="text-[10px] font-black uppercase mb-3 tracking-[0.2em] border-b border-black pb-1">
                            Invoice Details
                        </h3>
                        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                            <span className="font-bold uppercase opacity-60">Invoice:</span>
                            <span className="font-black uppercase tracking-wider">HHZ-{String(order.id).slice(0, 6).toUpperCase()}</span>

                            <span className="font-bold uppercase opacity-60">Order ID:</span>
                            <span className="font-black uppercase tracking-wider">ORD-{String(order.id).slice(18).toUpperCase()}</span>

                            <span className="font-bold uppercase opacity-60">Date:</span>
                            <span className="font-black">{new Date().toLocaleDateString('en-IN')}</span>

                            <span className="font-bold uppercase opacity-60">Method:</span>
                            <span className="font-black uppercase">{order.paymentMethod}</span>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="border border-black p-4 rounded-none">
                        <h3 className="text-[10px] font-black uppercase mb-3 tracking-[0.2em] border-b border-black pb-1">
                            Shipping Details
                        </h3>
                        <div className="text-[11px] space-y-1">
                            <p className="font-black uppercase tracking-tight">{order.address?.name}</p>
                            <div className="font-bold text-gray-800 leading-tight">
                                <p>{order.address?.line1}, {order.address?.city}</p>
                                <p className="uppercase">{order.address?.state} - {order.address?.pincode}</p>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex gap-4">
                                <p><span className="font-black uppercase opacity-40">P:</span> {order.address?.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Table */}
                <div className="mb-4 avoid-break">
                    <table className="w-full border-collapse border-y-2 border-black text-[11px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-black font-black uppercase text-[10px] tracking-widest">
                                <th className="py-2 px-4 text-left w-12">#</th>
                                <th className="py-2 px-4 text-left">Description</th>
                                <th className="py-2 px-4 text-center w-24">Size</th>
                                <th className="py-2 px-4 text-center w-20">Qty</th>
                                <th className="py-2 px-4 text-right w-36 border-l border-black bg-gray-100">Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item: any, idx: number) => (
                                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="py-2 px-4 text-center font-bold text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="py-2 px-4 font-black uppercase">{item.name}</td>
                                    <td className="py-2 px-4 text-center font-black italic">{item.size}</td>
                                    <td className="py-2 px-4 text-center font-black">{item.quantity}</td>
                                    <td className="py-2 px-4 text-right font-black border-l border-black bg-gray-50/50">{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals & Shipping */}
                <div className="grid grid-cols-2 gap-6 mb-4 avoid-break">
                    {/* Left Column - Shipping & Declaration */}
                    <div className="space-y-4">
                        <div className="border border-black p-4 rounded-none">
                            <h3 className="text-[10px] font-black uppercase mb-3 tracking-[0.2em] border-b border-black pb-1">
                                Logistics
                            </h3>
                            <div className="grid grid-cols-2 gap-y-1.5 text-[10px]">
                                <span className="font-bold uppercase opacity-50">Logistics:</span>
                                <span className="font-black uppercase">ECOM / DELHIVERY</span>

                                <span className="font-bold uppercase opacity-50">AWB No:</span>
                                <span className="font-black underline tracking-widest">{order.trackingNumber || 'PENDING'}</span>
                            </div>
                        </div>

                        <div className="p-4 border-2 border-dashed border-black">
                            <p className="text-[9px] font-bold leading-relaxed uppercase text-gray-500">
                                * We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Totals */}
                    <div className="border-2 border-black p-6 bg-gray-100/10">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold uppercase opacity-50">Subtotal</span>
                                <span className="font-black">₹{(order.subtotal || (order.total - (order.tax || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold uppercase opacity-50 text-gray-400">Discount</span>
                                <span className="font-black text-gray-400">-₹{(order.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold uppercase opacity-50">Shipping</span>
                                <span className="font-black">{order.shipping > 0 ? `₹${order.shipping.toLocaleString('en-IN')}` : '0.00'}</span>
                            </div>

                            <div className="border-t border-black/10 my-2 pt-2 space-y-1.5">
                                {(() => {
                                    const tax = order.tax || (order.total * 0.18);
                                    const halfTax = tax / 2;
                                    const isInterstate = order.address?.state.toLowerCase() !== 'delhi';

                                    if (isInterstate) {
                                        return (
                                            <div className="flex justify-between items-center text-[10px] font-black">
                                                <span className="uppercase opacity-50">IGST (18%)</span>
                                                <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-[10px] font-black">
                                                <span className="uppercase opacity-50">CGST (9%)</span>
                                                <span>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black">
                                                <span className="uppercase opacity-50">SGST (9%)</span>
                                                <span>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="pt-4 border-t-2 border-black flex justify-between items-end">
                                <span className="text-xl font-black uppercase tracking-tighter">TOTAL</span>
                                <span className="text-3xl font-black tracking-tighter">₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatory Section */}
                <div className="flex justify-end items-end mb-6 px-4 h-24 avoid-break">
                    <div className="text-right w-1/2 flex flex-col justify-end">
                        <div className="mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-8">Authorized Signatory</p>
                            <div className="border-b border-black w-48 ml-auto"></div>
                        </div>
                        <p className="font-black text-xl uppercase tracking-tighter">Happy Hopz</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Computer Generated - No Signature Required</p>
                    </div>
                </div>

                {/* Final Professional Footer */}
                <div className="text-center border-t-2 border-black pt-4 pb-2 avoid-break">
                    <div className="flex justify-center gap-8 text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <span>Delhi, India</span>
                        <span>|</span>
                        <span>www.happyhopz.com</span>
                        <span>|</span>
                        <span>support@happyhopz.com</span>
                    </div>
                </div>
            </div>

            <main className="py-8 print:hidden">
                <div className="print:hidden">
                    <BackButton label="Back to Orders" to="/admin/orders" />
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div className="text-black">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-bold">
                                Order #{String(order.id || '').slice(0, 8)}
                            </h1>
                            <Badge variant="outline" className="border-primary text-primary font-black uppercase tracking-widest px-3">
                                {order.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 font-medium">
                            Created on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="hopz"
                            onClick={handlePrint}
                            className="flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Printer className="w-4 h-4" />
                            Generate Formal Invoice
                        </Button>
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

                        <Card className="p-6 border-pink-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-pink-600">
                                <FileText className="w-5 h-5" />
                                <h2 className="text-xl font-bold">Billing Details</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-bold">₹{order.subtotal?.toFixed(2) || (order.total - (order.tax || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">GST (Included)</span>
                                    <span className="font-bold">₹{order.tax?.toFixed(2) || (order.total * 0.18).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="font-bold text-green-600">{order.shipping > 0 ? `₹${order.shipping.toFixed(2)}` : 'FREE'}</span>
                                </div>
                                <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-lg">Total Amount</span>
                                    <span className="font-black text-2xl text-primary">₹{order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
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
