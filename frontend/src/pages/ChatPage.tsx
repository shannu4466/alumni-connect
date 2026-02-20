import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    type: 'TEXT' | 'FILE' | 'SYSTEM';
}

const API_MESSAGES_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/messages';
const API_USERS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/users';
const WEBSOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/ws';

export default function ChatPage() {
    const { recipientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [messages, setMessages] = useState([]);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [historyError, setHistoryError] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const [recipientName, setRecipientName] = useState('Loading...');
    const [recipientProfileImage, setRecipientProfileImage] = useState('/placeholder-avatar.jpg');
    const [roll, setRoll] = useState('');

    const getProfileInitials = (name) => {
        return name ? String(name).split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
    };

    const formatMessageTime = (isoString) => {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const isOwnMessage = (senderId) => senderId === user?.id;

    const fetchRecipientDetails = useCallback(async () => {
        if (!recipientId || !user?.token) return;
        try {
            const response = await fetch(`${API_USERS_BASE_URL}/${recipientId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setRoll(data.rollNumber);
                setRecipientName(data.fullName || `User ${recipientId.substring(0, 4)}`);
                setRecipientProfileImage(data.profileImage || '/placeholder-avatar.jpg');
            } else {
                setRecipientName(`User ${recipientId.substring(0, 4)}`);
                setRecipientProfileImage('/placeholder-avatar.jpg');
            }
        } catch {
            setRecipientName(`User ${recipientId.substring(0, 4)}`);
            setRecipientProfileImage('/placeholder-avatar.jpg');
        }
    }, [recipientId, user?.token]);

    const fetchChatHistory = useCallback(async () => {
        if (!user?.token || !user?.id || !recipientId) {
            setHistoryError("Authentication required or recipient missing for chat history.");
            setIsLoadingHistory(false);
            return;
        }
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
            const response = await fetch(`${API_MESSAGES_BASE_URL}/history/${recipientId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch chat history: ${response.status} ${errorText}`);
            }
            const history = await response.json();

            history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setMessages(history);
        } catch (err) {
            setHistoryError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({ title: "Error loading chat", description: err instanceof Error ? err.message : "Could not load chat history.", variant: "destructive" });
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user?.token, user?.id, recipientId, toast]);

    const connectWebSocket = useCallback(() => {
        if (!user?.token || !user?.id || !recipientId) return;

        const wsUrl = `${WEBSOCKET_URL}?access_token=${user.token}`;

        const client = new Client({
            brokerURL: WEBSOCKET_URL,
            webSocketFactory: () => new SockJS(wsUrl),
            // debug: (str) => { console.log('STOMP Debug:', str); },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: { 'Authorization': `Bearer ${user.token}` },
            onConnect: () => {
                setIsConnected(true);
                client.subscribe(`/user/${user.id}/queue/messages`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages(prev => {
                        const newMessages = [...prev, receivedMessage];
                        newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                        return newMessages;
                    });
                });
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
                setIsConnected(false);
                toast({ title: "Chat Error", description: "Lost connection to chat server.", variant: "destructive" });
            },
            onDisconnect: () => {
                setIsConnected(false);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            if (client.connected) {
                client.deactivate();
            }
        };
    }, [user?.token, user?.id, recipientId, toast]);

    useEffect(() => {
        fetchRecipientDetails();
        fetchChatHistory();
    }, [fetchRecipientDetails, fetchChatHistory]);

    useEffect(() => {
        if (!isLoadingHistory && !historyError) {
            return connectWebSocket();
        }
    }, [isLoadingHistory, historyError, connectWebSocket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = () => {
        if (!newMessageContent.trim() || !stompClient?.connected) {
            toast({ title: "Message Not Sent", description: "Please type a message and ensure you are connected to chat.", variant: "info" });
            return;
        }
        const messagePayload = {
            senderId: user.id,
            receiverId: recipientId,
            content: newMessageContent,
            type: 'TEXT'
        };
        stompClient.publish({
            destination: '/app/chat.privateMessage',
            body: JSON.stringify(messagePayload)
        });
        setNewMessageContent('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!user || !user.token) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[500px]">
                <AlertCircle className="h-10 w-10 text-red-500 mr-2" />
                <p className="text-red-500">Please log in to use chat.</p>
            </div>
        );
    }

    if (isLoadingHistory) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading chat history...</p>
            </div>
        );
    }

    if (historyError) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-red-500 flex flex-col justify-center items-center min-h-[500px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {historyError}</h2>
                <Button onClick={fetchChatHistory} className="mt-4">Retry Load</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-0 py-0 max-w-full h-[calc(100vh-64px)] flex flex-col">
            <div className="p-4 border-b bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={recipientProfileImage} alt={recipientName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {getProfileInitials(recipientName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-base font-semibold">{recipientName}</h2>
                        <p className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                            {roll}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-muted-foreground text-center py-4">No messages yet. Start a conversation!</div>
                    )}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-2 ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Render avatar conditionally based on message sender */}
                            {!isOwnMessage(message.senderId) ? (
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarImage src={recipientProfileImage} alt={message.senderName} />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                        {getProfileInitials(message.senderName)}
                                    </AvatarFallback>
                                </Avatar>
                            ) : null}

                            <div className={`max-w-[70%] ${isOwnMessage(message.senderId) ? 'order-first' : ''}`}>
                                <div
                                    className={`p-3 rounded-lg ${isOwnMessage(message.senderId)
                                            ? 'bg-primary text-primary-foreground ml-auto'
                                            : 'bg-muted'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                </div>
                                <p className={`text-xs text-muted-foreground mt-1 ${isOwnMessage(message.senderId) ? 'text-right' : 'text-left'
                                    }`}>
                                    {formatMessageTime(message.timestamp)}
                                </p>
                            </div>

                            {isOwnMessage(message.senderId) ? ( // Render own avatar conditionally
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarImage src={user?.profileImage || '/placeholder-avatar.jpg'} alt={user?.fullName || 'You'} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {getProfileInitials(user?.fullName || 'You')}
                                    </AvatarFallback>
                                </Avatar>
                            ) : null}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card flex items-center gap-2">
                <Input
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                />
                <Button
                    onClick={handleSendMessage}
                    disabled={!newMessageContent.trim() || !isConnected}
                    size="icon"
                    className="flex-shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
