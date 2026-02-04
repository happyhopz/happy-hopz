import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState<any[]>([]);

    useEffect(() => {
        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
            setWishlist(JSON.parse(storedWishlist));
        }
    }, []);

    const removeFromWishlist = (productId: string) => {
        const newWishlist = wishlist.filter(item => item.id !== productId);
        setWishlist(newWishlist);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        toast.info('Removed from wishlist');
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <BackButton label="Back to Shopping" to="/products" />

                <div className="mb-8">
                    <h1 className="text-4xl font-fredoka font-bold text-foreground mb-2 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                        My Wishlist
                    </h1>
                    <p className="text-muted-foreground font-nunito">
                        Items you've saved for later
                    </p>
                </div>

                {wishlist.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-muted">
                        <Heart className="w-20 h-20 mx-auto text-muted mb-4" />
                        <h2 className="text-2xl font-fredoka font-bold mb-2">Your wishlist is empty</h2>
                        <p className="text-muted-foreground mb-8">Start adding your favorite shoes!</p>
                        <Link to="/products">
                            <Button variant="hopz" className="rounded-full px-8">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlist.map((product) => (
                            <div key={product.id} className="group relative bg-card rounded-3xl shadow-card p-4 transition-all hover:shadow-float">
                                <Link to={`/products/${product.id}`} className="block">
                                    <div className="aspect-square bg-muted/30 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                                        <img
                                            src={product.images?.[0]}
                                            alt={product.name}
                                            className="w-40 h-40 object-contain transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                    <h3 className="font-fredoka font-bold text-lg line-clamp-1">{product.name}</h3>
                                    <p className="text-primary font-fredoka font-bold text-xl mb-4">₹{product.price}</p>
                                </Link>

                                <div className="flex gap-2">
                                    <Link to={`/products/${product.id}`} className="flex-1">
                                        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl gap-2">
                                            <ShoppingBag className="w-4 h-4" />
                                            View
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-muted hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                                        onClick={() => removeFromWishlist(product.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Wishlist;
