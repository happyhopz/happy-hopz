import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const Orders = () => {
    const { user, loading } = useAuth();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await ordersAPI.getAll();
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: !!user
    });

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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <BackButton label="Continue Shopping" to="/products" />

                <h1 className="text-4xl font-fredoka font-bold text-foreground mb-8">
                    My Orders
                </h1>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !user ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Please Login</h2>
                        <p className="text-muted-foreground mb-6">You need to be logged in to view your orders.</p>
                        <Link to="/login">
                            <Button variant="hopz">Login Now</Button>
                        </Link>
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-2xl font-fredoka font-bold mb-2">No orders yet</h2>
                        <p className="text-muted-foreground mb-6">Start shopping to see your orders here!</p>
                        <Link to="/products" className="text-primary hover:underline">
                            Browse Products →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order: any) => (
                            <Link key={order.id} to={`/orders/${order.id}`}>
                                <Card className="p-6 hover:shadow-float transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-fredoka font-bold">
                                                    Order #{String(order.id || '').slice(0, 8)}
                                                </h3>
                                                <Badge className={`${getStatusColor(order.status)} text-white`}>
                                                    {getStatusLabel(order.status)}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {order.paymentStatus === 'PENDING' ? 'Awaiting Payment' : order.paymentStatus}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {order.createdAt ? (() => {
                                                        try {
                                                            return format(new Date(order.createdAt), 'MMM dd, yyyy');
                                                        } catch (e) {
                                                            return 'Invalid Date';
                                                        }
                                                    })() : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4" />
                                                    {order.items?.length || 0} items
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4" />
                                                    {(order.total || 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-fredoka font-bold text-primary flex items-center justify-end gap-1">
                                                <IndianRupee className="w-5 h-5" />
                                                {(order.total || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Preview */}
                                    <div className="mt-4 flex gap-2 overflow-x-auto">
                                        {order.items?.slice(0, 4).map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex-shrink-0 w-16 h-16 bg-gradient-soft rounded-lg flex items-center justify-center"
                                            >
                                                <span className="text-xs font-nunito font-semibold">
                                                    {item.name?.slice(0, 10)}
                                                </span>
                                            </div>
                                        ))}
                                        {(order.items?.length || 0) > 4 && (
                                            <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                                <span className="text-xs font-nunito font-semibold">
                                                    +{order.items.length - 4}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Orders;
