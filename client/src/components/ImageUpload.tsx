import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageUploadProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
}

const SortableItem = ({ id, image, index, total, onRemove, onMove }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-border group-hover:border-primary/50 transition-all shadow-sm">
                <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Drag Handle Overlay (Visible on Hover) */}
            <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
            >
                <div className="bg-white/90 p-2 rounded-full shadow-lg">
                    <GripVertical className="w-5 h-5 text-gray-600" />
                </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="w-7 h-7 rounded-full shadow-lg hover:scale-110 transition-transform"
                    onClick={() => onRemove(index)}
                >
                    <X className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Cover Badge */}
            {index === 0 && (
                <div className="absolute top-2 left-2 bg-pink-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md z-10 pointer-events-none ring-2 ring-white">
                    Cover
                </div>
            )}

            {/* Position Pin */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm z-10 opacity-60">
                #{index + 1}
            </div>
        </div>
    );
};

const ImageUpload = ({ images, onChange, maxImages = 5 }: ImageUploadProps) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
        setIsDraggingOver(false);

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = images.indexOf(active.id as string);
            const newIndex = images.indexOf(over.id as string);
            onChange(arrayMove(images, oldIndex, newIndex));
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                className={`group relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${isDraggingOver
                    ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
                    : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-gray-50/50'
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
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-fredoka font-bold text-foreground mb-1">
                        {isCompressing ? '✨ Magic Optimization in progress...' : 'Click to upload or drag images'}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                        High-quality WebP enabled • Max {maxImages} images
                    </p>
                </label>
            </div>

            {/* Image Sortable Grid */}
            {images.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {images.map((image, index) => (
                                <SortableItem
                                    key={image}
                                    id={image}
                                    image={image}
                                    index={index}
                                    total={images.length}
                                    onRemove={removeImage}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {images.length === 0 && (
                <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                    <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400 font-medium font-nunito">No images uploaded yet</p>
                </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center bg-gray-50 py-2 rounded-lg font-bold uppercase tracking-widest">
                💡 Tip: Drag images to change order. The first image is your main cover.
            </p>
        </div>
    );
};

export default ImageUpload;
