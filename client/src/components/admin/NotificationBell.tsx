import { useState, useRef, useEffect } from 'react';
import { Bell, ShoppingBag, ShieldAlert, Settings, CheckCheck, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsAPI } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';

export const AdminNotificationBell = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await notificationsAPI.getAdmin();
            setNotifications(response.data);
            setUnreadCount(response.data.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch admin notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead('admin');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ORDER':
            case 'ORDER_STATUS':
                return <ShoppingBag className="w-4 h-4 text-blue-500" />;
            case 'SECURITY':
                return <ShieldAlert className="w-4 h-4 text-orange-500" />;
            case 'SYSTEM':
                return <Settings className="w-4 h-4 text-purple-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-400" />;
        }
    };

    const NotificationItem = ({ notification }: { notification: any }) => {
        const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

        return (
            <div
                className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative ${!notification.isRead ? 'bg-primary/5' : ''}`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
                {!notification.isRead && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
                <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-muted'}`}>
                        {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm font-bold truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                        </p>

                        {metadata.orderId && (
                            <Link
                                to={`/admin/orders/${metadata.orderId}`}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center text-[10px] font-bold text-primary hover:underline gap-1"
                            >
                                View Order <ShoppingBag className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const FilteredList = ({ type }: { type: 'ALL' | 'ORDER' | 'SECURITY' | 'SYSTEM' }) => {
        const filtered = type === 'ALL'
            ? notifications
            : notifications.filter(n => n.type === type || (type === 'ORDER' && n.type === 'ORDER_STATUS'));

        if (isLoading && notifications.length === 0) {
            return (
                <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading...</p>
                </div>
            );
        }

        if (filtered.length === 0) {
            return (
                <div className="p-12 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-10" />
                    <p className="text-sm font-fredoka font-medium">No {type.toLowerCase()} notifications</p>
                </div>
            );
        }

        return (
            <ScrollArea className="h-[400px]">
                {filtered.map(n => <NotificationItem key={n.id} notification={n} />)}
            </ScrollArea>
        );
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all group"
                >
                    <Bell className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg ring-2 ring-background animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 mr-4 mt-2 overflow-hidden rounded-2xl shadow-2xl border-primary/10" align="end">
                <div className="bg-primary p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-fredoka font-bold text-lg tracking-tight">Admin Alerts</h3>
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] h-5">
                                    {unreadCount} New
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                            className="text-white hover:bg-white/10 text-[10px] font-bold h-7 px-2 border border-white/20 rounded-lg"
                        >
                            <CheckCheck className="w-3 h-3 mr-1" /> Mark All Read
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="ALL" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b h-11 bg-muted/30 px-2 gap-2">
                        <TabsTrigger value="ALL" className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">All</TabsTrigger>
                        <TabsTrigger value="ORDER" className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Orders</TabsTrigger>
                        <TabsTrigger value="SECURITY" className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Security</TabsTrigger>
                        <TabsTrigger value="SYSTEM" className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">System</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ALL" className="m-0"><FilteredList type="ALL" /></TabsContent>
                    <TabsContent value="ORDER" className="m-0"><FilteredList type="ORDER" /></TabsContent>
                    <TabsContent value="SECURITY" className="m-0"><FilteredList type="SECURITY" /></TabsContent>
                    <TabsContent value="SYSTEM" className="m-0"><FilteredList type="SYSTEM" /></TabsContent>
                </Tabs>

                <div className="p-3 bg-muted/30 border-t flex justify-center">
                    <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                        View All Activity Log
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
};
