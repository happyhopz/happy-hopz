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
                    @page { size: A4; margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                    .print-hidden { display: none !important; }
                    .print-only { display: block !important; }
                    .invoice-container { color: black !important; background: white !important; }
                    .border-print { border: 1px solid #000 !important; }
                    .border-b-print { border-bottom: 1px solid #000 !important; }
                }
            ` }} />

            {/* Final High-Fidelity Tax Invoice - Visible ONLY on Print */}
            <div className="hidden print:block invoice-container max-w-4xl mx-auto p-0 font-sans text-black bg-white leading-relaxed">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                    <div className="w-1/2">
                        <h1 className="text-4xl font-bold uppercase tracking-tighter mb-1">TAX INVOICE</h1>
                        <div className="text-xs space-y-0.5 font-medium">
                            <p className="font-bold text-sm">Happy Hopz</p>
                            <p>Kids Footwear & Lifestyle Store</p>
                            <p className="mt-2 font-bold uppercase text-[10px] text-gray-500">Business Type: <span className="text-black">Proprietorship</span></p>
                            <p className="font-bold uppercase text-[10px] text-gray-500">GSTIN: <span className="text-black">XXXXXXXXXXXXXXX</span></p>
                        </div>
                    </div>
                    <div className="text-right w-1/2">
                        <div className="text-xs space-y-0.5 font-medium">
                            <p className="font-bold">Address: <span className="font-normal text-gray-700 font-sans">11881/10 Sat Nagar, Karol Bagh, New Delhi - 110005</span></p>
                            <p className="font-bold">Email: <span className="font-normal text-gray-700">support@happyhopz.com</span></p>
                            <p className="font-bold">Website: <span className="font-normal text-gray-700 underline">www.happyhopz.com</span></p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Invoice & Order Details */}
                    <div className="border border-black p-4 rounded-sm">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> 📌 Invoice Details
                        </h3>
                        <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <span className="font-bold">Invoice No:</span>
                            <span className="font-medium uppercase">HHZ-{String(order.id).slice(0, 6).toUpperCase()}</span>
                            <span className="font-bold">Order ID:</span>
                            <span className="font-medium">HHZ-ORD-{String(order.id).slice(6, 12).toUpperCase()}</span>
                            <span className="font-bold">Invoice Date:</span>
                            <span className="font-medium">{new Date().toLocaleDateString('en-IN')}</span>
                            <span className="font-bold">Order Date:</span>
                            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                            <span className="font-bold">Payment Method:</span>
                            <span className="font-medium uppercase">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</span>
                            <span className="font-bold">Transaction ID:</span>
                            <span className="font-medium truncate">{order.paymentId || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="border border-black p-4 rounded-sm">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> 👤 Bill To (Customer Details)
                        </h3>
                        <div className="text-xs space-y-1">
                            <p className="font-bold text-sm uppercase">{order.address?.name}</p>
                            <p className="text-gray-700">{order.address?.line1}</p>
                            {order.address?.line2 && <p className="text-gray-700">{order.address.line2}</p>}
                            <p className="text-gray-700">{order.address?.city}, {order.address?.state}, {order.address?.pincode}</p>
                            <p className="pt-2"><span className="font-bold">Phone:</span> {order.address?.phone}</p>
                            <p><span className="font-bold">Email:</span> {order.user?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Product Table */}
                <div className="mb-8">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-1">
                        <Package className="w-3 h-3" /> 📦 Product Details
                    </h3>
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="bg-gray-100 border-b border-black font-bold uppercase">
                                <th className="py-2 px-3 text-left border-r border-black w-8">#</th>
                                <th className="py-2 px-3 text-left border-r border-black">Product Name</th>
                                <th className="py-2 px-3 text-center border-r border-black w-16">Size</th>
                                <th className="py-2 px-3 text-center border-r border-black w-12">Qty</th>
                                <th className="py-2 px-3 text-right border-r border-black w-24">MRP (₹)</th>
                                <th className="py-2 px-3 text-right w-24">Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item: any, idx: number) => {
                                const mrp = item.mrp || (item.price * 1.2); // Fallback for demonstration
                                return (
                                    <tr key={item.id} className="border-b border-black last:border-b-0">
                                        <td className="py-3 px-3 border-r border-black text-center">{idx + 1}</td>
                                        <td className="py-3 px-3 border-r border-black">
                                            <p className="font-bold uppercase">{item.name}</p>
                                        </td>
                                        <td className="py-3 px-3 text-center border-r border-black italic">{item.size}</td>
                                        <td className="py-3 px-3 text-center border-r border-black font-bold">{item.quantity}</td>
                                        <td className="py-3 px-3 text-right border-r border-black text-gray-500">₹{mrp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-3 px-3 text-right font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Price Summary & Details */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    {/* Left Side: Shipping & Declaration */}
                    <div className="space-y-6">
                        <div className="border border-black p-4 rounded-sm">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1">
                                <Truck className="w-3 h-3" /> 🚚 Shipping Information
                            </h3>
                            <div className="grid grid-cols-2 gap-y-1 text-xs">
                                <span className="font-bold">Courier Partner:</span>
                                <span className="font-medium">ECOM EXPRESS / DELHIVERY</span>
                                <span className="font-bold">Tracking ID:</span>
                                <span className="font-medium underline">{order.trackingNumber || 'Awaiting Pickup'}</span>
                                <span className="font-bold">Dispatch Date:</span>
                                <span className="font-medium">{order.trackingNumber ? new Date().toLocaleDateString('en-IN') : 'PENDING'}</span>
                            </div>
                        </div>

                        <div className="p-4 border border-black border-dashed flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> 📝 Declaration
                                </h4>
                                <p className="text-[10px] font-medium leading-relaxed uppercase text-gray-700">
                                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Financial Summary */}
                    <div className="border border-black p-6 bg-gray-50/50">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest border-b border-black pb-1">
                            💰 Price Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-medium">
                                <span className="uppercase opacity-60">Subtotal</span>
                                <span className="font-bold">₹{(order.subtotal || (order.total - (order.tax || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium text-green-700">
                                <span className="uppercase opacity-60 tracking-wider">Discount</span>
                                <span className="font-bold">-₹{(order.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium">
                                <span className="uppercase opacity-60">Shipping Charges</span>
                                <span className="font-bold">{order.shipping > 0 ? `₹${order.shipping.toLocaleString('en-IN')}` : '0'}</span>
                            </div>

                            <div className="border-t border-gray-200 my-2 pt-2 space-y-2">
                                {(() => {
                                    const tax = order.tax || (order.total * 0.18);
                                    const halfTax = tax / 2;
                                    // Logic: If state is Delhi (where business is), show CGST/SGST. Else show IGST.
                                    const isInterstate = order.address?.state.toLowerCase() !== 'delhi';

                                    if (isInterstate) {
                                        return (
                                            <div className="flex justify-between items-center text-xs font-medium italic text-gray-600">
                                                <span className="uppercase tracking-widest">IGST (18%)</span>
                                                <span className="font-bold">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-xs font-medium italic text-gray-600">
                                                <span className="uppercase tracking-widest">CGST (9%)</span>
                                                <span className="font-bold">₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-medium italic text-gray-600">
                                                <span className="uppercase tracking-widest">SGST (9%)</span>
                                                <span className="font-bold">₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="pt-4 border-t-4 border-black flex justify-between items-center">
                                <span className="text-xl font-bold uppercase tracking-tight">Total Payable</span>
                                <span className="text-2xl font-black">₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <p className="text-[8px] text-right font-bold text-gray-500 uppercase mt-2 italic">
                                (All prices are inclusive of applicable taxes unless stated otherwise.)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Signatory Section */}
                <div className="flex justify-between items-end mt-12 mb-20 px-4">
                    <div className="text-[10px] font-bold text-gray-400 max-w-[200px]">
                        <p>Little Feet. Big Adventures. Always delivering happiness to your doorstep with every step they take.</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-16 underline decoration-dotted">✍️ Authorized Signatory</p>
                        <div className="text-right">
                            <p className="font-black text-lg uppercase tracking-widest">For Happy Hopz</p>
                            <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">(This is a system-generated invoice and does not require a physical signature.)</p>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="text-center border-t-2 border-black pt-8">
                    <div className="inline-block px-12 py-3 mb-6">
                        <p className="text-sm font-bold uppercase tracking-widest">Thank you for shopping with Happy Hopz 💛</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-[0.3em]">Little Feet. Big Adventures.</p>
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
