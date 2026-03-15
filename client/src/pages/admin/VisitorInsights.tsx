import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Eye, Monitor, Smartphone, Tablet, Globe, ArrowUpRight,
    ChevronLeft, ChevronRight, Filter, MapPin, Clock, Download, Loader2, Mail, Users, TrendingUp, MousePointer2,
    UserCheck, Fingerprint, Phone
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { useState } from 'react';
import { format } from 'date-fns';

const DEVICE_COLORS: Record<string, string> = {
    desktop: '#6366f1',
    mobile: '#f59e0b',
    tablet: '#22c55e',
    unknown: '#94a3b8',
};

const CHART_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#a855f7'];

const DeviceIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'mobile': return <Smartphone className="w-4 h-4 text-amber-500" />;
        case 'tablet': return <Tablet className="w-4 h-4 text-green-500" />;
        default: return <Monitor className="w-4 h-4 text-indigo-500" />;
    }
};

const maskIp = (ip: string | null) => {
    if (!ip) return '—';
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    return ip.slice(0, 10) + '…';
};

const VisitorInsights = () => {
    const { user, isAdmin, loading } = useAuth();
    const [page, setPage] = useState(1);
    const [deviceFilter, setDeviceFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const params: any = {};
            if (deviceFilter !== 'all') params.device = deviceFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const response = await adminAPI.exportVisitors(params);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `happyhopz_visitors_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setExporting(false);
        }
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-visitors', page, deviceFilter, startDate, endDate],
        queryFn: async () => {
            const params: any = { page, limit: 30 };
            if (deviceFilter !== 'all') params.device = deviceFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const response = await adminAPI.getVisitors(params);
            return response.data;
        },
        enabled: isAdmin && !loading,
        refetchInterval: 30000,
    });

    const { data: generalStats } = useQuery({
        queryKey: ['admin-visitor-stats-general'],
        queryFn: async () => {
            const res = await adminAPI.getVisitorStats();
            return res.data;
        },
        enabled: isAdmin && !loading,
        refetchInterval: 60000,
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!user || !isAdmin) return <Navigate to="/admin/dashboard" />;

    const visitors = data?.visitors || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, totalCount: 0 };
    const agg = data?.aggregations || {};

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0s';
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const visitorTypeData = [
        { name: 'New', value: agg.visitorTypes?.new || 0, color: '#6366f1' },
        { name: 'Returning', value: agg.visitorTypes?.returning || 0, color: '#ec4899' }
    ];

    const funnelData = [
        { name: 'Visits', value: agg.funnel?.visits || 0, fill: '#6366f1' },
        { name: 'Product', value: agg.funnel?.product_views || 0, fill: '#8b5cf6' },
        { name: 'Cart', value: agg.funnel?.cart_views || 0, fill: '#d946ef' },
        { name: 'Checkout', value: agg.funnel?.checkout_starts || 0, fill: '#ec4899' },
        { name: 'Purchase', value: agg.funnel?.purchases || 0, fill: '#f43f5e' }
    ];

    // Compute device summary for header cards
    const totalDeviceViews = (agg.devices || []).reduce((s: number, d: any) => s + d.count, 0);
    const getDevicePercent = (name: string) => {
        const found = (agg.devices || []).find((d: any) => d.name === name);
        return totalDeviceViews > 0 ? Math.round(((found?.count || 0) / totalDeviceViews) * 100) : 0;
    };

    return (
        <>
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-fredoka font-bold text-foreground">
                    Visitor Insights
                </h1>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {exporting ? 'Exporting...' : 'Export to Excel'}
                </Button>
            </div>
            <p className="text-muted-foreground mb-8 text-sm">
                Detailed analytics about every visitor — device, location, browser, and more. Excel includes user contacts & addresses.
            </p>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-destructive">Failed to load visitor data.</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-indigo-50/60 border-indigo-100">
                            <CardContent className="p-4 text-center">
                                <Eye className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-indigo-800">{generalStats?.totalViews || pagination.totalCount}</p>
                                <p className="text-[10px] text-indigo-500 uppercase font-semibold">Total Page Views</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50/60 border-green-100">
                            <CardContent className="p-4 text-center">
                                <UserCheck className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-green-800">{generalStats?.totalRealVisitors || 0}</p>
                                <p className="text-[10px] text-green-600 uppercase font-semibold text-center leading-tight">
                                    Real Unique Visitors<br/>
                                    <span className="text-[8px] opacity-70">(by IP/Email)</span>
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50/60 border-amber-100">
                            <CardContent className="p-4 text-center">
                                <Smartphone className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-amber-800">{getDevicePercent('mobile')}%</p>
                                <p className="text-[10px] text-amber-500 uppercase font-semibold">Mobile Users</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-indigo-50/40 border-indigo-100">
                            <CardContent className="p-4 text-center">
                                <Monitor className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-indigo-800">{getDevicePercent('desktop')}%</p>
                                <p className="text-[10px] text-indigo-400 uppercase font-semibold">Desktop Users</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-50/60 border-emerald-100">
                            <CardContent className="p-4 text-center">
                                <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-emerald-800">
                                    {formatDuration(agg.avgDuration || 0)}
                                </p>
                                <p className="text-[10px] text-emerald-500 uppercase font-semibold">Avg. Duration</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50/60 border-blue-100">
                            <CardContent className="p-4 text-center">
                                <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-blue-800">
                                    {agg.visitorTypes?.new ? Math.round((agg.visitorTypes.new / (agg.visitorTypes.new + (agg.visitorTypes.returning || 0))) * 100) : 0}%
                                </p>
                                <p className="text-[10px] text-blue-500 uppercase font-semibold text-center leading-tight">
                                    New Visitors<br/>
                                    <span className="text-[8px] opacity-70">(by cookies)</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Advanced Analytics Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Conversion Funnel */}
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-rose-500" />
                                    CONVERSION FUNNEL
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: '#f8fafc' }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                                {funnelData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visitor Type & Device Summary */}
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-500" />
                                        VISITOR TYPES
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center">
                                    <div className="h-[180px] w-1/2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={visitorTypeData}
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {visitorTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-1/2 space-y-3">
                                        {visitorTypeData.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Top Campaigns (UTM) */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Top Campaigns</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[200px]">
                                    {(agg.utmCampaigns || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={(agg.utmCampaigns || []).slice(0, 6)} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} hide />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fontSize: 10, fontWeight: 500 }}
                                                    width={100}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                                />
                                                <Tooltip formatter={(v: any) => [`${v} clicks`, '']} />
                                                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={14} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">No UTM campaign data yet</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Interaction Events */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <MousePointer2 className="w-4 h-4 text-amber-500" />
                                    TOP EVENTS
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px]">
                                    {(agg.topEvents || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={(agg.topEvents || []).slice(0, 6)} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} hide />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fontSize: 10, fontWeight: 500 }}
                                                    width={120}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
                                                />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">No event data recorded</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <select
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={deviceFilter}
                                    onChange={e => { setDeviceFilter(e.target.value); setPage(1); }}
                                >
                                    <option value="all">All Devices</option>
                                    <option value="desktop">Desktop</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="tablet">Tablet</option>
                                </select>
                                <Input
                                    type="date"
                                    className="w-[150px] text-sm"
                                    value={startDate}
                                    onChange={e => { setStartDate(e.target.value); setPage(1); }}
                                    placeholder="Start Date"
                                />
                                <span className="text-muted-foreground text-xs">to</span>
                                <Input
                                    type="date"
                                    className="w-[150px] text-sm"
                                    value={endDate}
                                    onChange={e => { setEndDate(e.target.value); setPage(1); }}
                                    placeholder="End Date"
                                />
                                {(deviceFilter !== 'all' || startDate || endDate) && (
                                    <Button
                                        variant="ghost" size="sm"
                                        className="text-xs text-muted-foreground"
                                        onClick={() => { setDeviceFilter('all'); setStartDate(''); setEndDate(''); setPage(1); }}
                                    >
                                        Clear filters
                                    </Button>
                                )}
                                <div className="ml-auto text-xs text-muted-foreground">
                                    {pagination.totalCount} records
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visitor Table */}
                    <Card className="mb-6">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50/80">
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Time</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Type</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">User / Lead</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Location</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Source</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Device</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Browser / OS</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Page</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Referrer</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visitors.length > 0 ? visitors.map((v: any) => (
                                            <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(v.createdAt), 'dd MMM, HH:mm')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {v.isNewVisitor ? (
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold uppercase py-0 px-1.5 h-5">
                                                            New
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase py-0 px-1.5 h-5">
                                                            Returning
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        {v.leadName ? (
                                                            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                                                                <UserCheck className="w-3 h-3 text-emerald-500" />
                                                                <span>{v.leadName}</span>
                                                                <span className="text-[9px] text-muted-foreground font-normal ml-1">({maskIp(v.ip)})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-mono text-muted-foreground bg-gray-100 px-1 rounded flex items-center gap-1 w-fit">
                                                                <Fingerprint className="w-2.5 h-2.5" />
                                                                {maskIp(v.ip)}
                                                            </span>
                                                        )}

                                                        {(v.userEmail || v.leadPhone) && (
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                {v.userEmail && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                        <Mail className="w-2.5 h-2.5 text-blue-400" />
                                                                        <span className="truncate max-w-[150px]">{v.userEmail}</span>
                                                                    </div>
                                                                )}
                                                                {v.leadPhone && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                        <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                                                        <span>{v.leadPhone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.city || v.country ? (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <MapPin className="w-3 h-3 text-rose-400" />
                                                            <span>{[v.city, v.region, v.country].filter(Boolean).join(', ')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.utmSource ? (
                                                        <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50/50 text-amber-700 font-normal">
                                                            {v.utmSource}
                                                        </Badge>
                                                    ) : v.referrer ? (
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[80px] inline-block">
                                                            {(() => {
                                                                try { return new URL(v.referrer).hostname; } catch { return v.referrer; }
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">Direct</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <DeviceIcon type={v.device || 'desktop'} />
                                                        <span className="text-xs capitalize">{v.device || 'desktop'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs">
                                                        <span className="font-medium">{v.browser || '—'}</span>
                                                        <span className="text-muted-foreground"> / {v.os || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded max-w-[150px] truncate inline-block">
                                                        {v.path}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.referrer ? (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[150px]">
                                                            <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{v.referrer}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Direct</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {v.screenWidth && v.screenHeight ? `${v.screenWidth}×${v.screenHeight}` : '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                                    No visitor data recorded yet. Data will appear as visitors browse the site.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="outline" size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline" size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default VisitorInsights;
