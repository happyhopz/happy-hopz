import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, IndianRupee, Upload, FileText, AlertCircle, Sparkles, Box, CheckSquare, Square, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const ProductForm = ({ product, onSubmit, isLoading }: any) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        discountPrice: product?.discountPrice || '',
        category: product?.category || 'Sneakers',
        ageGroup: product?.ageGroup || '3-6 years',
        sizes: product?.sizes?.join(', ') || 'S, M, L',
        colors: product?.colors?.join(', ') || 'Red, Blue, Green',
        stock: product?.stock || '50',
        images: product?.images || [],
        status: product?.status || 'ACTIVE',
        tags: product?.tags || [],
        costPrice: product?.costPrice || '',
        boxPrice: product?.boxPrice || '',
        tagPrice: product?.tagPrice || '',
        shippingCost: product?.shippingCost || '',
        otherCosts: product?.otherCosts || '',
        sku: product?.sku || '',
        seoTitle: product?.seoTitle || '',
        seoDescription: product?.seoDescription || ''
    });

    const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

    const handleGenerateSEO = async () => {
        if (!formData.name) {
            toast.error('Please enter a product name first');
            return;
        }
        setIsGeneratingSEO(true);
        try {
            const response = await adminAPI.generateSEO(product?.id || 'temp');
            setFormData({
                ...formData,
                seoTitle: response.data.seoTitle,
                seoDescription: response.data.seoDescription
            });
            toast.success('SEO metadata generated! ✨');
        } catch (error) {
            toast.error('Failed to generate SEO');
        } finally {
            setIsGeneratingSEO(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Comprehensive Fix: Ensure all types are correct before sending to API
        const submissionData = {
            ...formData,
            price: formData.price === '' ? 0 : parseFloat(String(formData.price)),
            discountPrice: formData.discountPrice === '' ? null : parseFloat(String(formData.discountPrice)),
            costPrice: formData.costPrice === '' ? null : parseFloat(String(formData.costPrice)),
            boxPrice: formData.boxPrice === '' ? null : parseFloat(String(formData.boxPrice)),
            tagPrice: formData.tagPrice === '' ? null : parseFloat(String(formData.tagPrice)),
            shippingCost: formData.shippingCost === '' ? null : parseFloat(String(formData.shippingCost)),
            otherCosts: formData.otherCosts === '' ? null : parseFloat(String(formData.otherCosts)),
            stock: formData.stock === '' ? 0 : parseInt(String(formData.stock)),
            sizes: typeof formData.sizes === 'string' ? formData.sizes.split(',').map((s: any) => s.trim()) : formData.sizes,
            colors: typeof formData.colors === 'string' ? formData.colors.split(',').map((c: any) => c.trim()) : formData.colors,
            tags: formData.tags || []
        };

        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Product Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
            <div>
                <Label>Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label>Price (₹)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label>Discount Price (₹)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.discountPrice}
                        onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Cost Price (₹)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        placeholder="e.g. 500"
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                </div>
            </div>

            {/* Cost Breakdown Section */}
            <div className="border-t pt-4 mt-2">
                <Label className="text-base font-semibold mb-3 block">Additional Cost Breakdown (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label className="text-sm">Box Price (₹)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.boxPrice}
                            placeholder="Packaging"
                            onChange={(e) => setFormData({ ...formData, boxPrice: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-sm">Tag Price (₹)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.tagPrice}
                            placeholder="Labels/Tags"
                            onChange={(e) => setFormData({ ...formData, tagPrice: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-sm">Shipping Cost (₹)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.shippingCost}
                            placeholder="Per unit"
                            onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-sm">Other Costs (₹)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.otherCosts}
                            placeholder="Misc."
                            onChange={(e) => setFormData({ ...formData, otherCosts: e.target.value })}
                        />
                    </div>
                </div>
                {/* Total Cost Display */}
                {(formData.costPrice || formData.boxPrice || formData.tagPrice || formData.shippingCost || formData.otherCosts) && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold">Total Cost per Unit:</span>
                            <span className="font-bold text-primary">
                                ₹{(
                                    (parseFloat(formData.costPrice) || 0) +
                                    (parseFloat(formData.boxPrice) || 0) +
                                    (parseFloat(formData.tagPrice) || 0) +
                                    (parseFloat(formData.shippingCost) || 0) +
                                    (parseFloat(formData.otherCosts) || 0)
                                ).toFixed(2)}
                            </span>
                        </div>
                        {formData.price && (
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="font-semibold">Estimated Profit per Unit:</span>
                                <span className={`font-bold ${(parseFloat(formData.price) - (
                                        (parseFloat(formData.costPrice) || 0) +
                                        (parseFloat(formData.boxPrice) || 0) +
                                        (parseFloat(formData.tagPrice) || 0) +
                                        (parseFloat(formData.shippingCost) || 0) +
                                        (parseFloat(formData.otherCosts) || 0)
                                    )) > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    ₹{(
                                        parseFloat(formData.price) - (
                                            (parseFloat(formData.costPrice) || 0) +
                                            (parseFloat(formData.boxPrice) || 0) +
                                            (parseFloat(formData.tagPrice) || 0) +
                                            (parseFloat(formData.shippingCost) || 0) +
                                            (parseFloat(formData.otherCosts) || 0)
                                        )
                                    ).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <Label>SKU (Stock Keeping Unit)</Label>
                <Input
                    value={formData.sku}
                    placeholder="e.g. HH-SNK-001"
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> AI SEO Tools
                        </h4>
                        <p className="text-[10px] text-purple-600">Optimize for Google Search</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateSEO}
                        disabled={isGeneratingSEO}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 h-8 rounded-lg font-bold text-[10px]"
                    >
                        {isGeneratingSEO ? 'Generating...' : 'Magic Generate'}
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-[10px] text-purple-400">SEO Title</Label>
                        <Input
                            className="bg-white border-purple-100 text-xs h-9"
                            value={formData.seoTitle}
                            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-[10px] text-purple-400">SEO Description</Label>
                        <Input
                            className="bg-white border-purple-100 text-xs h-9"
                            value={formData.seoDescription}
                            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                        />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sneakers">Sneakers</SelectItem>
                            <SelectItem value="Sandals">Sandals</SelectItem>
                            <SelectItem value="Boots">Boots</SelectItem>
                            <SelectItem value="Party Wear">Party Wear</SelectItem>
                            <SelectItem value="Sports Shoes">Sports Shoes</SelectItem>
                            <SelectItem value="Ballet">Ballet</SelectItem>
                            <SelectItem value="School">School</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Age Group</Label>
                    <Select value={formData.ageGroup} onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0-3 years">0-3 years</SelectItem>
                            <SelectItem value="3-6 years">3-6 years</SelectItem>
                            <SelectItem value="6-9 years">6-9 years</SelectItem>
                            <SelectItem value="9-12 years">9-12 years</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div>
                <Label>Sizes (comma separated)</Label>
                <Input
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S, M, L, XL"
                    required
                />
            </div>
            <div>
                <Label>Colors (comma separated)</Label>
                <Input
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Red, Blue, Green"
                    required
                />
            </div>
            <div>
                <Label>Stock</Label>
                <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                />
            </div>
            <div>
                <Label>Product Images</Label>
                <ImageUpload
                    images={formData.images}
                    onChange={(images) => setFormData({ ...formData, images })}
                    maxImages={5}
                />
            </div>
            <div>
                <Label>Product Tags</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 p-4 border rounded-lg">
                    {['New Arrivals', 'Trending', 'Boys', 'Girls', 'Best Seller', 'Sale', 'Hampers'].map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.tags.includes(tag)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({ ...formData, tags: [...formData.tags, tag] });
                                    } else {
                                        setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) });
                                    }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-sm font-nunito">{tag}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Select tags to categorize this product in different sections (New Arrivals, Boys, Girls, etc.)
                </p>
            </div>
            <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" variant="hopz" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : product ? 'Save Product' : 'Create Product'}
            </Button>
        </form>
    );
};

const AdminProducts = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [inventoryFile, setInventoryFile] = useState<File | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const bulkStockMutation = useMutation({
        mutationFn: (updates: any[]) => adminAPI.bulkStockUpdate(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Inventory updated successfully! 📦');
            setIsBulkDialogOpen(false);
            setInventoryFile(null);
        },
        onError: () => toast.error('Failed to update inventory')
    });

    const { data: products, isLoading } = useQuery({
        queryKey: ['admin-products'],
        queryFn: async () => {
            const response = await adminAPI.getProducts();
            return response.data;
        },
        enabled: isAdmin
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => adminAPI.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Product created successfully');
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            const details = error.response?.data?.details || 'Failed to create product';
            toast.error(details);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Product updated successfully');
            setIsDialogOpen(false);
            setEditingProduct(null);
        },
        onError: (error: any) => {
            const details = error.response?.data?.details || 'Failed to update product';
            toast.error(details);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminAPI.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Product deleted successfully');
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== deleteMutation.variables));
        },
        onError: () => toast.error('Failed to delete product')
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => adminAPI.bulkDeleteProducts(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Products deleted successfully');
            setSelectedIds([]);
        },
        onError: () => toast.error('Failed to delete products')
    });

    const bulkCreateMutation = useMutation({
        mutationFn: (products: any[]) => adminAPI.bulkCreateProducts(products),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Products imported successfully');
            setIsBulkDialogOpen(false);
        },
        onError: () => toast.error('Failed to import products')
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvData = event.target?.result as string;
            const lines = csvData.split('\n');
            if (lines.length < 2) {
                toast.error('CSV file is empty or missing headers');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const products = lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',').map(v => v.trim());
                const product: any = {};
                headers.forEach((header, index) => {
                    product[header] = values[index];
                });
                return product;
            });

            const cleanedProducts = products.map(p => ({
                ...p,
                sizes: p.sizes ? String(p.sizes).split('|').map((s: string) => s.trim()) : [],
                colors: p.colors ? String(p.colors).split('|').map((c: string) => c.trim()) : [],
                images: p.images ? String(p.images).split('|').map((i: string) => i.trim()) : [],
                tags: p.tags ? String(p.tags).split('|').map((t: string) => t.trim()) : []
            }));

            bulkCreateMutation.mutate(cleanedProducts);
        };
        reader.readAsText(file);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
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
                    Product Management
                </h1>
                <div className="flex flex-wrap gap-4">
                    <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl font-bold border-2 gap-2 hover:bg-primary/5 transition-colors">
                                <Box className="w-4 h-4" />
                                Inventory Control
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black font-fredoka">Bulk Operations</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col items-center text-center cursor-pointer group">
                                        <Upload className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="text-xs font-bold mb-1">Bulk Create</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight">Import new products via CSV</p>
                                        <label className="absolute inset-0 cursor-pointer">
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                disabled={bulkCreateMutation.isPending}
                                            />
                                        </label>
                                    </div>
                                    <div className="p-6 border-2 border-dashed border-pink-100 rounded-3xl bg-pink-50/20 hover:bg-pink-50/50 transition-colors flex flex-col items-center text-center cursor-pointer group relative">
                                        <Box className="w-8 h-8 text-pink-500 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="text-xs font-bold mb-1">Stock Sync</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight">Update stock levels by SKU</p>
                                        <label className="absolute inset-0 cursor-pointer">
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept=".csv"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const csv = event.target?.result as string;
                                                        const lines = csv.split('\n').filter(l => l.trim());
                                                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                                                        const skuIdx = headers.indexOf('sku');
                                                        const stockIdx = headers.indexOf('stock');

                                                        if (skuIdx === -1 || stockIdx === -1) {
                                                            toast.error('CSV must have "sku" and "stock" columns');
                                                            return;
                                                        }

                                                        const updates = lines.slice(1).map(line => {
                                                            const parts = line.split(',');
                                                            return {
                                                                sku: parts[skuIdx].trim(),
                                                                stock: parseInt(parts[stockIdx].trim())
                                                            };
                                                        }).filter(u => u.sku && !isNaN(u.stock));

                                                        bulkStockMutation.mutate(updates);
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                                disabled={bulkStockMutation.isPending}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Operation Status</h4>
                                    {bulkCreateMutation.isPending || bulkStockMutation.isPending ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs font-bold text-primary animate-pulse">Processing bulk update...</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">No active operations</p>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {products && products.length > 0 && (
                        <Button
                            variant="outline"
                            className="rounded-xl font-bold border-2 gap-2"
                            onClick={() => {
                                if (selectedIds.length === products.length) {
                                    setSelectedIds([]);
                                } else {
                                    setSelectedIds(products.map((p: any) => p.id));
                                }
                            }}
                        >
                            {selectedIds.length === products?.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            {selectedIds.length === products?.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    )}

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 gap-2" onClick={() => setEditingProduct(null)}>
                                <Plus className="w-4 h-4" />
                                New Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </DialogTitle>
                            </DialogHeader>
                            <ProductForm
                                product={editingProduct}
                                onSubmit={(data) => {
                                    if (editingProduct) {
                                        updateMutation.mutate({ id: editingProduct.id, data });
                                    } else {
                                        createMutation.mutate(data);
                                    }
                                }}
                                isLoading={createMutation.isPending || updateMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !products || products.length === 0 ? (
                <Card className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-fredoka font-bold mb-2">No products yet</h3>
                    <p className="text-muted-foreground mb-4">Get started by adding your first product</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 pb-24">
                    {products?.filter(Boolean).map((product: any) => (
                        <Card key={product.id} className={`p-6 transition-all duration-200 border-2 ${selectedIds.includes(product.id) ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent'}`}>
                            <div className="flex gap-6 items-start">
                                <div className="pt-2">
                                    <Checkbox
                                        checked={selectedIds.includes(product.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedIds(prev => [...prev, product.id]);
                                            } else {
                                                setSelectedIds(prev => prev.filter(id => id !== product.id));
                                            }
                                        }}
                                        className="h-5 w-5 rounded-md border-2"
                                    />
                                </div>
                                <div className="w-24 h-24 bg-gradient-soft rounded-lg flex items-center justify-center flex-shrink-0">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-contain rounded-lg p-1"
                                        />
                                    ) : (
                                        <Package className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-xl font-fredoka font-bold">{product.name || 'Unnamed Product'}</h3>
                                            <p className="text-[10px] font-black text-primary/60 tracking-widest mb-1">{product.sku || 'NO SKU'}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {product.description || 'No description available'}
                                            </p>
                                        </div>
                                        <Badge className={(product.status || 'ACTIVE') === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}>
                                            {product.status || 'ACTIVE'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Price</p>
                                            <p className="font-nunito font-bold text-primary flex items-center gap-1">
                                                <IndianRupee className="w-4 h-4" />
                                                {(product.discountPrice || product.price || 0)}
                                                {product.discountPrice && (
                                                    <span className="text-sm text-muted-foreground line-through ml-2 flex items-center gap-0.5">
                                                        <IndianRupee className="w-3 h-3" />
                                                        {product.price}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Category</p>
                                            <p className="font-nunito font-semibold">{product.category || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Age Group</p>
                                            <p className="font-nunito font-semibold">{product.ageGroup || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Stock</p>
                                            <p className={`font-nunito font-semibold ${(product.stock || 0) < 10 ? 'text-red-500' : ''}`}>
                                                {product.stock || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingProduct(product);
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
                                                if (confirm('Are you sure you want to delete this product?')) {
                                                    deleteMutation.mutate(product.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
                    <Card className="bg-black/90 text-white border-white/10 shadow-2xl px-6 py-4 rounded-3xl flex items-center gap-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3 pr-8 border-r border-white/20">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-black text-black">
                                {selectedIds.length}
                            </div>
                            <p className="text-sm font-bold tracking-wide">Products Selected</p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="destructive"
                                className="rounded-xl font-bold gap-2 px-6 h-11 shadow-lg shadow-red-500/20"
                                onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
                                        bulkDeleteMutation.mutate(selectedIds);
                                    }
                                }}
                                disabled={bulkDeleteMutation.isPending}
                            >
                                <Trash2 className="w-4 h-4" />
                                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                            </Button>

                            <Button
                                variant="ghost"
                                className="rounded-xl font-bold text-white hover:bg-white/10 px-4 h-11"
                                onClick={() => setSelectedIds([])}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};

export default AdminProducts;
