import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import {
    Zap, Megaphone, ShoppingCart, Clock, Plus,
    Trash2, Edit, Save, X, ExternalLink, Mail, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Marketing = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('flash-sales');

    // Queries
    const { data: sales, isLoading: salesLoading } = useQuery<any>({
        queryKey: ['admin-flash-sales'],
        queryFn: () => adminAPI.getFlashSales(),
        enabled: activeTab === 'flash-sales'
    });

    const { data: abandonedCarts, isLoading: cartsLoading } = useQuery<any>({
        queryKey: ['admin-abandoned-carts'],
        queryFn: () => adminAPI.getAbandonedCarts(),
        enabled: activeTab === 'abandoned-carts'
    });

    // Mutations
    const createSaleMutation = useMutation({
        mutationFn: adminAPI.createFlashSale,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] });
            toast.success('Flash Sale scheduled successfully!');
        }
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing & Growth</h1>
                    <p className="text-muted-foreground">Drive more sales with time-limited offers and engagement tools.</p>
                </div>
                {activeTab === 'flash-sales' && (
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Flash Sale
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                    <TabsTrigger value="flash-sales" className="gap-2">
                        <Zap className="w-4 h-4" />
                        Flash Sales
                    </TabsTrigger>
                    <TabsTrigger value="popups" className="gap-2">
                        <Megaphone className="w-4 h-4" />
                        Popups
                    </TabsTrigger>
                    <TabsTrigger value="abandoned-carts" className="gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Abandoned
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="flash-sales" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {salesLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="animate-pulse h-48 bg-gray-50" />
                            ))
                        ) : (
                            sales?.data?.map((sale: any) => (
                                <Card key={sale.id} className="relative overflow-hidden border-2 hover:border-primary/20 transition-all group">
                                    <div className={`absolute top-0 right-0 p-2 ${sale.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                        <Badge variant={sale.isActive ? 'default' : 'secondary'}>
                                            {sale.isActive ? 'Active' : 'Ended'}
                                        </Badge>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            {sale.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {sale.discountValue}{sale.discountType === 'PERCENTAGE' ? '%' : ' FLAT'} OFF
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>Starts: {format(new Date(sale.startTime), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4" /> {/* Spacer */}
                                                <span>Ends: {format(new Date(sale.endTime), 'MMM d, h:mm a')}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                                            <Button variant="destructive" size="sm" className="px-3">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {!salesLoading && sales?.data?.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold">No Flash Sales Found</h3>
                                <p className="text-muted-foreground mb-6">Start a time-limited discount to boost your conversion rate.</p>
                                <Button variant="outline" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Schedule your first sale
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="popups" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Newsletter & Promotion Popups</CardTitle>
                            <CardDescription>Manage popups that appear to users on the home page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-xl bg-gray-50">
                                <div className="text-center">
                                    <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                                    <p className="font-medium">Popups feature coming in next step</p>
                                    <p className="text-sm text-muted-foreground">I am currently implementing the backend schema for high-conversion popups.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="abandoned-carts" className="space-y-6">
                    <div className="grid gap-6">
                        {cartsLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="animate-pulse h-24 bg-gray-50" />
                            ))
                        ) : abandonedCarts?.data?.map((user: any) => (
                            <Card key={user.id} className="overflow-hidden border-l-4 border-l-orange-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                {user.name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{user.name || 'Anonymous User'}</h3>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="mb-2">
                                                {user.cartItems.length} items left in cart
                                            </Badge>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    Recovery Email
                                                </Button>
                                                <Button size="sm" className="gap-2">
                                                    View Items
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Item Preview */}
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                        {user.cartItems.map((item: any) => (
                                            <div key={item.id} className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border p-1" title={item.product?.name}>
                                                {item.product?.images ? (
                                                    <img src={JSON.parse(item.product.images)[0]} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Zap className="w-4 h-4 text-gray-300" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {!cartsLoading && abandonedCarts?.data?.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed">
                                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold">No Abandoned Carts</h3>
                                <p className="text-muted-foreground">All users are completing their checkouts or your carts are currently empty.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Marketing;
