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
    ChevronLeft, ChevronRight, Filter, MapPin, Clock, Download, Loader2,
    Mail, Users, TrendingUp, MousePointer2, UserCheck, Fingerprint,
    Phone, Activity, BarChart2, PieChartIcon, Layers, Star, ShoppingCart, Package, Trophy
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, RadialBarChart, RadialBar, LineChart, Line
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

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-sm">
                {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
                        {p.name}: <span className="text-gray-800">{p.value?.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Section header component
const SectionHeader = ({ icon: Icon, title, color = 'text-indigo-500' }: { icon: any; title: string; color?: string }) => (
    <CardTitle className={`text-sm font-bold flex items-center gap-2 uppercase tracking-wide`}>
        <Icon className={`w-4 h-4 ${color}`} />
        {title}
    </CardTitle>
);

// Horizontal bar row for top lists
const HBarRow = ({ name, count, max, color }: { name: string; count: number; max: number; color: string }) => (
    <div className="flex items-center gap-3 group">
        <span className="text-xs text-muted-foreground w-28 truncate flex-shrink-0 font-medium">{name}</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${max > 0 ? (count / max) * 100 : 0}%`, backgroundColor: color }}
            />
        </div>
        <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
    </div>
);

const StatCard = ({ icon: Icon, label, value, color, subLabel }: any) => (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow ${color}`}>
        <CardContent className="p-4 text-center">
            <Icon className="w-5 h-5 mx-auto mb-1.5 opacity-70" />
            <p className="text-2xl font-fredoka font-bold">{value}</p>
            <p className="text-[10px] uppercase font-semibold leading-tight mt-0.5 opacity-75">{label}</p>
            {subLabel && <p className="text-[9px] opacity-50 mt-0.5">{subLabel}</p>}
        </CardContent>
    </Card>
);

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

    const { data: productEngagement } = useQuery({
        queryKey: ['admin-product-engagement'],
        queryFn: async () => {
            const res = await adminAPI.getProductEngagement();
            return res.data;
        },
        enabled: isAdmin && !loading,
        staleTime: 1000 * 60 * 5,
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

    // ── Derived chart data ──────────────────────────────────────────────────
    const visitorTypeData = [
        { name: 'New', value: agg.visitorTypes?.new || 0, color: '#6366f1' },
        { name: 'Returning', value: agg.visitorTypes?.returning || 0, color: '#ec4899' }
    ];

    const funnelData = [
        { name: 'Visits', value: agg.funnel?.visits || 0, fill: '#6366f1' },
        { name: 'Products', value: agg.funnel?.product_views || 0, fill: '#8b5cf6' },
        { name: 'Cart', value: agg.funnel?.cart_views || 0, fill: '#d946ef' },
        { name: 'Checkout', value: agg.funnel?.checkout_starts || 0, fill: '#ec4899' },
        { name: 'Purchase', value: agg.funnel?.purchases || 0, fill: '#f43f5e' }
    ];

    const deviceData = (agg.devices || []).map((d: any, i: number) => ({
        ...d,
        color: DEVICE_COLORS[d.name] || CHART_COLORS[i % CHART_COLORS.length]
    }));

    const totalDeviceViews = deviceData.reduce((s: number, d: any) => s + d.count, 0);
    const getDevicePercent = (name: string) => {
        const found = deviceData.find((d: any) => d.name === name);
        return totalDeviceViews > 0 ? Math.round(((found?.count || 0) / totalDeviceViews) * 100) : 0;
    };

    const browserData = (agg.browsers || []).slice(0, 6);
    const maxBrowser = Math.max(...browserData.map((b: any) => b.count), 1);

    const osData = (agg.operatingSystems || []).slice(0, 6);
    const maxOs = Math.max(...osData.map((o: any) => o.count), 1);

    const topPages = (agg.topPages || []).slice(0, 8);
    const maxPage = Math.max(...topPages.map((p: any) => p.count), 1);

    const topCountries = (agg.countries || []).slice(0, 8);
    const maxCountry = Math.max(...topCountries.map((c: any) => c.count), 1);

    const referrers = (agg.referrers || []).slice(0, 6);
    const maxReferrer = Math.max(...referrers.map((r: any) => r.count), 1);

    const utmSources = (agg.utmSources || []).slice(0, 6);

    // Engagement score (0–100) based on avg duration
    const avgDur = agg.avgDuration || 0;
    const engagementScore = Math.min(100, Math.round((avgDur / 300) * 100)); // 5 min = 100

    // Daily visitors — area chart data
    const dailyData = (generalStats?.dailyVisitors || []).map((d: any) => ({
        ...d,
        date: (() => { try { return new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return d.date; } })()
    }));

    // Today stats
    const todayViews = generalStats?.todayViews || 0;
    const weekViews = generalStats?.weekViews || 0;
    const monthViews = generalStats?.monthViews || 0;
    const totalRealVisitors = generalStats?.totalRealVisitors || 0;
    const newPct = agg.visitorTypes?.new
        ? Math.round((agg.visitorTypes.new / ((agg.visitorTypes.new || 0) + (agg.visitorTypes.returning || 0))) * 100)
        : 0;

    return (
        <>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-fredoka font-bold text-foreground">Visitor Insights</h1>
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
                Detailed analytics — device, location, browser, behaviour, and traffic sources. Live data, refreshes every 30s.
            </p>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-destructive">Failed to load visitor data.</div>
            ) : (
                <>
                    {/* ── KPI Summary Row ─────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                        <StatCard icon={Eye} label="Total Views" value={(generalStats?.totalViews || pagination.totalCount).toLocaleString()} color="bg-indigo-50/60 border-indigo-100 text-indigo-700" />
                        <StatCard icon={UserCheck} label="Real Visitors" value={totalRealVisitors.toLocaleString()} color="bg-emerald-50/60 border-emerald-100 text-emerald-700" subLabel="by IP / Email" />
                        <StatCard icon={Activity} label="Today" value={todayViews.toLocaleString()} color="bg-blue-50/60 border-blue-100 text-blue-700" subLabel="page views" />
                        <StatCard icon={TrendingUp} label="This Week" value={weekViews.toLocaleString()} color="bg-violet-50/60 border-violet-100 text-violet-700" subLabel="page views" />
                        <StatCard icon={Clock} label="Avg. Duration" value={formatDuration(avgDur)} color="bg-amber-50/60 border-amber-100 text-amber-700" />
                        <StatCard icon={Users} label="New Visitors" value={`${newPct}%`} color="bg-pink-50/60 border-pink-100 text-pink-700" subLabel="by cookies" />
                    </div>

                    {/* ── Row 1: Daily Trend (Area) + Funnel ──────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Daily Trend — Area Chart */}
                        <Card className="lg:col-span-2 border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={Activity} title="Daily Visitor Trend (Last 7 Days)" color="text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[240px]">
                                    {dailyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                                <Area type="monotone" dataKey="views" name="Page Views" stroke="#6366f1" strokeWidth={2} fill="url(#gradViews)" dot={{ r: 3, fill: '#6366f1' }} />
                                                <Area type="monotone" dataKey="visitors" name="Sessions" stroke="#f59e0b" strokeWidth={2} fill="url(#gradSessions)" dot={{ r: 3, fill: '#f59e0b' }} />
                                                <Area type="monotone" dataKey="realVisitors" name="Real Visitors" stroke="#22c55e" strokeWidth={2} fill="url(#gradReal)" dot={{ r: 3, fill: '#22c55e' }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">No chart data yet</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Conversion Funnel */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={TrendingUp} title="Conversion Funnel" color="text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 mt-2">
                                    {funnelData.map((item, i) => {
                                        const maxVal = funnelData[0]?.value || 1;
                                        const pct = Math.round((item.value / maxVal) * 100);
                                        const dropPct = i > 0 && funnelData[i - 1].value > 0
                                            ? Math.round((1 - item.value / funnelData[i - 1].value) * 100)
                                            : null;
                                        return (
                                            <div key={item.name}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-semibold text-gray-600">{item.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        {dropPct !== null && dropPct > 0 && (
                                                            <span className="text-[10px] text-rose-500 font-medium">-{dropPct}%</span>
                                                        )}
                                                        <span className="text-xs font-bold" style={{ color: item.fill }}>{item.value.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${pct}%`, backgroundColor: item.fill }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Conversion Rate</span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {funnelData[0]?.value > 0
                                            ? `${((funnelData[4]?.value / funnelData[0]?.value) * 100).toFixed(1)}%`
                                            : '0%'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Row 2: Devices (Donut) + Visitor Types + Engagement ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Device Breakdown — Donut */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={Smartphone} title="Device Breakdown" color="text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="h-[160px] w-[160px] flex-shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={deviceData} dataKey="count" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                                    {deviceData.map((entry: any, i: number) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => [`${v} views`, '']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        {deviceData.map((d: any) => (
                                            <div key={d.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                    <span className="text-xs capitalize font-medium">{d.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold">{d.count}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {totalDeviceViews > 0 ? `${Math.round((d.count / totalDeviceViews) * 100)}%` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visitor Retention — Donut */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={Users} title="Visitor Retention" color="text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="h-[160px] w-[160px] flex-shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={visitorTypeData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                                                    {visitorTypeData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => [`${v} sessions`, '']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {visitorTypeData.map((item) => {
                                            const total = (agg.visitorTypes?.new || 0) + (agg.visitorTypes?.returning || 0);
                                            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                            return (
                                                <div key={item.name}>
                                                    <div className="flex justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                            <span className="text-xs font-medium">{item.name}</span>
                                                        </div>
                                                        <span className="text-xs font-bold">{item.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-[10px] text-muted-foreground">Retention Rate</p>
                                            <p className="text-lg font-fredoka font-bold text-pink-600">
                                                {(() => {
                                                    const total = (agg.visitorTypes?.new || 0) + (agg.visitorTypes?.returning || 0);
                                                    return total > 0 ? `${Math.round(((agg.visitorTypes?.returning || 0) / total) * 100)}%` : '0%';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Engagement Score */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={MousePointer2} title="Engagement Score" color="text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[160px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" data={[{ name: 'Engagement', value: engagementScore, fill: engagementScore > 70 ? '#22c55e' : engagementScore > 40 ? '#f59e0b' : '#ef4444' }]} startAngle={90} endAngle={-270}>
                                            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                                            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-800" style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Fredoka One' }}>
                                                {engagementScore}
                                            </text>
                                            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#64748b' }}>/ 100</text>
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="text-center bg-gray-50 rounded-xl p-2">
                                        <p className="text-xs text-muted-foreground">Avg. Duration</p>
                                        <p className="text-sm font-bold text-emerald-600">{formatDuration(avgDur)}</p>
                                    </div>
                                    <div className="text-center bg-gray-50 rounded-xl p-2">
                                        <p className="text-xs text-muted-foreground">Month Views</p>
                                        <p className="text-sm font-bold text-indigo-600">{monthViews.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Row 3: Top Pages + Top Countries ────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Top Pages */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={Layers} title="Top Pages (Last 30 Days)" color="text-violet-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 mt-2">
                                    {topPages.length > 0 ? topPages.map((p: any, i: number) => (
                                        <HBarRow key={p.name} name={p.name} count={p.count} max={maxPage} color={CHART_COLORS[i % CHART_COLORS.length]} />
                                    )) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-6">No page data yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Countries */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={Globe} title="Top Countries" color="text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 mt-2">
                                    {topCountries.length > 0 ? topCountries.map((c: any, i: number) => (
                                        <HBarRow key={c.name} name={c.name} count={c.count} max={maxCountry} color={CHART_COLORS[i % CHART_COLORS.length]} />
                                    )) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-6">No country data yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Row 4: Browsers + OS + Traffic Sources ───────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Browsers */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={Monitor} title="Browsers" color="text-sky-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 mt-2">
                                    {browserData.length > 0 ? browserData.map((b: any, i: number) => (
                                        <HBarRow key={b.name} name={b.name} count={b.count} max={maxBrowser} color={CHART_COLORS[i % CHART_COLORS.length]} />
                                    )) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-6">No browser data yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operating Systems */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={BarChart2} title="Operating Systems" color="text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[220px] mt-2">
                                    {osData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={osData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} hide />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 500 }} width={80} axisLine={false} tickLine={false} tickFormatter={(v) => v.length > 12 ? v.substring(0, 12) + '…' : v} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="Visitors" radius={[0, 6, 6, 0]} barSize={16}>
                                                    {osData.map((_: any, i: number) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">No OS data yet</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Traffic Sources */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={ArrowUpRight} title="Traffic Sources" color="text-pink-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 mt-2">
                                    {referrers.length > 0 ? referrers.map((r: any, i: number) => (
                                        <HBarRow key={r.name} name={r.name} count={r.count} max={maxReferrer} color={CHART_COLORS[i % CHART_COLORS.length]} />
                                    )) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-6">No referrer data yet</p>
                                    )}
                                    {referrers.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center">Most traffic is Direct (no referrer)</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Row 5: UTM Sources + Top Events ─────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* UTM Sources */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={PieChartIcon} title="UTM / Marketing Sources" color="text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                {utmSources.length > 0 ? (
                                    <div className="h-[200px] mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={utmSources} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} tickFormatter={(v) => v.length > 10 ? v.substring(0, 10) + '…' : v} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="Clicks" radius={[6, 6, 0, 0]} barSize={32}>
                                                    {utmSources.map((_: any, i: number) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                                        <p className="text-sm text-muted-foreground italic">No UTM campaign data yet.</p>
                                        <p className="text-xs text-muted-foreground">Add <code className="bg-gray-100 px-1 rounded">?utm_source=instagram</code> to your links.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Events */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <SectionHeader icon={MousePointer2} title="Top Interaction Events" color="text-violet-500" />
                            </CardHeader>
                            <CardContent>
                                {(agg.topEvents || []).length > 0 ? (
                                    <div className="h-[200px] mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={(agg.topEvents || []).slice(0, 7)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} hide />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontWeight: 500 }} width={130} axisLine={false} tickLine={false} tickFormatter={(v) => v.length > 20 ? v.substring(0, 20) + '…' : v} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="Events" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={14} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">No event data recorded yet</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Top Products by Engagement ────────────────────────── */}
                    <Card className="mb-6 border shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center justify-between">
                                <SectionHeader icon={Trophy} title="Top Shoes by Engagement (Last 30 Days)" color="text-amber-500" />
                                <span className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                                    Score = Views + Unique Visitors + Cart Adds + Orders + Shares
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(productEngagement?.products || []).length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {(productEngagement.products as any[]).map((product: any, i: number) => {
                                        const maxScore = productEngagement.products[0]?.score || 1;
                                        const scorePct = Math.round((product.score / maxScore) * 100);
                                        const formatDur = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
                                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

                                        return (
                                            <div key={product.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                                                {/* Rank */}
                                                <div className="w-8 text-center text-lg flex-shrink-0">{medal}</div>

                                                {/* Product Image */}
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                                                    onError={(e: any) => { e.target.style.display = 'none'; }}
                                                />

                                                {/* Name + Score Bar */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm truncate">{product.name}</span>
                                                        <Badge variant="outline" className="text-[9px] shrink-0 bg-gray-50">{product.category}</Badge>
                                                        {product.status === 'ACTIVE' ? (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Active" />
                                                        ) : (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" title={product.status} />
                                                        )}
                                                    </div>
                                                    {/* Score bar */}
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${scorePct}%`,
                                                                background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : i < 3 ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : '#c7d2fe'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Metrics grid */}
                                                <div className="hidden md:grid grid-cols-5 gap-3 flex-shrink-0">
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-indigo-600">{product.views}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">Views</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-violet-600">{product.uniqueVisitors}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">Unique</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-amber-600">{product.cartAdds}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">Cart</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-emerald-600">{product.orders}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">Orders</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-rose-600">{formatDur(product.avgDuration)}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">Avg Time</p>
                                                    </div>
                                                </div>

                                                {/* Score badge */}
                                                <div className="flex-shrink-0 text-right">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
                                                        <div>
                                                            <p className="text-sm font-fredoka font-bold text-indigo-700 leading-none">{product.score}</p>
                                                            <p className="text-[8px] text-indigo-400">score</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No product engagement data yet.</p>
                                    <p className="text-xs mt-1">Data builds up as visitors browse products.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Filters ──────────────────────────────────────────────── */}
                    <Card className="mb-6 border shadow-sm">
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
                                <Input type="date" className="w-[150px] text-sm" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
                                <span className="text-muted-foreground text-xs">to</span>
                                <Input type="date" className="w-[150px] text-sm" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
                                {(deviceFilter !== 'all' || startDate || endDate) && (
                                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground"
                                        onClick={() => { setDeviceFilter('all'); setStartDate(''); setEndDate(''); setPage(1); }}>
                                        Clear filters
                                    </Button>
                                )}
                                <div className="ml-auto text-xs text-muted-foreground">{pagination.totalCount} records</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Visitor Table ─────────────────────────────────────────── */}
                    <Card className="mb-6 border shadow-sm">
                        <CardHeader className="pb-2 border-b">
                            <SectionHeader icon={Eye} title="Raw Visitor Log" color="text-slate-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50/80">
                                            {['Time', 'Type', 'User / Lead', 'Location', 'Source', 'Device', 'Browser / OS', 'Page', 'Referrer'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
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
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold uppercase py-0 px-1.5 h-5">New</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase py-0 px-1.5 h-5">Return</Badge>
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
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.city || v.country ? (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <MapPin className="w-3 h-3 text-rose-400" />
                                                            <span>{[v.city, v.region, v.country].filter(Boolean).join(', ')}</span>
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.utmSource ? (
                                                        <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50/50 text-amber-700 font-normal">{v.utmSource}</Badge>
                                                    ) : v.referrer ? (
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[80px] inline-block">
                                                            {(() => { try { return new URL(v.referrer).hostname; } catch { return v.referrer; } })()}
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
                                                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded max-w-[150px] truncate inline-block">{v.path}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.referrer ? (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[150px]">
                                                            <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{v.referrer}</span>
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">Direct</span>}
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

                    {/* ── Pagination ────────────────────────────────────────────── */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
                            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
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
