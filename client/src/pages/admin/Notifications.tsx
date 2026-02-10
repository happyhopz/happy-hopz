import { useState, useEffect } from 'react';
import { Bell, ShoppingBag, ShieldAlert, Settings, CheckCheck, Trash2, Calendar, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsAPI } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        unread: 0,
        orders: 0,
        security: 0,
        system: 0,
        queries: 0
    });

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await notificationsAPI.getAdmin();
            const data = response.data;
            setNotifications(data);

            // Calculate stats
            setStats({
                unread: data.filter((n: any) => !n.isRead).length,
                orders: data.filter((n: any) => n.type === 'ORDER' || n.type === 'ORDER_STATUS').length,
                security: data.filter((n: any) => n.type === 'SECURITY').length,
                system: data.filter((n: any) => n.type === 'SYSTEM').length,
                queries: data.filter((n: any) => n.type === 'QUERY').length
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead('admin');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setStats(prev => ({ ...prev, unread: 0 }));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ORDER':
            case 'ORDER_STATUS':
                return <ShoppingBag className="w-5 h-5 text-blue-500" />;
            case 'SECURITY':
                return <ShieldAlert className="w-5 h-5 text-orange-500" />;
            case 'SYSTEM':
                return <Settings className="w-5 h-5 text-purple-500" />;
            case 'QUERY':
                return <MessageSquare className="w-5 h-5 text-green-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    const NotificationCard = ({ notification }: { notification: any }) => {
        const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

        return (
            <Card className={`mb-4 transition-all hover:shadow-md border-l-4 ${!notification.isRead ? 'border-l-primary bg-primary/5' : 'border-l-transparent'}`}>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${!notification.isRead ? 'bg-white' : 'bg-muted'}`}>
                            {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-lg font-bold truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                    </h3>
                                    {!notification.isRead && (
                                        <Badge variant={"hopz" as any} className="h-5 text-[10px]">NEW</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                </div>
                            </div>

                            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
                                {notification.message}
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                {metadata.orderId && (
                                    <Button asChild size="sm" variant="outline" className="h-8 rounded-lg gap-2 text-xs font-bold">
                                        <Link to={`/admin/orders/${metadata.orderId}`}>
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            Manage Order
                                        </Link>
                                    </Button>
                                )}

                                {metadata.userId && (
                                    <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg gap-2 text-xs font-bold bg-muted/50">
                                        <Link to={`/admin/users?id=${metadata.userId}`}>
                                            <User className="w-3.5 h-3.5" />
                                            View User
                                        </Link>
                                    </Button>
                                )}

                                {!notification.isRead && (
                                    <Button
                                        onClick={() => markAsRead(notification.id)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 rounded-lg gap-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 ml-auto"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark as read
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const EmptyState = ({ type }: { type: string }) => (
        <Card className="border-dashed border-2 py-20 bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center text-center">
                <Bell className="w-16 h-16 text-muted-foreground/20 mb-6" />
                <h3 className="text-xl font-fredoka font-bold text-muted-foreground mb-2">
                    No {type.toLowerCase()} alerts
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    You're all caught up! When new events occur, they will appear here.
                </p>
                <Button variant="outline" className="mt-8 rounded-xl" onClick={fetchNotifications}>
                    Refresh feed
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-fredoka font-black text-foreground tracking-tight mb-2">
                        Activity Log & Notifications
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Monitor system-wide events, security alerts, and order status changes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={"hopz" as any}
                        onClick={markAllRead}
                        disabled={stats.unread === 0}
                        className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-bold"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Clear All Unread
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/50 backdrop-blur-sm border-primary/10 transition-transform hover:scale-[1.02]">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Unread</CardTitle>
                        <Badge variant={"hopz" as any} className="h-5">{stats.unread}</Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-black text-primary">{Math.round((stats.unread / Math.max(1, notifications.length)) * 100)}%</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Pending Review</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-blue-100 transition-transform hover:scale-[1.02]">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Orders</CardTitle>
                        <ShoppingBag className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-black text-blue-600">{stats.orders}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Order Alerts</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-orange-100 transition-transform hover:scale-[1.02]">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Security</CardTitle>
                        <ShieldAlert className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-black text-orange-600">{stats.security}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Access Logs</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-purple-100 transition-transform hover:scale-[1.02]">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">System</CardTitle>
                        <Settings className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-black text-purple-600">{stats.system}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Infrastructure</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-green-100 transition-transform hover:scale-[1.02]">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Queries</CardTitle>
                        <MessageSquare className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-black text-green-600">{stats.queries}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Customer Inquiries</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="ALL" className="w-full">
                <TabsList className="bg-white border p-1 rounded-2xl h-14 w-full sm:w-auto shadow-sm gap-2">
                    <TabsTrigger value="ALL" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                        All <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px]">{notifications.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="ORDER" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                        Orders <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px]">{stats.orders}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="SECURITY" className="rounded-xl px-8 h-full data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                        Security <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px]">{stats.security}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="SYSTEM" className="rounded-xl px-8 h-full data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                        System <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px]">{stats.system}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="QUERY" className="rounded-xl px-8 h-full data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                        Queries <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px]">{stats.queries}</Badge>
                    </TabsTrigger>
                </TabsList>

                {['ALL', 'ORDER', 'SECURITY', 'SYSTEM', 'QUERY'].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-sm font-medium text-muted-foreground">Fetching alerts...</p>
                            </div>
                        ) : (() => {
                            const filtered = tab === 'ALL'
                                ? notifications
                                : notifications.filter(n => n.type === tab || (tab === 'ORDER' && n.type === 'ORDER_STATUS'));

                            return filtered.length > 0 ? (
                                <div className="grid grid-cols-1 gap-1">
                                    {filtered.map(n => <NotificationCard key={n.id} notification={n} />)}
                                </div>
                            ) : (
                                <EmptyState type={tab} />
                            );
                        })()}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
