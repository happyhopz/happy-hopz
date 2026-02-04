import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingBag, CheckCircle2, Info, Sparkles, Filter, Ghost } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsPage = () => {
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ORDER'>('ALL');

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'UNREAD') return !n.isRead;
        if (filter === 'ORDER') return n.type === 'ORDER_STATUS';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-[#fafafa] text-foreground font-nunito">
            <Navbar />

            {/* Premium Header Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <BackButton label="Back" to="/" />
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest">Updates</span>
                                <h1 className="text-4xl lg:text-6xl font-black font-fredoka text-gray-900 tracking-tight">Notification Center</h1>
                            </div>
                            <p className="text-gray-500 text-lg max-w-xl">Stay updated on your orders, special promotions, and personal account alerts.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <Button
                                    variant="hopz"
                                    size="lg"
                                    onClick={markAllAsRead}
                                    className="rounded-2xl shadow-xl shadow-pink-200"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Mark All As Read
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar: Filters */}
                    <div className="w-full lg:w-64 shrink-0 space-y-2">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-4 flex items-center gap-2">
                            <Filter className="w-3 h-3" /> Filter By
                        </h3>
                        {[
                            { id: 'ALL', label: 'All Messages', icon: Bell },
                            { id: 'UNREAD', label: 'Unread Only', icon: Sparkles, count: unreadCount },
                            { id: 'ORDER', label: 'Order Status', icon: ShoppingBag }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 font-bold ${filter === item.id ? 'bg-white shadow-xl shadow-gray-200/50 text-pink-600 scale-[1.02]' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </div>
                                {item.count !== undefined && item.count > 0 && (
                                    <span className="w-6 h-6 bg-pink-500 text-white rounded-full text-[10px] flex items-center justify-center border-2 border-white">{item.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Right Content: Notifications List */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-400 font-bold animate-pulse">Loading your updates...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-100 shadow-sm"
                            >
                                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <Ghost className="w-16 h-16 text-gray-200" />
                                </div>
                                <h2 className="text-3xl font-black font-fredoka text-gray-900 mb-4">Nothing to see here... yet!</h2>
                                <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto font-medium">When you place orders or receive site news, they'll appear here styled for your eyes only.</p>
                                <Link to="/products">
                                    <Button variant="hopz" size="lg" className="rounded-2xl px-12">Start Shopping</Button>
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {filteredNotifications.map((n, index) => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className={`relative group p-6 lg:p-8 rounded-[32px] border-none shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 overflow-hidden ${!n.isRead ? 'bg-white border-2 border-pink-100' : 'bg-white opacity-80 hover:opacity-100'}`}>
                                                {/* Status Glow */}
                                                {!n.isRead && <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />}

                                                <div className="flex items-start gap-6 lg:gap-8">
                                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-12 ${!n.isRead ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400'}`}>
                                                        {n.type === 'ORDER_STATUS' ? <ShoppingBag className="w-8 h-8" /> : <Bell className="w-8 h-8" />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className={`text-xl lg:text-2xl font-black font-fredoka tracking-tight truncate ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                    {n.title}
                                                                </h3>
                                                                {!n.isRead && <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />}
                                                            </div>
                                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                                {format(new Date(n.createdAt), 'MMM dd • hh:mm a')}
                                                            </span>
                                                        </div>

                                                        <p className="text-gray-500 text-lg mb-6 font-medium leading-relaxed max-w-2xl">
                                                            {n.message}
                                                        </p>

                                                        <div className="flex flex-wrap items-center gap-4">
                                                            {!n.isRead && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => markAsRead(n.id)}
                                                                    className="h-10 px-6 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 font-black text-xs uppercase tracking-widest transition-colors"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                    Mark As Read
                                                                </Button>
                                                            )}
                                                            {n.orderId && (
                                                                <Link to={`/orders/${n.orderId}`}>
                                                                    <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl border-2 border-gray-100 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 font-black text-xs uppercase tracking-widest transition-all">
                                                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                                                        Track Order Details
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                            <div className="flex-1" />
                                                            {/* Secondary Info Icon */}
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Info className="w-5 h-5 text-gray-300" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NotificationsPage;
