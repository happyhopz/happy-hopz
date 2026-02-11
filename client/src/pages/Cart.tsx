import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const queryClient = useQueryClient();

    const { data: cartItems, isLoading } = useQuery({
        queryKey: ['cart', user?.id],
        queryFn: async () => {
            if (!user) {
                const localCart = localStorage.getItem('cart');
                return localCart ? JSON.parse(localCart) : [];
            }
            const response = await cartAPI.get();
            return response.data;
        },
        enabled: !loading
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
            if (!user) {
                const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
                const itemIndex = localCart.findIndex((item: any) => item.id === id);
                if (itemIndex > -1) {
                    localCart[itemIndex].quantity = quantity;
                    localStorage.setItem('cart', JSON.stringify(localCart));
                }
                return { data: localCart };
            }
            return cartAPI.update(id, quantity);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Cart updated');
        }
    });

    const removeMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) {
                const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
                const filteredCart = localCart.filter((item: any) => item.id !== id);
                localStorage.setItem('cart', JSON.stringify(filteredCart));
                return { data: filteredCart };
            }
            return cartAPI.remove(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed');
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const total = cartItems?.reduce((sum: number, item: any) => {
        const price = item.product?.discountPrice || item.product?.price || 0;
        return sum + (price * item.quantity);
    }, 0) || 0;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <BackButton label="Continue Shopping" to="/products" />

                <h1 className="text-4xl font-fredoka font-bold text-foreground mb-8">
                    Shopping Cart
                </h1>

                {!cartItems || cartItems.length === 0 ? (
                    <div className="text-center py-20">
                        <ShoppingBag className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-2xl font-fredoka font-bold mb-2">Your cart is empty</h2>
                        <p className="text-muted-foreground mb-6">Add some shoes to get started!</p>
                        <Button variant="hopz" onClick={() => navigate('/products')}>
                            Browse Products
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item: any) => (
                                <Card key={item.id} className="p-0 md:p-6 relative overflow-hidden group">
                                    <div className="flex flex-col md:flex-row gap-0 md:gap-6 items-stretch md:items-center">
                                        {/* Product Image - Full width on mobile, compact on desktop */}
                                        <div className="w-full h-72 md:w-40 md:h-40 bg-gradient-soft flex items-center justify-center flex-shrink-0 border-b md:border border-muted/20">
                                            <img
                                                src={item.product?.images?.[0]}
                                                alt={item.product?.name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Product Info - Padded on mobile */}
                                        <div className="flex-1 p-4 md:p-0 pr-8 md:pr-12">
                                            <h3 className="text-xl md:text-xl font-fredoka font-bold mb-1 line-clamp-2 text-foreground">
                                                {item.product?.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Size: <span className="font-semibold">{item.size}</span> | Color: <span className="font-semibold">{item.color}</span>
                                            </p>

                                            <div className="flex items-center justify-between md:justify-start gap-4 mb-4 md:mb-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-fredoka font-bold text-cyan-600">
                                                        ₹{item.product?.discountPrice || item.product?.price}
                                                    </span>
                                                    {item.product?.discountPrice && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            ₹{item.product?.price}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quantity Controls - Larger on mobile */}
                                            <div className="flex items-center justify-between md:justify-start gap-6">
                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="w-10 h-10 md:w-10 md:h-10 rounded-full border-cyan-200 hover:bg-cyan-50"
                                                        onClick={() => {
                                                            if (item.quantity > 1) {
                                                                updateMutation.mutate({
                                                                    id: item.id,
                                                                    quantity: item.quantity - 1
                                                                });
                                                            } else {
                                                                removeMutation.mutate(item.id);
                                                            }
                                                        }}
                                                    >
                                                        <Minus className="w-4 h-4 text-cyan-600" />
                                                    </Button>
                                                    <span className="text-xl font-fredoka font-bold w-8 text-center text-foreground">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="w-10 h-10 md:w-10 md:h-10 rounded-full border-cyan-200 hover:bg-cyan-50"
                                                        onClick={() => {
                                                            const sizeStock = item.product?.inventory?.find((i: any) => i.size === item.size)?.stock ?? 10;
                                                            if (item.quantity < sizeStock) {
                                                                updateMutation.mutate({
                                                                    id: item.id,
                                                                    quantity: item.quantity + 1
                                                                });
                                                            } else {
                                                                toast.error(`Only ${sizeStock} pairs available in size ${item.size}`);
                                                            }
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4 text-cyan-600" />
                                                    </Button>
                                                </div>

                                                <div className="md:hidden">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total</p>
                                                    <p className="text-lg font-fredoka font-bold text-foreground">
                                                        ₹{((item.product?.discountPrice || item.product?.price) * item.quantity).toFixed(0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove Button - Top Right Always */}
                                        <button
                                            onClick={() => removeMutation.mutate(item.id)}
                                            className="absolute top-3 right-3 p-2 bg-white/80 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none text-muted-foreground hover:text-destructive transition-colors rounded-full shadow-sm md:shadow-none"
                                            title="Remove from cart"
                                        >
                                            <Trash2 className="w-6 h-6 md:w-5 md:h-5 text-red-500 md:text-destructive" />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div>
                            <Card className="p-6 sticky top-24">
                                <h2 className="text-2xl font-fredoka font-bold mb-6">Order Summary</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-nunito font-semibold">₹{total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-nunito font-semibold text-primary">Free</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between">
                                        <span className="text-xl font-fredoka font-bold">Total</span>
                                        <span className="text-2xl font-fredoka font-bold text-primary">
                                            ₹{total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="hopz"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate('/checkout')}
                                >
                                    Proceed to Checkout
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full mt-3"
                                    onClick={() => navigate('/products')}
                                >
                                    Continue Shopping
                                </Button>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Cart;
