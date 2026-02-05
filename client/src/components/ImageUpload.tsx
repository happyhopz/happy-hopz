import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
}

// Cloudinary Configuration (User can update these in the future)
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

const ImageUpload = ({ images, onChange, maxImages = 5 }: ImageUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);

    const reloadScript = () => {
        const id = 'cloudinary-widget-script';
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.id = id;
        script.src = "https://upload-widget.cloudinary.com/global/all.js";
        script.type = "text/javascript";
        script.onload = () => toast.success("Media library ready! 📸");
        document.body.appendChild(script);
    };

    const openWidget = () => {
        if (images.length >= maxImages) {
            toast.error(`You can only upload up to ${maxImages} images`);
            return;
        }

        // Check if Cloudinary library is loaded
        // @ts-ignore
        if (!window.cloudinary) {
            toast.error("Cloudinary library not loaded.", {
                description: "Attempting to reload. Please wait a moment and try again."
            });
            reloadScript();
            return;
        }

        // Validate basic credentials
        if (CLOUD_NAME === "demo" || UPLOAD_PRESET === "ml_default") {
            toast.warning("Using demo credentials", {
                description: "Google Drive and multiple uploads may be restricted. Please set your own CLOUD_NAME and UPLOAD_PRESET in .env"
            });
        }

        try {
            // @ts-ignore
            const widget = window.cloudinary.createUploadWidget(
                {
                    cloudName: CLOUD_NAME,
                    uploadPreset: UPLOAD_PRESET,
                    sources: ['local', 'url', 'camera', 'google_drive'],
                    multiple: true,
                    maxFiles: maxImages - images.length,
                    clientAllowedFormats: ["png", "jpg", "jpeg", "webp", "gif"],
                    styles: {
                        palette: {
                            window: "#FFFFFF",
                            windowBorder: "#90A0B3",
                            tabIcon: "#0078FF",
                            menuIcons: "#5A616A",
                            textDark: "#000000",
                            textLight: "#FFFFFF",
                            link: "#0078FF",
                            action: "#FF620C",
                            inactiveTabIcon: "#0E2F5A",
                            error: "#F44235",
                            inProgress: "#0078FF",
                            complete: "#20B832",
                            sourceBg: "#E4EBF1"
                        }
                    }
                },
                (error: any, result: any) => {
                    if (!error && result && result.event === "success") {
                        const newImageUrl = result.info.secure_url;
                        onChange([...images, newImageUrl]);
                        toast.success("Image uploaded successfully! ✨");
                    }
                    if (error) {
                        toast.error("Upload widget error", {
                            description: "Please check your Cloudinary configuration."
                        });
                        console.error("Cloudinary Error:", error);
                    }
                }
            );

            widget.open();
        } catch (e) {
            toast.error("Failed to initialize upload widget");
            console.error("Widget initialization failed:", e);
        }
    };

    const removeImage = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onClick={openWidget}
                className="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer border-muted-foreground/25 hover:border-primary hover:bg-primary/5 group"
            >
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-nunito font-bold mb-1">
                        Upload from Computer or Google Drive
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Securely select images directly from your Google Drive
                    </p>
                    <Button
                        type="button"
                        variant="hopz"
                        size="sm"
                        className="mt-4 rounded-full px-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            openWidget();
                        }}
                    >
                        Pick Images
                    </Button>
                </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative group animate-scale-in">
                            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-transparent group-hover:border-primary transition-all">
                                <img
                                    src={image}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                onClick={() => removeImage(index)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Primary Image
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-2xl border-2 border-dotted">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">No images uploaded yet</p>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
