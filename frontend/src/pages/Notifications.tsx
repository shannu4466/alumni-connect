import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    MessageCircle,
    Clock,
    CheckCircle,
    XCircle,
    UserPlus,
    ArrowRight,
    Bell,
    Send,
    UserCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface ConnectionRequestData {
    id: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    receiverName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    sentAt: string;
    respondedAt?: string;
}

const API_CONNECTIONS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function Notifications() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sentRequests, setSentRequests] = useState([]);
    const [receivedPendingRequests, setReceivedPendingRequests] = useState([]);
    const [acceptedConnections, setAcceptedConnections] = useState([]);
    const [pendingAlumni, setPendingAlumni] = useState([]);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchAlumniPendingList = async () => {
        if (!user?.token || !user?.id) {
            setError("Authentication required to view notifications.");
            setIsLoading(false);
            return;
        }

        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };

            const response = await fetch(`${API_CONNECTIONS_BASE_URL}/api/users`, { headers });
            if (!response.ok) {
                throw new Error(`Failed to fetch alumni list: ${response.status}`);
            }

            const allUsers = await response.json();

            const filtered = allUsers.filter(u =>
                u.role === 'alumni' &&
                u.isApproved === false &&
                u.applicationStatus === 'PENDING_ADMIN_APPROVAL'
            );

            setPendingAlumni(filtered);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({
                title: "Error fetching alumni list",
                description: err instanceof Error ? err.message : "Could not load pending alumni.",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchAlumniPendingList();
        }
    }, [user]);

    const fetchConnectionData = useCallback(async () => {
        if (!user?.token || !user?.id) {
            setError("Authentication required to view notifications.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };

            const [sentRes, receivedRes, acceptedRes] = await Promise.all([
                fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/requests/sent`, { headers }),
                fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/requests/pending`, { headers }),
                fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/accepted`, { headers }),
            ]);

            if (!sentRes.ok || !receivedRes.ok || !acceptedRes.ok) {
                const sentErr = sentRes.ok ? '' : await sentRes.text();
                const receivedErr = receivedRes.ok ? '' : await receivedRes.text();
                const acceptedErr = acceptedRes.ok ? '' : await acceptedRes.text();
                throw new Error(`Failed to fetch connection data: Sent(${sentRes.status}): ${sentErr} Received(${receivedRes.status}): ${receivedErr} Accepted(${acceptedRes.status}): ${acceptedErr}`);
            }

            setSentRequests(await sentRes.json());
            setReceivedPendingRequests(await receivedRes.json());
            setAcceptedConnections(await acceptedRes.json());

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({ title: "Error fetching notifications", description: err instanceof Error ? err.message : "Could not load your notifications.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user?.token, user?.id, toast]);

    useEffect(() => {
        fetchConnectionData();
    }, [fetchConnectionData]);

    const handleRespondToRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
        setActionLoadingId(requestId);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.token}`,
            };

            if (!user?.token) {
                toast({ title: "Authentication Required", description: "Please log in to respond to requests.", variant: "destructive" });
                return;
            }

            const response = await fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/request/${requestId}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ action }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error("Backend Error on Respond to Request:", errorData);
                throw new Error(errorData.message || `Failed to respond: ${response.status}`);
            }

            toast({ title: `Request ${action === 'ACCEPT' ? 'Accepted!' : 'Rejected!'}`, description: `Connection request has been ${action.toLowerCase()}d.`, variant: "default" });
            fetchConnectionData();
        } catch (err) {
            toast({ title: `Failed to ${action} Request`, description: err instanceof Error ? err.message : `Could not ${action.toLowerCase()} connection request.`, variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const getProfileInitials = (name: string | undefined): string => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
    };

    const formatDateTime = (dateTimeString: string): string => {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading notifications...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-red-500 flex flex-col justify-center items-center min-h-[400px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {error}</h2>
                <Button onClick={fetchConnectionData} className="mt-4">Retry</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Notification Center</h1>
                    <p className="text-muted-foreground">Manage your connection requests and recent activities</p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    {receivedPendingRequests.length} pending requests
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {user?.role === 'alumni' && (
                    <Card className="bg-gradient-card border-border shadow-soft">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" /> Incoming Requests
                            </CardTitle>
                            <CardDescription>Requests from students to connect with you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {receivedPendingRequests.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No pending incoming requests.</p>
                            ) : (
                                receivedPendingRequests.map(request => (
                                    <div key={request.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                                        <div className="flex items-start space-x-3 flex-grow">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={`/api/placeholder/40/40?text=${getProfileInitials(request.senderName)}`} />
                                                <AvatarFallback>{getProfileInitials(request.senderName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">{request.senderName}</p>
                                                <p className="text-sm text-muted-foreground">wants to connect.</p>
                                                <p className="text-xs text-muted-foreground mt-1">Sent at: {formatDateTime(request.sentAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center items-center sm:flex-row gap-2 flex-shrink-0 mt-2 sm:mt-0">
                                            <Button
                                                size="sm"
                                                variant="premium"
                                                onClick={() => handleRespondToRequest(request.id, 'ACCEPT')}
                                                disabled={actionLoadingId === request.id}
                                            >
                                                {actionLoadingId === request.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                )}
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRespondToRequest(request.id, 'REJECT')}
                                                disabled={actionLoadingId === request.id}
                                            >
                                                {actionLoadingId === request.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                )}
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Outgoing Requests (For Students to track their requests) */}
                {user?.role === 'student' && (
                    <Card className="bg-gradient-card border-border shadow-soft">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" /> Sent Requests
                            </CardTitle>
                            <CardDescription>Status of connection requests you've sent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sentRequests.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No requests sent yet.</p>
                            ) : (
                                sentRequests.map(request => (
                                    <div key={request.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                                        <div className="flex items-start space-x-3 flex-grow">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={`/api/placeholder/40/40?text=${getProfileInitials(request.receiverName)}`} />
                                                <AvatarFallback>{getProfileInitials(request.receiverName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    To: {request.receiverName}
                                                </p>
                                                <div className="text-sm text-muted-foreground">
                                                    Status:{' '}
                                                    <Badge
                                                        variant={
                                                            request.status === 'ACCEPTED'
                                                                ? 'success'
                                                                : request.status === 'REJECTED'
                                                                    ? 'destructive'
                                                                    : 'secondary'
                                                        }
                                                    >
                                                        {request.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Sent at: {formatDateTime(request.sentAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {request.status === 'ACCEPTED' && (
                                            <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${request.receiverId}`)}>
                                                <MessageCircle className="h-3 w-3 mr-1" /> Message
                                            </Button>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Pending Alumni Applications (Admin View) */}
                {user?.role === 'admin' && (
                    <Card className="bg-gradient-card border-border shadow-soft">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" /> Pending Alumni Applications
                            </CardTitle>
                            <CardDescription>Alumni applications waiting for your approval.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingAlumni.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No pending alumni applications.</p>
                            ) : (
                                pendingAlumni.map(alumni => (
                                    <div key={alumni.id} className="flex justify-between items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                                        <div className='flex items-center justify-start'>
                                            <Avatar className="h-10 w-10 mr-2">
                                                <AvatarImage src={`/api/placeholder/40/40?text=${getProfileInitials(alumni.fullName)}`} />
                                                <AvatarFallback>{getProfileInitials(alumni.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h1 className='font-medium text-foreground truncate'>Alumni Name: {alumni.fullName}</h1>
                                                <div className="text-sm text-muted-foreground">
                                                    Status: <Badge variant="secondary">PENDING</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/view-alumni-profile/${alumni.id}`)}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Accepted Connections (Shared View - secondary/third column item) */}
                <Card className={`bg-gradient-card border-border shadow-soft ${user?.role === 'student' ? 'lg:col-span-2' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Recent Connections
                        </CardTitle>
                        <CardDescription>Recently accepted connection requests.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {acceptedConnections.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No recent accepted connections.</p>
                        ) : (
                            acceptedConnections.slice(0, 5).map(connection => (
                                <div key={connection.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`/api/placeholder/40/40?text=${getProfileInitials(connection.senderName === user?.fullName ? connection.receiverName : connection.senderName)}`} />
                                            <AvatarFallback>{getProfileInitials(connection.senderName === user?.fullName ? connection.receiverName : connection.senderName)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate">
                                                {connection.senderName === user?.fullName ? connection.receiverName : connection.senderName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <Badge className="bg-green-600 text-white">Connected</Badge>
                                            </p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/chat/${connection.senderId === user?.id ? connection.receiverId : connection.senderId}`)}>
                                        <MessageCircle className="h-4 w-4 mr-1" /> Chat
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
