import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, IndianRupee, ArrowLeft } from 'lucide-react';
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
        const colors: Record<string, string> = {
            CONFIRMED: 'bg-blue-600',
            SHIPPED: 'bg-purple-600',
            OUT_FOR_DELIVERY: 'bg-orange-500',
            DELIVERED: 'bg-green-600',
            CANCELLED: 'bg-slate-500',
            REFUNDED: 'bg-slate-900'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            CONFIRMED: 'Confirmed',
            SHIPPED: 'Shipped',
            OUT_FOR_DELIVERY: 'Out for Delivery',
            DELIVERED: 'Delivered',
            CANCELLED: 'Cancelled',
            REFUNDED: 'Refunded'
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
                    <div className="grid grid-cols-1 gap-6">
                        {orders.map((order: {
                            id: string;
                            orderId?: string;
                            status: string;
                            paymentStatus?: string;
                            createdAt?: string | Date;
                            total?: number;
                            items?: Array<{ name: string; quantity: number }>
                        }) => (
                            <Link key={order.id} to={`/orders/${order.id}`}>
                                <Card className="p-8 border-none bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 rounded-[32px] hover:ring-pink-200 transition-all duration-500 group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 opacity-50" />
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                                    Order #{String(order.orderId || order.id || '').slice(-8)}
                                                </h3>
                                                <Badge variant="default" className={`${getStatusColor(order.status)} text-white px-3 py-1 uppercase font-black text-[9px] tracking-widest rounded-full shadow-lg ${order.status === 'CONFIRMED' ? 'shadow-blue-100' : 'shadow-pink-100'} border-none`}>
                                                    {getStatusLabel(order.status)}
                                                </Badge>
                                                {order.paymentStatus === 'PENDING' && (
                                                    <Badge variant="outline" className="uppercase font-black text-[9px] tracking-widest border-orange-100 bg-orange-50 text-orange-600 px-3 py-1 rounded-full">
                                                        Awaiting Payment
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-pink-500" />
                                                    {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-purple-500" />
                                                    {order.items?.length || 0} Products
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className="text-slate-900">Total Charged</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                                                <p className="text-3xl font-fredoka font-black text-slate-900 flex items-center justify-end">
                                                    <IndianRupee className="w-5 h-5 mr-1 text-slate-300" />
                                                    {(order.total || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500 group-hover:border-pink-500">
                                                <ArrowLeft className="w-5 h-5 rotate-180" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Preview */}
                                    <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                        {order.items?.slice(0, 5).map((item: { name: string; quantity: number }, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex-shrink-0 w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 group-hover:border-pink-100 transition-colors"
                                            >
                                                <div className="p-2 text-center">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase truncate w-16 mb-1">{item.name}</p>
                                                    <Badge variant="outline" className="text-[8px] font-black scale-75 border-slate-200 text-slate-500">
                                                        {item.quantity}x
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {(order.items?.length || 0) > 5 && (
                                            <div className="flex-shrink-0 w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white border-2 border-slate-900 shadow-xl shadow-slate-200">
                                                <span className="text-xs font-black">
                                                    +{order.items.length - 5}
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
