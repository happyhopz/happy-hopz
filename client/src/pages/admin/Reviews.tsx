import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X, Trash2, MessageSquare, User, Package } from 'lucide-react';
import { toast } from 'sonner';

const AdminReviews = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: async () => {
            const response = await adminAPI.getAllReviews();
            return response.data;
        },
        enabled: isAdmin
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
            adminAPI.approveReview(id, isApproved),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            toast.success('Review status updated');
        }
    });

    const featureMutation = useMutation({
        mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
            adminAPI.featureReview(id, isFeatured),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            toast.success('Review featured status updated');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminAPI.deleteReview(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            toast.success('Review deleted');
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
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
                    Review Management
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-nunito font-semibold">{reviews?.length || 0} Total Reviews</span>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !reviews || reviews.length === 0 ? (
                <Card className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-fredoka font-bold mb-2">No reviews found</h3>
                    <p className="text-muted-foreground">Reviews from customers will appear here</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reviews.map((review: any) => (
                        <Card key={review.id} className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                        <Badge variant={review.isApproved ? 'default' : 'outline'} className="ml-2">
                                            {review.isApproved ? 'Approved' : 'Pending'}
                                        </Badge>
                                        {review.isFeatured && (
                                            <Badge className="bg-purple-500">Featured</Badge>
                                        )}
                                    </div>
                                    <p className="text-lg font-nunito italic text-foreground mb-4">"{review.comment}"</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>{review.user?.name} ({review.user?.email})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            <span>Product: {review.product?.name}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        Posted on {new Date(review.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 justify-end">
                                    <Button
                                        variant={review.isApproved ? 'outline' : 'hopz'}
                                        size="sm"
                                        onClick={() => approveMutation.mutate({ id: review.id, isApproved: !review.isApproved })}
                                    >
                                        {review.isApproved ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                        {review.isApproved ? 'Reject' : 'Approve'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => featureMutation.mutate({ id: review.id, isFeatured: !review.isFeatured })}
                                    >
                                        <Star className={`w-4 h-4 mr-2 ${review.isFeatured ? 'fill-purple-500 text-purple-500' : ''}`} />
                                        {review.isFeatured ? 'Unfeature' : 'Feature'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm('Delete this review permanently?')) {
                                                deleteMutation.mutate(review.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
};

export default AdminReviews;
