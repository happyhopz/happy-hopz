import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ShoppingBag, IndianRupee, TrendingUp, Package, Ticket, MessageSquare, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Revenue Trend Chart */}
                        <Card className="lg:col-span-2">
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
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Top Selling Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-fredoka">Top Selling Products</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.isArray(stats?.topSellingProducts) && stats.topSellingProducts.map((item: any, index: number) => (
                                        <div key={item.productId} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground font-bold">#{index + 1}</span>
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <Badge variant="secondary">
                                                {item._sum.quantity} Sold
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Low Stock Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Low Stock Alert
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.isArray(stats?.lowStockProducts) && stats.lowStockProducts.map((product: any) => (
                                        <div key={product.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                            <div>
                                                <p className="font-nunito font-semibold">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">{product.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-fredoka font-bold text-destructive">{product.stock} left</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
