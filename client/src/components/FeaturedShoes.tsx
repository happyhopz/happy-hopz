import { Heart, ShoppingCart, Edit, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, cartAPI, contentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ShareProduct from '@/components/ShareProduct';

const FeaturedShoes = () => {
  const { user } = useAuth();
  const { data: featuredContent } = useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      try {
        const response = await contentAPI.get('homepage.featured');
        return response.data;
      } catch (e) {
        return null;
      }
    }
  });

  const content = featuredContent || {
    badge: 'Our Collection',
    title: 'Featured Kids Shoes',
    subtitle: 'Comfort meets style in every step. Pick the perfect pair for your little adventurer!'
  };
  const isAdmin = user?.role === 'ADMIN';

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

  const tags = [
    { tag: 'Best Seller', tagColor: 'bg-orange-500' },
    { tag: 'New', tagColor: 'bg-[#06b6d4]' },
    { tag: 'Sale', tagColor: 'bg-[#06b6d4]' },
  ];

  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await productsAPI.getAll();
      return response.data.slice(0, 6);
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
      size: product.sizes[0] || 'M',
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
        size: product.sizes[0] || 'M',
        color: product.colors[0] || 'Default'
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    }
  };

  if (isLoading) {
    return (
      <section id="featured" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-40 bg-muted rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-10 w-64 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-background rounded-3xl p-6 animate-pulse">
                <div className="h-48 bg-muted rounded-2xl mb-6" />
                <div className="h-6 bg-muted rounded mb-3" />
                <div className="h-8 bg-muted rounded w-24 mb-3" />
                <div className="flex gap-2 mb-4">
                  <div className="h-8 w-8 bg-muted rounded-lg" />
                  <div className="h-8 w-8 bg-muted rounded-lg" />
                  <div className="h-8 w-8 bg-muted rounded-lg" />
                </div>
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section id="featured" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-cyan/50 rounded-full text-sm font-nunito font-semibold text-secondary-foreground mb-4">
            👟 {content.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-foreground">
            {content.title}
          </h2>
          <p className="mt-4 text-muted-foreground font-nunito max-w-md mx-auto">
            {content.subtitle}
          </p>
        </div>

        {/* Shoes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {products.map((product: any, index: number) => (
            <ShoeCard
              key={product.id}
              product={product}
              tag={tags[index % tags.length]}
              delay={index * 100}
              isAdmin={isAdmin}
              onAddToCart={() => handleAddToCart(product)}
              onBuyNow={() => handleBuyNow(product)}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/products">
            <Button variant="outline" size="lg" className="rounded-full border-2 hover:bg-secondary">
              View All Shoes
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  sizes: string[];
  colors: string[];
}

interface TagInfo {
  tag: string;
  tagColor: string;
}

const ShoeCard = ({
  product,
  tag,
  delay,
  isAdmin,
  onAddToCart,
  onBuyNow
}: {
  product: Product;
  tag: TagInfo;
  delay: number;
  isAdmin: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}) => {
  return (
    <div className="relative">
      {/* Admin Edit Button */}
      {isAdmin && (
        <Link
          to={`/admin/products?edit=${product.id}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-16 w-10 h-10 rounded-full bg-blue-500 shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-20"
          title="Edit Product"
        >
          <Edit className="w-5 h-5 text-white" />
        </Link>
      )}

      <Link
        to={`/products/${product.id}`}
        className="group relative bg-background rounded-3xl shadow-card p-3 md:p-6 transition-all duration-300 hover:shadow-float hover:-translate-y-2 animate-fade-up opacity-0 block"
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      >
        {/* Product Image */}
        <div className="relative h-32 md:h-48 flex items-center justify-center mb-3 md:mb-6">
          <div className="absolute inset-0 bg-white rounded-2xl border border-muted/30" />
          <img
            src={product.images[0]}
            alt={product.name}
            className="relative h-28 w-28 md:h-40 md:w-40 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="font-fredoka font-semibold text-sm md:text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>

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

        {/* Floating Badges */}
        <span
          style={tag.tag.toLowerCase().includes('sale') || tag.tag.toLowerCase().includes('new') ? { backgroundColor: '#06b6d4' } : {}}
          className={`absolute top-2 left-2 md:top-4 md:left-4 px-2 py-0.5 md:px-3 md:py-1 ${tag.tagColor} text-white text-[10px] md:text-xs font-nunito font-bold rounded-full z-50 shadow-md pointer-events-none`}
        >
          {tag.tag}
        </span>

        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2 z-50">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-card shadow-soft flex items-center justify-center transition-transform hover:scale-110 group-hover:bg-pink/20"
          >
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-pink transition-colors" />
          </button>
          <ShareProduct product={product} iconOnly className="!w-8 !h-8 md:!w-10 md:!h-10 shadow-soft" />
        </div>
      </Link>
    </div>
  );
};

export default FeaturedShoes;
