import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
    Package, ArrowLeft, Clock, CheckCircle, XCircle,
    RotateCcw, MapPin, Mail, Phone, Calendar,
    FileText, Save, Info, ShoppingBag, Truck,
    CheckSquare, Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.happyhopz.com/api';

const STATUS_CONFIG: Record<string, any> = {
    PENDING: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

interface ReturnItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    size: string;
    color: string;
    reason: string;
    condition: string | null;
    images: string | null;
}

interface ReturnRequest {
    id: string;
    orderId: string;
    type: 'RETURN' | 'EXCHANGE';
    status: string;
    reason: string;
    comments: string | null;
    itemsTotal: number;
    pickupCharge: number;
    refundAmount: number;
    pickupAddress: string | null;
    pickupScheduled: string | null;
    adminNotes: string | null;
    createdAt: string;
    items: ReturnItem[];
    user: {
        name: string | null;
        email: string;
        phone: string | null;
    };
    order: {
        id: string;
        orderId: string;
        createdAt: string;
        total: number;
        status: string;
    };
}

export default function ReturnDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [adminNotes, setAdminNotes] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [restockItems, setRestockItems] = useState(true);

    const { data: returnRequest, isLoading, error } = useQuery<ReturnRequest>({
        queryKey: ['admin-return', id],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/returns/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        }
    });

    useEffect(() => {
        if (returnRequest) {
            setAdminNotes(returnRequest.adminNotes || '');
            if (returnRequest.pickupScheduled) {
                setPickupDate(new Date(returnRequest.pickupScheduled).toISOString().slice(0, 16));
            }
        }
    }, [returnRequest]);

    const approveMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem('token');
            return axios.patch(`${API_URL}/admin/returns/${id}/approve`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-return', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
            toast.success('Return request approved');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to approve')
    });

    const rejectMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem('token');
            return axios.patch(`${API_URL}/admin/returns/${id}/reject`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-return', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
            toast.success('Return request rejected');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to reject')
    });

    const completeMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem('token');
            return axios.patch(`${API_URL}/admin/returns/${id}/complete`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-return', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
            toast.success('Return request marked as completed');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to complete')
    });

    if (isLoading) return <div className="p-12 text-center animate-pulse">Loading request details...</div>;
    if (error || !returnRequest) return <div className="p-12 text-center text-red-500 font-bold">Error loading return request.</div>;

    const StatusIcon = STATUS_CONFIG[returnRequest.status].icon;
    const isPending = returnRequest.status === 'PENDING';
    const isApproved = returnRequest.status === 'APPROVED';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/returns')} className="rounded-full h-10 w-10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-fredoka font-bold flex items-center gap-2">
                            {returnRequest.type === 'RETURN' ? <RotateCcw className="w-8 h-8 text-pink-500" /> : <Truck className="w-8 h-8 text-blue-500" />}
                            {returnRequest.type} Request #{returnRequest.id.slice(0, 8)}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            Submitted on {new Date(returnRequest.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <Badge className={`${STATUS_CONFIG[returnRequest.status].color} px-4 py-2 rounded-full text-base font-bold flex items-center gap-2`}>
                    <StatusIcon className="w-5 h-5" />
                    {STATUS_CONFIG[returnRequest.status].label}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Section */}
                    <Card className="border-none shadow-premium bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="bg-pink-50/30 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-pink-600" />
                                Items to {returnRequest.type === 'RETURN' ? 'Return' : 'Exchange'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {returnRequest.items.map((item) => (
                                    <div key={item.id} className="p-6 flex gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between">
                                                <h3 className="font-bold text-lg">{item.productName}</h3>
                                                <span className="font-bold">₹{item.price}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm">
                                                <Badge variant="outline" className="rounded-md">Size: {item.size}</Badge>
                                                <Badge variant="outline" className="rounded-md">Color: {item.color}</Badge>
                                                <Badge variant="outline" className="rounded-md">Qty: {item.quantity}</Badge>
                                            </div>
                                            <div className="mt-4 p-3 bg-red-50/50 rounded-lg border border-red-100">
                                                <p className="text-sm font-semibold text-red-700 underline mb-1">Reason:</p>
                                                <p className="text-sm italic">{item.reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Return Summary / Reasoning */}
                    <Card className="border-none shadow-premium bg-white rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Request Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Main Reason</Label>
                                    <p className="text-lg font-bold mt-1 uppercase tracking-tight">{returnRequest.reason}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Customer Comments</Label>
                                    <p className="mt-1 text-sm bg-muted/30 p-3 rounded-lg border border-dashed">
                                        {returnRequest.comments || 'No additional comments provided.'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-bold flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    Pickup Address
                                </h4>
                                <div className="p-4 rounded-xl border-2 border-dashed bg-gray-50/50">
                                    <p className="text-sm leading-relaxed font-medium">
                                        {returnRequest.pickupAddress || 'Address details missing.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Customer, Stats & Actions */}
                <div className="space-y-6">
                    {/* Customer Info Card */}
                    <Card className="border-none shadow-premium bg-white rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Customer Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {(returnRequest.user.name || returnRequest.user.email)[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold leading-none">{returnRequest.user.name || 'Anonymous'}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-1">{returnRequest.user.email}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{returnRequest.user.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Order ID: <button onClick={() => navigate(`/admin/orders/${returnRequest.order.id}`)} className="text-primary hover:underline font-bold">#{returnRequest.order.orderId}</button></span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    {returnRequest.type === 'RETURN' && (
                        <Card className="border-none shadow-premium bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl overflow-hidden">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Refund Calculation</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-90">Items Total</span>
                                    <span>₹{returnRequest.itemsTotal}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-90">Pickup Fee (Deducted)</span>
                                    <span className="text-pink-200">-₹{returnRequest.pickupCharge}</span>
                                </div>
                                <Separator className="bg-white/20" />
                                <div className="flex justify-between items-end pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase opacity-80 leading-none">Net Refund</p>
                                        <h3 className="text-4xl font-fredoka font-bold">₹{returnRequest.refundAmount}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Panel */}
                    <Card className="border-none shadow-premium bg-white rounded-2xl border-t-4 border-t-primary overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg">Process Request</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isPending && (
                                <>
                                    <div className="space-y-4 bg-muted/20 p-4 rounded-xl border">
                                        <div className="space-y-2">
                                            <Label>Pickup Date & Time (Optional)</Label>
                                            <Input
                                                type="datetime-local"
                                                value={pickupDate}
                                                onChange={(e) => setPickupDate(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Internal Admin Notes</Label>
                                            <Textarea
                                                placeholder="e.g. Approved after customer sent DM on Instagram..."
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                className="bg-white text-sm h-24"
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-blue-100"
                                            onClick={() => approveMutation.mutate({ pickupScheduled: pickupDate, adminNotes })}
                                            disabled={approveMutation.isPending}
                                        >
                                            Approve & Schedule
                                        </Button>
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <Label className="text-red-600 font-bold">Reject with Reason</Label>
                                        <Input
                                            placeholder="Reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="bg-red-50/20"
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl"
                                            onClick={() => rejectMutation.mutate({ reason: rejectionReason, adminNotes })}
                                            disabled={rejectMutation.isPending || !rejectionReason}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Request
                                        </Button>
                                    </div>
                                </>
                            )}

                            {isApproved && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-4">
                                        <h4 className="flex items-center gap-2 font-bold text-green-700">
                                            <Package className="w-5 h-5" />
                                            Finish Processing
                                        </h4>
                                        <div className="space-y-3">
                                            <button
                                                className="flex items-center gap-2 text-sm w-full text-left font-bold"
                                                onClick={() => setRestockItems(!restockItems)}
                                            >
                                                {restockItems ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                                                Restore items to stock?
                                            </button>
                                            <p className="text-[10px] text-muted-foreground italic">
                                                Enabling this will automatically increment the inventory for these sizes.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 rounded-xl"
                                            onClick={() => completeMutation.mutate({ restockItems, adminNotes })}
                                            disabled={completeMutation.isPending}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Mark as Completed
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Update Admin Notes</Label>
                                        <Textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            className="min-h-[100px] text-sm"
                                        />
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => approveMutation.mutate({ pickupScheduled: pickupDate, adminNotes })}>
                                            <Save className="w-3.5 h-3.5 mr-2" />
                                            Update Notes Only
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!isPending && !isApproved && (
                                <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No further actions available for this request status.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
