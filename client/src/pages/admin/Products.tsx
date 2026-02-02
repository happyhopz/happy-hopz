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
import { Plus, Edit, Trash2, Package, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const AdminProducts = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

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
        onError: () => toast.error('Failed to create product')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Product updated successfully');
            setIsDialogOpen(false);
            setEditingProduct(null);
        },
        onError: () => toast.error('Failed to update product')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminAPI.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Product deleted successfully');
        },
        onError: () => toast.error('Failed to delete product')
    });

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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="hopz" onClick={() => setEditingProduct(null)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
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
                <div className="grid grid-cols-1 gap-4">
                    {products?.filter(Boolean).map((product: any) => (
                        <Card key={product.id} className="p-6">
                            <div className="flex gap-6">
                                <div className="w-24 h-24 bg-gradient-soft rounded-lg flex items-center justify-center flex-shrink-0">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-20 h-20 object-contain"
                                        />
                                    ) : (
                                        <Package className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-xl font-fredoka font-bold">{product.name || 'Unnamed Product'}</h3>
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
        </>
    );
};

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
        tags: product?.tags || []
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            sizes: formData.sizes.split(',').map(s => s.trim()),
            colors: formData.colors.split(',').map(c => c.trim())
        });
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
            <div className="grid grid-cols-2 gap-4">
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
                    {['New Arrivals', 'Trending', 'Boys', 'Girls', 'Best Seller', 'Sale'].map((tag) => (
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
                {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
        </form>
    );
};

export default AdminProducts;
