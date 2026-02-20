import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    MessageCircle,
    MapPin,
    Building,
    Calendar,
    Star,
    UserCheck,
    Loader2,
    AlertCircle,
    Search as SearchIcon,
    MessageSquareText,
    Bell
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CombinedConnectionData {
    id: string;
    fullName: string;
    email?: string;
    role?: string;
    profileImage?: string;
    company?: string;
    position?: string;
    location?: string;
    connectedSince?: string;
    lastMessageContent?: string;
    lastMessageTimestamp?: string;
    unreadCount?: number;
    hasMessages: boolean;
}

interface BackendConversationPreviewData {
    partnerId: string;
    partnerName: string;
    partnerProfileImage?: string;
    latestMessageContent: string;
    latestMessageTimestamp?: string;
    unreadCount: number;
}

interface BackendConnectionData {
    id: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    receiverName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    sentAt: string;
    respondedAt?: string;
}

const API_USERS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/users';
const API_CONNECTIONS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/connections';
const API_MESSAGES_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/messages';

export default function Connections() {
    const [searchTerm, setSearchTerm] = useState('');
    const [combinedConnections, setCombinedConnections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const getProfileInitials = (fullName) => {
        return fullName ? String(fullName).split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
    };

    const formatLastMessageTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'N/A';
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const fetchCombinedConnectionsData = useCallback(async () => {
        if (!user?.token || !user?.id) {
            setError("Authentication required to view your connections.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            };

            const [conversationsRes, acceptedConnectionsRes] = await Promise.all([
                fetch(`${API_MESSAGES_BASE_URL}/conversations`, { headers }),
                fetch(`${API_CONNECTIONS_BASE_URL}/accepted`, { headers })
            ]);

            let conversationsData: BackendConversationPreviewData[] = [];
            if (conversationsRes.ok) {
                conversationsData = await conversationsRes.json();
            } else {
                console.error("Failed to fetch message conversations:", await conversationsRes.text());
            }

            let acceptedConnectionsData: BackendConnectionData[] = [];
            if (acceptedConnectionsRes.ok) {
                acceptedConnectionsData = await acceptedConnectionsRes.json();
            } else {
                console.error("Failed to fetch accepted connections list:", await acceptedConnectionsRes.text());
            }

            const uniqueUsersMap = new Map<string, CombinedConnectionData>();

            for (const conv of conversationsData) {
                uniqueUsersMap.set(conv.partnerId, {
                    id: conv.partnerId,
                    fullName: conv.partnerName,
                    profileImage: conv.partnerProfileImage,
                    latestMessageContent: conv.latestMessageContent,
                    lastMessageTimestamp: conv.latestMessageTimestamp,
                    unreadCount: conv.unreadCount,
                    hasMessages: true,
                });
            }

            for (const conn of acceptedConnectionsData) {
                const otherUserId = conn.senderId === user.id ? conn.receiverId : conn.senderId;
                const otherUserName = conn.senderId === user.id ? conn.receiverName : conn.senderName;

                if (!uniqueUsersMap.has(otherUserId)) {
                    try {
                        const userProfileResponse = await fetch(`${API_USERS_BASE_URL}/${otherUserId}`, { headers });
                        const userProfileData = userProfileResponse.ok ? await userProfileResponse.json() : {};

                        uniqueUsersMap.set(otherUserId, {
                            id: otherUserId,
                            fullName: userProfileData.fullName || otherUserName,
                            email: userProfileData.email || 'N/A',
                            role: userProfileData.role || 'N/A',
                            profileImage: userProfileData.profileImage || "/placeholder-avatar.jpg",
                            company: userProfileData.company,
                            position: userProfileData.position,
                            location: userProfileData.location,
                            connectedSince: conn.respondedAt || conn.sentAt,
                            lastMessageContent: "No messages yet.", // Default if no messages
                            lastMessageTimestamp: conn.respondedAt || conn.sentAt,
                            unreadCount: 0,
                            hasMessages: false,
                        });
                    } catch (profileErr) {
                        console.error(`Error fetching profile for unconnected user ${otherUserName}:`, profileErr);
                        uniqueUsersMap.set(otherUserId, {
                            id: otherUserId,
                            fullName: otherUserName,
                            email: 'N/A', role: 'N/A', profileImage: "/placeholder-avatar.jpg",
                            connectedSince: conn.respondedAt || conn.sentAt,
                            lastMessageContent: "Error loading profile.",
                            lastMessageTimestamp: conn.respondedAt || conn.sentAt,
                            unreadCount: 0,
                            hasMessages: false,
                        });
                    }
                } else {
                    const existingEntry = uniqueUsersMap.get(otherUserId);
                    if (existingEntry && !existingEntry.connectedSince) {
                        uniqueUsersMap.set(otherUserId, { ...existingEntry, connectedSince: conn.respondedAt || conn.sentAt });
                    }
                }
            }

            const finalCombinedList = Array.from(uniqueUsersMap.values());

            finalCombinedList.sort((a, b) => {
                const tsA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : new Date(a.connectedSince || 0).getTime();
                const tsB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : new Date(b.connectedSince || 0).getTime();

                // Prioritize by message existence (conversations first)
                if (a.hasMessages && !b.hasMessages) return -1;
                if (!a.hasMessages && b.hasMessages) return 1;

                // Then sort by timestamp (latest first)
                return tsB - tsA;
            });

            setCombinedConnections(finalCombinedList);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({ title: "Error fetching data", description: err instanceof Error ? err.message : "Could not load your conversations and connections.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user?.token, user?.id, toast]);

    useEffect(() => {
        fetchCombinedConnectionsData();
    }, [fetchCombinedConnectionsData]);

    const filteredCombinedConnections = combinedConnections.filter(person => {
        const matchesSearch = person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (person.position && person.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (person.lastMessageContent && person.lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    const handleOpenChat = (partnerId) => {
        navigate(`/chat/${partnerId}`);
    };

    const handleViewProfile = (partnerId) => {
        navigate(`/view-${partnerId.startsWith('std') ? 'student' : 'alumni'}-profile/${partnerId}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading your connections...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-red-500 flex flex-col justify-center items-center min-h-[400px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {error}</h2>
                <Button onClick={fetchCombinedConnectionsData} className="mt-4">Retry Load</Button>
            </div>
        );
    }

    return (
        <div className="container px-4 py-8 space-y-8 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Connections</h1>
                    <p className="text-muted-foreground">Your established network of {user?.role === 'student' ? "alumni's" : 'students'}</p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    {filteredCombinedConnections.length} connections
                </Badge>
            </div>

            <Card className="bg-gradient-card border-border shadow-soft">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search connections..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-background"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {filteredCombinedConnections.length === 0 ? (
                <Card className="bg-gradient-card border-border shadow-soft">
                    <CardContent className="p-12 text-center">
                        <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No connections or conversations yet!</h3>
                        <p className="text-muted-foreground">
                            {user?.role === 'alumni' ? `Connect with students by posting referrals or messaging them directly.` : 'Start building your network by sending connection requests in the Connect section.'}
                        </p>
                        {user?.role === 'student' && (
                            <Button onClick={() => navigate('/connect')} variant="premium" className="mt-4">
                                Connect with Alumni
                            </Button>
                        )}
                        {user?.role === 'alumni' && (
                            <Button onClick={() => navigate('/post-referral')} variant="premium" className="mt-4">
                                Post a Referral
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredCombinedConnections.map((person) => (
                        <Card
                            key={person.id}
                            className="bg-gradient-card border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => handleOpenChat(person.id)}
                        >
                            <CardContent className="p-4 flex items-center space-x-4">
                                <div className="relative">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={person.profileImage || "/placeholder-avatar.jpg"} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                            {getProfileInitials(person.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {person.unreadCount > 0 && (
                                        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold">
                                            {person.unreadCount}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg font-semibold truncate">
                                            {person.fullName}
                                        </CardTitle>
                                        <span className="text-xs text-muted-foreground">
                                            {person.lastMessageTimestamp && formatLastMessageTime(person.lastMessageTimestamp)}
                                            {!person.lastMessageTimestamp && person.connectedSince && `Connected since ${(person.connectedSince)}`}
                                        </span>
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground truncate mt-1">
                                        {person.hasMessages ? person.latestMessageContent : 'No messages yet. Click to start chat.'}
                                    </CardDescription>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
