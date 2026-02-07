import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Package, Clock, CheckCircle, XCircle, RotateCcw,
    Search, Filter, TrendingUp, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.happyhopz.com/api';

interface ReturnRequest {
    id: string;
    orderId: string;
    type: string;
    status: string;
    itemsTotal: number;
    pickupCharge: number;
    refundAmount: number | null;
    createdAt: string;
    user: {
        email: string;
        name: string | null;
        phone: string | null;
    };
    items: Array<{
        productName: string;
        quantity: number;
    }>;
}

interface Stats {
    totalReturns: number;
    pendingReturns: number;
    approvedReturns: number;
    completedReturns: number;
    rejectedReturns: number;
    totalRefundAmount: number;
}

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

export default function AdminReturns() {
    const navigate = useNavigate();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchReturns();
        fetchStats();
    }, [filter, search]);

    const fetchReturns = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filter !== 'ALL') params.append('status', filter);
            if (search) params.append('search', search);

            const response = await axios.get(
                `${API_URL}/admin/returns?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReturns(response.data.returnRequests);
        } catch (error: any) {
            console.error('Fetch returns error:', error);
            toast.error('Failed to load returns');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/returns/stats/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error: any) {
            console.error('Fetch stats error:', error);
        }
    };

    const handleQuickAction = async (returnId: string, action: 'approve' | 'reject') => {
        const confirmMsg = action === 'approve'
            ? 'Approve this return request?'
            : 'Reject this return request?';

        if (!confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('token');
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const payload = action === 'reject' ? { reason: 'Admin rejected' } : {};

            await axios.patch(
                `${API_URL}/admin/returns/${returnId}/${endpoint}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Return request ${action}d successfully`);
            fetchReturns();
            fetchStats();
        } catch (error: any) {
            console.error(`${action} error:`, error);
            toast.error(error.response?.data?.error || `Failed to ${action} return`);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-fredoka font-bold mb-2">Returns Management</h1>
                <p className="text-muted-foreground">Manage return and exchange requests</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{stats.pendingReturns}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold">{stats.approvedReturns}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-blue-500" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">{stats.completedReturns}</p>
                            </div>
                            <Package className="w-8 h-8 text-green-500" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Refunds</p>
                                <p className="text-2xl font-bold">₹{stats.totalRefundAmount}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-primary" />
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters & Search */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by order ID, customer email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((status) => (
                            <Button
                                key={status}
                                variant={filter === status ? 'default' : 'outline'}
                                onClick={() => setFilter(status)}
                                size="sm"
                            >
                                {status === 'ALL' ? 'All' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Returns List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : returns.length === 0 ? (
                <Card className="p-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Returns Found</h3>
                    <p className="text-muted-foreground">No return requests match your filters</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {returns.map((returnReq) => {
                        const StatusIcon = STATUS_CONFIG[returnReq.status as keyof typeof STATUS_CONFIG].icon;
                        return (
                            <Card key={returnReq.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold">
                                                {returnReq.type === 'RETURN' ? <RotateCcw className="w-5 h-5 inline mr-2" /> : <Package className="w-5 h-5 inline mr-2" />}
                                                {returnReq.type}
                                            </h3>
                                            <Badge className={STATUS_CONFIG[returnReq.status as keyof typeof STATUS_CONFIG].color}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {STATUS_CONFIG[returnReq.status as keyof typeof STATUS_CONFIG].label}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>Order: #{returnReq.orderId.slice(0, 8)}</p>
                                            <p>Customer: {returnReq.user.name || returnReq.user.email}</p>
                                            <p>Items: {returnReq.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}</p>
                                            <p>Created: {new Date(returnReq.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        {returnReq.type === 'RETURN' && (
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">Refund Amount</div>
                                                <div className="text-2xl font-bold text-primary">₹{returnReq.refundAmount}</div>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/admin/returns/${returnReq.id}`)}
                                            >
                                                View Details
                                            </Button>
                                            {returnReq.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleQuickAction(returnReq.id, 'approve')}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleQuickAction(returnReq.id, 'reject')}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
