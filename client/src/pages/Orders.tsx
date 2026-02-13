import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await ordersAPI.getMyOrders();
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: !!user
    });

    const getStatusStyles = (status: string) => {
        const styles: Record<string, { bg: string; text: string; shadow: string }> = {
            CONFIRMED: { bg: 'bg-blue-600', text: 'text-blue-600', shadow: 'shadow-blue-100' },
            SHIPPED: { bg: 'bg-indigo-600', text: 'text-indigo-600', shadow: 'shadow-indigo-100' },
            OUT_FOR_DELIVERY: { bg: 'bg-orange-500', text: 'text-orange-500', shadow: 'shadow-orange-100' },
            DELIVERED: { bg: 'bg-green-600', text: 'text-green-600', shadow: 'shadow-green-100' },
            CANCELLED: { bg: 'bg-slate-500', text: 'text-slate-500', shadow: 'shadow-slate-100' },
            REFUNDED: { bg: 'bg-slate-900', text: 'text-slate-900', shadow: 'shadow-slate-200' }
        };
        return styles[status] || { bg: 'bg-gray-500', text: 'text-gray-500', shadow: 'shadow-gray-100' };
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

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-xl font-fredoka font-bold text-slate-400 animate-pulse">Syncing your order history...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <BackButton label="Back to Shop" to="/products" className="mb-4" />
                        <h1 className="text-5xl font-fredoka font-black text-slate-900 tracking-tight">
                            My Orders
                        </h1>
                        <p className="text-slate-400 font-medium mt-2">Track, manage and view your purchase history</p>
                    </div>

                    {!orders || orders.length === 0 ? null : (
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                            <Package className="w-5 h-5 text-pink-500" />
                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                {orders.length} TOTAL ORDERS
                            </span>
                        </div>
                    )}
                </div>

                {!user ? (
                    <Card className="p-12 text-center bg-white shadow-xl shadow-slate-200/50 rounded-[40px] border-none ring-1 ring-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full -mr-32 -mt-32 opacity-50" />
                        <Package className="w-20 h-20 mx-auto text-slate-300 mb-6 relative z-10" />
                        <h2 className="text-3xl font-fredoka font-black text-slate-900 mb-4 relative z-10">Authentication Required</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto relative z-10">Please login to access your secure order data and tracking information.</p>
                        <Link to="/login">
                            <Button variant="hopz" className="h-14 px-10 text-lg rounded-2xl relative z-10">Login Now</Button>
                        </Link>
                    </Card>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : !orders || orders.length === 0 ? (
                    <Card className="p-16 text-center bg-white shadow-xl shadow-slate-200/50 rounded-[40px] border-none ring-1 ring-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full -mr-32 -mt-32 opacity-50" />
                        <Package className="w-24 h-24 mx-auto mb-8 text-slate-200 relative z-10" />
                        <h3 className="text-4xl font-fredoka font-black text-slate-900 mb-4 relative z-10">No Orders Found</h3>
                        <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto relative z-10">Looks like you haven't started your Happy Hopz journey yet!</p>
                        <Link to="/products">
                            <Button variant="hopz" className="h-16 px-12 text-xl rounded-[24px] relative z-10 shadow-float">
                                Start Shopping
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {orders.map((order: any) => {
                            const styles = getStatusStyles(order.status);
                            const firstItem = order.items?.[0];

                            // Parse images safely
                            let images: string[] = [];
                            try {
                                if (firstItem?.product?.images) {
                                    images = typeof firstItem.product.images === 'string'
                                        ? JSON.parse(firstItem.product.images)
                                        : firstItem.product.images;
                                }
                            } catch (e) {
                                console.error('Failed to parse images', e);
                            }
                            const firstImage = Array.isArray(images) ? images[0] : null;

                            // Calculate Total Savings
                            const itemsSavings = order.items?.reduce((acc: number, item: any) => {
                                const mrp = item.product?.price || item.price;
                                const paid = item.price;
                                return acc + (mrp - paid) * item.quantity;
                            }, 0) || 0;
                            const totalSavings = itemsSavings + (order.couponDiscount || 0);

                            return (
                                <Link key={order.id} to={`/orders/${order.id}`}>
                                    <Card className="group bg-white p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-pink-100/50 ring-1 ring-slate-100 transition-all duration-500 rounded-[32px] relative">
                                        {/* Status Accent Bar */}
                                        <div className={`absolute top-0 left-0 bottom-0 w-2 ${styles.bg}`} />

                                        <div className="flex flex-col lg:flex-row p-6 md:p-8 gap-8 items-start lg:items-center">
                                            {/* Product Image Section */}
                                            <div className="relative w-full lg:w-48 h-48 lg:h-32 flex-shrink-0 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group-hover:scale-[1.02] transition-transform duration-500 shadow-inner">
                                                {firstImage ? (
                                                    <img
                                                        src={firstImage}
                                                        alt={order.orderId}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                )}

                                                {/* Item Count Overlay */}
                                                {(order.items?.length > 1) && (
                                                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white px-2 py-1 rounded-lg font-black text-[10px] tracking-tight border border-white/20">
                                                        +{order.items.length - 1} MORE
                                                    </div>
                                                )}
                                            </div>

                                            {/* Order Details */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                                        Order #{String(order.orderId || order.id || '').slice(-8)}
                                                    </h3>
                                                    <Badge
                                                        className={`${styles.bg} text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[2px] shadow-lg border-none ${styles.shadow}`}
                                                    >
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                    {order.paymentStatus === 'PENDING' && (
                                                        <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full tracking-widest border border-orange-100">
                                                            Awaiting Payment
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Placed On</p>
                                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                                            <Calendar className="w-4 h-4 text-pink-500" />
                                                            {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Summary</p>
                                                        <div className="flex items-center gap-2 font-bold text-slate-700 truncate max-w-[200px]">
                                                            <Package className="w-4 h-4 text-purple-500" />
                                                            {order.items?.length || 0} Products
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Savings</p>
                                                        <div className="text-green-600 font-bold flex items-center gap-1">
                                                            <IndianRupee className="w-3 h-3" />
                                                            {totalSavings > 0 ? totalSavings.toFixed(2) : 'Enjoyed Happy Prices!'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price & Action */}
                                            <div className="w-full lg:w-auto flex items-center justify-between lg:flex-col lg:items-end lg:justify-center border-t lg:border-t-0 border-slate-50 pt-6 lg:pt-0 lg:pl-10">
                                                <div className="lg:text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                                                    <p className="text-3xl font-fredoka font-black text-slate-900 flex items-center lg:justify-end">
                                                        <IndianRupee className="w-5 h-5 mr-1 text-slate-300" />
                                                        {(order.total || 0).toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="lg:mt-6 w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-gradient-to-tr group-hover:from-pink-500 group-hover:to-pink-600 group-hover:text-white transition-all duration-500 group-hover:border-pink-400 shadow-sm group-hover:shadow-xl group-hover:shadow-pink-200 group-hover:rotate-12">
                                                    <ArrowLeft className="w-6 h-6 rotate-180 transition-transform group-hover:scale-110" />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Orders;
