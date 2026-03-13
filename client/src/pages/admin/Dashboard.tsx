import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ShoppingBag, IndianRupee, TrendingUp, Package, Ticket, MessageSquare, Settings, Activity, Clock, Eye, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const { user, isAdmin, loading } = useAuth();

    const { data: stats, isLoading, error: statsError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await adminAPI.getStats();
            return response.data;
        },
        enabled: isAdmin && !loading,
        retry: 1,
        refetchInterval: 30000,
        refetchOnWindowFocus: true
    });

    const { data: auditLogs } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: async () => {
            const response = await adminAPI.getAuditLogs();
            return response.data;
        },
        enabled: isAdmin && !loading,
        refetchInterval: 10000
    });

    const { data: visitorStats } = useQuery({
        queryKey: ['admin-visitor-stats'],
        queryFn: async () => {
            const response = await adminAPI.getVisitorStats();
            return response.data;
        },
        enabled: isAdmin && !loading,
        refetchInterval: 30000
    });
    // Debug logging
    console.log('[Dashboard] Auth State:', { user, isAdmin, loading });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading authentication...</p>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl">
                    <h2 className="text-xl font-bold text-yellow-700 mb-4">Access Denied</h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
                        <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
                        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                        <p className="text-yellow-600 mt-4">
                            {!user ? 'You need to sign in first.' : 'You need admin privileges to access this page.'}
                        </p>
                    </div>
                    <div className="mt-4 space-x-2">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                            Go Home
                        </button>
                        {!user && (
                            <button
                                onClick={() => window.location.href = '/signin'}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
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
            ) : statsError ? (
                <div className="text-center py-20">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold text-red-700 mb-2">Dashboard Error</h2>
                        <p className="text-red-600 mb-4">
                            {statsError instanceof Error ? statsError.message : 'Failed to load dashboard statistics'}
                        </p>
                        <details className="text-left">
                            <summary className="cursor-pointer text-sm text-red-500 hover:text-red-700">Technical Details</summary>
                            <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto">
                                {JSON.stringify(statsError, null, 2)}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            ) : !stats ? (
                <div className="text-center py-20 text-muted-foreground">
                    No data available. Please try again.
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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

                        <Card className="bg-blue-50/50 border-blue-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700">Total Investment</CardTitle>
                                <Package className="w-4 h-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-fredoka font-bold text-blue-700 flex items-center gap-1">
                                    <IndianRupee className="w-6 h-6" />
                                    {(stats?.totalInvestment || 0).toFixed(2)}
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

                    {/* Visitor Analytics Widget */}
                    <Card className="mb-8 border-2 border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="font-fredoka flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-500" />
                                Visitor Analytics
                                <Badge variant="secondary" className="text-xs animate-pulse ml-1">Live</Badge>
                            </CardTitle>
                            <a
                                href="https://analytics.google.com/analytics/web/#/p458399513/reports/intelligenthome"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm" className="text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                                    <ExternalLink className="w-3 h-3" />
                                    Full GA4 Analytics
                                </Button>
                            </a>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Today</p>
                                    <p className="text-3xl font-fredoka font-bold text-blue-800">{visitorStats?.todayVisitors ?? '—'}</p>
                                    <p className="text-[10px] text-blue-500 mt-0.5">unique visitors</p>
                                    <p className="text-[10px] text-blue-400 font-semibold">{visitorStats?.todayViews ?? '—'} page views</p>
                                </div>
                                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">7 Days</p>
                                    <p className="text-3xl font-fredoka font-bold text-indigo-800">{visitorStats?.weekVisitors ?? '—'}</p>
                                    <p className="text-[10px] text-indigo-500 mt-0.5">unique visitors</p>
                                    <p className="text-[10px] text-indigo-400 font-semibold">{visitorStats?.weekViews ?? '—'} page views</p>
                                </div>
                                <div className="p-4 bg-violet-50/60 border border-violet-100 rounded-xl text-center">
                                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">30 Days</p>
                                    <p className="text-3xl font-fredoka font-bold text-violet-800">{visitorStats?.monthVisitors ?? '—'}</p>
                                    <p className="text-[10px] text-violet-500 mt-0.5">unique visitors</p>
                                    <p className="text-[10px] text-violet-400 font-semibold">{visitorStats?.monthViews ?? '—'} page views</p>
                                </div>
                                <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">All Time</p>
                                    <p className="text-3xl font-fredoka font-bold text-purple-800">{visitorStats?.totalVisitors ?? '—'}</p>
                                    <p className="text-[10px] text-purple-500 mt-0.5">unique visitors</p>
                                    <p className="text-[10px] text-purple-400 font-semibold">{visitorStats?.totalViews ?? '—'} page views</p>
                                </div>
                            </div>
                            <div className="h-[220px] w-full">
                                {Array.isArray(visitorStats?.dailyVisitors) && visitorStats.dailyVisitors.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={visitorStats.dailyVisitors}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => {
                                                    try { return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
                                                    catch { return str; }
                                                }}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                            <Tooltip
                                                formatter={(value, name) => [`${value}`, name === 'visitors' ? 'Unique Visitors' : 'Page Views']}
                                                labelFormatter={(label) => {
                                                    try { return new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
                                                    catch { return label; }
                                                }}
                                            />
                                            <Bar dataKey="visitors" fill="#6366f1" radius={[4, 4, 0, 0]} name="visitors" />
                                            <Bar dataKey="views" fill="#c7d2fe" radius={[4, 4, 0, 0]} name="views" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                        No visitor data yet — data will appear as visitors browse the site
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>

                    {/* Cost Breakdown Section */}
                    {stats?.totalRevenue > 0 && (
                        <Card className="mb-8 border-2 border-primary/20">
                            <CardHeader>
                                <CardTitle className="font-fredoka flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Profit Analysis (Delivered Orders Only)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                    {/* Gross Revenue */}
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                        <p className="text-sm text-blue-700 font-semibold mb-1">Gross Revenue</p>
                                        <p className="text-2xl font-fredoka font-bold text-blue-900 flex items-center gap-1">
                                            <IndianRupee className="w-5 h-5" />
                                            {(stats?.totalRevenue || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Total Costs */}
                                    <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg">
                                        <p className="text-sm text-red-700 font-semibold mb-1">Total Costs</p>
                                        <p className="text-2xl font-fredoka font-bold text-red-900 flex items-center gap-1">
                                            <IndianRupee className="w-5 h-5" />
                                            {(stats?.totalCosts || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Net Profit */}
                                    <div className="p-4 bg-green-50/50 border border-green-100 rounded-lg">
                                        <p className="text-sm text-green-700 font-semibold mb-1">Net Profit</p>
                                        <p className="text-2xl font-fredoka font-bold text-green-900 flex items-center gap-1">
                                            <IndianRupee className="w-5 h-5" />
                                            {(stats?.totalProfit || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Profit Margin */}
                                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg">
                                        <p className="text-sm text-purple-700 font-semibold mb-1">Profit Margin</p>
                                        <p className="text-2xl font-fredoka font-bold text-purple-900">
                                            {stats?.profitMargin || 0}%
                                        </p>
                                        <p className="text-xs text-purple-600 mt-1">
                                            {parseFloat(stats?.profitMargin || 0) > 30 ? '🎉 Excellent!' : parseFloat(stats?.profitMargin || 0) > 20 ? '✅ Good' : '⚠️ Low margin'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cost Breakdown Donut Chart */}
                                {stats?.totalCosts > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-3">Cost Breakdown</p>
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Product', value: stats?.totalProductCost || 0 },
                                                                { name: 'Packaging', value: stats?.totalPackagingCost || 0 },
                                                                { name: 'Labels', value: stats?.totalLabelingCost || 0 },
                                                                { name: 'Shipping', value: stats?.totalShippingCost || 0 },
                                                                { name: 'Other', value: stats?.totalOtherCosts || 0 },
                                                            ].filter(d => d.value > 0)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                        >
                                                            {[
                                                                { name: 'Product', value: stats?.totalProductCost || 0 },
                                                                { name: 'Packaging', value: stats?.totalPackagingCost || 0 },
                                                                { name: 'Labels', value: stats?.totalLabelingCost || 0 },
                                                                { name: 'Shipping', value: stats?.totalShippingCost || 0 },
                                                                { name: 'Other', value: stats?.totalOtherCosts || 0 },
                                                            ].filter(d => d.value > 0).map((_, index) => (
                                                                <Cell key={`cost-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'][index % 5]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, '']} />
                                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-3">Revenue vs Profit</p>
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Profit', value: Math.max(0, stats?.totalProfit || 0) },
                                                                { name: 'Costs', value: stats?.totalCosts || 0 },
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                        >
                                                        </div>
                                )}
                                                    </CardContent>
                                                </Card>
                    )}

                                                {/* Inventory Investment Analysis */}
                                                {stats?.totalInvestment > 0 && (
                                                    <Card className="mb-8 border-2 border-blue-100 bg-blue-50/5">
                                                        <CardHeader>
                                                            <CardTitle className="font-fredoka flex items-center gap-2">
                                                                <Package className="w-5 h-5 text-blue-600" />
                                                                Inventory Investment Analysis
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                                                {/* Investment by Category Pie Chart */}
                                                                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                                                    <p className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
                                                                        <Activity className="w-4 h-4" />
                                                                        Investment by Category
                                                                    </p>
                                                                    <div className="h-[250px]">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <PieChart>
                                                                                <Pie
                                                                                    data={stats.investmentByCategory || []}
                                                                                    cx="50%"
                                                                                    cy="50%"
                                                                                    innerRadius={60}
                                                                                    outerRadius={90}
                                                                                    paddingAngle={3}
                                                                                    dataKey="value"
                                                                                >
                                                                                    {(stats.investmentByCategory || []).map((_: any, index: number) => {
                                                                                        const colors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5'];
                                                                                        return <Cell key={`invest-cat-${index}`} fill={colors[index % colors.length]} />;
                                                                                    })}
                                                                                </Pie>
                                                                                <Tooltip
                                                                                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Investment']}
                                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                                />
                                                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                                                            </PieChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>

                                                                {/* Top Products by Investment Bar Chart */}
                                                                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                                                    <p className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
                                                                        <TrendingUp className="w-4 h-4" />
                                                                        Top Products by Investment
                                                                    </p>
                                                                    <div className="h-[250px]">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart
                                                                                layout="vertical"
                                                                                data={stats.topInvestedProducts || []}
                                                                                margin={{ left: 10, right: 30 }}
                                                                            >
                                                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                                                                                <YAxis
                                                                                    type="category"
                                                                                    dataKey="name"
                                                                                    tick={{ fontSize: 10 }}
                                                                                    width={120}
                                                                                    tickFormatter={(str) => str.length > 20 ? `${str.slice(0, 17)}...` : str}
                                                                                />
                                                                                <Tooltip
                                                                                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Total Investment']}
                                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                                />
                                                                                <Bar dataKey="totalInvestment" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Detailed Investment Table */}
                                                            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                                                <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-center">
                                                                    <p className="text-sm font-bold text-blue-800 font-fredoka uppercase tracking-wider">Detailed Investment Analysis</p>
                                                                    <Badge variant="outline" className="bg-white text-blue-600 border-blue-200">
                                                                        {stats.allProductInvestments?.length || 0} Products
                                                                    </Badge>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left">
                                                                        <thead>
                                                                            <tr className="bg-gray-50/50 text-xs font-bold text-muted-foreground uppercase border-b border-gray-100">
                                                                                <th className="px-6 py-4">Product Name</th>
                                                                                <th className="px-6 py-4">Category</th>
                                                                                <th className="px-6 py-4 text-center">In Stock</th>
                                                                                <th className="px-6 py-4 text-right">Unit Cost</th>
                                                                                <th className="px-6 py-4 text-right">Total Value</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="text-sm divide-y divide-gray-50 font-nunito">
                                                                            {(stats.allProductInvestments || []).sort((a: any, b: any) => b.totalInvestment - a.totalInvestment).map((prod: any) => (
                                                                                <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
                                                                                    <td className="px-6 py-4">
                                                                                        <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{prod.name}</p>
                                                                                        <p className="text-[10px] text-muted-foreground font-mono">{prod.id?.slice(0, 8)}</p>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600">
                                                                                            {prod.category}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-center">
                                                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${prod.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                                            {prod.stock}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right tabular-nums">
                                                                                        <span className="text-muted-foreground">₹</span>{prod.unitCost?.toFixed(2)}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right tabular-nums">
                                                                                        <p className="font-black text-blue-700">
                                                                                            <span className="text-[10px] mr-0.5">₹</span>{prod.totalInvestment?.toFixed(2)}
                                                                                        </p>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                <div className="p-4 bg-gray-50/30 border-t border-gray-100 text-right">
                                                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                                                                        Total Inventory Value: <span className="text-blue-700 text-sm ml-2">₹{stats.totalInvestment?.toFixed(2)}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

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
                                                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-pink-100 hover:border-pink-500 bg-pink-50/10">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                                                                    <IndianRupee className="w-6 h-6 text-pink-600" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-fredoka font-bold text-lg">Pricing & Tax</h3>
                                                                    <p className="text-sm text-muted-foreground">GST & Shipping rules</p>
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
                                                                    <h3 className="font-fredoka font-bold text-lg">System Settings</h3>
                                                                    <p className="text-sm text-muted-foreground">General configuration</p>
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
                                                    {/* Order Status Distribution - Donut Chart */}
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="font-fredoka">Order Status Distribution</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {Array.isArray(stats?.ordersByStatus) && stats.ordersByStatus.length > 0 ? (
                                                                <div className="h-[280px]">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <PieChart>
                                                                            <Pie
                                                                                data={stats.ordersByStatus.map((s: any) => ({ name: s.status, value: s._count }))}
                                                                                cx="50%"
                                                                                cy="50%"
                                                                                innerRadius={60}
                                                                                outerRadius={100}
                                                                                paddingAngle={3}
                                                                                dataKey="value"
                                                                                label={({ name, value }) => `${name} (${value})`}
                                                                            >
                                                                                {stats.ordersByStatus.map((_: any, index: number) => {
                                                                                    const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444', '#06b6d4', '#ec4899'];
                                                                                    return <Cell key={`status-${index}`} fill={colors[index % colors.length]} />;
                                                                                })}
                                                                            </Pie>
                                                                            <Tooltip formatter={(value: any) => [`${value} orders`, '']} />
                                                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                                                        </PieChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                                                                    No order data available yet.
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>

                                                    {/* Top Selling Products - Horizontal Bar Chart */}
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="font-fredoka flex items-center gap-2">
                                                                <TrendingUp className="w-5 h-5 text-green-500" />
                                                                Top Selling Items
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {Array.isArray(stats?.topSellingProducts) && stats.topSellingProducts.length > 0 ? (
                                                                <div className="h-[280px]">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <BarChart
                                                                            layout="vertical"
                                                                            data={stats.topSellingProducts.map((item: any) => ({
                                                                                name: (item.name || item.product?.name || 'Unknown').slice(0, 20),
                                                                                sold: item._sum?.quantity || item.quantity || 0
                                                                            }))}
                                                                            margin={{ left: 10, right: 30 }}
                                                                        >
                                                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                                                                            <Tooltip formatter={(value: any) => [`${value} sold`, 'Quantity']} />
                                                                            <Bar dataKey="sold" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={20} />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                                                                    No sales data available yet.
                                                                </div>
                                                            )}
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
