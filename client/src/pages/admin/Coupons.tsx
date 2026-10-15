import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Ticket, Plus, Trash2, Edit, Calendar, Tag, IndianRupee, Globe, Package, Search, Check, CheckSquare, Square, X } from 'lucide-react';
import { toast } from 'sonner';

const AdminCoupons = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
            const response = await adminAPI.getCoupons();
            return response.data;
        },
        enabled: isAdmin
    });

    const { data: products = [] } = useQuery({
        queryKey: ['admin-products'],
        queryFn: async () => {
            const response = await adminAPI.getProducts();
            return response.data || [];
        },
        enabled: isAdmin
    });

    const productMap = useMemo(() => {
        return new Map<string, any>(products.map((p: any) => [p.id, p]));
    }, [products]);

    const createMutation = useMutation({
        mutationFn: (data: any) => adminAPI.createCoupon(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            toast.success('Coupon created successfully');
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create coupon')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateCoupon(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            toast.success('Coupon updated successfully');
            setIsDialogOpen(false);
            setEditingCoupon(null);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.details?.[0]?.message || error.response?.data?.error || 'Failed to update coupon';
            toast.error(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminAPI.deleteCoupon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            toast.success('Coupon deleted successfully');
        },
        onError: () => toast.error('Failed to delete coupon')
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-fredoka font-bold text-foreground">
                        Coupon Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create storewide promotions or target specific products
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="hopz" onClick={() => setEditingCoupon(null)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </DialogTitle>
                        </DialogHeader>
                        <CouponForm
                            coupon={editingCoupon}
                            products={products}
                            onSubmit={(data: any) => {
                                if (editingCoupon) {
                                    updateMutation.mutate({ id: editingCoupon.id, data });
                                } else {
                                    createMutation.mutate(data);
                                }
                            }}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !coupons || coupons.length === 0 ? (
                <Card className="p-12 text-center">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-fredoka font-bold mb-2">No coupons found</h3>
                    <p className="text-muted-foreground">Start by creating your first discount coupon</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map((coupon: any) => {
                        const isSpecific = coupon.appliesTo === 'SPECIFIC';
                        const productCount = Array.isArray(coupon.productIds) ? coupon.productIds.length : 0;

                        return (
                            <Card key={coupon.id} className="p-6 relative overflow-hidden group flex flex-col justify-between">
                                <div>
                                    <div className="absolute top-0 right-0 p-3 flex gap-1.5 flex-wrap justify-end">
                                        {coupon.isHidden && (
                                            <Badge className="bg-purple-100 text-purple-700 border-purple-200">🔒 Secret</Badge>
                                        )}
                                        <Badge variant={coupon.isActive ? 'default' : 'outline'}>
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Ticket className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-fredoka font-bold uppercase tracking-wider">{coupon.code}</h3>
                                            <p className="text-sm font-nunito font-bold text-cyan-600">
                                                {coupon.discountType === 'PERCENTAGE'
                                                    ? `${coupon.discountValue}% OFF`
                                                    : <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" />{coupon.discountValue} OFF</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {isSpecific ? (
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 text-xs gap-1 font-semibold">
                                                <Package className="w-3.5 h-3.5" />
                                                {productCount} Specific {productCount === 1 ? 'Product' : 'Products'}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1 font-semibold">
                                                <Globe className="w-3.5 h-3.5" />
                                                All Products
                                            </Badge>
                                        )}
                                        {coupon.firstTimeOnly && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                First Time Only
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <p className="flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            Min Order: <IndianRupee className="w-3 h-3 inline-block mx-0.5" />{coupon.minOrderValue || 0}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Expires: {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Usage: {coupon.currentUses} / {coupon.maxUses || '∞'}
                                        </p>
                                    </div>

                                    {isSpecific && productCount > 0 && (
                                        <div className="pt-3 pb-3 border-t border-slate-100 text-xs text-muted-foreground mb-2">
                                            <p className="font-semibold text-gray-700 mb-1">Eligible Items:</p>
                                            <p className="line-clamp-2 text-gray-600">
                                                {coupon.productIds
                                                    .map((pid: string) => productMap.get(pid)?.name || 'Product')
                                                    .join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            setEditingCoupon(coupon);
                                            setIsDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm('Delete this coupon?')) {
                                                deleteMutation.mutate(coupon.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
};

const CouponForm = ({ coupon, products = [], onSubmit, isLoading }: any) => {
    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        discountType: coupon?.discountType || 'PERCENTAGE',
        discountValue: coupon?.discountValue || '',
        minOrderValue: coupon?.minOrderValue || '',
        maxUses: coupon?.maxUses || '',
        expiryDate: coupon?.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
        isActive: coupon?.isActive ?? true,
        isHidden: coupon?.isHidden ?? false,
        firstTimeOnly: coupon?.firstTimeOnly ?? false,
        appliesTo: coupon?.appliesTo || 'ALL',
        productIds: Array.isArray(coupon?.productIds) ? coupon.productIds : []
    });

    const [productSearch, setProductSearch] = useState('');

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return products;
        const q = productSearch.toLowerCase();
        return products.filter((p: any) =>
            p.name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q)
        );
    }, [products, productSearch]);

    const toggleProduct = (productId: string) => {
        setFormData(prev => {
            const exists = prev.productIds.includes(productId);
            const next = exists
                ? prev.productIds.filter((id: string) => id !== productId)
                : [...prev.productIds, productId];
            return { ...prev, productIds: next };
        });
    };

    const handleSelectAllProducts = () => {
        const allIds = products.map((p: any) => p.id);
        setFormData(prev => ({ ...prev, productIds: allIds }));
        toast.info(`Selected all ${products.length} products`);
    };

    const handleClearAllProducts = () => {
        setFormData(prev => ({ ...prev, productIds: [] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.appliesTo === 'SPECIFIC' && formData.productIds.length === 0) {
            toast.error('Please select at least one product for this specific coupon');
            return;
        }

        onSubmit({
            ...formData,
            discountValue: parseFloat(formData.discountValue as string),
            minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue as string) : null,
            maxUses: formData.maxUses ? parseInt(formData.maxUses as string) : null,
            expiryDate: formData.expiryDate || null,
            isHidden: formData.isHidden,
            firstTimeOnly: formData.firstTimeOnly,
            appliesTo: formData.appliesTo,
            productIds: formData.appliesTo === 'SPECIFIC' ? formData.productIds : []
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input
                    className="uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="E.g. SUMMER20"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                            <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        required
                        placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '500'}
                    />
                </div>
            </div>

            {/* Applicable Products Selection: All Products or Specific Products */}
            <div className="space-y-2.5 pt-1">
                <Label className="text-sm font-bold text-gray-800">Coupon Applies To</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, appliesTo: 'ALL' })}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            formData.appliesTo === 'ALL'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground'
                                : 'border-gray-200 hover:border-gray-300 bg-white text-muted-foreground'
                        }`}
                    >
                        <div className={`p-2 rounded-lg ${formData.appliesTo === 'ALL' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-foreground">All Products</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Applies storewide to any product</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, appliesTo: 'SPECIFIC' })}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            formData.appliesTo === 'SPECIFIC'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground'
                                : 'border-gray-200 hover:border-gray-300 bg-white text-muted-foreground'
                        }`}
                    >
                        <div className={`p-2 rounded-lg ${formData.appliesTo === 'SPECIFIC' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-foreground">Specific Products</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Select specific products for this coupon</p>
                        </div>
                    </button>
                </div>

                {/* Specific Products Selector */}
                {formData.appliesTo === 'SPECIFIC' && (
                    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <span>Selected:</span>
                                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                                    {formData.productIds.length} of {products.length} products
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs bg-white"
                                    onClick={handleSelectAllProducts}
                                >
                                    Select All ({products.length})
                                </Button>
                                {formData.productIds.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={handleClearAllProducts}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <Input
                                placeholder="Search products by name, category, or SKU..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="pl-9 pr-8 bg-white h-9 text-xs"
                            />
                            {productSearch && (
                                <button
                                    type="button"
                                    onClick={() => setProductSearch('')}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Product Checkbox List */}
                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border rounded-lg bg-white p-1.5 divide-y divide-slate-100">
                            {filteredProducts.length === 0 ? (
                                <p className="text-center py-6 text-xs text-muted-foreground">
                                    No products found matching "{productSearch}"
                                </p>
                            ) : (
                                filteredProducts.map((p: any) => {
                                    const isSelected = formData.productIds.includes(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => toggleProduct(p.id)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected ? 'bg-primary/5 text-foreground' : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}} // Handled by div onClick
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate">{p.name}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <span className="capitalize">{p.category}</span>
                                                        {p.sku && <span>• SKU: {p.sku}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className="text-xs font-extrabold text-foreground">
                                                    ₹{p.discountPrice || p.price}
                                                </p>
                                                {p.discountPrice && (
                                                    <p className="text-[10px] text-muted-foreground line-through">
                                                        ₹{p.price}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {formData.appliesTo === 'SPECIFIC' && formData.productIds.length === 0 && (
                            <p className="text-xs font-semibold text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                                ⚠️ Please select at least one product for this coupon to be valid.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Min Order (₹)</Label>
                    <Input
                        type="number"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        placeholder="0"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Max Uses</Label>
                    <Input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="Unlimited"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
            </div>

            <div className="flex items-center gap-2 py-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>

            <div className="flex items-center gap-2 py-2 bg-blue-50 px-3 rounded-lg border border-blue-200">
                <input
                    type="checkbox"
                    id="firstTimeOnly"
                    checked={formData.firstTimeOnly}
                    onChange={(e) => setFormData({ ...formData, firstTimeOnly: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                    <Label htmlFor="firstTimeOnly" className="cursor-pointer font-bold text-blue-700">✨ First Time Purchases Only</Label>
                    <p className="text-xs text-blue-500">Only applicable for users/guests without previous orders.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 py-2 bg-purple-50 px-3 rounded-lg border border-purple-200">
                <input
                    type="checkbox"
                    id="isHidden"
                    checked={formData.isHidden}
                    onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                    <Label htmlFor="isHidden" className="cursor-pointer font-bold text-purple-700">🔒 Hidden / Secret</Label>
                    <p className="text-xs text-purple-500">Won't appear in public coupon list. Only works when typed manually.</p>
                </div>
            </div>

            <Button type="submit" variant="hopz" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
        </form>
    );
};

export default AdminCoupons;
