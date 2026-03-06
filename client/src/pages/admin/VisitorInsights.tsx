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
    ChevronLeft, ChevronRight, Filter, MapPin, Clock
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
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

    // Compute device summary for header cards
    const totalDeviceViews = (agg.devices || []).reduce((s: number, d: any) => s + d.count, 0);
    const getDevicePercent = (name: string) => {
        const found = (agg.devices || []).find((d: any) => d.name === name);
        return totalDeviceViews > 0 ? Math.round(((found?.count || 0) / totalDeviceViews) * 100) : 0;
    };

    return (
        <>
            <h1 className="text-4xl font-fredoka font-bold text-foreground mb-2">
                Visitor Insights
            </h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Detailed analytics about every visitor who lands on your website — device, location, browser, and more.
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
                                <p className="text-3xl font-fredoka font-bold text-indigo-800">{pagination.totalCount}</p>
                                <p className="text-[10px] text-indigo-500 uppercase font-semibold">Total Page Views</p>
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
                                <Globe className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                <p className="text-3xl font-fredoka font-bold text-emerald-800">
                                    {(agg.countries || [])[0]?.name || '—'}
                                </p>
                                <p className="text-[10px] text-emerald-500 uppercase font-semibold">Top Country</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Device Breakdown Pie */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Device Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[200px]">
                                    {(agg.devices || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={(agg.devices || []).map((d: any) => ({ name: d.name, value: d.count }))}
                                                    cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                                    paddingAngle={3} dataKey="value"
                                                >
                                                    {(agg.devices || []).map((d: any, i: number) => (
                                                        <Cell key={d.name} fill={DEVICE_COLORS[d.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => [`${v} views`, '']} />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Countries Bar */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Top Countries</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[200px]">
                                    {(agg.countries || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={(agg.countries || []).slice(0, 6)} layout="vertical" margin={{ left: 5, right: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                                                <Tooltip formatter={(v: any) => [`${v} views`, '']} />
                                                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No geo data yet</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Referrers */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Top Referrers</CardTitle></CardHeader>
                            <CardContent>
                                {(agg.referrers || []).length > 0 ? (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {(agg.referrers || []).slice(0, 8).map((r: any, i: number) => (
                                            <div key={r.name} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                                    <span className="truncate text-xs">{r.name}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] ml-2 flex-shrink-0">{r.count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No referrer data</div>
                                )}
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
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">IP</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Location</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Device</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Browser / OS</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Page</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Referrer</th>
                                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Screen</th>
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
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{maskIp(v.ip)}</span>
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
                                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
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
