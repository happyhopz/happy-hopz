import { Link } from 'react-router-dom';
import { Gift, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

const HamperSection = () => {
    const { data: hampers, isLoading } = useQuery({
        queryKey: ['hamper-products'],
        queryFn: async () => {
            const response = await productsAPI.getAll({ category: 'Hampers', limit: 4 });
            return response.data;
        }
    });

    if (!isLoading && (!hampers || hampers.length === 0)) {
        return null;
    }

    return (
        <section className="py-20 relative overflow-hidden bg-gradient-to-b from-white to-pink-50/30">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-100 border-2 border-pink-200 rounded-full mb-4">
                            <Gift className="w-4 h-4 text-pink-600" />
                            <span className="text-xs font-nunito font-black uppercase tracking-widest text-pink-700">
                                Gifts for Every Occasion
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-fredoka font-bold text-foreground">
                            Exclusive <span className="text-pink-600">Gift Hampers</span>
                        </h2>
                        <p className="mt-4 text-muted-foreground font-nunito max-w-md">
                            Specialized footwear hampers curated with love for your little ones. Perfect for birthdays and celebrations!
                        </p>
                    </div>

                    <Link to="/products?category=Hampers">
                        <Button variant="outline" className="rounded-full border-2 border-pink-200 hover:bg-pink-50 hover:text-pink-600 font-bold group">
                            View All Hampers
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {hampers.map((hamper: any, index: number) => (
                            <Link
                                key={hamper.id}
                                to={`/products/${hamper.id}`}
                                className="group relative bg-white rounded-3xl p-3 md:p-6 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center animate-fade-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-2xl bg-white flex items-center justify-center border border-gray-100 p-4 shadow-sm">
                                    <img
                                        src={hamper.images[0]}
                                        alt={hamper.name}
                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <h3 className="font-fredoka font-semibold text-sm md:text-lg text-foreground group-hover:text-pink-600 transition-colors line-clamp-1 mb-2">
                                    {hamper.name}
                                </h3>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-lg md:text-xl font-fredoka font-bold text-pink-600">
                                        ₹{hamper.discountPrice || hamper.price}
                                    </span>
                                    {hamper.discountPrice && (
                                        <span className="text-xs text-muted-foreground line-through">
                                            ₹{hamper.price}
                                        </span>
                                    )}
                                </div>

                                <Button className="w-full rounded-full bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white border-0 font-bold text-xs md:text-sm h-8 md:h-10 transition-colors">
                                    View Detail
                                </Button>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default HamperSection;
