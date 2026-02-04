import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Package, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';

const OmniSearch = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: results, isLoading } = useQuery({
        queryKey: ['search', query],
        queryFn: async () => {
            if (query.length < 2) return null;
            const response = await searchAPI.query(query);
            return response.data;
        },
        enabled: query.length >= 2,
        staleTime: 1000 * 60, // 1 minute
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/products?search=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md hidden lg:block">
            <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Search className="h-4 w-4" />
                </div>
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for sandals, sneakers, or orders..."
                    className={`pl-10 pr-10 h-10 w-full rounded-full border-2 bg-secondary/50 focus:bg-white transition-all duration-300 ${isOpen ? 'ring-4 ring-primary/10 border-primary w-[500px] z-50' : 'border-transparent hover:bg-secondary w-full'}`}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (query.length >= 2) && (
                <div className="absolute top-full mt-2 w-[500px] bg-white border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span>Searching...</span>
                            </div>
                        ) : results ? (
                            <div className="space-y-6">
                                {/* Suggestions Section */}
                                {results.suggestions?.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Suggestions</h4>
                                        <div className="flex flex-wrap gap-2 px-2">
                                            {results.suggestions.map((s: string) => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setQuery(s);
                                                        navigate(`/products?category=${encodeURIComponent(s)}`);
                                                        setIsOpen(false);
                                                    }}
                                                    className="px-3 py-1 bg-secondary hover:bg-primary hover:text-white rounded-full text-xs font-bold transition-colors"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Products Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Products</h4>
                                        <Link to={`/products?search=${query}`} className="text-[10px] font-bold text-primary hover:underline">View All</Link>
                                    </div>
                                    <div className="space-y-1">
                                        {results.products?.length > 0 ? results.products.map((p: any) => (
                                            <Link
                                                key={p.id}
                                                to={`/products/${p.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 p-2 hover:bg-pink-50 rounded-xl transition-colors group"
                                            >
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                    <img src={JSON.parse(p.images)[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-pink-600">₹{p.discountPrice || p.price}</p>
                                                    {p.discountPrice && <p className="text-[10px] text-gray-400 line-through">₹{p.price}</p>}
                                                </div>
                                            </Link>
                                        )) : (
                                            <p className="text-sm text-gray-500 px-2 py-2">No products found matching "{query}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* Orders Section */}
                                {results.orders?.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">My Orders</h4>
                                        <div className="space-y-1">
                                            {results.orders.map((o: any) => (
                                                <Link
                                                    key={o.id}
                                                    to={`/orders/${o.id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                                                >
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-900">Order #{o.id.slice(0, 8)}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{o.status}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-300" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-muted-foreground">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                <p className="text-sm">Start typing to search products and orders...</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSearchSubmit}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white p-3 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                        Search All Results <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default OmniSearch;
