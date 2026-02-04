import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token');
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword({ token, password });
            setSuccess(true);
            toast.success('Password reset successfully');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4 py-20">
                <div className="w-full max-w-md">
                    <Card className="border-none shadow-2xl rounded-3xl overflow-hidden animate-scale-in">
                        <CardHeader className="space-y-1 pb-2">
                            <CardTitle className="text-2xl font-fredoka font-bold">Reset Password</CardTitle>
                            <CardDescription>
                                Please enter your new password below.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-4">
                            {!success ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pl-10 h-12 rounded-xl border-2 focus:border-primary transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                id="confirm-password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="pl-10 h-12 rounded-xl border-2 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-full font-bold text-base shadow-lg shadow-primary/20"
                                        variant="hopz"
                                        disabled={loading}
                                    >
                                        {loading ? 'Resetting password...' : 'Reset Password'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset!</h3>
                                    <p className="text-muted-foreground">
                                        Your password has been successfully updated. Redirecting you to login...
                                    </p>
                                    <Link to="/login">
                                        <Button
                                            variant="hopz"
                                            className="mt-8 rounded-full w-full"
                                        >
                                            Login Now
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ResetPassword;
