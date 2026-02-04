import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setSubmitted(true);
            toast.success('Reset link sent to your email');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4 py-20">
                <div className="w-full max-w-md">
                    <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>

                    <Card className="border-none shadow-2xl rounded-3xl overflow-hidden animate-scale-in">
                        <CardHeader className="space-y-1 pb-2">
                            <CardTitle className="text-2xl font-fredoka font-bold">Forgot Password?</CardTitle>
                            <CardDescription>
                                No worries! Enter your email and we'll send you a link to reset your password.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-4">
                            {!submitted ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                        {loading ? 'Sending link...' : 'Send Reset Link'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
                                    <p className="text-muted-foreground">
                                        We've sent a password reset link to <span className="font-bold text-gray-900">{email}</span>.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-8 rounded-full"
                                        onClick={() => setSubmitted(false)}
                                    >
                                        Didn't receive email? Try again
                                    </Button>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="bg-muted/30 py-4 flex justify-center border-t">
                            <p className="text-xs text-muted-foreground">
                                Remembered your password? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ForgotPassword;
