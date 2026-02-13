import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, cartAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ShoppingCart, Search, SlidersHorizontal, Edit, Star } from 'lucide-react';
import { toast } from 'sonner';
import ShareProduct from '@/components/ShareProduct';
import { ALL_EU_SIZES } from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';

const Products = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [ageGroup, setAgeGroup] = useState(searchParams.get('ageGroup') || '');
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const addToCartMutation = useMutation({
        mutationFn: (data: { productId: string; quantity: number; size: string; color: string }) =>
            cartAPI.add(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Added to bag!');
        },
        onError: () => {
            toast.error('Failed to add to bag');
        }
    });

    const handleAddToCart = async (product: any) => {
        if (!user) {
            toast.info('Please login to add items to cart');
            navigate('/login');
            return;
        }
        addToCartMutation.mutate({
            productId: product.id,
            quantity: 1,
            size: product.sizes[0] || '13',
            color: product.colors[0] || 'Default'
        });
    };

    const handleBuyNow = async (product: any) => {
        if (!user) {
            toast.info('Please login to continue');
            navigate('/login');
            return;
        }
        try {
            await cartAPI.add({
                productId: product.id,
                quantity: 1,
                size: product.sizes[0] || '13',
                color: product.colors[0] || 'Default'
            });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            navigate('/checkout');
        } catch (error) {
            toast.error('Failed to proceed to checkout');
        }
    };

    const [showFilters, setShowFilters] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    const { data: products, isLoading } = useQuery({
        queryKey: ['products', search, category, ageGroup],
        queryFn: async () => {
            const params: any = {};
            if (search) params.search = search;
            if (category) params.category = category;
            if (ageGroup) params.ageGroup = ageGroup;
            const response = await productsAPI.getAll(params);
            return response.data;
        }
    });

    useEffect(() => {
        setSearch(searchParams.get('search') || '');
        setCategory(searchParams.get('category') || '');
        setAgeGroup(searchParams.get('ageGroup') || '');
    }, [searchParams]);

    const handleSearch = () => {
        const params: any = {};
        if (search) params.search = search;
        if (category) params.category = category;
        if (ageGroup) params.ageGroup = ageGroup;
        setSearchParams(params);
    };

    const filteredProducts = products?.filter((p: any) => {
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        const matchesSize = selectedSizes.length === 0 || (p.sizes && p.sizes.some((s: string) => selectedSizes.includes(s)));
        return matchesPrice && matchesSize;
    });

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Shop Kids Shoes | Happy Hopz - Premium Footwear</title>
                <meta name="description" content="Explore our wide collection of premium, comfortable, and stylish kids footwear. From sneakers to sandals, find the perfect pair at Happy Hopz." />
                <meta property="og:title" content="Shop Kids Shoes | Happy Hopz" />
                <meta property="og:description" content="Explore our wide collection of premium, comfortable, and stylish kids footwear." />
            </Helmet>
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <BackButton label="Back to Home" to="/" />

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-fredoka font-bold text-foreground mb-2">
                        Shop All Shoes
                    </h1>
                    <p className="text-muted-foreground font-nunito">
                        Find the perfect pair for your little one
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="mb-8 space-y-4">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search shoes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button onClick={handleSearch} variant="hopz">
                            Search
                        </Button>

                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className="gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                        </Button>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-card rounded-3xl shadow-float border border-primary/10 animate-fade-down">
                            <div className="space-y-2">
                                <label className="text-sm font-fredoka font-bold text-foreground">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">All Categories</SelectItem>
                                        <SelectItem value="Sneakers">Sneakers</SelectItem>
                                        <SelectItem value="Sandals">Sandals</SelectItem>
                                        <SelectItem value="Boots">Boots</SelectItem>
                                        <SelectItem value="Party Wear">Party Wear</SelectItem>
                                        <SelectItem value="Sports Shoes">Sports Shoes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-fredoka font-bold text-foreground">Age Group</label>
                                <Select value={ageGroup} onValueChange={setAgeGroup}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="All Ages" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">All Ages</SelectItem>
                                        <SelectItem value="Infant (0-1y)">Infant (0-1y)</SelectItem>
                                        <SelectItem value="Toddler (1-3y)">Toddler (1-3y)</SelectItem>
                                        <SelectItem value="Junior (3-6y)">Junior (3-6y)</SelectItem>
                                        <SelectItem value="Senior (6-9y)">Senior (6-9y)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-fredoka font-bold text-foreground">Price Filter</label>
                                <div className="flex flex-wrap gap-2">
                                    {[500, 1000, 2000, 5000].map(price => (
                                        <button
                                            key={price}
                                            onClick={() => setPriceRange([0, price])}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${priceRange[1] === price ? 'bg-primary text-white' : 'bg-muted hover:bg-primary/20'
                                                }`}
                                        >
                                            Under ₹{price}
                                        </button>
                                    ))}
                                </div>
                                <Slider
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                    max={10000}
                                    step={100}
                                    className="mt-4"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                    <span>₹0</span>
                                    <span>₹10,000+</span>
                                </div>
                            </div>

                            <div className="space-y-4 md:col-span-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-fredoka font-bold text-foreground">Filter by Size (EU)</label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[10px] h-auto p-0 font-bold text-muted-foreground hover:text-primary"
                                        onClick={() => setSelectedSizes([])}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                                    {ALL_EU_SIZES.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setSelectedSizes(prev =>
                                                    prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                                                );
                                            }}
                                            className={`h-9 rounded-xl text-xs font-bold border-2 transition-all ${selectedSizes.includes(size)
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-muted text-muted-foreground hover:border-primary/30 bg-white'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="mt-4 text-muted-foreground">Loading products...</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-muted-foreground">
                            {filteredProducts?.length || 0} products found
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {filteredProducts?.map((product: any, index: number) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    delay={index * 50}
                                    isAdmin={isAdmin}
                                    onAddToCart={() => handleAddToCart(product)}
                                    onBuyNow={() => handleBuyNow(product)}
                                />
                            ))}
                        </div>

                        {filteredProducts?.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-2xl font-fredoka text-muted-foreground">
                                    No products found
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Try adjusting your filters
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

const ProductCard = ({
    product,
    delay,
    isAdmin,
    onAddToCart,
    onBuyNow
}: {
    product: any;
    delay: number;
    isAdmin: boolean;
    onAddToCart: () => void;
    onBuyNow: () => void;
}) => {
    return (
        <div className="relative">
            {isAdmin && (
                <Link
                    to={`/admin/products?edit=${product.id}`}
                    className="absolute top-12 right-2 md:top-16 md:right-4 w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 animate-fade-in"
                    title="Edit Product"
                >
                    <Edit className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </Link>
            )}

            <Link
                to={`/products/${product.id}`}
                className="group relative bg-card rounded-3xl shadow-card p-3 md:p-6 transition-all duration-300 hover:shadow-float hover:-translate-y-2 animate-fade-up opacity-0 block"
                style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
            >
                {/* Product Image */}
                <div className="relative aspect-[4/5] flex items-center justify-center mb-3 md:mb-6 overflow-hidden rounded-2xl border border-muted/30 bg-white shadow-sm">
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="relative w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                </div>

                {/* Product Info */}
                <div className="space-y-2 md:space-y-3">
                    <h3 className="font-fredoka font-semibold text-sm md:text-xl text-foreground line-clamp-2">
                        {product.name}
                    </h3>

                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 md:gap-2">
                            <span className="text-lg md:text-2xl font-fredoka font-bold text-cyan-600">
                                ₹{product.discountPrice || product.price}
                            </span>
                            {product.discountPrice && (
                                <span className="text-xs md:text-sm text-muted-foreground line-through">
                                    ₹{product.price}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] md:text-xs">
                            <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded font-bold">
                                <span>{(product as any).avgRating?.toFixed(1) || '4.5'}</span>
                                <Star className="w-2.5 h-2.5 fill-white" />
                            </div>
                            <span className="text-muted-foreground">
                                ({(product as any).ratingCount || 0})
                            </span>
                        </div>
                    </div>



                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1.5 md:gap-2 mt-2 md:mt-4">
                        <Button
                            variant="hopz"
                            className="w-full group/btn text-xs md:text-sm bg-cyan border-2 border-cyan-500 text-black hover:bg-cyan/90 font-bold shadow-sm py-1.5 md:py-2 h-8 md:h-10"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAddToCart();
                            }}
                        >
                            <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 text-black transition-transform group-hover/btn:scale-110" />
                            Add to Bag
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-2 border-cyan-700 bg-cyan-400 text-black hover:bg-cyan-500 hover:border-cyan-800 font-bold text-xs md:text-sm shadow-sm py-1.5 md:py-2 h-8 md:h-10"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onBuyNow();
                            }}
                        >
                            Buy Now
                        </Button>
                    </div>
                </div>

                {/* Floating Badge (Refined to New Arrival/Best Seller Only) */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-[45]">
                    {(() => {
                        const allowedTags = ['new arrival', 'best seller'];
                        const tag = product.tags?.find((t: string) =>
                            allowedTags.some(allowed => t.toLowerCase().includes(allowed))
                        );

                        if (tag) {
                            const lowT = tag.toLowerCase();
                            const isNewArrival = lowT.includes('new');

                            return (
                                <span
                                    className={`px-2 py-0.5 md:px-3 md:py-1 ${isNewArrival ? 'bg-[#06b6d4]' : 'bg-orange-500'} text-white text-[10px] md:text-xs font-nunito font-bold rounded-full shadow-sm pointer-events-none animate-fade-in`}
                                >
                                    {tag}
                                </span>
                            );
                        }
                        return null;
                    })()}
                </div>

                <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2 z-50">
                    <ShareProduct product={product} iconOnly className="!w-8 !h-8 md:!w-10 md:!h-10 shadow-lg" />
                </div>
            </Link>
        </div>
    );
};

export default Products;
