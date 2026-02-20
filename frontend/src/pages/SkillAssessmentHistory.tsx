import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, AlertCircle, Loader2, CheckCircle, XCircle, Award, Target, Eye, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface QuizResultResponseDTO {
    id: string;
    jobId: string;
    quizId: string;
    score: number;
    passed: boolean;
    attemptedAt: string;
    userName: string;
    status: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const API_JOB_POSTS_BASE_URL = `${API_BASE_URL}/api/job-posts`;

export default function SkillAssessmentHistory() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<QuizResultResponseDTO[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [jobTitlesMap, setJobTitlesMap] = useState<Record<string, string>>({});
    const [loadingJobs, setLoadingJobs] = useState(false);

    const fetchJobTitles = useCallback(async (jobIds: string[]) => {
        setLoadingJobs(true);
        const uniqueJobIds = Array.from(new Set(jobIds));
        const titlesMap: Record<string, string> = {};

        const fetchPromises = uniqueJobIds.map(async (id) => {
            try {
                const response = await fetch(`${API_JOB_POSTS_BASE_URL}/${id}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                if (response.ok) {
                    const jobData = await response.json();
                    titlesMap[id] = jobData.title || 'Unknown Job Title';
                } else {
                    titlesMap[id] = 'Job Details Unavailable';
                }
            } catch (err) {
                titlesMap[id] = 'Job Details Unavailable';
            }
        });

        await Promise.all(fetchPromises);
        setJobTitlesMap(titlesMap);
        setLoadingJobs(false);
    }, [user.token]);

    const fetchQuizResults = useCallback(async () => {
        if (!user || !user.id || !user.token) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const url = `${API_BASE_URL}/api/quizzes/results/user/${user.id}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch results.' }));
                throw new Error(errorData.message || 'Failed to fetch assessment history.');
            }

            const data: QuizResultResponseDTO[] = await response.json();
            setResults(data.sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()));

            const jobIds = data.map(r => r.jobId);
            if (jobIds.length > 0) {
                fetchJobTitles(jobIds);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching assessments.');
            toast({
                title: "Error",
                description: "Could not load skill assessment history.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast, fetchJobTitles]);

    useEffect(() => {
        fetchQuizResults();
    }, [fetchQuizResults]);

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (status: string, score: number) => {
        if (status === 'DISQUALIFIED') {
            return <Badge variant="destructive">DISQUALIFIED</Badge>;
        }
        if (score >= 70) {
            return <Badge className="bg-green-600 hover:bg-green-700 text-white">PASSED</Badge>;
        }
        return <Badge variant="secondary" className="bg-red-500 text-white hover:bg-red-600">FAILED</Badge>;
    };

    if (loading || loadingJobs) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg text-muted-foreground">Loading your assessment history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading History</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center">
                <Award className="h-7 w-7 mr-3 text-primary" /> Skill Assessment History
            </h1>

            {results.length === 0 ? (
                <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>No Assessment Attempts Found</AlertTitle>
                    <AlertDescription>You haven't completed any skill assessments yet. Find a job referral to begin!</AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-4">
                    {results.map((result) => (
                        <Card key={result.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
                                <CardTitle className="text-xl font-semibold flex items-center flex-wrap gap-x-2">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    <span className="text-muted-foreground whitespace-nowrap">Job Title:</span>
                                    <span className="text-foreground font-bold leading-tight truncate">
                                        {jobTitlesMap[result.jobId] || 'Loading Job Details...'}
                                    </span>
                                </CardTitle>
                                <div className="text-sm text-muted-foreground flex items-center">
                                    <Target className="h-3 w-3 mr-1" />
                                    Attempted on: {new Date(result.attemptedAt).toLocaleDateString()}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
                                    <div className="flex flex-col">
                                        <p className="font-medium text-lg">
                                            Status: {getStatusBadge(result.status, result.score)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm text-muted-foreground">Score Achieved</p>
                                        <div className="text-2xl font-extrabold">
                                            <span className={getScoreColor(result.score)}>{result.score}%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full sm:w-auto"
                                            onClick={() => navigate(`/job-details/${result.jobId}`)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
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
