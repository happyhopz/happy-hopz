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
            if (error.response?.data?.error === 'Please verify your email') {
                navigate('/verify-email');
            } else {
                toast.error(error.response?.data?.error || 'Login failed');
            }
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
            navigate('/verify-email');
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
            <div className="min-h-screen gradient-hopz flex items-center justify-center p-4">
                <div className="absolute top-4 left-4">
                    <BackButton label="Back to Home" to="/" />
                </div>
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8 animate-fade-up">
                        <Link to="/" className="inline-block">
                            <img
                                src={pandaLogo}
                                alt="Happy Hopz"
                                className="w-24 h-24 mx-auto mb-4 animate-bounce-gentle"
                            />
                            <h1 className="text-3xl font-playfair font-bold text-foreground">
                                HAPPY HOPZ
                            </h1>
                        </Link>
                    </div>

                    <Card className="shadow-float animate-scale-in">
                        <Tabs defaultValue="login" className="w-full">
                            <CardHeader>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Login</TabsTrigger>
                                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                </TabsList>
                            </CardHeader>

                            {/* Login Tab */}
                            <TabsContent value="login">
                                <form onSubmit={handleLogin}>
                                    <CardContent className="space-y-4">
                                        <CardTitle>Welcome Back!</CardTitle>
                                        <CardDescription>
                                            Login to continue shopping
                                        </CardDescription>

                                        <div className="space-y-2">
                                            <Label htmlFor="login-email">Email</Label>
                                            <Input
                                                id="login-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="login-password">Password</Label>
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex flex-col gap-4">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            variant="hopz"
                                            disabled={loading}
                                        >
                                            {loading ? 'Logging in...' : 'Login'}
                                        </Button>

                                        <div className="relative my-2">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t"></span>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center w-full">
                                            <GoogleLogin
                                                onSuccess={handleGoogleSuccess}
                                                onError={() => toast.error('Google Login Failed')}
                                                useOneTap
                                                shape="pill"
                                                theme="filled_blue"
                                                width="100%"
                                            />
                                        </div>
                                    </CardFooter>
                                </form>
                            </TabsContent>

                            {/* Signup Tab */}
                            <TabsContent value="signup">
                                <form onSubmit={handleSignup}>
                                    <CardContent className="space-y-4">
                                        <CardTitle>Create Account</CardTitle>
                                        <CardDescription>
                                            Join Happy Hopz family today!
                                        </CardDescription>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name">Name</Label>
                                            <Input
                                                id="signup-name"
                                                type="text"
                                                placeholder="Your name"
                                                value={signupData.name}
                                                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
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
                                            />
                                        </div>
                                    </CardContent>

                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            variant="hopz"
                                            disabled={loading}
                                        >
                                            {loading ? 'Creating account...' : 'Sign Up'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </Card>

                    <div className="text-center mt-4">
                        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
