import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import pandaLogo from '@/assets/happy-hopz-logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';
    const { login, signup, googleLogin } = useAuth();
    const [loading, setLoading] = useState(false);

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({
        email: '',
        password: '',
        name: '',
        phone: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(loginData.email, loginData.password);
            toast.success('Welcome back!');
            navigate(redirectUrl);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(signupData);
            toast.success('Account created successfully!');
            navigate(redirectUrl);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            toast.success('Logged in with Google!');
            navigate(redirectUrl);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "912680393961-8o09ir0atdaa61cki2ij18ub7kqvfre1.apps.googleusercontent.com"}>
            <div className="min-h-screen gradient-hopz flex flex-col items-center justify-center p-4 py-12">
                <div className="fixed top-6 left-6 z-50">
                    <BackButton label="Home" to="/" />
                </div>

                <div className="w-full max-w-md animate-fade-up">
                    {/* Logo Section */}
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
                            <img
                                src={pandaLogo}
                                alt="Happy Hopz"
                                className="w-20 h-20 mx-auto mb-2 animate-bounce-gentle"
                            />
                            <h1 className="text-2xl font-playfair font-black tracking-tight text-foreground">
                                HAPPY HOPZ
                            </h1>
                        </Link>
                    </div>

                    <Card className="shadow-2xl border-none ring-1 ring-black/5 animate-scale-in overflow-hidden rounded-3xl">
                        <Tabs defaultValue="login" className="w-full">
                            <CardHeader className="bg-muted/30 pb-2">
                                <TabsList className="grid w-full grid-cols-2 p-1 bg-white/50 backdrop-blur rounded-2xl">
                                    <TabsTrigger value="login" className="rounded-xl data-[state=active]:shadow-sm">Login</TabsTrigger>
                                    <TabsTrigger value="signup" className="rounded-xl data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                                </TabsList>
                            </CardHeader>

                            <div className="p-2">
                                {/* Login Tab */}
                                <TabsContent value="login" className="mt-0">
                                    <form onSubmit={handleLogin}>
                                        <CardContent className="space-y-4 pt-4">
                                            <div>
                                                <CardTitle className="text-xl">Welcome Back!</CardTitle>
                                                <CardDescription>
                                                    Login to continue shopping
                                                </CardDescription>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="login-email">Email</Label>
                                                <Input
                                                    id="login-email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    required
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="login-password">Password</Label>
                                                    <Link to="/forgot-password" title="Reset your password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                                                </div>
                                                <Input
                                                    id="login-password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    required
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>
                                        </CardContent>

                                        <CardFooter className="flex flex-col gap-4 pb-6">
                                            <Button
                                                type="submit"
                                                className="w-full rounded-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                                variant="hopz"
                                                disabled={loading}
                                            >
                                                {loading ? 'Logging in...' : 'Login'}
                                            </Button>

                                            <div className="relative w-full my-2">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-muted-foreground/20"></span>
                                                </div>
                                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                                    <span className="bg-card px-3 text-muted-foreground/60">Or continue with</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-center w-full">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => toast.error('Google Login Failed')}
                                                    useOneTap
                                                    shape="pill"
                                                    theme="filled_blue"
                                                    width="300px"
                                                />
                                            </div>
                                        </CardFooter>
                                    </form>
                                </TabsContent>

                                {/* Signup Tab */}
                                <TabsContent value="signup" className="mt-0">
                                    <form onSubmit={handleSignup}>
                                        <CardContent className="space-y-4 pt-4">
                                            <div>
                                                <CardTitle className="text-xl">Create Account</CardTitle>
                                                <CardDescription>
                                                    Join Happy Hopz family today!
                                                </CardDescription>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="signup-name">Name</Label>
                                                <Input
                                                    id="signup-name"
                                                    type="text"
                                                    placeholder="Your name"
                                                    value={signupData.name}
                                                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="signup-email">Email</Label>
                                                <Input
                                                    id="signup-email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={signupData.email}
                                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                                    required
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="signup-phone">Phone (Optional)</Label>
                                                <Input
                                                    id="signup-phone"
                                                    type="tel"
                                                    placeholder="+91 9876543210"
                                                    value={signupData.phone}
                                                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="signup-password">Password</Label>
                                                <Input
                                                    id="signup-password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={signupData.password}
                                                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                                    required
                                                    minLength={6}
                                                    className="rounded-xl border-2 h-11"
                                                />
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pb-6">
                                            <Button
                                                type="submit"
                                                className="w-full rounded-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                                variant="hopz"
                                                disabled={loading}
                                            >
                                                {loading ? 'Creating account...' : 'Sign Up'}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
