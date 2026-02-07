import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.happyhopz.com/api';

interface ReturnItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    size: string;
    color: string;
    reason: string;
}

interface ReturnRequest {
    id: string;
    orderId: string;
    type: string;
    status: string;
    reason: string;
    itemsTotal: number;
    pickupCharge: number;
    refundAmount: number | null;
    createdAt: string;
    items: ReturnItem[];
    order: {
        id: string;
        total: number;
        createdAt: string;
    };
}

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

export default function MyReturns() {
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/returns/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReturns(response.data);
        } catch (error: any) {
            console.error('Fetch returns error:', error);
            toast.error('Failed to load return requests');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (returnId: string) => {
        if (!confirm('Are you sure you want to cancel this return request?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API_URL}/returns/${returnId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Return request cancelled');
            fetchReturns();
        } catch (error: any) {
            console.error('Cancel return error:', error);
            toast.error(error.response?.data?.error || 'Failed to cancel return request');
        }
    };

    const filteredReturns = filter === 'ALL'
        ? returns
        : returns.filter(r => r.status === filter);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-4 pb-12">
                {/* Back Button */}
                <div className="container mx-auto px-4 mb-4">
                    <BackButton />
                </div>

                {/* Header */}
                <section className="bg-gradient-to-br from-pink-50 via-cyan-50 to-purple-50 py-10 mb-8">
                    <div className="container mx-auto px-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <RotateCcw className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            My <span className="text-primary">Returns</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto">
                            Track and manage your return and exchange requests
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((status) => (
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

                    {/* Returns List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading returns...</p>
                        </div>
                    ) : filteredReturns.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-fredoka font-bold mb-2">No Returns Found</h3>
                            <p className="text-muted-foreground mb-6">
                                {filter === 'ALL'
                                    ? "You haven't made any return requests yet"
                                    : `No ${filter.toLowerCase()} returns found`
                                }
                            </p>
                            <Link to="/orders">
                                <Button>View Orders</Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredReturns.map((returnReq) => {
                                const StatusIcon = STATUS_CONFIG[returnReq.status as keyof typeof STATUS_CONFIG].icon;
                                return (
                                    <Card key={returnReq.id} className="p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-fredoka font-bold">
                                                        {returnReq.type === 'RETURN' ? 'Return' : 'Exchange'} Request
                                                    </h3>
                                                    <Badge className={STATUS_CONFIG[returnReq.status as keyof typeof STATUS_CONFIG].color}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {STATUS_CONFIG[returnReq.status as keyof typeof STATUS_CONFIG].label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Order #{returnReq.orderId.slice(0, 8)} •
                                                    Created {new Date(returnReq.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {returnReq.type === 'RETURN' && (
                                                    <div className="text-2xl font-bold text-primary">
                                                        ₹{returnReq.refundAmount}
                                                    </div>
                                                )}
                                                {returnReq.type === 'EXCHANGE' && (
                                                    <div className="text-sm font-semibold text-green-600">
                                                        Free Delivery
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="border-t pt-4 mb-4">
                                            <h4 className="font-semibold mb-2 text-sm">Items:</h4>
                                            <div className="space-y-2">
                                                {returnReq.items.map((item) => (
                                                    <div key={item.id} className="flex justify-between text-sm">
                                                        <span>{item.productName} ({item.size}, {item.color}) x{item.quantity}</span>
                                                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pricing Breakdown */}
                                        {returnReq.type === 'RETURN' && (
                                            <div className="border-t pt-4 mb-4 text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Items Total:</span>
                                                    <span>₹{returnReq.itemsTotal}</span>
                                                </div>
                                                <div className="flex justify-between text-red-600">
                                                    <span>Pickup Charge:</span>
                                                    <span>- ₹{returnReq.pickupCharge}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-base border-t pt-1">
                                                    <span>Refund Amount:</span>
                                                    <span className="text-primary">₹{returnReq.refundAmount}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4 border-t">
                                            <Link to={`/returns/${returnReq.id}`} className="flex-1">
                                                <Button variant="outline" className="w-full">
                                                    View Details
                                                </Button>
                                            </Link>
                                            {returnReq.status === 'PENDING' && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleCancel(returnReq.id)}
                                                    className="flex-1"
                                                >
                                                    Cancel Request
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
