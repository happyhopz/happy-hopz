import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsAPI, cartAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ShoppingBag,
    Heart,
    Truck,
    RotateCcw,
    Star,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    MapPin,
    Tag,
    Package,
    Shield,
    Zap,
    Ruler,
    CheckCircle,
    Clock,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import Reviews from '@/components/Reviews';
import ShareProduct from '@/components/ShareProduct';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [adding, setAdding] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [pincode, setPincode] = useState('');
    const [showProductDetails, setShowProductDetails] = useState(true);
    const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
    const [showSizeChart, setShowSizeChart] = useState(false);
    const [showSizeGuider, setShowSizeGuider] = useState(false);

    const { data: product, isLoading: loadingProduct } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await productsAPI.getById(id!);
            return response.data;
        },
        enabled: !!id
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await productsAPI.getAll();
            return response.data;
        }
    });

    const { data: relatedProducts, isLoading: loadingRelated } = useQuery({
        queryKey: ['related-products', product?.category],
        queryFn: async () => {
            const response = await productsAPI.getAll({ category: product?.category });
            return response.data.filter((p: any) => p.id !== id).slice(0, 6);
        },
        enabled: !!product?.category
    });

    // Track recently viewed products
    useEffect(() => {
        if (product) {
            const stored = sessionStorage.getItem('recentlyViewed');
            let list = stored ? JSON.parse(stored) : [];
            list = list.filter((p: any) => p.id !== product.id);
            list.unshift({
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images
            });
            sessionStorage.setItem('recentlyViewed', JSON.stringify(list.slice(0, 10)));
        }
    }, [product]);

    // Reset selection when product changes
    useEffect(() => {
        setSelectedSize('');
        setSelectedColor('');
        setSelectedImageIndex(0);
        window.scrollTo(0, 0);
    }, [id]);

    const handleAddToCart = async () => {
        if (!selectedSize) {
            toast.error('Please select a size');
            return;
        }

        if (!selectedColor) {
            toast.error('Please select a color');
            return;
        }

        setAdding(true);
        try {
            if (!user) {
                // Handle guest cart
                const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
                const existingItemIndex = localCart.findIndex((item: any) =>
                    item.productId === product.id &&
                    item.size === selectedSize &&
                    item.color === selectedColor
                );

                if (existingItemIndex > -1) {
                    localCart[existingItemIndex].quantity += 1;
                } else {
                    localCart.push({
                        id: `guest_${Date.now()}`,
                        productId: product.id,
                        quantity: 1,
                        size: selectedSize,
                        color: selectedColor,
                        product: product
                    });
                }

                localStorage.setItem('cart', JSON.stringify(localCart));
                toast.success('Added to bag!');
                queryClient.invalidateQueries({ queryKey: ['cart'] });
            } else {
                await cartAPI.add({
                    productId: product.id,
                    quantity: 1,
                    size: selectedSize,
                    color: selectedColor
                });
                queryClient.invalidateQueries({ queryKey: ['cart'] });
                toast.success('Added to bag!');
            }
        } catch (error) {
            toast.error('Failed to add to bag');
        } finally {
            setAdding(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            toast.info('Please login to continue');
            navigate('/login?redirect=/checkout');
            return;
        }

        if (!selectedSize) {
            toast.error('Please select a size');
            return;
        }

        if (!selectedColor) {
            toast.error('Please select a color');
            return;
        }

        try {
            await cartAPI.add({
                productId: product.id,
                quantity: 1,
                size: selectedSize,
                color: selectedColor
            });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            navigate('/checkout');
        } catch (error) {
            toast.error('Failed to proceed to checkout');
        }
    };

    const handleWishlist = () => {
        const stored = localStorage.getItem('wishlist');
        let list = stored ? JSON.parse(stored) : [];
        if (isWishlisted) {
            list = list.filter((p: any) => p.id !== product.id);
            toast.success('Removed from wishlist');
        } else {
            list.push({
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images
            });
            toast.success('Added to wishlist!');
        }
        localStorage.setItem('wishlist', JSON.stringify(list));
        setIsWishlisted(!isWishlisted);
    };

    useEffect(() => {
        if (product) {
            const stored = localStorage.getItem('wishlist');
            const list = stored ? JSON.parse(stored) : [];
            setIsWishlisted(list.some((p: any) => p.id === product.id));
        }
    }, [product]);

    const discountPercent = product?.discountPrice
        ? Math.round((1 - product.discountPrice / product.price) * 100)
        : 0;

    if (loadingProduct) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-3xl font-fredoka font-bold">Product not found</h1>
                    <Button variant="hopz" className="mt-4" onClick={() => navigate('/products')}>
                        Back to Shop
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-4">
                {/* Back Button */}
                <div className="mb-4">
                    <BackButton />
                </div>

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link to="/" className="hover:text-primary">Home</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link to="/products" className="hover:text-primary">Products</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link to={`/products?category=${product.category}`} className="hover:text-primary">{product.category}</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Left Side - Image Gallery */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Thumbnail Strip */}
                        <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-visible pb-2 md:pb-0 scrollbar-hide w-full md:w-20">
                            {product.images.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx
                                        ? 'border-primary shadow-md'
                                        : 'border-transparent hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                            {/* Placeholder thumbnails if only 1 image */}
                            {product.images.length === 1 && (
                                <>
                                    <div className="w-16 h-20 rounded-lg bg-muted flex items-center justify-center">
                                        <Package className="w-6 h-6 text-muted-foreground/50" />
                                    </div>
                                    <div className="w-16 h-20 rounded-lg bg-muted flex items-center justify-center">
                                        <Package className="w-6 h-6 text-muted-foreground/50" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Main Image */}
                        <div className="flex-1 grid grid-cols-1 gap-4">
                            <div className="relative bg-white rounded-lg overflow-hidden aspect-[3/4] group flex items-center justify-center border border-border/50">
                                <img
                                    src={product.images[selectedImageIndex] || product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-4 md:p-8"
                                />

                                {/* Floating Badges */}
                                {discountPercent > 0 && (
                                    <Badge
                                        style={{ backgroundColor: '#06b6d4' }}
                                        className="absolute top-4 left-4 text-white font-bold px-3 py-1.5 z-50 shadow-md"
                                    >
                                        SALE {discountPercent}% OFF
                                    </Badge>
                                )}
                                <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">
                                    <button
                                        onClick={handleWishlist}
                                        className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 ${isWishlisted ? 'text-pink-500' : 'text-gray-400'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </button>
                                    <ShareProduct product={product} iconOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Product Info (Sticky) */}
                    <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
                        {/* Brand & Title */}
                        <div>
                            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">Happy Hopz</h2>
                            <h1 className="text-lg text-muted-foreground mt-1">{product.name}</h1>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mt-3">
                                <div className="flex items-center gap-1.5 bg-green-600 text-white px-2.5 py-1 rounded text-sm font-bold">
                                    <span>4.2</span>
                                    <Star className="w-3.5 h-3.5 fill-white" />
                                </div>
                                <span className="text-muted-foreground text-sm">4.2K Ratings</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold text-cyan-600">
                                ₹{product.discountPrice || product.price}
                            </span>
                            {product.discountPrice && (
                                <>
                                    <span className="text-lg text-muted-foreground line-through">
                                        MRP ₹{product.price}
                                    </span>
                                    <span className="text-orange-500 font-bold">
                                        ({discountPercent}% OFF)
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-green-600 text-sm font-medium">inclusive of all taxes</p>

                        {/* Select Size */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-foreground uppercase tracking-wide text-sm">Select Size</h3>
                                <button
                                    onClick={() => setShowSizeChart(true)}
                                    className="text-pink-500 font-bold text-sm hover:underline flex items-center gap-1"
                                >
                                    <Ruler className="w-4 h-4" />
                                    Size Chart
                                </button>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {product.sizes.map((size: string) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`w-14 h-14 rounded-full border-2 font-bold transition-all ${selectedSize === size
                                            ? 'border-blue-600 text-black bg-blue-400 shadow-lg scale-105'
                                            : 'border-gray-300 text-foreground hover:border-blue-500 bg-white'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Select Color */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-foreground uppercase tracking-wide text-sm">
                                Select Color: <span className="font-normal text-muted-foreground capitalize">{selectedColor || 'Choose'}</span>
                            </h3>
                            <div className="flex gap-3 flex-wrap">
                                {product.colors.map((color: string) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${selectedColor === color
                                            ? 'border-pink-600 text-white bg-pink-500 shadow-lg scale-105'
                                            : 'border-gray-300 text-foreground hover:border-pink-500 bg-white'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                            <Button
                                onClick={handleAddToCart}
                                disabled={adding || product.stock === 0}
                                className="w-full sm:flex-1 h-14 text-base font-bold bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                                <ShoppingBag className="w-5 h-5 mr-2" />
                                {adding ? 'ADDING...' : product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                            </Button>
                            <Button
                                onClick={handleWishlist}
                                variant="outline"
                                className={`w-full sm:flex-1 h-14 text-base font-bold border-2 ${isWishlisted
                                    ? 'border-pink-500 text-pink-500 bg-pink-50'
                                    : 'border-muted-foreground/30'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 mr-2 ${isWishlisted ? 'fill-pink-500' : ''}`} />
                                WISHLIST
                            </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                            <Button
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                                variant="outline"
                                className="w-full sm:flex-[2] h-14 text-base font-bold border-2 border-pink-500 text-pink-500 hover:bg-pink-50"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                BUY NOW
                            </Button>
                            <ShareProduct product={product} className="w-full sm:flex-1 h-14 shadow-md" />
                        </div>

                        <Separator />

                        {/* Delivery Options */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-foreground uppercase tracking-wide text-sm flex items-center gap-2">
                                <Truck className="w-5 h-5" />
                                Delivery Options
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    className="flex-1 px-4 py-3 border-2 border-muted-foreground/30 rounded-lg focus:border-pink-500 outline-none transition-all"
                                    maxLength={6}
                                />
                                <Button
                                    variant="ghost"
                                    className="text-pink-500 font-bold hover:bg-pink-50"
                                    onClick={() => {
                                        if (pincode.length === 6) {
                                            toast.success('Delivery available for this pincode!');
                                        } else {
                                            toast.error('Please enter a valid 6-digit pincode');
                                        }
                                    }}
                                >
                                    Check
                                </Button>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-2">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Truck className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold text-sm tracking-wide">ESTIMATED DELIVERY</span>
                                </div>
                                <p className="text-xl font-fredoka font-bold text-blue-900">
                                    {format(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), 'EEEE, MMM dd')} - {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM dd')}
                                </p>
                                <p className="text-xs text-blue-600/80 font-medium">
                                    Express Shipping available for active Happy Hopz members!
                                </p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>100% Original Products</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <RotateCcw className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>Pay on delivery might be available</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>Easy 14 days returns and exchanges</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Best Offers */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-foreground uppercase tracking-wide text-sm flex items-center gap-2">
                                <Tag className="w-5 h-5" />
                                Best Offers
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className=" text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded font-bold">OFFER</span>
                                    <p><strong>10% Instant Discount</strong> on first purchase</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded font-bold">EMI</span>
                                    <p>EMI Available on purchases above ₹3000</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded font-bold">FREE</span>
                                    <p>Free Shipping on all orders</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Product Details Accordion */}
                        <div>
                            <button
                                onClick={() => setShowProductDetails(!showProductDetails)}
                                className="w-full flex items-center justify-between py-4 text-left"
                            >
                                <h3 className="font-bold text-foreground uppercase tracking-wide text-sm">Product Details</h3>
                                {showProductDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            {showProductDetails && (
                                <div className="pb-4 space-y-3 text-sm">
                                    <p className="text-foreground leading-relaxed">{product.description}</p>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div>
                                            <span className="text-muted-foreground">Category</span>
                                            <p className="font-medium">{product.category}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Age Group</span>
                                            <p className="font-medium">{product.ageGroup}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Available Sizes</span>
                                            <p className="font-medium">{product.sizes.join(', ')}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Colors</span>
                                            <p className="font-medium">{product.colors.join(', ')}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Stock</span>
                                            <p className={`font-medium ${product.stock > 10 ? 'text-green-600' : 'text-orange-500'}`}>
                                                {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left!`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivery & Returns Accordion */}
                        <div className="border-t">
                            <button
                                onClick={() => setShowDeliveryDetails(!showDeliveryDetails)}
                                className="w-full flex items-center justify-between py-4 text-left"
                            >
                                <h3 className="font-bold text-foreground uppercase tracking-wide text-sm">Delivery & Returns</h3>
                                {showDeliveryDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            {showDeliveryDetails && (
                                <div className="pb-4 space-y-3 text-sm">
                                    <p>✓ Free delivery on orders above ₹499</p>
                                    <p>✓ Cash on Delivery available</p>
                                    <p>✓ Easy 14-day returns</p>
                                    <p>✓ Items can be exchanged for different sizes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mb-16">
                    <Reviews productId={product.id} />
                </div>

                {/* Similar Products Section */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <section className="py-12 border-t">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold uppercase tracking-wide">Similar Products</h2>
                            <Link
                                to={`/products?category=${product.category}`}
                                className="text-pink-500 font-bold text-sm hover:underline flex items-center"
                            >
                                VIEW ALL <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {relatedProducts.map((p: any) => (
                                <Link key={p.id} to={`/products/${p.id}`} className="group">
                                    <div className="relative bg-card rounded-lg overflow-hidden aspect-[3/4] mb-3">
                                        <img
                                            src={p.images[0]}
                                            alt={p.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {p.discountPrice && (
                                            <Badge className="absolute bottom-2 left-2 bg-pink-500 text-white text-[10px]">
                                                {Math.round((1 - p.discountPrice / p.price) * 100)}% OFF
                                            </Badge>
                                        )}
                                        <button
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => { e.preventDefault(); toast.success('Added to wishlist!'); }}
                                        >
                                            <Heart className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-foreground truncate">Happy Hopz</h4>
                                        <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">₹{p.discountPrice || p.price}</span>
                                            {p.discountPrice && (
                                                <span className="text-xs text-muted-foreground line-through">₹{p.price}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
                {/* Size Confidence Modal Trigger - will be added next */}

                {/* Related Products */}
                <div className="mt-16 border-t pt-12">
                    <h2 className="text-3xl font-fredoka font-bold mb-8">You Might Also Like</h2>
                    {loadingRelated ? (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-64 h-80 bg-muted animate-pulse rounded-3xl shrink-0" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts?.map((p: any) => (
                                <Link key={p.id} to={`/products/${p.id}`} className="group bg-card rounded-3xl p-4 shadow-sm hover:shadow-float transition-all border border-transparent hover:border-primary/10">
                                    <div className="aspect-square bg-muted/20 rounded-2xl flex items-center justify-center mb-4">
                                        <img src={p.images?.[0]} alt={p.name} className="w-32 h-32 object-contain transition-transform group-hover:scale-110" />
                                    </div>
                                    <h3 className="font-fredoka font-bold text-sm line-clamp-2 mb-2">{p.name}</h3>
                                    <p className="text-primary font-bold">₹{p.price}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Sticky Mobile CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[55] bg-white border-t p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] animate-fade-up">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 rounded-xl font-bold border-2 border-primary/20 hover:border-primary/50 text-foreground"
                        onClick={handleAddToCart}
                        disabled={adding}
                    >
                        {adding ? '...' : 'ADD TO BAG'}
                    </Button>
                    <Button
                        variant="hopz"
                        className="flex-[2] h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20"
                        onClick={handleBuyNow}
                    >
                        BUY NOW
                    </Button>
                </div>
            </div>

            {/* Recently Viewed Products */}
            {(() => {
                const stored = sessionStorage.getItem('recentlyViewed');
                const list = stored ? JSON.parse(stored).filter((p: any) => p.id !== id) : [];
                if (list.length === 0) return null;

                return (
                    <section className="bg-muted/30 py-12 border-t border-b">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-fredoka font-bold mb-8 flex items-center gap-3">
                                <Clock className="w-6 h-6 text-primary" />
                                Recently Viewed
                            </h2>
                            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
                                {list.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        to={`/products/${p.id}`}
                                        className="flex-shrink-0 w-48 bg-card rounded-2xl p-4 shadow-sm hover:shadow-card transition-all"
                                    >
                                        <div className="aspect-square bg-white rounded-xl flex items-center justify-center mb-3">
                                            <img src={p.images?.[0]} alt={p.name} className="w-32 h-32 object-contain" />
                                        </div>
                                        <h3 className="font-fredoka font-bold text-sm line-clamp-1">{p.name}</h3>
                                        <p className="text-primary font-bold">₹{p.price}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })()}

            <Footer />

            {/* Size Chart Modal */}
            {showSizeChart && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSizeChart(false)}>
                    <div
                        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-fredoka font-bold">Size Guide</h2>
                            </div>
                            <button
                                onClick={() => setShowSizeChart(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* How to Measure */}
                            <div className="bg-primary/5 rounded-xl p-4 mb-6">
                                <h3 className="font-bold text-sm mb-2">How to Measure:</h3>
                                <ol className="text-sm text-muted-foreground font-nunito space-y-1">
                                    <li>1. Place foot on paper against a wall</li>
                                    <li>2. Mark the longest toe</li>
                                    <li>3. Measure from wall to mark</li>
                                    <li>4. Use the larger foot measurement</li>
                                </ol>
                            </div>

                            {/* Size Chart Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-primary text-white">
                                            <th className="px-2 py-2 text-left font-bold">Size</th>
                                            <th className="px-2 py-2 text-left font-bold">Age</th>
                                            <th className="px-2 py-2 text-left font-bold">US</th>
                                            <th className="px-2 py-2 text-left font-bold">UK</th>
                                            <th className="px-2 py-2 text-left font-bold">EU</th>
                                            <th className="px-2 py-2 text-left font-bold">Inch</th>
                                            <th className="px-2 py-2 text-left font-bold">CM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-nunito">
                                        {[
                                            { ourSize: 'XS', age: '1-3 m', us: '1 C', uk: '0 C', eu: '16', inch: '3.5', cm: '8.9' },
                                            { ourSize: 'XS', age: '3-6 m', us: '2 C', uk: '1 C', eu: '17', inch: '3.75', cm: '9.5' },
                                            { ourSize: 'XS', age: '6-9 m', us: '3 C', uk: '2 C', eu: '18', inch: '4.125', cm: '10.5' },
                                            { ourSize: 'S', age: '10-12 m', us: '4 C', uk: '3 C', eu: '19', inch: '4.5', cm: '11.4' },
                                            { ourSize: 'S', age: '15-18 m', us: '5 C', uk: '4 C', eu: '20', inch: '4.75', cm: '12.1' },
                                            { ourSize: 'S', age: '1.5-2 y', us: '6 C', uk: '5 C', eu: '22', inch: '5.125', cm: '13' },
                                            { ourSize: 'M', age: '2-2.5 y', us: '7 C', uk: '6 C', eu: '23', inch: '5.5', cm: '14' },
                                            { ourSize: 'M', age: '2.5-3 y', us: '8 C', uk: '7 C', eu: '24', inch: '5.75', cm: '14.6' },
                                            { ourSize: 'M', age: '3-4 y', us: '9 C', uk: '8 C', eu: '25', inch: '6.125', cm: '15.6' },
                                            { ourSize: 'L', age: '4-4.5 y', us: '10 C', uk: '9 C', eu: '27', inch: '6.5', cm: '16.5' },
                                            { ourSize: 'L', age: '5 y', us: '11 C', uk: '10 C', eu: '28', inch: '6.75', cm: '17.1' },
                                            { ourSize: 'XL', age: '5-5.5 y', us: '12 C', uk: '11 C', eu: '30', inch: '7.125', cm: '18.1' },
                                            { ourSize: 'XL', age: '5.5-6 y', us: '13 C', uk: '12 C', eu: '31', inch: '7.5', cm: '19.1' },
                                            { ourSize: 'XXL', age: '7 y', us: '1 Y', uk: '13 C', eu: '32', inch: '7.75', cm: '19.7' },
                                            { ourSize: 'XXL', age: '8 y', us: '2 Y', uk: '1 Y', eu: '33', inch: '8.125', cm: '20.6' },
                                        ].map((row, idx) => (
                                            <tr key={`${row.ourSize}-${row.age}`} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-2 py-1.5 font-bold text-primary">{row.ourSize}</td>
                                                <td className="px-2 py-1.5">{row.age}</td>
                                                <td className="px-2 py-1.5">{row.us}</td>
                                                <td className="px-2 py-1.5">{row.uk}</td>
                                                <td className="px-2 py-1.5">{row.eu}</td>
                                                <td className="px-2 py-1.5">{row.inch}</td>
                                                <td className="px-2 py-1.5">{row.cm}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Quick Reference */}
                            <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                                <h4 className="font-bold text-xs mb-2">Quick Size Reference:</h4>
                                <div className="grid grid-cols-3 gap-1 text-xs font-nunito">
                                    <span><strong className="text-primary">XS</strong> = 1-9m</span>
                                    <span><strong className="text-primary">S</strong> = 10m-2y</span>
                                    <span><strong className="text-primary">M</strong> = 2-4y</span>
                                    <span><strong className="text-primary">L</strong> = 4-5y</span>
                                    <span><strong className="text-primary">XL</strong> = 5-6y</span>
                                    <span><strong className="text-primary">XXL</strong> = 7-8y</span>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <a
                                    href="/size-guide"
                                    className="text-primary font-bold text-sm hover:underline"
                                >
                                    View Full Size Guide →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

const SizeGuider = ({ isOpen, onClose, onSelectSize }: { isOpen: boolean, onClose: () => void, onSelectSize: (size: string) => void }) => {
    const [age, setAge] = useState('');
    const [footLength, setFootLength] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const calculateSize = () => {
        if (!footLength) {
            toast.error('Please enter foot length');
            return;
        }

        const len = parseFloat(footLength);
        let recommended = 'M';

        if (len < 12) recommended = 'XS';
        else if (len < 14) recommended = 'S';
        else if (len < 16) recommended = 'M';
        else if (len < 18) recommended = 'L';
        else if (len < 20) recommended = 'XL';
        else recommended = 'XXL';

        setResult(recommended);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-primary text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Ruler className="w-6 h-6" />
                        <h2 className="text-2xl font-fredoka font-bold">Find My Size</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {!result ? (
                        <>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">How old is your child?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['0-1y', '1-3y', '3-6y', '6-9y'].map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setAge(a)}
                                            className={`py-3 rounded-xl border-2 font-bold transition-all ${age === a ? 'border-primary bg-primary/5 text-primary' : 'border-muted text-muted-foreground'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Foot Length (in CM)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="e.g. 14.5"
                                        className="w-full h-14 px-4 rounded-xl border-2 border-muted focus:border-primary outline-none text-lg font-bold"
                                        value={footLength}
                                        onChange={(e) => setFootLength(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">CM</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Place foot on a paper, mark heel and toe, and measure!</p>
                            </div>

                            <Button onClick={calculateSize} className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90">
                                RECOMMEND MY SIZE
                            </Button>
                        </>
                    ) : (
                        <div className="text-center space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Our Recommendation</p>
                                <h3 className="text-6xl font-fredoka font-black text-primary mt-2">SIZE {result}</h3>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-2xl text-sm italic">
                                "This size offers about 0.5cm of wiggle room for growth and comfort."
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setResult(null)}>
                                    RE-MEASURE
                                </Button>
                                <Button className="flex-[2] h-12 rounded-xl bg-green-600 hover:bg-green-700 font-bold" onClick={() => onSelectSize(result)}>
                                    USE THIS SIZE
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
