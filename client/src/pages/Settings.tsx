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
import { User, Phone, Mail, Shield, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
    const { user, setUser, loading: authLoading } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <BackButton label="Back to Orders" to="/orders" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-fredoka font-bold text-foreground">
                                Account Settings
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage your profile information and account security
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Sidebar/Tabs */}
                        <div className="md:col-span-1 space-y-2">
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-3 rounded-xl font-semibold"
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                                title="Coming soon!"
                            >
                                <Shield className="w-4 h-4" />
                                Security
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                                title="Coming soon!"
                            >
                                <Mail className="w-4 h-4" />
                                Email Prefs
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="md:col-span-3 space-y-6">
                            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-2">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="flex items-center gap-4 mb-6 border-b pb-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{user.email}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                                        </div>
                                    </div>

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
                                                className="rounded-xl border-2 focus-visible:ring-primary h-11"
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
                                                className="rounded-xl border-2 focus-visible:ring-primary h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 opacity-50">
                                        <Label className="text-sm font-bold flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email Address (Read-only)
                                        </Label>
                                        <Input
                                            value={user.email}
                                            disabled
                                            className="rounded-xl border-2 bg-muted/50 h-11"
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            variant="hopz"
                                            className="rounded-full px-8 py-6 h-auto text-lg hover:shadow-float active:scale-95 transition-all w-full md:w-auto"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            <Card className="p-6 bg-blue-50/50 border-blue-100 border-2 rounded-2xl">
                                <div className="flex gap-4">
                                    <Shield className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-blue-900 mb-1">Account Security</h4>
                                        <p className="text-sm text-blue-700">
                                            Your account is protected by industry-standard encryption. We never share your personal data with third parties.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Settings;
