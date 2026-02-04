import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Mail, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminContacts = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('ALL');

    const { data: contacts, isLoading } = useQuery({
        queryKey: ['admin-contacts', statusFilter],
        queryFn: async () => {
            const params = statusFilter === 'ALL' ? {} : { status: statusFilter };
            const response = await contactsAPI.getAll(params);
            return response.data;
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) =>
            contactsAPI.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
            toast.success('Status updated');
        }
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'UNREAD': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'READ': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'REPLIED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'UNREAD': return <Badge variant="destructive">Unread</Badge>;
            case 'READ': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Read</Badge>;
            case 'REPLIED': return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Replied</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-fredoka font-bold text-foreground">Support Requests</h1>
                    <p className="text-muted-foreground mt-1 font-nunito">Manage incoming customer inquiries</p>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] border-2">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Requests</SelectItem>
                        <SelectItem value="UNREAD">Unread Only</SelectItem>
                        <SelectItem value="READ">Read</SelectItem>
                        <SelectItem value="REPLIED">Replied</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : contacts?.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="text-xl font-fredoka font-bold">No requests found</h3>
                    <p className="text-muted-foreground">Everything is quiet for now!</p>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {contacts?.map((contact: any) => (
                        <Card key={contact.id} className="p-6 hover:shadow-float transition-all border-l-4 overflow-hidden relative" style={{ borderLeftColor: contact.status === 'UNREAD' ? 'red' : contact.status === 'READ' ? '#3b82f6' : '#22c55e' }}>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(contact.status)}
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                {format(new Date(contact.createdAt), 'dd MMM yyyy • HH:mm')}
                                            </span>
                                        </div>
                                        {getStatusBadge(contact.status)}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">{contact.subject}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="font-bold text-sm text-primary">{contact.name}</p>
                                            <span className="text-muted-foreground">•</span>
                                            <a href={`mailto:${contact.email}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                                <Mail className="w-3 h-3" />
                                                {contact.email}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 p-4 rounded-xl border border-gray-100 italic text-sm leading-relaxed text-muted-foreground">
                                        "{contact.message}"
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        {contact.status !== 'REPLIED' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-green-600 hover:bg-green-700 h-9"
                                                    onClick={() => statusMutation.mutate({ id: contact.id, status: 'REPLIED' })}
                                                >
                                                    Mark as Replied
                                                </Button>
                                                {contact.status === 'UNREAD' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9"
                                                        onClick={() => statusMutation.mutate({ id: contact.id, status: 'READ' })}
                                                    >
                                                        Mark as Read
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {contact.status === 'REPLIED' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-9 text-muted-foreground"
                                                onClick={() => statusMutation.mutate({ id: contact.id, status: 'UNREAD' })}
                                            >
                                                Reset to Unread
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminContacts;
