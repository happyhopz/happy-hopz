import { useNotifications } from '@/contexts/NotificationContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingBag, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

    return (
        <div className="min-h-screen bg-background text-foreground font-nunito">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <BackButton label="Back to Homepage" to="/" />

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-fredoka font-bold">Your Notifications</h1>
                    {notifications.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="border-pink-500 text-pink-500 hover:bg-pink-50"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="p-20 text-center border-dashed border-2 border-muted-foreground/20">
                        <Bell className="w-24 h-24 mx-auto mb-6 text-muted-foreground/30" />
                        <h2 className="text-2xl font-fredoka font-bold text-muted-foreground mb-4">No notifications yet</h2>
                        <p className="text-muted-foreground mb-8">We'll notify you here when your order status changes or when we have exciting updates for you!</p>
                        <Link to="/products">
                            <Button variant="hopz">Start Shopping</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((n) => (
                            <Card
                                key={n.id}
                                className={`p-6 transition-all border-l-4 ${!n.isRead ? 'border-l-pink-500 bg-pink-50/10' : 'border-l-muted-foreground/20'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-pink-100 text-pink-500' : 'bg-muted text-muted-foreground'}`}>
                                        {n.type === 'ORDER_STATUS' ? <ShoppingBag className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`text-xl font-bold font-fredoka ${!n.isRead ? 'text-pink-600' : ''}`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-sm text-muted-foreground font-medium">
                                                {format(new Date(n.createdAt), 'MMMM dd, yyyy • hh:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-lg mb-4">
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            {!n.isRead && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => markAsRead(n.id)}
                                                    className="bg-pink-100 text-pink-600 hover:bg-pink-200 border-none font-bold"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Mark as read
                                                </Button>
                                            )}
                                            {n.orderId && (
                                                <Link to={`/orders/${n.orderId}`}>
                                                    <Button variant="outline" size="sm" className="font-bold">
                                                        Track Order Details
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default NotificationsPage;
