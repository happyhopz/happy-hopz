import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ShoppingBag, IndianRupee, TrendingUp, Package, Ticket, MessageSquare, Settings, Activity, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const { user, isAdmin, loading } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await adminAPI.getStats();
            return response.data;
        },
        enabled: isAdmin
    });

    const { data: auditLogs } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: async () => {
            const response = await adminAPI.getAuditLogs();
            return response.data;
        },
        enabled: isAdmin,
        refetchInterval: 10000 // Refresh every 10s for "real-time" feel
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" />;
    }

    return (
        <>
            <h1 className="text-4xl font-fredoka font-bold text-foreground mb-8">
                Admin Dashboard
            </h1>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !stats ? (
                <div className="text-center py-20 text-muted-foreground">
                    Failed to load dashboard statistics. Please try again.
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-fredoka font-bold">{stats?.totalUsers || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-fredoka font-bold">{stats?.totalOrders || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-fredoka font-bold flex items-center gap-1">
                                    <IndianRupee className="w-6 h-6" />
                                    {(stats?.totalRevenue || 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-green-50/50 border-green-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-green-700">Estimated Profit</CardTitle>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-fredoka font-bold text-green-700 flex items-center gap-1">
                                    <IndianRupee className="w-6 h-6" />
                                    {(stats?.totalProfit || 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-fredoka font-bold flex items-center gap-1">
                                    <IndianRupee className="w-6 h-6" />
                                    {(stats?.averageOrderValue || 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Navigation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Link to="/admin/products">
                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-fredoka font-bold text-lg">Products</h3>
                                        <p className="text-sm text-muted-foreground">Manage inventory</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link to="/admin/orders">
                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <ShoppingBag className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-fredoka font-bold text-lg">Orders</h3>
                                        <p className="text-sm text-muted-foreground">View all orders</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link to="/admin/users">
                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-fredoka font-bold text-lg">Users</h3>
                                        <p className="text-sm text-muted-foreground">Manage customers</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link to="/admin/coupons">
                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Ticket className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-fredoka font-bold text-lg">Coupons</h3>
                                        <p className="text-sm text-muted-foreground">Discount codes</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link to="/admin/reviews">
                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-fredoka font-bold text-lg">Reviews</h3>
                                        <p className="text-sm text-muted-foreground">Moderate feedback</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link to="/admin/settings">
                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Settings className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-fredoka font-bold text-lg">Settings</h3>
                                        <p className="text-sm text-muted-foreground">App configuration</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
                        {/* Revenue Trend Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-fredoka">Revenue Trends (Last 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {Array.isArray(stats?.dailyRevenue) && stats.dailyRevenue.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.dailyRevenue}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={(str) => {
                                                        try {
                                                            const date = new Date(str);
                                                            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                                        } catch (e) {
                                                            return 'N/A';
                                                        }
                                                    }}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    tickFormatter={(val) => `₹${val}`}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                                                    labelFormatter={(label) => {
                                                        try {
                                                            return new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                                                        } catch (e) {
                                                            return 'Invalid Date';
                                                        }
                                                    }}
                                                />
                                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            No revenue data for the selected period
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Order Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-fredoka">Order Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.isArray(stats?.ordersByStatus) && stats.ordersByStatus.map((status: any) => (
                                        <div key={status.status} className="flex items-center justify-between">
                                            <Badge variant="outline">{status.status}</Badge>
                                            <div className="flex-1 mx-4 h-2 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${stats.totalOrders > 0 ? (status._count / stats.totalOrders) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <span className="font-bold">{status._count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Selling Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-fredoka flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Top Selling Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.isArray(stats?.topSellingProducts) && stats.topSellingProducts.map((item: any) => (
                                        <div key={item.productId} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-nunito font-bold text-sm truncate">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item._sum.quantity} Sold</p>
                                            </div>
                                            <div className="flex gap-1 h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${stats.topSellingProducts[0]?._sum.quantity > 0 ? (item._sum.quantity / stats.topSellingProducts[0]._sum.quantity) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topSellingProducts || stats.topSellingProducts.length === 0) && (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            No sales data available yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Activity Feed */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 font-fredoka">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Real-time Audit Logs
                                </CardTitle>
                                <Badge variant="secondary" className="animate-pulse">Live</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                                    {auditLogs?.length > 0 ? auditLogs.map((log: any) => (
                                        <div key={log.id} className="flex gap-4 relative">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Activity className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0 border-b border-gray-100 pb-4 last:border-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-sm text-foreground uppercase tracking-tight">
                                                        {log.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(log.createdAt), 'HH:mm • dd MMM')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Target: <span className="font-mono bg-gray-100 px-1 rounded">{log.entity}</span>
                                                    {log.entityId && ` (${log.entityId.slice(0, 8)})`}
                                                </p>
                                                {log.details && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-[10px] font-mono text-muted-foreground border border-gray-100 overflow-x-auto">
                                                        {(() => {
                                                            try {
                                                                const parsed = JSON.parse(log.details);
                                                                return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
                                                            } catch (e) {
                                                                return log.details;
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                            <Activity className="w-12 h-12 mb-2 opacity-10" />
                                            <p>No recent activity logs found</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Low Stock Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-fredoka">
                                    <Package className="w-5 h-5 text-destructive" />
                                    Low Stock Alert
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.isArray(stats?.lowStockProducts) && stats.lowStockProducts.map((product: any) => (
                                        <div key={product.id} className="flex items-center justify-between p-4 bg-red-50/30 border border-red-100 rounded-xl">
                                            <div>
                                                <p className="font-nunito font-bold text-sm">{product.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{product.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-fredoka font-black text-destructive">{product.stock}</p>
                                                <p className="text-[8px] uppercase font-bold text-destructive/60">units</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) && (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            All products in safe stock levels ✅
                                        </div>
                                    )}
                                </div>
                                <Link to="/admin/products">
                                    <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl text-xs h-10 border-2">
                                        Manage Inventory
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Orders */}
                    <Card className="mb-8">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Orders</CardTitle>
                            <Link to="/admin/orders">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                    View All
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.isArray(stats?.recentOrders) && stats.recentOrders.map((order: any) => (
                                    <Link key={order.id} to={`/admin/orders/${order.id}`} className="block">
                                        <div className="flex items-center justify-between p-4 bg-muted hover:bg-muted/80 transition-colors rounded-lg cursor-pointer">
                                            <div>
                                                <p className="font-nunito font-semibold">Order #{String(order.id).slice(0, 8)}</p>
                                                <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-fredoka font-bold text-primary flex items-center justify-end gap-1">
                                                    <IndianRupee className="w-4 h-4" />
                                                    {(order.total || 0).toFixed(2)}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                    <p className="text-sm text-muted-foreground uppercase">{order.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </>
    );
};

export default AdminDashboard;
