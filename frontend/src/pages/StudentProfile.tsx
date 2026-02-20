import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2,
    AlertCircle,
    Mail,
    Linkedin,
    Github,
    MapPin,
    Calendar,
    Building2,
    ClipboardList,
    FileText,
    Search,
    Briefcase,
    MessageCircle,
    Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface StudentProfileData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    collegeName?: string;
    graduationYear?: number;
    bio?: string;
    skills?: string[];
    isApproved: boolean;
    linkedinProfile?: string;
    githubProfile?: string;
    location?: string;
    profileImage?: string;
    resume?: string;
    rollNumber?: string;
    applicationStatus?: string;
}

const API_USERS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/users';

export default function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [student, setStudent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStudentDetails = useCallback(async () => {
        if (!id) {
            setError("Student ID is missing.");
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
                setError("You must be logged in to view student profiles.");
                setIsLoading(false);
                toast({
                    title: "Authentication Required",
                    description: "Please log in to view student profiles.",
                    variant: "destructive",
                });
                return;
            }
            headers['Authorization'] = `Bearer ${user.token}`;

            const response = await fetch(`${API_USERS_BASE_URL}/${id}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError("Student profile not found.");
                } else {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch student details: ${response.status} ${errorText}`);
                }
            }

            const data = await response.json();
            setStudent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error("Error fetching student details:", err);
            toast({
                title: "Error fetching profile",
                description: err instanceof Error ? err.message : "Could not load student profile.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [id, user?.token, toast]);

    useEffect(() => {
        fetchStudentDetails();
    }, [fetchStudentDetails]);

    const handleDownloadResume = () => {
        if (student?.resume) {
            window.open(student.resume, '_blank');
        } else {
            toast({
                title: "Resume Not Available",
                description: "This student has not uploaded a resume.",
                variant: "info",
            });
        }
    };

    const getProfileInitials = (fullName) => {
        return fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN';
    };

    const handleMessageStudent = (studentId) => {
        navigate(`/chat/${studentId}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading student profile...</p>
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

    if (!student) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-muted-foreground flex flex-col justify-center items-center min-h-[500px]">
                <Search className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Student Profile Not Found</h2>
                <p className="mt-2">The profile you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const isLoggedUserAlumniOrAdmin = (user?.role === 'alumni' || user?.role === 'admin');
    const isViewingOwnProfile = user?.id === student.id;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <h1 className='h-10 text-3xl font-bold w-full text-center'>Student Details</h1>
            <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                        <Avatar className="h-24 w-24 flex-shrink-0 border-2 border-primary-foreground/20 shadow-md">
                            <AvatarImage src={student.profileImage || "/placeholder-avatar.jpg"} />
                            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                                {getProfileInitials(student.fullName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left flex-grow min-w-0">
                            <CardTitle className="text-2xl font-bold text-foreground mb-1 truncate">
                                {student.fullName.toUpperCase()}
                            </CardTitle>
                            <CardDescription className="text-lg text-muted-foreground flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {student.email}
                                </span>
                                {student.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {student.location}
                                    </span>
                                )}
                            </CardDescription>
                            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                                <Badge variant="secondary">{student.role}</Badge>
                                {student.applicationStatus === 'APPROVED' && (
                                    <Badge className="bg-green-500 text-white hover:bg-green-600">Approved</Badge>
                                )}
                                {student.applicationStatus === 'PENDING' && (
                                    <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>
                                )}
                                {student.applicationStatus === 'REJECTED' && (
                                    <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 flex-shrink-0">
                        <Button
                            asChild={!!student.linkedinProfile}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            {student.linkedinProfile ? (
                                <a
                                    href={student.linkedinProfile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                                </a>
                            ) : (
                                <span className="flex items-center">
                                    <Linkedin className="mr-2 h-4 w-4" /> LinkedIn Not Available
                                </span>
                            )}
                        </Button>
                        <Button
                            asChild={!!student.githubProfile}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            {student.githubProfile ? (
                                <a
                                    href={student.githubProfile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Github className="mr-2 h-4 w-4" /> GitHub
                                </a>
                            ) : (
                                <span className="flex items-center">
                                    <Github className="mr-2 h-4 w-4" /> Github Not Available
                                </span>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 md:px-8 md:pb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        {student.collegeName && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span>{student.collegeName}</span>
                            </div>
                        )}
                        {student.graduationYear && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span>Graduated: {student.graduationYear}</span>
                            </div>
                        )}
                        {student.rollNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                                <span>Roll Number: {student.rollNumber}</span>
                            </div>
                        )}
                        {(student.rollNumber && student.role === 'student') && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Layers className="h-4 w-4 flex-shrink-0" />
                                <span>Branch: {student.branch}</span>
                            </div>
                        )}
                        {student.company && student.position && (student.role === 'alumni') && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Briefcase className="h-4 w-4 flex-shrink-0" />
                                <span>{student.position} at {student.company}</span>
                            </div>
                        )}
                    </div>

                    {student.bio && (
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">About</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {student.bio}
                            </p>
                        </div>
                    )}

                    {student.skills && student.skills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {student.skills.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='flex flex-col sm:flex-row justify-between w-full gap-3'>
                        <div className="flex justify-start pt-4 border-t border-border flex-1">
                            {student.resume ? (
                                <Button variant="premium" onClick={handleDownloadResume}>
                                    <FileText className="mr-2 h-4 w-4" /> Download Resume
                                </Button>
                            ) : (
                                <Button variant="premium" disabled>
                                    <FileText className="mr-2 h-4 w-4" /> Resume Not Available
                                </Button>
                            )}
                        </div>
                        {isLoggedUserAlumniOrAdmin && !isViewingOwnProfile && (
                            <div className="flex justify-end pt-4 border-t border-border flex-1">
                                <Button variant="premium" onClick={() => handleMessageStudent(student.id)}>
                                    <MessageCircle className="mr-2 h-4 w-4" /> Message
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
