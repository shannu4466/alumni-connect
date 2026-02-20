import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2,
    Loader2,
    AlertCircle,
    Mail,
    Linkedin,
    Github,
    MapPin,
    Calendar,
    Briefcase,
    ClipboardList,
    FileText,
    XCircle,
    CheckCircle,
    Search,
    AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useAlumniApproval } from '@/hooks/useAlumniApproval';

interface AlumniProfileData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    company?: string;
    graduationYear?: number;
    bio?: string;
    skills?: string[];
    isApproved: boolean;
    linkedinProfile?: string;
    githubProfile?: string;
    location?: string;
    profileImage?: string;
    resume?: string;
    company?: string;
    position?: string;
    rollNumber?: string;
    applicationStatus?: 'PENDING_ADMIN_APPROVAL' | 'APPROVED' | 'REJECTED';
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function AlumniProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const { updateAlumniApprovalStatus, isUpdatingApproval } = useAlumniApproval(); // Use the hook here

    const [alumni, setAlumni] = useState<AlumniProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [warningCard, isWarningCard] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchAlumniDetails = useCallback(async () => {
        if (!id) {
            setError("Alumni ID is missing.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            if (!user?.token) {
                setError("You must be logged in to view alumni profiles.");
                setIsLoading(false);
                toast({
                    title: "Authentication Required",
                    description: "Please log in to view alumni profiles.",
                    variant: "destructive",
                });
                return;
            }
            headers['Authorization'] = `Bearer ${user.token}`;

            const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError("Alumni profile not found.");
                } else {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch alumni details: ${response.status} ${errorText}`);
                }
            }

            const data = await response.json();
            setAlumni(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({
                title: "Error fetching profile",
                description: err instanceof Error ? err.message : "Could not load alumni profile.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [id, user?.token, toast]);

    useEffect(() => {
        fetchAlumniDetails();
    }, [fetchAlumniDetails]);

    const handleApprovalAction = async (alumniId: string, approved: boolean) => {
        setAlumni(prevAlumni => prevAlumni ? { ...prevAlumni, isApproved: approved, applicationStatus: approved ? 'APPROVED' : 'REJECTED' } : null);

        const result = await updateAlumniApprovalStatus(alumniId, approved);

        if (result) {
            fetchAlumniDetails();
        } else {
            fetchAlumniDetails();
        }
    };

    const handleDownloadResume = () => {
        if (alumni?.resume) {
            window.open(alumni.resume, '_blank');
        } else {
            toast({
                title: "Resume Not Available",
                description: "This alumnus has not uploaded a resume.",
                variant: "info",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading alumni profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-red-500 flex flex-col justify-center items-center min-h-[500px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {error}</h2>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    if (!alumni) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-muted-foreground flex flex-col justify-center items-center min-h-[500px]">
                <Search className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Alumni Profile Not Found</h2>
                <p className="mt-2">The profile you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <h1 className='h-10 text-3xl font-bold w-full text-center'>Alumni Details</h1>
            <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                        <Avatar className="h-24 w-24 flex-shrink-0 border-2 border-primary-foreground/20 shadow-md">
                            <AvatarImage src={alumni.profileImage || "/placeholder-avatar.jpg"} />
                            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                                {alumni.fullName ? alumni.fullName.split(' ').map(n => n[0]).join('') : 'UN'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left flex-grow min-w-0">
                            <CardTitle className="text-3xl font-bold text-foreground mb-1 truncate">
                                {alumni.fullName.toUpperCase()}
                            </CardTitle>
                            <CardDescription className="text-lg text-muted-foreground flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {alumni.email}
                                </span>
                                {alumni.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {alumni.location}
                                    </span>
                                )}
                            </CardDescription>
                            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                                <Badge variant="secondary">{alumni.role}</Badge>
                                {alumni.applicationStatus === 'APPROVED' && (
                                    <Badge className="bg-green-500 text-white hover:bg-green-600">Approved</Badge>
                                )}
                                {alumni.applicationStatus === 'PENDING_ADMIN_APPROVAL' && (
                                    <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>
                                )}
                                {alumni.applicationStatus === 'REJECTED' && (
                                    <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 flex-shrink-0">
                        {alumni.linkedinProfile && (
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <a href={alumni.linkedinProfile} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                                </a>
                            </Button>
                        )}
                        {alumni.githubProfile && (
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <a href={alumni.githubProfile} target="_blank" rel="noopener noreferrer">
                                    <Github className="mr-2 h-4 w-4" /> GitHub
                                </a>
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 md:px-8 md:pb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        {alumni.company ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span>COMPANY : {alumni.company.toUpperCase()}</span>
                            </div>
                        ) :
                            (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Building2 className="h-4 w-4 flex-shrink-0" />
                                    <span>COMPANY : NOT AVAILABLE</span>
                                </div>
                            )}
                        {alumni.graduationYear && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span>Graduated Year: {alumni.graduationYear}</span>
                            </div>
                        )}
                        {alumni.rollNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                                <span>Roll Number: {alumni.rollNumber}</span>
                            </div>
                        )}
                        {alumni.company && alumni.position && (alumni.role === 'alumni') && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Briefcase className="h-4 w-4 flex-shrink-0" />
                                <span>ROLE : {alumni.position.toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    {alumni.bio && (
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">About</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {alumni.bio}
                            </p>
                        </div>
                    )}

                    {alumni.skills && alumni.skills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {alumni.skills.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-start pt-4 border-t border-border">
                        {alumni.resume ?
                            <Button variant="premium" onClick={handleDownloadResume}>
                                <FileText className="mr-2 h-4 w-4" /> Download Resume
                            </Button>
                            :
                            <Button variant="premium">
                                <FileText className="mr-2 h-4 w-4" /> No Resume
                            </Button>
                        }
                    </div>

                    {user?.role === 'admin' && alumni.role === 'alumni' && (
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-border">
                            {alumni.applicationStatus === 'PENDING_ADMIN_APPROVAL' && (
                                <div className='flex justify-between'>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleApprovalAction(alumni.id, false)}
                                        disabled={isUpdatingApproval}
                                        className='mr-2'
                                    >
                                        <XCircle className="mr-2 h-3 w-3" />
                                        {isUpdatingApproval ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reject'}
                                    </Button>
                                    <Button
                                        variant="premium"
                                        size="sm"
                                        onClick={() => handleApprovalAction(alumni.id, true)}
                                        disabled={isUpdatingApproval}
                                    >
                                        <CheckCircle className="mr-2 h-3 w-3" />
                                        {isUpdatingApproval ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                    </Button>
                                </div>
                            )}
                            {alumni.applicationStatus === 'REJECTED' && (
                                <Button
                                    variant="premium"
                                    size="sm"
                                    onClick={() => handleApprovalAction(alumni.id, true)}
                                    disabled={isUpdatingApproval}
                                >
                                    <CheckCircle className="mr-2 h-3 w-3" />
                                    {isUpdatingApproval ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve (Override)'}
                                </Button>
                            )}
                            {alumni.applicationStatus === 'APPROVED' && (
                                <Button
                                    size="sm"
                                    onClick={() => isWarningCard(true)}
                                    disabled={isUpdatingApproval}
                                    variant='destructive'
                                    className=''
                                >
                                    <XCircle className="mr-2 h-3 w-3" />
                                    {isUpdatingApproval ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remove Alumni'}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Warning card */}
                    {warningCard && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <Card className="w-full max-w-sm border border-border bg-black shadow-xl rounded-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-center gap-2 text-red-600 text-lg font-semibold">
                                        <AlertTriangle className="h-6 w-6" />
                                        Remove Alumni
                                    </CardTitle>
                                    <CardDescription className="text-center mt-2 text-sm text-white">
                                        Are you sure you want to remove this alumni from your college? Once removed, they will no longer be able to post referrals.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-center gap-4 mt-4">
                                    <Button
                                        variant="outline"
                                        className="px-4 py-2"
                                        onClick={() => isWarningCard(false)}
                                        disabled={isUpdatingApproval}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="px-4 py-2"
                                        onClick={() => {
                                            handleApprovalAction(alumni.id, false);
                                            isWarningCard(false);
                                        }}
                                        disabled={isUpdatingApproval}
                                    >
                                        {isUpdatingApproval ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            'Yes, Remove'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
