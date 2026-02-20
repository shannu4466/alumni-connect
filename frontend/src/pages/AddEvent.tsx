import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    FileText,
    PlusCircle,
    Clock,
    Send,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const API_EVENTS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/events';

export default function AddEvent() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDateTime: '',
        location: '',
        imageUrl: '',
        registrationUrl: '',
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!user?.token || user.role !== 'admin') {
            toast({
                title: "Authorization Error",
                description: "Only administrators can post events.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            let eventDateTimeISO = null;
            if (formData.eventDateTime) {
                const localDate = new Date(formData.eventDateTime);
                eventDateTimeISO = localDate.toISOString();
            }

            const payload = {
                ...formData,
                eventDateTime: eventDateTimeISO,
            };

            const response = await fetch(API_EVENTS_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error("Backend Error on Event Post:", errorData);
                throw new Error(errorData.message || `Failed to post event: ${response.status}`);
            }

            toast({
                title: "Event Posted Successfully!",
                description: "Your event has been published.",
                variant: "default",
            });

            setFormData({
                title: '',
                description: '',
                eventDateTime: '',
                location: '',
                imageUrl: '',
                registrationUrl: '',
            });
        } catch (error) {
            toast({
                title: "Failed to Post Event",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Add New Event</h1>
                    <p className="text-muted-foreground">Fill in the details to announce an upcoming college event.</p>
                </div>
            </div>

            <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5" />
                        Event Details
                    </CardTitle>
                    <CardDescription>
                        Provide all necessary information about the event.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Event Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="e.g., Annual Alumni Meet 2025"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eventDateTime">Date & Time *</Label>
                                <Input
                                    id="eventDateTime"
                                    name="eventDateTime"
                                    type="datetime-local"
                                    value={formData.eventDateTime}
                                    onChange={handleInputChange}
                                    required
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="bg-background dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Event Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe the event, agenda, speakers, etc."
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                className="bg-background resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="e.g., College Auditorium or Virtual"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                                <Input
                                    id="imageUrl"
                                    name="imageUrl"
                                    type="url"
                                    placeholder="e.g., https://example.com/event_banner.jpg"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    className="bg-background"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registrationUrl">Registration URL (Optional)</Label>
                            <Input
                                id="registrationUrl"
                                name="registrationUrl"
                                type="url"
                                placeholder="e.g., https://forms.gle/event-register"
                                value={formData.registrationUrl}
                                onChange={handleInputChange}
                                className="bg-background"
                            />
                        </div>

                        <div className="pt-6 border-t border-border">
                            <Button
                                type="submit"
                                variant="premium"
                                size="lg"
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Post Event
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
