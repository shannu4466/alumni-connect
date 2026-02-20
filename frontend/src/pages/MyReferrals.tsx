import { useState, useEffect, useCallback } from 'react';
import {
    Search as SearchIcon,
    Filter,
    MapPin,
    Building,
    IndianRupee,
    BookmarkPlus,
    ExternalLink,
    Star,
    Clock,
    Loader2,
    Calendar,
    AlertCircle,
    PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface JobPost {
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
    status?: string;
}

const API_JOB_POSTS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/job-posts';

export default function MyReferrals() {
    const [myJobPosts, setMyJobPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // New state for status filter
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchMyJobPosts = useCallback(async () => {
        if (!user?.token || !user?.id || user.role !== 'alumni') {
            setError("You must be logged in as an alumnus to view your referrals.");
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

            const response = await fetch(`${API_JOB_POSTS_BASE_URL}/by-alumni/${user.id}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch your job posts: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            data.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
            setMyJobPosts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({
                title: "Error fetching your jobs",
                description: err instanceof Error ? err.message : "Could not load your posted referrals.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user?.token, user?.id, user?.role, toast]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchMyJobPosts();
    }, [fetchMyJobPosts]);

    const filteredReferrals = myJobPosts.filter(referral => {
        const matchesSearch = referral.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            referral.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (referral.skills && referral.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesStatus = filterStatus === 'all' || (referral.status && referral.status.toLowerCase() === filterStatus);

        return matchesSearch && matchesStatus;
    });

    const formatSalary = (min, max) => {
        if (min === null && max === null) return 'N/A';
        if (min !== null && max !== null) return `${min.toLocaleString()} - ${max.toLocaleString()}`;
        if (min !== null) return `Min: ${min.toLocaleString()}`;
        if (max !== null) return `Max: ${max.toLocaleString()}`;
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

    const getStatusBadgeVariant = (status) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return 'default';
            case 'HIRED': return 'success';
            case 'CLOSED': return 'destructive';
            default: return 'secondary';
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading your referrals...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-red-500 flex flex-col justify-center items-center min-h-[400px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {error}</h2>
                <Button onClick={fetchMyJobPosts} className="mt-4">Retry Load</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Manage Your Referrals</h1>
                    <p className="text-muted-foreground">
                        Keep track of all the job referrals you’ve shared with your network.
                    </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    {filteredReferrals.length} referrals posted
                </Badge>
            </div>

            <Card className="bg-gradient-card border-border shadow-soft">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by title, company, or skills..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-background"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[200px] bg-background">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {filteredReferrals.length === 0 ? (
                <Card className="bg-gradient-card border-border shadow-soft">
                    <CardContent className="p-12 text-center">
                        <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No referrals posted yet!</h3>
                        <p className="text-muted-foreground">
                            Share an opportunity and help your fellow graduates.
                        </p>
                        <Link to="/post-referral">
                            <Button variant="premium" className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" /> Post Your First Referral
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReferrals.map((referral) => (
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
                                            <CardTitle className="text-xl truncate">{referral.title}</CardTitle>
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
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                                        {referral.status && (
                                            <Badge variant={getStatusBadgeVariant(referral.status)} className="text-base px-3 py-1">
                                                {referral.status}
                                            </Badge>
                                        )}
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

                                    <div className="flex justify-end w-full items-end gap-3 flex-shrink-0">
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
