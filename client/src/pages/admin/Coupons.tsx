import { useState } from 'react';
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
import { Ticket, Plus, Trash2, Edit, Calendar, Tag, IndianRupee } from 'lucide-react';
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
        onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update coupon')
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
                <h1 className="text-4xl font-fredoka font-bold text-foreground">
                    Coupon Management
                </h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="hopz" onClick={() => setEditingCoupon(null)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </DialogTitle>
                        </DialogHeader>
                        <CouponForm
                            coupon={editingCoupon}
                            onSubmit={(data) => {
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
                    {coupons.map((coupon: any) => (
                        <Card key={coupon.id} className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3">
                                <Badge variant={coupon.isActive ? 'default' : 'outline'}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
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
                            <div className="space-y-2 text-sm text-muted-foreground mb-6">
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
                                    Usage: {coupon.currentUses} / {coupon.maxUses || '?'}
                                </p>
                            </div>
                            <div className="flex gap-2">
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
                    ))}
                </div>
            )}
        </>
    );
};

const CouponForm = ({ coupon, onSubmit, isLoading }: any) => {
    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        discountType: coupon?.discountType || 'PERCENTAGE',
        discountValue: coupon?.discountValue || '',
        minOrderValue: coupon?.minOrderValue || '',
        maxUses: coupon?.maxUses || '',
        expiryDate: coupon?.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
        isActive: coupon?.isActive ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            discountValue: parseFloat(formData.discountValue as string),
            minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue as string) : null,
            maxUses: formData.maxUses ? parseInt(formData.maxUses as string) : null,
            expiryDate: formData.expiryDate || null
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
            <Button type="submit" variant="hopz" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
        </form>
    );
};

export default AdminCoupons;
