import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ShoppingBag, Zap } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cartAPI } from '@/lib/api';
import { getColorHex } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickBuyModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

const QuickBuyModal = ({ product, isOpen, onClose, user }: QuickBuyModalProps) => {
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    if (!product) return null;

    const handleFinish = async (isBuyNow: boolean) => {
        if (!user) {
            toast.info('Please login to continue');
            navigate('/login');
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

        setIsSubmitting(true);
        try {
            await cartAPI.add({
                productId: product.id,
                quantity: 1,
                size: selectedSize,
                color: selectedColor
            });
            queryClient.invalidateQueries({ queryKey: ['cart'] });

            if (isBuyNow) {
                navigate('/checkout');
            } else {
                toast.success('Added to bag!');
                onClose();
            }
        } catch (error) {
            toast.error('Failed to update cart');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[92vw] max-w-[425px] rounded-3xl p-4 sm:p-6 overflow-hidden">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="font-fredoka text-xl sm:text-2xl">Complete Your Selection</DialogTitle>
                    <DialogDescription className="font-nunito text-xs sm:text-sm leading-tight">
                        Pick your favorite size and color for <strong>{product.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                    {/* Size Selection */}
                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Size (EU)</h4>
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                            {product.sizes.map((size: string) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`h-9 sm:h-10 rounded-xl border-2 font-bold transition-all text-xs sm:text-sm ${selectedSize === size
                                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm scale-105'
                                        : 'border-muted hover:border-cyan-200'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Color</h4>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {product.colors.map((color: string) => {
                                const isSelected = selectedColor === color;
                                const colorHex = getColorHex(color);
                                return (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-gray-900 bg-gray-50 shadow-md scale-105'
                                            : 'border-muted hover:border-gray-200'
                                            }`}
                                    >
                                        <div
                                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-black/10 shadow-inner"
                                            style={{ backgroundColor: colorHex }}
                                        />
                                        <span className="text-[10px] sm:text-xs font-bold capitalize">{color}</span>
                                        {isSelected && <Check className="w-3 h-3 text-green-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2">
                    <Button
                        variant="hopz"
                        className="w-full h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 text-white font-black text-base sm:text-lg gap-2 shadow-lg shadow-orange-100 transition-transform active:scale-95"
                        onClick={() => handleFinish(true)}
                        disabled={isSubmitting}
                    >
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        BUY NOW
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-11 sm:h-12 rounded-xl font-bold border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 text-xs sm:text-sm gap-2"
                        onClick={() => handleFinish(false)}
                        disabled={isSubmitting}
                    >
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                        Add to Bag
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuickBuyModal;
