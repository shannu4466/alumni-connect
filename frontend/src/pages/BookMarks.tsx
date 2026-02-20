import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    MapPin,
    Building,
    IndianRupee,
    BookmarkPlus,
    ExternalLink,
    Star,
    Clock,
    Loader2,
    Calendar,
    Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Referral {
    id: string;
    alumniId: string;
    alumniName: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    requirements?: string;
    skills?: string[];
    applicationDeadline: string;
    applicationUrl: string;
    postedDate: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function Bookmarks() {
    const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchBookmarkedJobs = useCallback(async () => {
        if (!user?.token || !user?.id) {
            setError("You must be logged in to view bookmarks.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };
            const bookmarksResponse = await fetch(`${API_BASE_URL}/api/bookmarks/user/${user.id}`, { headers });

            if (!bookmarksResponse.ok) {
                throw new Error(`Failed to fetch bookmarks: ${bookmarksResponse.status}`);
            }

            const bookmarkedJobIds = await bookmarksResponse.json();

            if (bookmarkedJobIds.length === 0) {
                setBookmarkedJobs([]);
                return;
            }

            const jobDetailsPromises = bookmarkedJobIds.map(jobId =>
                fetch(`${API_BASE_URL}/api/job-posts/${jobId}`, { headers }).then(res => {
                    if (!res.ok) {
                        console.error(`Failed to fetch details for job ID: ${jobId}, status: ${res.status}`);
                        return null;
                    }
                    return res.json();
                })
            );

            const jobDetails = (await Promise.all(jobDetailsPromises)).filter(job => job !== null);

            setBookmarkedJobs(jobDetails);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({
                title: "Error fetching bookmarks",
                description: err instanceof Error ? err.message : "Could not load bookmarked jobs.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchBookmarkedJobs();
    }, [fetchBookmarkedJobs]);

    const handleRemoveBookmark = async (jobPostId) => {
        if (!user?.token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/${jobPostId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove bookmark.');
            }

            toast({ title: "Bookmark Removed", description: "Job removed from your bookmarks.", });
            fetchBookmarkedJobs();

        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive", });
        }
    };

    const formatSalary = (min, max) => {
        if (min === null && max === null) return 'N/A';
        if (min !== null && max !== null) return `${min.toLocaleString()} - ${max.toLocaleString()}`;
        if (min !== null) return `Min: ₹${min.toLocaleString()}`;
        if (max !== null) return `Max: ₹${max.toLocaleString()}`;
        return 'N/A';
    };

    const formatDeadline = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getProfileInitials = (fullName) => {
        return fullName ? String(fullName).split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
    };

    const handleViewDetails = (id) => {
        navigate(`/job-details/${id}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading your bookmarks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Bookmarks</h1>
                    <p className="text-muted-foreground">Your saved job referrals.</p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                        {bookmarkedJobs.length}
                    </span>
                    <span className="ml-2">Saved Referrals</span>
                </Badge>
            </div>

            {bookmarkedJobs.length === 0 ? (
                <Card className="bg-gradient-card border-border shadow-soft">
                    <CardContent className="p-12 text-center">
                        <BookmarkPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No bookmarks yet!</h3>
                        <p className="text-muted-foreground">
                            Browse the referrals page and click the bookmark icon to save jobs.
                        </p>
                        <Button onClick={() => navigate('/referrals')} variant="premium" className="mt-4">
                            Browse Referrals
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {bookmarkedJobs.map((referral) => (
                        <Card key={referral.id} className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                                    <div className="flex items-start space-x-4 flex-grow">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={referral.companyLogo || "/placeholder-company.png"} />
                                            <AvatarFallback>
                                                <Building className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <span className="truncate">{referral.title}</span>
                                                <Badge variant={referral.jobType === 'full-time' ? 'default' : 'secondary'}>
                                                    {referral.jobType}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {referral.company}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {referral.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <IndianRupee className="h-3 w-3" />
                                                    {formatSalary(referral.salaryMin, referral.salaryMax)}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveBookmark(referral.id);
                                                }}
                                                title='Remove Bookmark'
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-foreground line-clamp-2">{referral.description}</p>
                                {referral.skills && referral.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {referral.skills.slice(0, 3).map((skill, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {skill}
                                            </Badge>
                                        ))}
                                        {referral.skills.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{referral.skills.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {referral.requirements && (
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">Requirements:</span> {referral.requirements}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-border gap-3">
                                    <div className="flex flex-wrap items-center space-x-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={referral.avatar || "/placeholder-avatar.jpg"} />
                                                <AvatarFallback className="text-xs">
                                                    {referral.alumniName ? referral.alumniName.split(' ').map(n => n[0]).join('') : 'AA'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>Posted by {referral.alumniName}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{referral.postedDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Deadline: {formatDeadline(referral.applicationDeadline)}</span>
                                        </div>
                                        {referral.rating && (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                <span>{referral.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end items-center gap-3 flex-shrink-0 w-full">
                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(referral.id)}>
                                            <ExternalLink className="mr-2 h-3 w-3" />
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
