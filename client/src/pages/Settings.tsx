import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { User, Phone, Mail, Shield, Save, Loader2, Lock, Bell, MapPin, Baby, Trash2, Home, MessageSquare, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { addressAPI, kidsAPI, ordersAPI } from '@/lib/api';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SettingsTab = 'home' | 'profile' | 'security' | 'addresses' | 'kids' | 'notifications';

const Settings = () => {
    const { user, setUser, logout, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('home');

    // Profile State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // Security State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Notification Prefs State
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [promoNotifications, setPromoNotifications] = useState(true);
    const [whatsappOrderNotifications, setWhatsappOrderNotifications] = useState(true);
    const [whatsappPromoNotifications, setWhatsappPromoNotifications] = useState(true);

    // Address Book State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: ''
    });

    // Kids Profile State
    const [kids, setKids] = useState<any[]>([]);
    const [isAddingKid, setIsAddingKid] = useState(false);
    const [newKid, setNewKid] = useState({
        name: '', size: '', gender: 'Boy', birthday: ''
    });

    // Orders Summary State
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setEmailNotifications(user.emailNotifications ?? true);
            setPromoNotifications(user.promoNotifications ?? true);
            setWhatsappOrderNotifications(user.whatsappOrderNotifications ?? true);
            setWhatsappPromoNotifications(user.whatsappPromoNotifications ?? true);
            fetchSettingsData();
        }
    }, [user]);

    const fetchSettingsData = async () => {
        setLoadingData(true);
        try {
            const [addrRes, kidsRes, ordersRes] = await Promise.all([
                addressAPI.getAll(),
                kidsAPI.getAll(),
                ordersAPI.getMyOrders()
            ]);
            setAddresses(addrRes.data);
            setKids(kidsRes.data);
            setRecentOrders(ordersRes.data.slice(0, 3));
        } catch (error) {
            console.error('Failed to fetch settings data', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await authAPI.updateProfile({ name, phone });
            setUser(response.data);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setIsSaving(true);
        try {
            await authAPI.changePassword({ oldPassword, newPassword });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password updated successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationPrefsSubmit = async () => {
        setIsSaving(true);
        try {
            const response = await authAPI.updateNotificationPrefs({
                emailNotifications,
                promoNotifications,
                whatsappOrderNotifications,
                whatsappPromoNotifications
            });
            setUser(response.data);
            toast.success('Preferences updated!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await addressAPI.create(newAddress);
            toast.success('Address added!');
            setIsAddingAddress(false);
            setNewAddress({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
            fetchSettingsData();
        } catch (error) {
            toast.error('Failed to add address');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            await addressAPI.delete(id);
            toast.success('Address removed');
            fetchSettingsData();
        } catch (error) {
            toast.error('Failed to remove address');
        }
    };

    const handleAddKid = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await kidsAPI.create(newKid);
            toast.success('Child profile added!');
            setIsAddingKid(false);
            setNewKid({ name: '', size: '', gender: 'Boy', birthday: '' });
            fetchSettingsData();
        } catch (error) {
            toast.error('Failed to add profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKid = async (id: string) => {
        try {
            await kidsAPI.delete(id);
            toast.success('Profile removed');
            fetchSettingsData();
        } catch (error) {
            toast.error('Failed to remove profile');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await authAPI.deleteAccount();
            toast.success('Account deleted. We are sorry to see you go.');
            logout();
            window.location.href = '/';
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <Shield className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground mb-6">Please login to access your settings.</p>
                    <Button variant="hopz" onClick={() => window.location.href = '/login'}>Login Now</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col text-slate-900">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <BackButton label="Back to Orders" to="/orders" />

                    <div className="mb-8">
                        <h1 className="text-4xl font-fredoka font-bold">
                            Account Settings
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Manage your profile, security, and preferences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Sidebar/Tabs */}
                        <div className="md:col-span-1 space-y-2">
                            {[
                                { id: 'home', label: 'Overview', icon: Home },
                                { id: 'profile', label: 'Profile', icon: User },
                                { id: 'addresses', label: 'Address Book', icon: MapPin },
                                { id: 'kids', label: 'My Sizes / Kids', icon: Baby },
                                { id: 'security', label: 'Security', icon: Shield },
                                { id: 'notifications', label: 'Notifications', icon: Bell },
                            ].map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                                    className={`w-full justify-start gap-3 rounded-xl font-semibold transform transition-all duration-200 ${activeTab === tab.id ? 'bg-primary text-white scale-105 shadow-md' : 'text-slate-600 hover:bg-muted'}`}
                                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </Button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="md:col-span-3 space-y-6">
                            {/* Tab Headers */}
                            <div className="flex items-center gap-4 mb-2 p-4 bg-muted/30 rounded-2xl border">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{user.email}</h3>
                                    <p className="text-xs text-slate-500">Joined Happy Hopz family</p>
                                </div>
                            </div>

                            {activeTab === 'home' && (
                                <div className="space-y-6 animate-fade-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="p-6 border-2 border-primary/20 bg-primary/5 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-primary flex items-center gap-1"><MapPin className="w-4 h-4" /> Saved Addresses</p>
                                                <h4 className="text-2xl font-black">{addresses.length}</h4>
                                            </div>
                                            <Button variant="ghost" className="rounded-full h-10 w-10 p-0" onClick={() => setActiveTab('addresses')}>
                                                <ChevronRight className="w-6 h-6" />
                                            </Button>
                                        </Card>
                                        <Card className="p-6 border-2 border-cyan-200 bg-cyan-50 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-cyan-600 flex items-center gap-1"><Baby className="w-4 h-4" /> Kids Profiles</p>
                                                <h4 className="text-2xl font-black">{kids.length}</h4>
                                            </div>
                                            <Button variant="ghost" className="rounded-full h-10 w-10 p-0" onClick={() => setActiveTab('kids')}>
                                                <ChevronRight className="w-6 h-6" />
                                            </Button>
                                        </Card>
                                    </div>

                                    <Card className="border-2 rounded-2xl overflow-hidden">
                                        <div className="bg-slate-50 p-4 border-b">
                                            <h4 className="font-bold flex items-center gap-2 text-slate-700">
                                                <Bell className="w-4 h-4" /> Recent Orders
                                            </h4>
                                        </div>
                                        <div className="p-0">
                                            {recentOrders.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 italic">No recent orders yet.</div>
                                            ) : (
                                                <div className="divide-y">
                                                    {recentOrders.map(order => (
                                                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => window.location.href = `/orders/${order.id}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs text-center px-1">
                                                                    {order.orderId?.split('-').pop() || '...'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm">₹{order.total}</p>
                                                                    <p className="text-xs text-slate-500">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`text-[10px] font-black px-2 py-1 rounded-full border-2 ${order.status === 'DELIVERED' ? 'border-green-500 text-green-500' : 'border-primary text-primary'
                                                                }`}>
                                                                {order.status}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {recentOrders.length > 0 && (
                                            <div className="p-3 bg-slate-50 text-center border-t">
                                                <Button variant="link" className="text-primary font-bold text-xs" onClick={() => window.location.href = '/orders'}>
                                                    View All Orders
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <Card className="p-6 md:p-8 bg-card border-2 animate-fade-up rounded-2xl">
                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-bold flex items-center gap-2">
                                                    <User className="w-4 h-4 text-primary" />
                                                    Full Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Enter your name"
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-sm font-bold flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-cyan-500" />
                                                    Phone Number
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="Enter phone number"
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <Button type="submit" disabled={isSaving} variant="hopz" className="rounded-full px-8 py-3 h-auto text-base font-black shadow-lg shadow-primary/25">
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                                UPDATE PROFILE
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            {activeTab === 'addresses' && (
                                <div className="space-y-6 animate-fade-up">
                                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <MapPin className="text-primary" /> Delivery Addresses
                                        </h3>
                                        <Button
                                            variant="hopz"
                                            size="sm"
                                            className="rounded-full font-bold px-4"
                                            onClick={() => setIsAddingAddress(!isAddingAddress)}
                                        >
                                            {isAddingAddress ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add New</>}
                                        </Button>
                                    </div>

                                    {isAddingAddress && (
                                        <Card className="p-6 border-2 border-primary/30 animate-in slide-in-from-top duration-300 rounded-2xl bg-primary/5">
                                            <form onSubmit={handleAddAddress} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input placeholder="Recipient Name" value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} className="rounded-xl" required />
                                                    <Input placeholder="Phone Number" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="rounded-xl" required />
                                                    <Input placeholder="Flat, House no., Building" className="md:col-span-2 rounded-xl" value={newAddress.line1} onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })} required />
                                                    <Input placeholder="Area, Colony, Street, Sector" className="md:col-span-2 rounded-xl" value={newAddress.line2} onChange={e => setNewAddress({ ...newAddress, line2: e.target.value })} />
                                                    <Input placeholder="City" className="rounded-xl" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required />
                                                    <Input placeholder="State" className="rounded-xl" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} required />
                                                    <Input placeholder="Pincode" className="rounded-xl" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} required />
                                                </div>
                                                <Button type="submit" variant="hopz" className="w-full rounded-full font-black mt-2" disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                                    SAVE ADDRESS
                                                </Button>
                                            </form>
                                        </Card>
                                    )}

                                    <div className="grid grid-cols-1 gap-4">
                                        {addresses.length === 0 ? (
                                            <Card className="p-12 text-center border-2 border-dashed rounded-2xl">
                                                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 font-bold">No saved addresses yet.</p>
                                                <p className="text-xs text-slate-400">Add an address to make checkout faster!</p>
                                            </Card>
                                        ) : (
                                            addresses.map((addr) => (
                                                <Card key={addr.id} className="p-5 border-2 hover:border-primary/50 transition-colors rounded-2xl relative shadow-sm">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-primary/10 p-3 rounded-full text-primary">
                                                            <Home className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-800">{addr.name}</h4>
                                                            <p className="text-sm text-slate-500">{addr.phone}</p>
                                                            <p className="text-sm mt-1 text-slate-600">
                                                                {addr.line1}, {addr.line2 && `${addr.line2},`} {addr.city}, {addr.state} - {addr.pincode}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'kids' && (
                                <div className="space-y-6 animate-fade-up">
                                    <Card className="p-6 bg-cyan-600 text-white rounded-2xl border-none shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/20 p-4 rounded-full">
                                                <Baby className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black">My Sizes / Kids Profiles</h3>
                                                <p className="text-cyan-50 opacity-90 text-sm">Save your child's age and shoe size for a personalized shopping experience!</p>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            variant="secondary"
                                            className="rounded-full font-bold border-2 border-cyan-100 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                                            onClick={() => setIsAddingKid(!isAddingKid)}
                                        >
                                            {isAddingKid ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Profile</>}
                                        </Button>
                                    </div>

                                    {isAddingKid && (
                                        <Card className="p-6 border-2 border-cyan-300 animate-in slide-in-from-top duration-300 rounded-2xl bg-cyan-50/50">
                                            <form onSubmit={handleAddKid} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-bold uppercase text-slate-500">Child's Name</Label>
                                                        <Input placeholder="Enter name" value={newKid.name} onChange={e => setNewKid({ ...newKid, name: e.target.value })} className="rounded-xl" required />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-bold uppercase text-slate-500">Shoe Size (EU)</Label>
                                                        <Input placeholder="e.g., 24" value={newKid.size} onChange={e => setNewKid({ ...newKid, size: e.target.value })} className="rounded-xl" required />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-bold uppercase text-slate-500">Gender</Label>
                                                        <select
                                                            className="flex h-11 w-full rounded-xl border-2 border-input bg-white px-3 py-2 text-sm focus:outline-none"
                                                            value={newKid.gender}
                                                            onChange={e => setNewKid({ ...newKid, gender: e.target.value })}
                                                        >
                                                            <option>Boy</option>
                                                            <option>Girl</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-bold uppercase text-slate-500">Birthday (Optional)</Label>
                                                        <Input type="date" value={newKid.birthday} onChange={e => setNewKid({ ...newKid, birthday: e.target.value })} className="rounded-xl" />
                                                    </div>
                                                </div>
                                                <Button type="submit" className="w-full rounded-full font-black mt-2 bg-cyan-600 hover:bg-cyan-700 text-white py-6 h-auto" disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Baby className="w-5 h-5 mr-2" />}
                                                    CREATE PROFILE
                                                </Button>
                                            </form>
                                        </Card>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {kids.length === 0 ? (
                                            <div className="md:col-span-2 p-12 text-center border-2 border-dashed rounded-2xl opacity-60">
                                                <p className="font-bold text-slate-400">Add profiles for magic size recommendations!</p>
                                            </div>
                                        ) : (
                                            kids.map((kid) => (
                                                <Card key={kid.id} className="p-6 border-2 border-cyan-100 bg-white rounded-2xl relative group hover:border-cyan-300 transition-all">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 text-slate-300 group-hover:text-red-400"
                                                        onClick={() => handleDeleteKid(kid.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black ${kid.gender === 'Girl' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                                                            }`}>
                                                            {kid.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black text-slate-800">{kid.name}</h4>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-500 uppercase">SIZE EU {kid.size}</span>
                                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-500 uppercase">{kid.gender}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-fade-up">
                                    <Card className="p-6 md:p-8 bg-card border-2 rounded-2xl">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                            <Lock className="text-orange-500" /> Password Settings
                                        </h3>
                                        <form onSubmit={handleSecuritySubmit} className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold flex items-center gap-2">
                                                        Current Password
                                                    </Label>
                                                    <Input
                                                        type="password"
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        className="rounded-xl border-2 h-11"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold flex items-center gap-2">
                                                        New Password
                                                    </Label>
                                                    <Input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="rounded-xl border-2 h-11"
                                                        required
                                                        minLength={6}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold flex items-center gap-2">
                                                        Confirm New Password
                                                    </Label>
                                                    <Input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="rounded-xl border-2 h-11"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                <Button type="submit" disabled={isSaving} variant="hopz" className="rounded-full px-8 py-3 h-auto text-base font-black">
                                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                                                    UPDATE PASSWORD
                                                </Button>
                                            </div>
                                        </form>
                                    </Card>

                                    <Card className="p-6 md:p-8 border-2 border-red-100 bg-red-50 rounded-2xl">
                                        <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2 italic">
                                            <Trash2 className="w-5 h-5" /> Danger Zone
                                        </h3>
                                        <p className="text-sm text-red-500 mb-6">Permanently delete your account and all your data. This action cannot be undone.</p>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" className="text-red-600 font-bold hover:bg-red-100 hover:text-red-700 rounded-xl px-0 underline">
                                                    Delete My Happy Hopz Account Permanently
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl border-2 border-red-200">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-2xl font-black text-slate-800">Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-600 font-bold">
                                                        This will permanently delete your account, address book, and child profiles. Your order history will be anonymized for our records. This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="mt-4">
                                                    <AlertDialogCancel className="rounded-full font-bold">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 rounded-full font-black px-8">
                                                        YES, DELETE FOREVER
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <Card className="p-6 md:p-8 bg-card border-2 animate-fade-up rounded-2xl">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> Email Notifications
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                                                    <div className="space-y-1">
                                                        <Label className="text-base font-bold">Order Tracking</Label>
                                                        <p className="text-xs text-slate-500">Get confirmation and tracking emails for every purchase.</p>
                                                    </div>
                                                    <Switch
                                                        checked={emailNotifications}
                                                        onCheckedChange={setEmailNotifications}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                                                    <div className="space-y-1">
                                                        <Label className="text-base font-bold">Promotional Updates</Label>
                                                        <p className="text-xs text-slate-500">Early access to sales, new launches, and exclusive coupons.</p>
                                                    </div>
                                                    <Switch
                                                        checked={promoNotifications}
                                                        onCheckedChange={setPromoNotifications}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-green-600 flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4" /> WhatsApp Alerts
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100">
                                                    <div className="space-y-1">
                                                        <Label className="text-base font-bold flex items-center gap-2">WhatsApp Order Status <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase">Popular</span></Label>
                                                        <p className="text-xs text-slate-500">Get faster updates via WhatsApp for shipping and delivery.</p>
                                                    </div>
                                                    <Switch
                                                        checked={whatsappOrderNotifications}
                                                        onCheckedChange={setWhatsappOrderNotifications}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100">
                                                    <div className="space-y-1">
                                                        <Label className="text-base font-bold">Flash Sales on WhatsApp</Label>
                                                        <p className="text-xs text-slate-500">Don't miss out on lightning deals. Never spammy!</p>
                                                    </div>
                                                    <Switch
                                                        checked={whatsappPromoNotifications}
                                                        onCheckedChange={setWhatsappPromoNotifications}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={handleNotificationPrefsSubmit} disabled={isSaving} variant="hopz" className="rounded-full px-8 py-3 h-auto text-base font-black shadow-lg shadow-primary/25">
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                                SAVE PREFERENCES
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Settings;
