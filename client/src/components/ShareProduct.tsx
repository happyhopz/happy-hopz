import React from 'react';
import { Share2, Link as LinkIcon, MessageCircle, Send } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareProductProps {
    product: {
        id: string;
        name: string;
        description?: string;
    };
    iconOnly?: boolean;
    className?: string;
}

const ShareProduct: React.FC<ShareProductProps> = ({ product, iconOnly = false, className = "" }) => {
    const shareUrl = `${window.location.origin}/products/${product.id}`;
    const shareText = `Check out this amazing product on Happy Hopz: ${product.name}!`;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: shareText,
                    url: shareUrl,
                });
                toast.success('Shared successfully!');
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    toast.error('Sharing failed');
                }
            }
        } else {
            // Fallback is handled by the dropdown if native share isn't available
            // But we keep this for direct calls if needed
            copyLink();
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
    };

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        window.open(url, '_blank');
    };

    const shareTelegram = () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    // If native share is available and we are on mobile, we might prefer it directly
    // However, a dropdown gives more explicit control for desktop users.

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {iconOnly ? (
                    <button
                        className={`w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 text-gray-400 hover:text-primary ${className}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                ) : (
                    <Button variant="outline" className={`gap-2 ${className}`}>
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                {navigator.share && (
                    <DropdownMenuItem onClick={handleNativeShare} className="rounded-lg gap-2 cursor-pointer">
                        <Share2 className="w-4 h-4" />
                        <span>Native Share</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={shareWhatsApp} className="rounded-lg gap-2 cursor-pointer text-green-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareTelegram} className="rounded-lg gap-2 cursor-pointer text-blue-500">
                    <Send className="w-4 h-4" />
                    <span>Telegram</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink} className="rounded-lg gap-2 cursor-pointer">
                    <LinkIcon className="w-4 h-4" />
                    <span>Copy Link</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ShareProduct;
