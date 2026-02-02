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
import { User, Phone, Mail, Shield, Save, Loader2, Lock, Bell } from 'lucide-react';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'security' | 'email';

const Settings = () => {
    const { user, setUser, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Profile State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // Security State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Email Prefs State
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [promoNotifications, setPromoNotifications] = useState(true);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setEmailNotifications(user.emailNotifications ?? true);
            setPromoNotifications(user.promoNotifications ?? true);
        }
    }, [user]);

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

    const handleEmailPrefsSubmit = async () => {
        setIsSaving(true);
        try {
            const response = await authAPI.updateEmailPrefs({ emailNotifications, promoNotifications });
            setUser(response.data);
            toast.success('Email preferences updated!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update preferences');
        } finally {
            setIsSaving(false);
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
                                { id: 'profile', label: 'Profile', icon: User },
                                { id: 'security', label: 'Security', icon: Shield },
                                { id: 'email', label: 'Notifications', icon: Bell },
                            ].map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                                    className={`w-full justify-start gap-3 rounded-xl font-semibold ${activeTab === tab.id ? 'bg-secondary text-primary' : 'text-slate-600'}`}
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

                            {activeTab === 'profile' && (
                                <Card className="p-6 md:p-8 bg-card border-2 animate-fade-up">
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
                                            <Button type="submit" disabled={isSaving} variant="hopz" className="rounded-full px-6 py-2.5 h-auto text-base font-bold">
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                                Save Profile
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            {activeTab === 'security' && (
                                <Card className="p-6 md:p-8 bg-card border-2 animate-fade-up">
                                    <form onSubmit={handleSecuritySubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                    <Lock className="w-4 h-4 text-orange-500" />
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
                                                    <Shield className="w-4 h-4 text-blue-500" />
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
                                                    <Lock className="w-4 h-4 text-green-500" />
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
                                            <Button type="submit" disabled={isSaving} variant="hopz" className="rounded-full px-6 py-2.5 h-auto text-base font-bold">
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                                                Update Password
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            {activeTab === 'email' && (
                                <Card className="p-6 md:p-8 bg-card border-2 animate-fade-up">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                                            <div className="space-y-1">
                                                <Label className="text-base font-bold">Order Notifications</Label>
                                                <p className="text-sm text-slate-500">Get updates about your orders and tracking status.</p>
                                            </div>
                                            <Switch
                                                checked={emailNotifications}
                                                onCheckedChange={setEmailNotifications}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                                            <div className="space-y-1">
                                                <Label className="text-base font-bold">Promotional Emails</Label>
                                                <p className="text-sm text-slate-500">Stay informed about sales and new arrivals.</p>
                                            </div>
                                            <Switch
                                                checked={promoNotifications}
                                                onCheckedChange={setPromoNotifications}
                                            />
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={handleEmailPrefsSubmit} disabled={isSaving} variant="hopz" className="rounded-full px-6 py-2.5 h-auto text-base font-bold">
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Bell className="w-5 h-5 mr-2" />}
                                                Save Preferences
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
