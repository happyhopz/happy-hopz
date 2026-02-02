import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Ticket,
    MessageSquare,
    Settings,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Package, label: 'Products', path: '/admin/products' },
        { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
        { icon: MessageSquare, label: 'Reviews', path: '/admin/reviews' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r h-[calc(100vh-64px)] fixed left-0 hidden lg:block overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            Admin Panel
                        </h2>
                        <nav className="space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${isActive
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'text-muted-foreground hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                                            <span>{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        <Separator className="my-6" />

                        <div className="space-y-1">
                            <div className="px-3 py-2">
                                <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                                <p className="text-sm font-bold truncate">{user?.name || user?.email}</p>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={logout}
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 p-8 min-h-[calc(100vh-64px)]">
                    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
