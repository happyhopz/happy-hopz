import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, ThumbsUp, CheckCircle2, Image as ImageIcon, Plus, X, MessageSquare, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface Review {
    id: string;
    rating: number;
    comment: string;
    images?: string; // JSON string
    recommend: boolean;
    createdAt: string;
    user: {
        name: string;
    };
}

const Reviews = ({ productId }: { productId: string }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isWriting, setIsWriting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [recommend, setRecommend] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews', productId],
        queryFn: async () => {
            const response = await cartAPI.getReviews(productId);
            return response.data;
        }
    });

    const submitReviewMutation = useMutation({
        mutationFn: (data: any) => cartAPI.postReview(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            toast.success('Review submitted for approval! 🎉');
            setIsWriting(false);
            setComment('');
            setImages([]);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to submit review');
        }
    });

    const handleAddImage = () => {
        if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
            setImages([...images, newImageUrl.trim()]);
            setNewImageUrl('');
        }
    };

    const handleRemoveImage = (url: string) => {
        setImages(images.filter(img => img !== url));
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const recommendationRate = reviews.length > 0
        ? Math.round((reviews.filter((r: Review) => r.recommend).length / reviews.length) * 100)
        : 100;

    return (
        <section className="py-16 bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-12 mb-12">
                    {/* Summary Card */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-pink-50/50 rounded-[32px] p-8 text-center border border-pink-100/50">
                            <h3 className="text-xl font-black font-fredoka text-gray-900 mb-2">Customer Reviews</h3>
                            <div className="flex flex-col items-center gap-2 mb-4">
                                <span className="text-6xl font-black font-fredoka text-pink-600">{averageRating}</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-5 h-5 ${s <= Number(averageRating) ? 'fill-pink-500 text-pink-500' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                                <p className="text-sm font-bold text-gray-500">{reviews.length} Verified Reviews</p>
                            </div>
                            <div className="pt-6 border-t border-pink-100/50">
                                <p className="text-sm font-bold text-pink-600 mb-1">{recommendationRate}% of customers</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Would recommend this product</p>
                            </div>
                        </div>

                        {!isWriting && (
                            <Button
                                onClick={() => setIsWriting(true)}
                                variant="hopz"
                                className="w-full mt-6 h-14 rounded-2xl shadow-xl shadow-pink-100"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Write A Review
                            </Button>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {isWriting ? (
                            <Card className="p-8 rounded-[32px] border-2 border-pink-100 shadow-xl shadow-pink-50/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black font-fredoka text-gray-900">Share Your Experience</h3>
                                    <button onClick={() => setIsWriting(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Rating */}
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Rating</p>
                                        <div className="flex gap-4">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setRating(s)}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${s <= rating ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 scale-110' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                                                >
                                                    <Star className={`w-6 h-6 ${s <= rating ? 'fill-current' : ''}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommendation */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                        <Heart className={`w-6 h-6 ${recommend ? 'fill-pink-500 text-pink-500' : 'text-gray-300'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">Would you recommend this?</p>
                                            <p className="text-xs text-gray-500">Helps other parents choose better!</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRecommend(true)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${recommend ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-400'}`}
                                            >
                                                YES
                                            </button>
                                            <button
                                                onClick={() => setRecommend(false)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!recommend ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-400'}`}
                                            >
                                                NO
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Your Feedback</p>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="What did your little one think of these?"
                                            className="w-full h-32 p-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-pink-100 outline-none transition-all resize-none text-gray-700 font-medium"
                                        />
                                    </div>

                                    {/* Photo Upload Simulation */}
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Add Photos (URL)</p>
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={newImageUrl}
                                                onChange={(e) => setNewImageUrl(e.target.value)}
                                                placeholder="Paste image URL here..."
                                                className="flex-1 h-12 px-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-pink-200 outline-none text-sm"
                                            />
                                            <Button onClick={handleAddImage} variant="secondary" className="h-12 rounded-xl px-6">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {images.map((img) => (
                                                <div key={img} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => handleRemoveImage(img)}
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => submitReviewMutation.mutate({
                                            productId,
                                            rating,
                                            comment,
                                            recommend,
                                            images
                                        })}
                                        disabled={submitReviewMutation.isPending || !comment.trim()}
                                        variant="hopz"
                                        className="w-full h-16 rounded-[20px] shadow-2xl shadow-pink-100 text-lg"
                                    >
                                        {submitReviewMutation.isPending ? 'Sending...' : 'Publish My Review'}
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {isLoading ? (
                                    <div className="py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                                        <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xl font-bold text-gray-400">Be the first to share a review!</p>
                                    </div>
                                ) : reviews.map((r: Review) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-8 rounded-[32px] bg-white border border-gray-100 hover:shadow-2xl hover:shadow-gray-100/50 transition-all duration-500"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-black text-lg">
                                                    {r.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black font-fredoka text-gray-900 leading-none mb-1">{r.user.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-pink-500 text-pink-500' : 'text-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                        <span className="text-xs font-black text-green-600 flex items-center gap-1 uppercase tracking-widest">
                                                            <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">
                                                {format(new Date(r.createdAt), 'MMM yyyy')}
                                            </span>
                                        </div>

                                        {r.recommend && (
                                            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <ThumbsUp className="w-3 h-3" /> Recommends this product
                                            </div>
                                        )}

                                        <p className="text-gray-600 text-lg font-medium leading-relaxed mb-6">
                                            {r.comment}
                                        </p>

                                        {r.images && JSON.parse(r.images).length > 0 && (
                                            <div className="flex flex-wrap gap-3 mt-6">
                                                {JSON.parse(r.images).map((img: string, idx: number) => (
                                                    <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100">
                                                        <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
