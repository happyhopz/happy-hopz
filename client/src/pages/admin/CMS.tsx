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

    useEffect(() => {
        if (remoteHero) setHeroData(remoteHero);
    }, [remoteHero]);

    useEffect(() => {
        if (remoteFeatured) setFeaturedData(remoteFeatured);
    }, [remoteFeatured]);

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
