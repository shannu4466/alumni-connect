import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building,
    MapPin,
    Calendar,
    FileText,
    IndianRupee,
    Clock,
    Loader2,
    AlertCircle,
    Award,
    Search,
    CheckCircle,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface JobDetails {
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
    applicants?: number;
    avatar?: string;
    companyLogo?: string;
    rating?: number;
    status?: string;
}

interface QuizResultData {
    id: string;
    userId: string;
    userName: string;
    jobId: string;
    quizId: string;
    score: number;
    passed: boolean;
    attemptedAt: string;
    userAnswers: { [key: string]: number };
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const API_JOB_POSTS_BASE_URL = `${API_BASE_URL}/api/job-posts`;
const API_QUIZZES_BASE_URL = `${API_BASE_URL}/api/quizzes`;
const API_USERS_BASE_URL = `${API_BASE_URL}/api/users`;

export default function ViewJobDetails() {
    const { id: jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [jobDetails, setJobDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizResults, setQuizResults] = useState([]);
    const [isLoadingResults, setIsLoadingResults] = useState(true);
    const [hasAttemptedQuiz, setHasAttemptedQuiz] = useState(false);
    const [userScore, setUserScore] = useState(null);
    const [isUpdatingJobStatus, setIsUpdatingJobStatus] = useState(false);
    const [filterResultsBy, setFilterResultsBy] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchJobDetails = useCallback(async () => {
        if (!jobId) {
            setError("Job ID is missing.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (user?.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
            } else {
                setError("You must be logged in to view job details.");
                setIsLoading(false);
                toast({
                    title: "Authentication Required",
                    description: "Please log in to view job details.",
                    variant: "destructive",
                });
                return;
            }

            const response = await fetch(`${API_JOB_POSTS_BASE_URL}/${jobId}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError("Job post not found.");
                } else {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch job details: ${response.status} ${errorText}`);
                }
            }

            const data = await response.json();
            setJobDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error("Error fetching job details:", err);
            toast({
                title: "Error fetching job",
                description: err instanceof Error ? err.message : "Could not load job details.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [jobId, user?.token, toast]);

    const fetchQuizResults = useCallback(async (jobIdToFetch, jobPosterId) => {
        if (!user?.token || !user?.id) {
            setIsLoadingResults(false);
            return;
        }

        if (user.id !== jobPosterId && user.role !== 'admin') {
            setIsLoadingResults(false);
            setQuizResults([]);
            return;
        }

        setIsLoadingResults(true);
        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };
            const response = await fetch(`${API_QUIZZES_BASE_URL}/results/job/${jobIdToFetch}`, { headers });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch quiz results: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            setQuizResults(data);
        } catch (err) {
            console.error("Error fetching quiz results:", err);
            toast({
                title: "Error fetching results",
                description: "Could not load quiz results for this job.",
                variant: "destructive",
            });
            setQuizResults([]);
        } finally {
            setIsLoadingResults(false);
        }
    }, [user?.token, user?.id, user?.role, toast]);

    const checkUserQuizAttempt = useCallback(async (jobIdToCheck, userId) => {
        if (!user?.token || !userId) {
            setHasAttemptedQuiz(false);
            setUserScore(null);
            return;
        }
        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };
            const response = await fetch(`${API_QUIZZES_BASE_URL}/results/user/${userId}`, { headers });
            if (response.ok) {
                const userQuizResults = await response.json();
                const attemptedThisJob = userQuizResults.find(result => result.jobId === jobIdToCheck);
                setHasAttemptedQuiz(!!attemptedThisJob);
                if (attemptedThisJob) {
                    setUserScore(attemptedThisJob.score);
                } else {
                    setUserScore(null);
                }
            } else if (response.status === 404) {
                setHasAttemptedQuiz(false);
                setUserScore(null);
            } else {
                console.error("Failed to check user quiz attempt:", await response.text());
                setHasAttemptedQuiz(false);
                setUserScore(null);
            }
        } catch (err) {
            console.error("Error checking user quiz attempt:", err);
            setHasAttemptedQuiz(false);
            setUserScore(null);
        }
    }, [user?.token, user?.id]);

    const handleUpdateJobStatus = async (status) => {
        if (!jobDetails?.id || !user?.token) return;
        setIsUpdatingJobStatus(true);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            };
            const response = await fetch(`${API_JOB_POSTS_BASE_URL}/${jobDetails.id}/status`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ status: status }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update job status: ${response.status} ${errorText}`);
            }
            setJobDetails(prev => ({ ...prev, status: status }));
            toast({
                title: "Job Status Updated",
                description: `Job marked as ${status.toLowerCase()}.`,
                variant: "default",
            });
        } catch (err) {
            console.error("Error updating job status:", err);
            toast({
                title: "Failed to Update Status",
                description: err instanceof Error ? err.message : "Could not update job status.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingJobStatus(false);
        }
    };

    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    useEffect(() => {
        if (jobDetails && user) {
            if (user.id === jobDetails.alumniId || user.role === 'admin') {
                fetchQuizResults(jobDetails.id, jobDetails.alumniId);
            } else {
                setIsLoadingResults(false);
                setQuizResults([]);
            }

            if ((user.role === 'student' || user.role === 'alumni') && user.id) {
                checkUserQuizAttempt(jobDetails.id, user.id);
            } else {
                setHasAttemptedQuiz(false);
                setUserScore(null);
            }
        } else if (jobDetails) {
            setIsLoadingResults(false);
            setQuizResults([]);
            setHasAttemptedQuiz(false);
            setUserScore(null);
        }
    }, [jobDetails, user, fetchQuizResults, checkUserQuizAttempt]);


    const formatSalary = (min, max) => {
        if (min === null && max === null) return 'N/A';
        if (min !== null && max !== null) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
        if (min !== null) return `Min: ₹${min.toLocaleString()}`;
        if (max !== null) return `Max: ₹${max.toLocaleString()}`;
        return 'N/A';
    };

    const formatDeadline = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const isDeadlinePassed = (deadlineDateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(deadlineDateString);
        deadline.setHours(0, 0, 0, 0);
        return deadline < today;
    };

    const handleApply = (id, jobSkills) => {
        navigate(`/quiz/${id}`, { state: { jobSkills: jobSkills } });
    };

    const getProfileInitials = (fullName) => {
        return fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
    };

    const filteredQuizResults = quizResults.filter(result => {
        if (filterResultsBy === 'all') return true;
        if (filterResultsBy === 'passed') return result.passed;
        if (filterResultsBy === 'failed') return !result.passed;
        return true;
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading job details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-red-500 flex flex-col justify-center items-center min-h-[400px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {error}</h2>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    if (!jobDetails) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-muted-foreground flex flex-col justify-center items-center min-h-[400px]">
                <Search className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Job Details Not Found</h2>
                <p className="mt-2">The job you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const deadlinePassed = isDeadlinePassed(jobDetails.applicationDeadline);
    const isJobPoster = user?.id === jobDetails.alumniId;
    const isAdmin = user?.role === 'admin';
    const showResultsSection = isJobPoster || isAdmin;
    const isJobHiredOrClosed = jobDetails.status === 'HIRED' || jobDetails.status === 'CLOSED';

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            <Card className="bg-gradient-card border-border shadow-elegant lg:col-span-2">
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start space-x-4 flex-grow">
                            <Avatar className="h-14 w-14 flex-shrink-0">
                                <AvatarImage src={jobDetails.companyLogo || "/placeholder-company.png"} />
                                <AvatarFallback>
                                    <Building className="h-7 w-7" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-3xl font-bold text-foreground break-words">{jobDetails.title}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-base">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Building className="h-4 w-4" />
                                        {jobDetails.company}
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {jobDetails.location}
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <IndianRupee className="h-4 w-4" />
                                        {formatSalary(jobDetails.salaryMin, jobDetails.salaryMax)}
                                    </span>
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-shrink-0 mt-4 md:mt-0">
                            <Badge variant={jobDetails.jobType === 'full-time' ? 'default' : 'secondary'} className="text-base px-3 py-1">
                                {jobDetails.jobType}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose dark:prose-invert max-w-none space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Job Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{jobDetails.description}</p>

                        {jobDetails.requirements && (
                            <>
                                <h3 className="text-lg font-semibold text-foreground">Requirements & Qualifications</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{jobDetails.requirements}</p>
                            </>
                        )}

                        {jobDetails.skills && jobDetails.skills.length > 0 && (
                            <>
                                <h3 className="text-lg font-semibold text-foreground">Skills Required</h3>
                                <div className="flex flex-wrap gap-2">
                                    {jobDetails.skills.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="text-sm px-2 py-1">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-6 pt-6 border-t border-border md:grid md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Posted By</p>
                            <div className="flex items-center gap-2 text-foreground">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={jobDetails.avatar || "/placeholder-avatar.jpg"} />
                                    <AvatarFallback className="text-xs">
                                        {jobDetails.alumniName
                                            ? jobDetails.alumniName.toUpperCase().split(" ").map((n) => n[0]).join("")
                                            : "AA"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-base truncate">{jobDetails.alumniName}</span>
                            </div>
                        </div>

                        <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Posted On</p>
                            <p className="text-foreground text-base flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {jobDetails.postedDate}
                            </p>
                        </div>

                        <div className="space-y-1 min-w-[200px] flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Application Deadline</p>
                            <p className="text-foreground text-base flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDeadline(jobDetails.applicationDeadline)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
                        {(user?.role === 'student' || user?.role === 'alumni') && user?.id !== jobDetails.alumniId && (
                            <Button
                                variant={deadlinePassed ? "destructive" : (hasAttemptedQuiz ? "success" : (isJobHiredOrClosed ? "secondary" : "premium"))}
                                size="lg"
                                onClick={() => handleApply(jobDetails.id, jobDetails.skills)}
                                className="w-full sm:w-auto flex items-center justify-center"
                                disabled={deadlinePassed || hasAttemptedQuiz || isJobHiredOrClosed}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                {deadlinePassed ? 'Application Expired' : (isJobHiredOrClosed ? 'Job Closed' : (hasAttemptedQuiz ? 'Already Attempted' : 'Apply Now'))}
                                {hasAttemptedQuiz && userScore !== null && (
                                    <span className="ml-2 px-2 py-1 rounded-full bg-background text-foreground text-sm font-semibold">
                                        {userScore}% scored
                                    </span>
                                )}
                            </Button>
                        )}
                        {user?.role === 'alumni' && user?.id === jobDetails.alumniId && (
                            <>
                                {(jobDetails.status === 'ACTIVE' || jobDetails.status === 'CLOSED') && (
                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        onClick={() => handleUpdateJobStatus('CLOSED')}
                                        disabled={jobDetails.status === 'CLOSED' || isUpdatingJobStatus}
                                        className="w-full sm:w-auto"
                                    >
                                        {isUpdatingJobStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Mark as Closed
                                    </Button>
                                )}
                                {jobDetails.status === 'ACTIVE' && (
                                    <Button
                                        variant="success"
                                        size="lg"
                                        onClick={() => handleUpdateJobStatus('HIRED')}
                                        disabled={isUpdatingJobStatus}
                                        className="w-full sm:w-auto"
                                    >
                                        {isUpdatingJobStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Mark as Hired
                                    </Button>
                                )}
                                {jobDetails.status === 'HIRED' && (
                                    <Button
                                        variant="success"
                                        size="lg"
                                        disabled={true}
                                        className="w-full sm:w-auto"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Job Hired
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {showResultsSection && (
                <Card className="bg-gradient-card border-border shadow-elegant 
                   lg:col-span-1 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
                    <CardHeader className="space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <CardTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Quiz Results
                            </CardTitle>
                            <Select value={filterResultsBy} onValueChange={setFilterResultsBy}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="passed">Passed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <CardDescription className="text-sm text-muted-foreground w-full">
                            Total of{" "}
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white text-sm font-bold ml-1">
                                {quizResults.length}
                            </span>{" "}
                            students attempted this quiz.
                        </CardDescription>
                    </CardHeader>

                    {/* Content */}
                    <CardContent className="space-y-3 sm:space-y-4">
                        {isLoadingResults ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : filteredQuizResults.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6 text-sm">
                                {filterResultsBy === 'all'
                                    ? 'No students have attempted the quiz for this referral yet.'
                                    : 'No students found matching this filter.'}
                            </p>
                        ) : (
                            filteredQuizResults.map((result) => (
                                <div
                                    key={result.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 
                       p-3 rounded-lg border border-border bg-background hover:bg-accent/10 transition"
                                >
                                    {/* Student Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${result.userName}`}
                                            />
                                            <AvatarFallback className="text-xs">
                                                {getProfileInitials(result.userName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground truncate">
                                                {result.userName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Score: {result.score}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full sm:w-auto"
                                        onClick={() => navigate(`/view-student-profile/${result.userId}`)}
                                    >
                                        View Profile
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
