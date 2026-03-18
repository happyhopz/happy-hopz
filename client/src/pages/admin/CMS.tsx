import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Layout, Monitor, Image as ImageIcon, Star, Save, RefreshCw, AlertCircle } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check } from 'lucide-react';

const SortableSectionItem = ({ section }: { section: any }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm transition-all ${isDragging ? 'shadow-xl scale-[1.02] border-primary/20' : 'hover:border-primary/10'}`}
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
                <h4 className="font-fredoka font-bold text-lg">{section.name}</h4>
                <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${section.enabled ? 'bg-green-400' : 'bg-gray-300'}`} title={section.enabled ? 'Section Active' : 'Section Hidden'} />
        </div>
    );
};

const AdminCMS = () => {
    const queryClient = useQueryClient();
    const [heroData, setHeroData] = useState<any>({
        badge: 'New Collection Available!',
        title: 'Little Feet, Big Adventures',
        subtitle: 'Where Every Step Is a Happy Hopz 🐼',
        ctaText: 'Shop Now',
        secondaryCta: 'View Collection'
    });

    const [featuredData, setFeaturedData] = useState<any>({
        badge: 'Our Collection',
        title: 'Featured Kids Shoes',
        subtitle: 'Comfort meets style in every step. Pick the perfect pair for your little adventurer!'
    });

    const [homepageLayout, setHomepageLayout] = useState<any[]>([
        { id: 'holi-banner', name: 'Holi Banner', description: 'Promotional announcement bar at the very top.', enabled: true },
        { id: 'hero-section', name: 'Hero Section', description: 'Main banner with title, subtitle, and CTA buttons.', enabled: true },
        { id: 'featured-shoes', name: 'Featured Shoes', description: 'Grid of best-selling or new arrival products.', enabled: true },
        { id: 'hamper-section', name: 'Hamper Section', description: 'Curated gift bundles and hamper offerings.', enabled: true },
        { id: 'why-parents-love', name: 'Why Parents Love', description: 'Trust signals and customer testimonials.', enabled: true }
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { data: remoteHero, isLoading: loadingHero } = useQuery({
        queryKey: ['cms-hero'],
        queryFn: async () => {
            try {
                const response = await contentAPI.get('homepage.hero');
                return response.data;
            } catch (e) {
                return null;
            }
        }
    });

    const { data: remoteFeatured, isLoading: loadingFeatured } = useQuery({
        queryKey: ['cms-featured'],
        queryFn: async () => {
            try {
                const response = await contentAPI.get('homepage.featured');
                return response.data;
            } catch (e) {
                return null;
            }
        }
    });

    const { data: remoteLayout, isLoading: loadingLayout } = useQuery({
        queryKey: ['cms-layout'],
        queryFn: async () => {
            try {
                const response = await contentAPI.get('homepage.layout');
                return response.data;
            } catch (e) {
                return null;
            }
        }
    });

    useEffect(() => {
        if (remoteHero) setHeroData(remoteHero);
    }, [remoteHero]);

    useEffect(() => {
        if (remoteFeatured) setFeaturedData(remoteFeatured);
    }, [remoteFeatured]);

    useEffect(() => {
        if (remoteLayout && Array.isArray(remoteLayout)) {
            setHomepageLayout(remoteLayout);
        }
    }, [remoteLayout]);

    const updateMutation = useMutation({
        mutationFn: ({ key, content }: { key: string; content: any }) => contentAPI.update(key, content),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [variables.key === 'homepage.hero' ? 'cms-hero' : 'cms-featured'] });
            toast.success('Content updated successfully!');
        },
        onError: () => toast.error('Failed to update content')
    });

    const handleSaveHero = () => {
        updateMutation.mutate({ key: 'homepage.hero', content: heroData });
    };

    const handleSaveFeatured = () => {
        updateMutation.mutate({ key: 'homepage.featured', content: featuredData });
    };

    const handleSaveLayout = () => {
        updateMutation.mutate({ key: 'homepage.layout', content: homepageLayout });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setHomepageLayout((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-fredoka font-bold text-foreground flex items-center gap-3">
                        <Layout className="w-10 h-10 text-primary" />
                        Content Management
                    </h1>
                    <p className="text-muted-foreground mt-2 font-nunito">
                        Easily manage your homepage and global site elements.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="rounded-xl border-2 gap-2"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['cms-hero', 'cms-featured'] })}
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hero Section Config */}
                <Card className="p-8 border-2 border-primary/10 shadow-xl rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black font-fredoka">Hero Section</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold flex items-center gap-2">
                                <Star className="w-4 h-4 text-orange-400" />
                                Badge Text
                            </Label>
                            <Input
                                value={heroData.badge}
                                onChange={(e) => setHeroData({ ...heroData, badge: e.target.value })}
                                className="rounded-xl border-2 focus-visible:ring-primary h-12"
                                placeholder="e.g. New Collection Available!"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Main Title</Label>
                            <Input
                                value={heroData.title}
                                onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                                className="rounded-xl border-2 focus-visible:ring-primary h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Subtitle / Tagline</Label>
                            <Textarea
                                value={heroData.subtitle}
                                onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                                className="rounded-2xl border-2 focus-visible:ring-primary min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Primary CTA (Button)</Label>
                                <Input
                                    value={heroData.ctaText}
                                    onChange={(e) => setHeroData({ ...heroData, ctaText: e.target.value })}
                                    className="rounded-xl border-2 focus-visible:ring-primary h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Secondary CTA</Label>
                                <Input
                                    value={heroData.secondaryCta}
                                    onChange={(e) => setHeroData({ ...heroData, secondaryCta: e.target.value })}
                                    className="rounded-xl border-2 focus-visible:ring-primary h-12"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-lg shadow-primary/20"
                            onClick={handleSaveHero}
                            disabled={updateMutation.isPending}
                        >
                            <Save className="w-5 h-5" />
                            {updateMutation.isPending ? 'Saving...' : 'Update Hero Section'}
                        </Button>
                    </div>
                </Card>

                {/* Featured Products Config */}
                <Card className="p-8 border-2 border-cyan-500/10 shadow-xl rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center">
                            <Star className="w-6 h-6 text-cyan-600" />
                        </div>
                        <h2 className="text-2xl font-black font-fredoka">Featured Collection</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold">Section Badge</Label>
                            <Input
                                value={featuredData.badge}
                                onChange={(e) => setFeaturedData({ ...featuredData, badge: e.target.value })}
                                className="rounded-xl border-2 focus-visible:ring-cyan-500 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Section Heading</Label>
                            <Input
                                value={featuredData.title}
                                onChange={(e) => setFeaturedData({ ...featuredData, title: e.target.value })}
                                className="rounded-xl border-2 focus-visible:ring-cyan-500 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Section Description</Label>
                            <Textarea
                                value={featuredData.subtitle}
                                onChange={(e) => setFeaturedData({ ...featuredData, subtitle: e.target.value })}
                                className="rounded-2xl border-2 focus-visible:ring-cyan-500 min-h-[100px]"
                            />
                        </div>

                        <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-cyan-600 shrink-0" />
                            <p className="text-xs text-cyan-800 font-medium leading-relaxed">
                                Tip: Use compelling titles to increase customer engagement. The featured section displays the first 6 active products by default.
                            </p>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl font-black text-lg gap-3 bg-cyan hover:bg-cyan/90 border-2 border-cyan-500 text-black shadow-lg shadow-cyan/20 px-8"
                            onClick={handleSaveFeatured}
                            disabled={updateMutation.isPending}
                        >
                            <Save className="w-5 h-5" />
                            {updateMutation.isPending ? 'Saving...' : 'Update Featured Section'}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Homepage Layout Management */}
            <Card className="p-8 border-2 border-indigo-500/10 shadow-xl rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <Layout className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black font-fredoka">Homepage Layout</h2>
                            <p className="text-sm text-muted-foreground font-nunito">Drag sections to change their appearance order on the homepage.</p>
                        </div>
                    </div>
                    <Button
                        className="rounded-xl font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 shadow-lg shadow-indigo-200"
                        onClick={handleSaveLayout}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Order
                    </Button>
                </div>

                <div className="space-y-3">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={homepageLayout.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {homepageLayout.map((section) => (
                                <SortableSectionItem key={section.id} section={section} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                    <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                        Notice: Changes made here will take effect immediately on the homepage. You can use this to prioritize seasonal sections like the Holi Banner or Feature collections.
                    </p>
                </div>
            </Card>

            {/* Promo Banner Management */}
            <Card className="p-8 border-2 border-pink-500/10 shadow-xl rounded-[2.5rem]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-pink-500" />
                    </div>
                    <h2 className="text-2xl font-black font-fredoka">Promotional Banners</h2>
                </div>

                <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                    <p className="text-muted-foreground font-nunito font-bold italic">
                        Banner management system coming soon. This will allow you to schedule flash sales and seasonal banners.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default AdminCMS;
