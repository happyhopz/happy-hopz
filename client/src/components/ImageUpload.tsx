import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
}

const ImageUpload = ({ images, onChange, maxImages = 5 }: ImageUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, [images]);

    const handleFiles = async (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (images.length + imageFiles.length > maxImages) {
            alert(`You can only upload up to ${maxImages} images`);
            return;
        }

        setIsCompressing(true);
        try {
            const newImages = [...images];
            for (const file of imageFiles) {
                const compressedBase64 = await compressImage(file);
                newImages.push(compressedBase64);
            }
            onChange(newImages);
        } catch (error) {
            console.error('Compression failed:', error);
        } finally {
            setIsCompressing(false);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const removeImage = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        const newImages = [...images];
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= images.length) return;

        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
        onChange(newImages);
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
            >
                <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-nunito font-semibold mb-1">
                        {isCompressing ? 'Optimizing Images...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        High-quality optimization enabled (Max {maxImages} images)
                    </p>
                </label>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                                <img
                                    src={image}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Controls Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black disabled:opacity-30"
                                        onClick={() => moveImage(index, 'left')}
                                        disabled={index === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black disabled:opacity-30"
                                        onClick={() => moveImage(index, 'right')}
                                        disabled={index === images.length - 1}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="w-8 h-8 rounded-full shadow-lg"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-white font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
                                    {index === 0 ? 'Main Cover' : `Image ${index + 1}`}
                                </p>
                            </div>

                            {index === 0 && (
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-10 pointer-events-none">
                                    Cover
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images uploaded yet</p>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
