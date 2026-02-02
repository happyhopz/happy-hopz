import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const { user, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else if (user?.isVerified) {
            navigate('/');
        }
    }, [user, token, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        try {
            await authAPI.verifyEmail(code);
            toast.success('Email verified successfully!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authAPI.resendOTP();
            toast.success('New code sent to your email');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-float border-none">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-fredoka font-bold">Check your email</CardTitle>
                    <CardDescription className="font-nunito">
                        We've sent a 6-digit verification code to <span className="font-bold text-foreground">{user?.email}</span>
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleVerify}>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <Input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                className="text-center text-3xl tracking-[0.5em] font-bold h-16 border-primary/20 focus-visible:ring-primary w-full max-w-[240px]"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>
                        <p className="text-center text-sm text-muted-foreground font-nunito">
                            Enter the code from your inbox to continue
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold"
                            variant="hopz"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                        <div className="flex items-center justify-between w-full text-sm">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </button>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="flex items-center gap-1 text-primary font-bold hover:underline disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                                Resend Code
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default VerifyEmail;
