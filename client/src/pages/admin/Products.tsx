import { useState } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
import { Plus, Edit, Trash2, Package, IndianRupee, Upload, FileText, AlertCircle, Sparkles, Box, CheckSquare, Square, Check, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ALL_EU_SIZES } from '@/lib/constants';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const SortableProductItem = ({ product, isSelected, onToggleSelect, onEdit, onDelete }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`p-6 transition-all duration-200 border-2 ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent'} ${isDragging ? 'shadow-2xl' : ''}`}
        >
            <div className="flex gap-6 items-start">
                <div className="pt-2 flex flex-col gap-4 items-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        className="h-5 w-5 rounded-md border-2"
                    />
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
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
                            onClick={() => onEdit(product)}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(product.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
const ProductForm = ({ product, onSubmit, isLoading }: any) => {
    const initialSizes = product?.sizes || [];
    const initialInventory = (Array.isArray(product?.inventory) ? product.inventory : []).filter((i: any) => initialSizes.includes(i.size));

    // Auto-sync: Add missing entries to inventory if they exist in sizes
    initialSizes.forEach((size: string) => {
        if (!initialInventory.find((i: any) => i.size === size)) {
            initialInventory.push({ size, stock: product?.stock || 0 });
        }
    });

    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        discountPrice: product?.discountPrice || '',
        category: product?.category || 'Sneakers',
        ageGroup: product?.ageGroup || '3-6 years',
        sizes: initialSizes,
        inventory: initialInventory.sort((a: any, b: any) => parseInt(a.size) - parseInt(b.size)),
        colors: product?.colors?.join(', ') || 'Red, Blue, Green',
        stock: product?.stock || 0,
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
        seoDescription: product?.seoDescription || '',
        avgRating: product?.avgRating || 4.5,
        ratingCount: product?.ratingCount || 0
    });

    const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

    const handleGenerateSEO = async () => {
        if (!formData.name) {
            toast.error('Please enter a product name first');
            return;
        }
        setIsGeneratingSEO(true);
        try {
            // Local fallback for new products
            if (!product?.id) {
                const seoTitle = `${formData.name} - Premium Kids Footwear | Happy Hopz`;
                const seoDescription = `Shop the latest ${formData.name} from Happy Hopz. Specialized ${formData.category} for ${formData.ageGroup} with 18% GST benefits and free shipping above ₹999.`;

                setFormData({
                    ...formData,
                    seoTitle,
                    seoDescription
                });
                toast.success('Local SEO metadata generated! ✨');
                return;
            }

            const response = await adminAPI.generateSEO(product.id);
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

        // Helper for numeric sanitation
        const parseNum = (val: any) => (val === undefined || val === null || val === '') ? null : parseFloat(String(val));

        // Comprehensive Fix: Ensure all types are correct before sending to API
        const submissionData = {
            ...formData,
            price: parseNum(formData.price) || 0,
            discountPrice: parseNum(formData.discountPrice),
            costPrice: parseNum(formData.costPrice),
            boxPrice: parseNum(formData.boxPrice),
            tagPrice: parseNum(formData.tagPrice),
            shippingCost: parseNum(formData.shippingCost),
            otherCosts: parseNum(formData.otherCosts),
            stock: parseNum(formData.stock) || 0,
            sizes: Array.isArray(formData.sizes) ? formData.sizes.map((s: any) => String(s).trim()) : [],
            inventory: formData.inventory,
            colors: typeof formData.colors === 'string' ? formData.colors.split(',').map((c: any) => c.trim()) : formData.colors,
            tags: formData.tags || [],
            avgRating: parseNum(formData.avgRating) || 4.5,
            ratingCount: parseNum(formData.ratingCount) || 0
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
                    <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs text-gray-500 uppercase font-black tracking-widest">
                            <span>Cost Breakdown</span>
                            <span className="text-primary font-bold">Calculated Per Unit</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                <span className="text-sm font-bold text-gray-700">Total Cost per Unit</span>
                                <span className="font-black text-pink-600">
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
                                <>
                                    {/* Calculated Effective Price */}
                                    {(() => {
                                        const effectivePrice = parseFloat(formData.discountPrice) || parseFloat(formData.price) || 0;
                                        const totalCost = (
                                            (parseFloat(formData.costPrice) || 0) +
                                            (parseFloat(formData.boxPrice) || 0) +
                                            (parseFloat(formData.tagPrice) || 0) +
                                            (parseFloat(formData.shippingCost) || 0) +
                                            (parseFloat(formData.otherCosts) || 0)
                                        );
                                        const profitPerPair = effectivePrice - totalCost;
                                        const totalProfit = profitPerPair * (parseInt(formData.stock) || 0);

                                        return (
                                            <>
                                                <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg border border-green-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-green-700">Profit (1 Pair)</span>
                                                        <p className="text-[10px] text-green-600/70 font-bold uppercase tracking-tighter">
                                                            {formData.discountPrice ? 'Discount Price' : 'Selling Price'} - Total Cost
                                                        </p>
                                                    </div>
                                                    <span className="font-black text-green-700 text-lg">
                                                        ₹{profitPerPair.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border-2 border-primary/20 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-primary uppercase tracking-tight">Total Inventory Profit</span>
                                                        <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">₹{profitPerPair.toFixed(2)} × {formData.stock || 0} units</p>
                                                    </div>
                                                    <span className="font-black text-primary text-2xl">
                                                        ₹{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Ratings Section */}
            <div className="border-t pt-4 mt-2">
                <Label className="text-base font-semibold mb-3 block">Storefront Ratings (Managed)</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm">Average Rating (0-5)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={formData.avgRating}
                            onChange={(e) => setFormData({ ...formData, avgRating: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-sm">Rating Count (Total Reviews)</Label>
                        <Input
                            type="number"
                            step="1"
                            min="0"
                            value={formData.ratingCount}
                            onChange={(e) => setFormData({ ...formData, ratingCount: e.target.value })}
                        />
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                    These values appear on the storefront to build customer trust.
                </p>
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
                            <SelectItem value="Hampers">Hampers</SelectItem>
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
                            <SelectItem value="12+ years">12+ years</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-cyan-50 border border-cyan-100 rounded-xl mb-4">
                <Checkbox
                    id="oneSize"
                    checked={formData.sizes.length === 1 && formData.sizes[0] === 'One Size'}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            setFormData({
                                ...formData,
                                sizes: ['One Size'],
                                inventory: [{ size: 'One Size', stock: formData.stock || 10 }]
                            });
                        } else {
                            setFormData({
                                ...formData,
                                sizes: [],
                                inventory: []
                            });
                        }
                    }}
                />
                <Label htmlFor="oneSize" className="text-sm font-bold text-cyan-900 cursor-pointer">
                    This is a Single Size product (e.g. Hampers, Newborn Sets)
                </Label>
            </div>

            <div className={formData.sizes[0] === 'One Size' ? 'hidden' : 'block'}>
                <Label className="mb-2 block">Available Sizes (EU) & Stock</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-2xl bg-gray-50/30">
                    {ALL_EU_SIZES.map((size) => {
                        const isSelected = formData.sizes.includes(size);
                        const sizeStock = formData.inventory.find((i: any) => i.size === size)?.stock || 0;

                        return (
                            <div key={size} className={`flex flex-col p-4 rounded-xl border-2 transition-all duration-200 ${isSelected ? 'border-primary bg-white shadow-md' : 'border-gray-100 bg-white/50 opacity-60'}`}>
                                <label className="flex items-center gap-3 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const newSizes = [...formData.sizes, size].sort((a, b) => parseInt(a) - parseInt(b));
                                                const newInventory = [...formData.inventory, { size, stock: 10 }].sort((a, b) => parseInt(a.size) - parseInt(b.size));
                                                setFormData({ ...formData, sizes: newSizes, inventory: newInventory });
                                            } else {
                                                const newSizes = formData.sizes.filter((s: string) => s !== size);
                                                const newInventory = formData.inventory.filter((i: any) => i.size !== size);
                                                setFormData({ ...formData, sizes: newSizes, inventory: newInventory });
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-black text-foreground">EU {size}</span>
                                </label>
                                {isSelected && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Current Stock</p>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={sizeStock === 0 ? '' : sizeStock}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : parseInt(e.target.value.replace(/\D/g, ''));
                                                const newInventory = formData.inventory.map((i: any) =>
                                                    i.size === size ? { ...i, stock: isNaN(val) ? 0 : val } : i
                                                );
                                                const newTotalStock = newInventory.reduce((sum: number, i: any) => sum + (parseInt(i.stock) || 0), 0);
                                                setFormData({ ...formData, inventory: newInventory, stock: newTotalStock });
                                            }}
                                            className="h-10 text-sm font-bold border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 px-1">
                    Select active sizes and enter current stock levels for each.
                </p>
            </div>

            {formData.sizes[0] === 'One Size' && (
                <div>
                    <Label>Total Stock for this Hamper/Set</Label>
                    <Input
                        type="number"
                        value={formData.inventory[0]?.stock || 0}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFormData({
                                ...formData,
                                stock: val,
                                inventory: [{ size: 'One Size', stock: val }]
                            });
                        }}
                        className="font-bold border-primary text-primary bg-primary/5"
                        placeholder="Enter total stock quantity"
                    />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Since this is a One Size product, just enter the total quantity available.
                    </p>
                </div>
            )}
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
                <Label>Total Stock (Auto-calculated)</Label>
                <Input
                    type="number"
                    value={formData.stock}
                    readOnly
                    className="bg-gray-50 font-bold text-primary"
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
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [localProducts, setLocalProducts] = useState<any[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const [sortBy, setSortBy] = useState('newest');

    const { data: products, isLoading } = useQuery({
        queryKey: ['admin-products'],
        queryFn: async () => {
            const response = await adminAPI.getProducts();
            setLocalProducts(response.data);
            return response.data;
        },
        enabled: isAdmin
    });

    const reorderMutation = useMutation({
        mutationFn: (orders: { id: string; order: number }[]) => adminAPI.reorderProducts(orders),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('New order saved! 🚀');
            setIsReorderMode(false);
        },
        onError: () => toast.error('Failed to save reorder')
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalProducts((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveReorder = () => {
        const orders = localProducts.map((p, index) => ({
            id: p.id,
            order: index
        }));
        reorderMutation.mutate(orders);
    };

    const sortedProducts = products ? [...products].sort((a: any, b: any) => {
        if (sortBy === 'stock-low') return (a.stock || 0) - (b.stock || 0);
        if (sortBy === 'stock-high') return (b.stock || 0) - (a.stock || 0);
        if (sortBy === 'price-low') return (a.discountPrice || a.price || 0) - (b.discountPrice || b.price || 0);
        if (sortBy === 'price-high') return (b.discountPrice || b.price || 0) - (a.discountPrice || a.price || 0);
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
    }) : [];

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

    // ─── Excel Export with Images ─────────────────────────────────────────────
    const exportToExcel = async () => {
        if (!products || products.length === 0) {
            toast.error('No products to export');
            return;
        }

        const toastId = toast.loading('Generating Excel file with images... This may take a moment. ⏳');

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Happy Hopz Admin';
            workbook.lastModifiedBy = 'Happy Hopz Admin';
            workbook.created = new Date();
            workbook.modified = new Date();

            const sheet = workbook.addWorksheet('Inventory', {
                properties: { tabColor: { argb: 'FF06B6D4' } },
                views: [{ state: 'frozen', ySplit: 1 }]
            });

            // Define columns
            const columns = [
                { header: 'Image', key: 'image', width: 15 },
                { header: 'Product Name', key: 'name', width: 35 },
                { header: 'SKU', key: 'sku', width: 18 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Age Group', key: 'ageGroup', width: 15 },
                { header: 'Tags', key: 'tags', width: 20 },
                { header: 'Colors', key: 'colors', width: 20 },
                { header: 'Sizes Available', key: 'sizes', width: 25 },
                { header: 'Selling Price (₹)', key: 'sellingPrice', width: 18 },
                { header: 'MRP (₹)', key: 'mrp', width: 12 },
                { header: 'Cost Price (₹)', key: 'costPrice', width: 15 },
                { header: 'Total Cost (₹)', key: 'totalCost', width: 15 },
                { header: 'Profit/Pair (₹)', key: 'profit', width: 15 },
                { header: 'Total Stock', key: 'stock', width: 12 },
                { header: 'Total Profit (₹)', key: 'totalProfit', width: 18 },
            ];

            // Add dynamic size columns
            ALL_EU_SIZES.forEach((sz) => columns.push({ header: `Stock EU${sz}`, key: `size_${sz}`, width: 12 }));
            columns.push({ header: 'Stock One Size', key: `size_One Size`, width: 15 });

            // Add remaining columns
            columns.push(
                { header: 'SEO Title', key: 'seoTitle', width: 30 },
                { header: 'SEO Description', key: 'seoDesc', width: 40 },
                { header: 'Avg Rating', key: 'rating', width: 12 },
                { header: 'Rating Count', key: 'ratingCount', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 15 }
            );

            sheet.columns = columns;

            // Style header row
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF0F172A' }
                };
            });

            // Process products
            for (let i = 0; i < products.length; i++) {
                const p = products[i];
                const rowIndex = i + 2; // +1 for 1-based index, +1 for header
                
                // Parse arrays
                const inventory: { size: string; stock: number }[] = Array.isArray(p.inventory) ? p.inventory : (() => { try { return JSON.parse(p.inventory || '[]'); } catch { return []; } })();
                const images: string[] = Array.isArray(p.images) ? p.images : (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })();
                const tags: string[] = Array.isArray(p.tags) ? p.tags : (() => { try { return JSON.parse(p.tags || '[]'); } catch { return []; } })();
                const colors: string[] = Array.isArray(p.colors) ? p.colors : (typeof p.colors === 'string' ? p.colors.split(',').map((c: string) => c.trim()) : []);
                const sizes: string[] = Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === 'string' ? p.sizes.split(',').map((s: string) => s.trim()) : []);

                // Cost calculations
                const totalCost = (p.costPrice || 0) + (p.boxPrice || 0) + (p.tagPrice || 0) + (p.shippingCost || 0) + (p.otherCosts || 0);
                const sellingPrice = p.discountPrice || p.price || 0;
                const profitPerPair = sellingPrice - totalCost;

                // Build row data
                const rowData: any = {
                    name: p.name || '',
                    sku: p.sku || '',
                    status: p.status || 'ACTIVE',
                    category: p.category || '',
                    ageGroup: p.ageGroup || '',
                    tags: tags.join(', '),
                    colors: colors.join(', '),
                    sizes: sizes.join(', '),
                    sellingPrice: sellingPrice || '',
                    mrp: p.price || '',
                    costPrice: p.costPrice || '',
                    totalCost: totalCost > 0 ? totalCost : '',
                    profit: totalCost > 0 ? profitPerPair : '',
                    stock: p.stock || 0,
                    totalProfit: totalCost > 0 ? profitPerPair * (p.stock || 0) : '',
                    seoTitle: p.seoTitle || '',
                    seoDesc: p.seoDescription || '',
                    rating: p.avgRating || '',
                    ratingCount: p.ratingCount || 0,
                    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''
                };

                // Add size stocks
                ALL_EU_SIZES.forEach((sz) => {
                    const entry = inventory.find((inv) => inv.size === sz);
                    if (entry) rowData[`size_${sz}`] = entry.stock;
                });
                const oneSizeEntry = inventory.find((inv) => inv.size === 'One Size');
                if (oneSizeEntry) rowData[`size_One Size`] = oneSizeEntry.stock;

                const row = sheet.addRow(rowData);
                row.height = 90; // Make row tall enough for image
                row.alignment = { vertical: 'middle', wrapText: true };

                // Fetch, resize, and embed image
                if (images.length > 0 && images[0]) {
                    try {
                        const response = await fetch(images[0]);
                        const blob = await response.blob();
                        
                        const processedBuffer = await new Promise<ArrayBuffer | null>((resolve) => {
                            const img = new Image();
                            const objectUrl = URL.createObjectURL(blob);
                            img.onload = () => {
                                URL.revokeObjectURL(objectUrl);
                                const canvas = document.createElement('canvas');
                                const SIZE = 120; // 120x120 square for perfect uniform alignment
                                canvas.width = SIZE;
                                canvas.height = SIZE;
                                const ctx = canvas.getContext('2d');
                                if (!ctx) return resolve(null);

                                // White background
                                ctx.fillStyle = '#FFFFFF';
                                ctx.fillRect(0, 0, SIZE, SIZE);

                                // Calculate padded object-fit: contain
                                const PADDING = 10;
                                const innerSize = SIZE - (PADDING * 2);
                                const scale = Math.min(innerSize / img.width, innerSize / img.height);
                                const w = img.width * scale;
                                const h = img.height * scale;
                                const x = (SIZE - w) / 2;
                                const y = (SIZE - h) / 2;

                                ctx.drawImage(img, x, y, w, h);

                                // Export compressed jpeg
                                canvas.toBlob((b) => {
                                    if (b) {
                                        b.arrayBuffer().then(resolve);
                                    } else {
                                        resolve(null);
                                    }
                                }, 'image/jpeg', 0.85);
                            };
                            img.onerror = () => {
                                URL.revokeObjectURL(objectUrl);
                                resolve(null);
                            };
                            img.src = objectUrl;
                        });

                        if (processedBuffer) {
                            const imageId = workbook.addImage({
                                buffer: processedBuffer,
                                extension: 'jpeg',
                            });

                            // Add image to cell A{rowIndex} using exact pixel payload so it doesn't stretch
                            sheet.addImage(imageId, {
                                tl: { col: 0.1, row: rowIndex - 1 + 0.1 },
                                ext: { width: 100, height: 100 },
                                editAs: 'oneCell'
                            });
                        } else {
                            sheet.getCell(`A${rowIndex}`).value = '(Image Failed)';
                        }
                    } catch (imgError) {
                        console.error(`Failed to process image for ${p.name}:`, imgError);
                        sheet.getCell(`A${rowIndex}`).value = '(Fetch Error)';
                    }
                } else {
                    sheet.getCell(`A${rowIndex}`).value = '(No Image)';
                }
            }

            // Generate and save
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const timestamp = new Date().toISOString().slice(0, 10);
            saveAs(blob, `happyhopz-inventory-visual-${timestamp}.xlsx`);
            
            toast.dismiss(toastId);
            toast.success(`Exported ${products.length} products with images! 🖼️📊`);
            
        } catch (error) {
            console.error('Export error:', error);
            toast.dismiss(toastId);
            toast.error('Failed to generate Excel file');
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

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

                    <Select value={sortBy} onValueChange={setSortBy} disabled={isReorderMode}>
                        <SelectTrigger className="w-[180px] rounded-xl font-bold border-2">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="stock-low">Stock: Low to High</SelectItem>
                            <SelectItem value="stock-high">Stock: High to Low</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant={isReorderMode ? "hopz" : "outline"}
                        className="rounded-xl font-bold border-2 gap-2"
                        onClick={() => {
                            if (isReorderMode) {
                                handleSaveReorder();
                            } else {
                                setIsReorderMode(true);
                                setSortBy('manual'); // Internal state for manual sort
                                setLocalProducts(products || []);
                            }
                        }}
                        disabled={reorderMutation.isPending}
                    >
                        {isReorderMode ? (
                            <>
                                <Check className="w-4 h-4" />
                                Save Order
                            </>
                        ) : (
                            <>
                                <GripVertical className="w-4 h-4" />
                                Reorder
                            </>
                        )}
                    </Button>

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

                    {/* Export to Excel */}
                    {products && products.length > 0 && (
                        <Button
                            variant="outline"
                            className="rounded-xl font-bold border-2 gap-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                            onClick={exportToExcel}
                        >
                            <Download className="w-4 h-4" />
                            Export Excel
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
                                key={editingProduct?.id || 'new'}
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
                    {isReorderMode ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={localProducts.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {localProducts.map((product) => (
                                    <SortableProductItem
                                        key={product.id}
                                        product={product}
                                        isSelected={selectedIds.includes(product.id)}
                                        onToggleSelect={(checked: boolean) => {
                                            if (checked) {
                                                setSelectedIds(prev => [...prev, product.id]);
                                            } else {
                                                setSelectedIds(prev => prev.filter(id => id !== product.id));
                                            }
                                        }}
                                        onEdit={(p: any) => {
                                            setEditingProduct(p);
                                            setIsDialogOpen(true);
                                        }}
                                        onDelete={(id: string) => {
                                            if (confirm('Are you sure you want to delete this product?')) {
                                                deleteMutation.mutate(id);
                                            }
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    ) : (
                        sortedProducts.filter(Boolean).map((product: any) => (
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
                        ))
                    )}
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
