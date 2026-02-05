import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    emailNotifications?: boolean;
    promoNotifications?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: { email: string; password: string; name?: string; phone?: string }) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.data);
                    setToken(storedToken);
                } catch (error: any) {
                    // Only remove token if it's explicitly an auth error (401)
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        setToken(null);
                    }
                    console.error('Auth check failed:', error.message);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authAPI.login({ email, password });
        const { user: userData, token: userToken } = response.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const signup = async (data: { email: string; password: string; name?: string; phone?: string }) => {
        const response = await authAPI.signup(data);
        const { user: userData, token: userToken } = response.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const googleLogin = async (credential: string) => {
        const response = await authAPI.googleLogin(credential);
        const { user: userData, token: userToken } = response.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const isAdmin = user?.role === 'ADMIN' || user?.email === 'happyhopz308@gmail.com';

    return (
        <AuthContext.Provider value={{ user, setUser, token, loading, login, signup, googleLogin, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
