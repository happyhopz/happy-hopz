import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Eye, Package, IndianRupee, Search, Download, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const AdminOrders = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();

    // Hooks must be at the top
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [paymentFilter, setPaymentFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['admin-orders', statusFilter, paymentFilter, searchTerm, startDate, endDate],
        queryFn: async () => {
            try {
                const params: any = {};
                if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
                if (paymentFilter && paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
                if (searchTerm) params.search = searchTerm;
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;
                const response = await adminAPI.getOrders(params);
                return Array.isArray(response?.data) ? response.data : [];
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                return [];
            }
        },
        enabled: !!isAdmin
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await adminAPI.deleteOrder(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Order deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete order');
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (orderIds: string[]) => {
            return await adminAPI.bulkDeleteOrders(orderIds);
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setSelectedOrders([]);
            toast.success(data.data.message || 'Orders deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to delete orders');
        }
    });

    // Helper functions
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-gray-400 font-bold',
            CONFIRMED: 'bg-blue-500 font-bold',
            PROCESSING: 'bg-purple-500 font-bold',
            SHIPPED: 'bg-indigo-600 font-bold',
            OUT_FOR_DELIVERY: 'bg-orange-500 font-bold',
            DELIVERED: 'bg-green-500 font-bold',
            CANCELLED: 'bg-red-500 font-bold',
            REFUNDED: 'bg-gray-700 font-bold'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getPaymentColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-500',
            COMPLETED: 'bg-green-500',
            FAILED: 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const exportToCSV = () => {
        try {
            if (!orders || orders.length === 0) {
                toast.error('No orders to export');
                return;
            }

            const headers = [
                'Order ID', 'Date', 'Source', 'Customer Name', 'Customer Email', 'Customer Phone',
                'Shipping Address 1', 'Shipping Address 2', 'City', 'State', 'Pincode',
                'Items Summary', 'Subtotal', 'Shipping', 'Tax', 'Total Amount',
                'Status', 'Payment Status', 'Tracking Number'
            ];

            const csvContent = orders.filter(Boolean).map((o: any) => {
                const customerName = o.user?.name || o.guestName || 'Guest';
                const customerEmail = o.user?.email || o.guestEmail || 'N/A';
                const customerPhone = o.user?.phone || o.guestPhone || o.address?.phone || 'N/A';

                const itemsSummary = o.items?.map((item: any) =>
                    `${item.name} x ${item.quantity} (${item.size}, ${item.color})`
                ).join('; ') || 'No Items';

                return [
                    o.id || 'N/A',
                    o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A',
                    o.source || 'ONLINE',
                    customerName,
                    customerEmail,
                    customerPhone,
                    o.address?.line1 || 'N/A',
                    o.address?.line2 || '',
                    o.address?.city || 'N/A',
                    o.address?.state || 'N/A',
                    o.address?.pincode || 'N/A',
                    itemsSummary,
                    (o.subtotal || o.total || 0).toFixed(2),
                    (o.shipping || 0).toFixed(2),
                    (o.tax || 0).toFixed(2),
                    (o.total || 0).toFixed(2),
                    o.status || 'N/A',
                    o.paymentStatus || 'N/A',
                    o.trackingNumber || 'N/A'
                ].map(val => {
                    const str = String(val).replace(/"/g, '""');
                    return `"${str}"`;
                }).join(',');
            });

            const csvString = [headers.join(','), ...csvContent].join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `happy-hopz-orders-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Orders exported successfully');
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Failed to export orders');
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === (orders?.length || 0)) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders?.map((o: any) => o.id) || []);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)? This action cannot be undone.`)) {
            bulkDeleteMutation.mutate(selectedOrders);
        }
    };

    // Conditional returns AFTER all hooks
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground font-nunito">Initializing admin session...</p>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" />;
    }

    if (error) {
        console.error('React Query error in AdminOrders:', error);
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-4xl font-fredoka font-bold text-foreground">
                    Order Management
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                    {selectedOrders.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 shadow-lg shadow-destructive/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedOrders.length})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={!orders || orders.length === 0}
                        className="flex items-center gap-2 border-primary/20 hover:border-primary transition-all"
                    >
                        <Download className="w-4 h-4 text-primary" />
                        Export CSV
                    </Button>
                    <div className="flex items-center gap-4 text-muted-foreground bg-muted/50 px-4 py-1 rounded-full">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            <span className="font-nunito font-semibold">{orders?.length || 0} Orders</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-6 mb-8 border-primary/10 shadow-sm">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-primary/20 text-primary focus:ring-primary"
                                checked={(orders?.length || 0) > 0 && selectedOrders.length === orders?.length}
                                onChange={toggleSelectAll}
                            />
                            <span className="text-sm font-medium text-muted-foreground">Select All</span>
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Order ID or Customer Email..."
                                className="pl-10 border-primary/20 focus-visible:ring-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="border-primary/20">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</label>
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="border-primary/20">
                                    <SelectValue placeholder="All Payment Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Payment Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From Date</label>
                            <Input
                                type="date"
                                className="border-primary/20"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To Date</label>
                            <Input
                                type="date"
                                className="border-primary/20"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-muted-foreground font-nunito">Loading orders...</p>
                </div>
            ) : !orders || orders.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="text-xl font-fredoka font-bold mb-2">No orders found</h3>
                    <p className="text-muted-foreground font-nunito">
                        {statusFilter || paymentFilter || searchTerm ? 'Try adjusting your filters' : 'No orders have been placed yet.'}
                    </p>
                    {(statusFilter || paymentFilter || searchTerm) && (
                        <Button
                            variant="link"
                            className="mt-4 text-primary"
                            onClick={() => {
                                setStatusFilter('');
                                setPaymentFilter('');
                                setSearchTerm('');
                                setStartDate('');
                                setEndDate('');
                            }}
                        >
                            Clear all filters
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {orders.filter(Boolean).map((order: any) => (
                        <Card key={order.id} className={`p-6 hover:shadow-float transition-all border-primary/5 ${selectedOrders.includes(order.id) ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-primary/20 text-primary focus:ring-primary"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => toggleSelectOrder(order.id)}
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-gradient-hopz flex items-center justify-center shadow-sm">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-fredoka font-bold">
                                            Order #{order.orderId || String(order.id || 'N/A').slice(0, 8)}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-sm text-muted-foreground font-nunito">
                                                {order.user?.email || order.guestEmail || 'Guest User'}
                                            </p>
                                            <div className="flex gap-1">
                                                {order.emailSent && <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">EMAIL SENT</Badge>}
                                                {order.whatsappSent && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">WA SENT</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 ml-0 md:ml-12 mt-4 md:mt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Amount</p>
                                            <p className="font-nunito font-bold text-lg text-primary flex items-center gap-1">
                                                <IndianRupee className="w-4 h-4" />
                                                {(order.total || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Items</p>
                                            <p className="font-nunito font-bold text-lg">{order.items?.length || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                            <Badge className={`${getStatusColor(order.status)} text-white border-none px-3 py-1`}>
                                                {order.status || 'UNKNOWN'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Payment</p>
                                            <Badge className={`${getPaymentColor(order.paymentStatus)} text-white border-none px-3 py-1`}>
                                                {order.paymentStatus || 'UNKNOWN'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-primary/5 flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground font-nunito">
                                            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="font-bold border-primary/20 text-destructive hover:bg-destructive/5"
                                                onClick={() => handleDelete(order.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                            <Button variant="outline" size="sm" className="font-bold border-primary/20 text-primary hover:bg-primary/5" onClick={() => window.open(`/api/admin/orders/${order.id}/shipping-label`, '_blank')}>
                                                <FileText className="w-4 h-4 mr-2" />
                                                Label
                                            </Button>
                                            <Link to={`/admin/orders/${order.id}`}>
                                                <Button variant="outline" size="sm" className="font-bold border-primary/20 text-primary hover:bg-primary/5">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
