import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Globe, Info, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            try {
                const response = await contentAPI.get('site_settings');
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    return defaultSettings;
                }
                throw error;
            }
        },
        enabled: isAdmin
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => contentAPI.update('site_settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            toast.success('Settings updated successfully');
        },
        onError: () => toast.error('Failed to update settings')
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" />;
    }

    const defaultSettings = {
        siteName: 'Happy Hopz',
        contactEmail: 'hello@happyhopz.com',
        contactPhone: '+91 98765 43210',
        address: '123, Footwear Plaza, New Delhi, India',
        socials: {
            instagram: 'https://instagram.com/happyhopz',
            facebook: 'https://facebook.com/happyhopz'
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            siteName: formData.get('siteName'),
            contactEmail: formData.get('contactEmail'),
            contactPhone: formData.get('contactPhone'),
            address: formData.get('address'),
            socials: {
                instagram: formData.get('instagram'),
                facebook: formData.get('facebook')
            }
        };
        updateMutation.mutate(data);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-fredoka font-bold text-foreground">
                    Site Settings
                </h1>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <form onSubmit={handleSave}>
                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList className="bg-secondary/50">
                            <TabsTrigger value="general" className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="contact" className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Contact Info
                            </TabsTrigger>
                            <TabsTrigger value="social" className="flex items-center gap-2">
                                <Instagram className="w-4 h-4" />
                                Social Media
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="siteName">Site Name</Label>
                                        <Input id="siteName" name="siteName" defaultValue={settings?.siteName || defaultSettings.siteName} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="contact">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <Input id="contactEmail" name="contactEmail" className="pl-10" defaultValue={settings?.contactEmail || defaultSettings.contactEmail} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <Input id="contactPhone" name="contactPhone" className="pl-10" defaultValue={settings?.contactPhone || defaultSettings.contactPhone} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Physical Address</Label>
                                        <Input id="address" name="address" defaultValue={settings?.address || defaultSettings.address} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="social">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Social Media Links</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">Instagram URL</Label>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <Input id="instagram" name="instagram" className="pl-10" defaultValue={settings?.socials?.instagram || defaultSettings.socials.instagram} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="facebook">Facebook URL</Label>
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <Input id="facebook" name="facebook" className="pl-10" defaultValue={settings?.socials?.facebook || defaultSettings.socials.facebook} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-8 flex justify-end">
                        <Button type="submit" variant="hopz" disabled={updateMutation.isPending} size="lg">
                            <Save className="w-4 h-4 mr-2" />
                            {updateMutation.isPending ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </div>
                </form>
            )}
        </>
    );
};

export default AdminSettings;
