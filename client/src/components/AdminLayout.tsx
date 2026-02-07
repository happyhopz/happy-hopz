import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import {
    LayoutDashboard, ShoppingBag, Users, Ticket, MessageSquare,
    Settings, LogOut, Search, X, Loader2, Star, Layout, Package, ChevronRight, Zap, IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const { user, loading, logout } = useAuth();

    // Global Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const response = await adminAPI.search(searchQuery);
                    setSearchResults(response.data);
                    setShowResults(true);
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Package, label: 'Products', path: '/admin/products' },
        { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
        { icon: Star, label: 'Reviews', path: '/admin/reviews' },
        { icon: Zap, label: 'Marketing', path: '/admin/marketing' },
        { icon: MessageSquare, label: 'Support Requests', path: '/admin/contacts' },
        { icon: Layout, label: 'Store Content', path: '/admin/cms' },
        { icon: IndianRupee, label: 'Pricing & Tax', path: '/admin/settings', adminOnly: true },
        { icon: Settings, label: 'Settings', path: '/admin/settings', adminOnly: true },
    ];

    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || user?.role === 'ADMIN');

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border">
                    <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">You do not have permission to view the admin panel.</p>
                    <Link to="/login">
                        <Button variant="default">Login as Admin</Button>
                    </Link>
                </div>
            </div>
        );
    }

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
                            {filteredMenuItems.map((item) => {
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

                        {/* Global Admin Search */}
                        <div className="mb-8 relative" ref={searchRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    className="pl-10 h-12 rounded-xl border-2 border-gray-100 bg-white shadow-sm focus:border-primary transition-all text-base"
                                    placeholder="Deep search: find anything (Products, Orders, Users)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
                                )}
                            </div>

                            {/* Results Dropdown */}
                            {showResults && searchResults && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[600px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                    {/* Products */}
                                    {searchResults.products?.length > 0 && (
                                        <div className="p-2">
                                            <h3 className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Products</h3>
                                            <div className="space-y-1">
                                                {searchResults.products.map((p: any) => (
                                                    <Link key={p.id} to="/admin/products" onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-xl transition-colors group">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                            {p.images?.[0] ? <img src={p.images[0]} className="w-8 h-8 object-contain" /> : <Package className="w-5 h-5 text-gray-400" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate group-hover:text-primary">{p.name}</p>
                                                            <p className="text-xs text-muted-foreground">₹{p.price} • {p.stock} in stock</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Orders */}
                                    {searchResults.orders?.length > 0 && (
                                        <div className="p-2 border-t">
                                            <h3 className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Orders</h3>
                                            <div className="space-y-1">
                                                {searchResults.orders.map((o: any) => (
                                                    <Link key={o.id} to={`/admin/orders/${o.id}`} onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-xl transition-colors group">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                                                            <ShoppingBag className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate group-hover:text-primary">Order #{o.id.slice(0, 8)}</p>
                                                            <p className="text-xs text-muted-foreground">{o.user?.email} • {o.status}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Users */}
                                    {searchResults.users?.length > 0 && (
                                        <div className="p-2 border-t">
                                            <h3 className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Users</h3>
                                            <div className="space-y-1">
                                                {searchResults.users.map((u: any) => (
                                                    <Link key={u.id} to="/admin/users" onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-xl transition-colors group">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                                            <Users className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate group-hover:text-primary">{u.name || 'No Name'}</p>
                                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                                        </div>
                                                    </Link>))}
                                            </div>
                                        </div>
                                    )}

                                    {searchResults.products?.length === 0 && searchResults.orders?.length === 0 && searchResults.users?.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <p>No results found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
