import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentAPI, adminAPI, settingsAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Globe, Info, Phone, Mail, Instagram, Facebook, CreditCard, Smartphone, Landmark, Banknote, Percent, Truck, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
    const { user, isAdmin, loading } = useAuth();
    const queryClient = useQueryClient();

    // Site Content (General/Contact/Social) - uses old contentAPI
    const { data: siteContent, isLoading: isContentLoading } = useQuery({
        queryKey: ['site-content'],
        queryFn: async () => {
            try {
                const response = await contentAPI.get('site_settings');
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 404) return defaultContent;
                throw error;
            }
        },
        enabled: isAdmin
    });

    // Dynamic Site Settings (GST, Shipping) - uses NEW settingsAPI
    const { data: dynamicSettings, isLoading: isSettingsLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const response = await settingsAPI.get();
            return response.data;
        },
        enabled: isAdmin
    });

    const { data: paymentSettings, isLoading: isPaymentLoading } = useQuery({
        queryKey: ['payment-settings'],
        queryFn: async () => {
            const response = await adminAPI.getPaymentSettings();
            return response.data;
        },
        enabled: isAdmin
    });

    const updateContentMutation = useMutation({
        mutationFn: (data: any) => contentAPI.update('site_settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-content'] });
            toast.success('Site content updated');
        },
        onError: () => toast.error('Failed to update site content')
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: any) => settingsAPI.updateAsAdmin(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            toast.success('Business settings updated');
        },
        onError: () => toast.error('Failed to update settings')
    });

    const updatePaymentMutation = useMutation({
        mutationFn: (data: any) => adminAPI.updatePaymentSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
            toast.success('Payment settings updated');
        },
        onError: () => toast.error('Failed to update payment settings')
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

    const defaultContent = {
        siteName: 'Happy Hopz',
        contactEmail: 'hello@happyhopz.com',
        contactPhone: '+91 98765 43210',
        address: '123, Footwear Plaza, New Delhi, India',
        socials: {
            instagram: 'https://instagram.com/happyhopz',
            facebook: 'https://facebook.com/happyhopz'
        }
    };

    const handleSaveGeneral = (e: React.FormEvent) => {
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
        updateContentMutation.mutate(data);
    };

    const handleSavePricing = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            gst_percentage: Number(formData.get('gst_percentage')),
            delivery_charge: Number(formData.get('delivery_charge')),
            free_delivery_threshold: Number(formData.get('free_delivery_threshold'))
        };
        updateSettingsMutation.mutate(data);
    };

    const isPageLoading = isContentLoading || isSettingsLoading || isPaymentLoading;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-fredoka font-bold text-foreground">Site Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your shop's configuration and business rules.</p>
                </div>
            </div>

            {isPageLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="pricing" className="space-y-6">
                    <TabsList className="bg-secondary/50 p-1 rounded-xl">
                        <TabsTrigger value="pricing" className="flex items-center gap-2 rounded-lg">
                            <IndianRupee className="w-4 h-4" />
                            Pricing & Tax
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-2 rounded-lg">
                            <Globe className="w-4 h-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="flex items-center gap-2 rounded-lg">
                            <CreditCard className="w-4 h-4" />
                            Payments
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pricing" className="space-y-6">
                        <form onSubmit={handleSavePricing} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-md overflow-hidden">
                                    <CardHeader className="bg-pink-50/50 border-b">
                                        <CardTitle className="flex items-center gap-2 text-pink-600">
                                            <Percent className="w-5 h-5" />
                                            Tax Configuration
                                        </CardTitle>
                                        <CardDescription>Manage GST/VAT apply to all products.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="gst_percentage">GST Percentage (%)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="gst_percentage"
                                                    name="gst_percentage"
                                                    type="number"
                                                    step="0.1"
                                                    className="pr-8"
                                                    defaultValue={dynamicSettings?.gst_percentage || 18}
                                                />
                                                <div className="absolute right-3 top-3 text-muted-foreground font-bold">%</div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic">Standard footwear GST is usually 12% or 18%.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-md overflow-hidden">
                                    <CardHeader className="bg-blue-50/50 border-b">
                                        <CardTitle className="flex items-center gap-2 text-blue-600">
                                            <Truck className="w-5 h-5" />
                                            Shipping Rules
                                        </CardTitle>
                                        <CardDescription>Configure delivery fees and thresholds.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="delivery_charge">Standard Delivery Charge (₹)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="delivery_charge"
                                                    name="delivery_charge"
                                                    type="number"
                                                    className="pl-8"
                                                    defaultValue={dynamicSettings?.delivery_charge || 99}
                                                />
                                                <div className="absolute left-3 top-3 text-muted-foreground">₹</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="free_delivery_threshold">Free Delivery Threshold (₹)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="free_delivery_threshold"
                                                    name="free_delivery_threshold"
                                                    type="number"
                                                    className="pl-8"
                                                    defaultValue={dynamicSettings?.free_delivery_threshold || 999}
                                                />
                                                <div className="absolute left-3 top-3 text-muted-foreground">₹</div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic">Orders above this amount get free shipping.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" variant="hopz" disabled={updateSettingsMutation.isPending} size="lg" className="rounded-xl shadow-lg shadow-pink-100">
                                    <Save className="w-4 h-4 mr-2" />
                                    {updateSettingsMutation.isPending ? 'Saving Prices...' : 'Save Pricing Settings'}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="general">
                        <form onSubmit={handleSaveGeneral} className="space-y-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle>Global Identity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="siteName">Site Name</Label>
                                        <Input id="siteName" name="siteName" defaultValue={siteContent?.siteName || defaultContent.siteName} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contactEmail">Contact Email</Label>
                                            <Input id="contactEmail" name="contactEmail" defaultValue={siteContent?.contactEmail || defaultContent.contactEmail} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contactPhone">Contact Phone</Label>
                                            <Input id="contactPhone" name="contactPhone" defaultValue={siteContent?.contactPhone || defaultContent.contactPhone} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Physical Address</Label>
                                        <Input id="address" name="address" defaultValue={siteContent?.address || defaultContent.address} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle>Social Presence</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">Instagram URL</Label>
                                        <Input id="instagram" name="instagram" defaultValue={siteContent?.socials?.instagram || defaultContent.socials.instagram} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="facebook">Facebook URL</Label>
                                        <Input id="facebook" name="facebook" defaultValue={siteContent?.socials?.facebook || defaultContent.socials.facebook} />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button type="submit" variant="hopz" disabled={updateContentMutation.isPending} size="lg">
                                    <Save className="w-4 h-4 mr-2" />
                                    {updateContentMutation.isPending ? 'Saving Content...' : 'Save General Settings'}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="payments">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Payment Methods</CardTitle>
                                <CardDescription>Toggle visibility of payment options at checkout.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {['COD', 'UPI', 'CARD', 'NETBANKING'].map((method) => (
                                    <div key={method} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-gray-900">{method === 'COD' ? 'Cash on Delivery' : method}</div>
                                        </div>
                                        <Switch
                                            checked={paymentSettings?.[method]}
                                            onCheckedChange={(val) => updatePaymentMutation.mutate({ ...paymentSettings, [method]: val })}
                                            disabled={updatePaymentMutation.isPending}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default AdminSettings;
