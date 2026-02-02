import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, Search, Mail, Phone, ShoppingBag } from 'lucide-react';

const AdminUsers = () => {
    const { user, isAdmin, loading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const response = await adminAPI.getUsers();
            return response.data;
        },
        enabled: isAdmin
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" />;
    }

    const filteredUsers = users?.filter((u: any) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-fredoka font-bold text-foreground">
                    User Management
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <UsersIcon className="w-5 h-5" />
                    <span className="font-nunito font-semibold">{users?.length || 0} Total Users</span>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search users by email or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !filteredUsers || filteredUsers.length === 0 ? (
                <Card className="p-12 text-center">
                    <UsersIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-fredoka font-bold mb-2">No users found</h3>
                    <p className="text-muted-foreground">
                        {searchTerm ? 'Try adjusting your search' : 'No users registered yet'}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers?.filter(Boolean).map((u: any) => (
                        <Card key={u.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-hopz flex items-center justify-center">
                                            <span className="text-white font-fredoka font-bold text-lg">
                                                {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-fredoka font-bold">{u.name || 'No Name'}</h3>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                    {u.role || 'USER'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">{u.email || 'N/A'}</span>
                                        </div>
                                        {u.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">{u.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {u._count?.orders || 0} orders
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
};

export default AdminUsers;
