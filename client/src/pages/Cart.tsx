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
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: cartItems, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartAPI.get();
            return response.data;
        },
        enabled: !!user
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
            cartAPI.update(id, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Cart updated');
        }
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => cartAPI.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed');
        }
    });

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <ShoppingBag className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-3xl font-fredoka font-bold mb-4">Please Login</h1>
                    <p className="text-muted-foreground mb-6">Login to view your cart</p>
                    <Button variant="hopz" onClick={() => navigate('/login')}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

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
                                <Card key={item.id} className="p-6">
                                    <div className="flex gap-6">
                                        {/* Product Image */}
                                        <div className="w-32 h-32 bg-gradient-soft rounded-xl flex items-center justify-center flex-shrink-0">
                                            <img
                                                src={item.product?.images?.[0]}
                                                alt={item.product?.name}
                                                className="w-24 h-24 object-contain"
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-fredoka font-bold mb-1">
                                                {item.product?.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Size: {item.size} | Color: {item.color}
                                            </p>
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-2xl font-fredoka font-bold text-primary">
                                                    ₹{item.product?.discountPrice || item.product?.price}
                                                </span>
                                                {item.product?.discountPrice && (
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        ₹{item.product?.price}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
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
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="text-lg font-fredoka font-bold w-12 text-center">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => updateMutation.mutate({
                                                        id: item.id,
                                                        quantity: item.quantity + 1
                                                    })}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeMutation.mutate(item.id)}
                                        >
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </Button>
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
