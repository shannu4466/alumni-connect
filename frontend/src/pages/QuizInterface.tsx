import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Award,
  Timer,
  Target,
  Loader2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
  category: string;
  jobTitle?: string;
  jobSkills?: string[];
}

const API_QUIZ_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/quizzes';
const API_JOB_POSTS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/job-posts';

export default function QuizInterface() {
  const { jobId, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [eliminated, setEliminated] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleFullscreenChange = () => {
    if (quizFinished) return;
    if (!document.fullscreenElement) {
      handleEliminate();
    }
  };

  const calculateScore = useCallback(() => {
    if (!quiz) return 0;
    let correctAnswers = 0;
    quiz.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswerIndex) {
        correctAnswers++;
      }
    });
    return (correctAnswers / quiz.questions.length) * 100;
  }, [quiz, selectedAnswers]);

  const handleSubmitQuiz = useCallback(async (status = 'SUBMITTED') => {
    if (!quiz || !user?.id) return;
    setIsSubmitting(true);
    let score = 0;
    let passed = false;
    let userAnswers = selectedAnswers;

    if (status === 'DISQUALIFIED') {
      score = 0;
      passed = false;
      userAnswers = {};
    } else {
      score = calculateScore();
      passed = score >= quiz.passingScore;
    }

    const submissionPayload = {
      userId: user.id,
      jobId: quiz.id,
      quizId: quiz.category,
      score: Math.round(score),
      passed: passed,
      userAnswers: userAnswers,
      status: status,
    };

    try {
      const response = await fetch(`${API_QUIZ_BASE_URL}/submit-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(submissionPayload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit quiz result: ${response.status} ${errorText}`);
      }

      sessionStorage.removeItem('quizSessionToken');
      setQuizFinished(true);
      document.exitFullscreen?.();

      if (status === 'SUBMITTED') {
        setShowResults(true);
      } else {
        navigate('/referrals', { replace: true });
      }
    } catch (error) {
      toast({ title: "Quiz Submission Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      sessionStorage.removeItem('quizSessionToken');
      setQuizFinished(true);
      document.exitFullscreen?.();
      navigate('/referrals', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, user, selectedAnswers, calculateScore, navigate, toast]);


  const handleEliminate = useCallback((event?: BeforeUnloadEvent) => {
    if (quizFinished) return;
    if (!eliminated) {
      if (event) {
        event.preventDefault();
        event.returnValue = '';
      }
      setEliminated(true);
      document.exitFullscreen?.();
      toast({
        title: "Quiz Disqualified",
        description: "You were disqualified for leaving the fullscreen quiz window or reloading the page.",
        variant: "destructive"
      });
      handleSubmitQuiz('DISQUALIFIED');
    }
  }, [eliminated, toast, handleSubmitQuiz]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sessionTokenInStorage = sessionStorage.getItem('quizSessionToken');
    if (sessionId && sessionTokenInStorage !== sessionId) {
      navigate('/referrals', { replace: true });
      toast({
        title: "Invalid Quiz Session",
        description: "You cannot access this quiz without a valid session token.",
        variant: "destructive",
      });
    }
  }, [sessionId, navigate, toast]);

  useEffect(() => {
    const fetchJobDetailsAndQuiz = async () => {
      setIsLoadingQuiz(true);
      setErrorQuiz(null);
      if (!user?.token || !jobId) {
        setErrorQuiz("Authentication required to take the quiz.");
        setIsLoadingQuiz(false);
        return;
      }

      try {
        const headers = { 'Authorization': `Bearer ${user.token}` };
        const jobResponse = await fetch(`${API_JOB_POSTS_BASE_URL}/${jobId}`, { headers });
        if (!jobResponse.ok) {
          throw new Error(`Failed to fetch job details: ${jobResponse.status}`);
        }
        const jobData = await jobResponse.json();

        let questions;
        if (jobData.quizEnabled && jobData.quizQuestions && jobData.quizQuestions.length > 0) {
          questions = jobData.quizQuestions;
        } else if (!jobData.quizEnabled && jobData.skills && jobData.skills.length > 0) {
          const categoryQueryParams = jobData.skills.map((skill) => `categories=${encodeURIComponent(skill.toLowerCase())}`).join('&');
          const limit = 10;
          const quizResponse = await fetch(`${API_QUIZ_BASE_URL}/questions?${categoryQueryParams}&limit=${limit}`, { headers });

          if (!quizResponse.ok) {
            const errorText = await quizResponse.text();
            throw new Error(`Failed to fetch quiz questions from database: ${quizResponse.status} ${errorText}`);
          }
          questions = await quizResponse.json();
        } else {
          setErrorQuiz("No quiz questions or relevant skills found for this job.");
          setIsLoadingQuiz(false);
          return;
        }

        const questionsWithUniqueIds = questions.map(q => ({
          ...q,
          id: q.id || uuidv4()
        }));

        if (questionsWithUniqueIds.length === 0) {
          setErrorQuiz(`No quiz questions found for skills: ${jobData.skills.join(', ')}. Please contact support.`);
          setIsLoadingQuiz(false);
          return;
        }

        setQuiz({
          id: jobId,
          title: `Assessment for ${jobData.title}`,
          description: `Test your skills for this job.`,
          questions: questionsWithUniqueIds,
          timeLimit: Math.ceil(questionsWithUniqueIds.length * 0.2),
          passingScore: 70,
          category: 'Job Specific',
          jobTitle: jobData.title,
          jobSkills: jobData.skills,
        });
        setTimeLeft(Math.ceil(questionsWithUniqueIds.length * 0.2) * 60);
        setIsLoadingQuiz(false);

      } catch (err) {
        setErrorQuiz(err instanceof Error ? err.message : 'An unknown error occurred.');
        setIsLoadingQuiz(false);
      }
    };

    if (jobId && (!sessionId || !quiz)) {
      fetchJobDetailsAndQuiz();
    }
  }, [jobId, user?.token, toast, sessionId]);

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !eliminated) {
      const timer = setTimeout(() => setTimeLeft(prevTime => prevTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizStarted && timeLeft === 0 && !eliminated) {
      handleSubmitQuiz();
    }
  }, [timeLeft, quizStarted, quiz, eliminated, handleSubmitQuiz]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      handleEliminate(e);
    };

    if (quizStarted && !quizFinished) {
      window.addEventListener("blur", handleEliminate);
      document.addEventListener("visibilitychange", handleEliminate);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("blur", handleEliminate);
      document.removeEventListener("visibilitychange", handleEliminate);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quizStarted, quizFinished, handleEliminate]);


  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const progress = quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!quiz || !currentQuestion) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: answerIndex }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleStartQuiz = async () => {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    const token = uuidv4();
    sessionStorage.setItem("quizSessionToken", token);
    navigate(`/quiz/${jobId}/${token}`, { replace: true });
    setQuizStarted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string | undefined) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (eliminated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-red-500 flex flex-col justify-center items-center min-h-[500px]">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold">Quiz Disqualified</h2>
        <p className="mt-2">You were disqualified for leaving the fullscreen quiz window. Your results will not be submitted.</p>
        <Button onClick={() => navigate('/referrals')} className="mt-4">Back to Referrals</Button>
      </div>
    );
  }

  if (isLoadingQuiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Preparing quiz questions...</p>
      </div>
    );
  }

  if (errorQuiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-red-500 flex flex-col justify-center items-center min-h-[500px]">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold">Quiz Error: {errorQuiz}</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-muted-foreground flex flex-col justify-center items-center min-h-[500px]">
        <BookOpen className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold">No Quiz Available</h2>
        <p className="mt-2">Could not find a quiz for the selected job's skills. Please try another job.</p>
        <Button onClick={() => navigate('/referrals')} className="mt-4">Browse Referrals</Button>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              {passed ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {passed ? 'Congratulations!' : 'Quiz Completed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold text-primary">
              {score.toFixed(1)}%
            </div>
            <div className="text-muted-foreground">
              {passed ? 'You passed the quiz!' : `You need ${quiz.passingScore}% to pass`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{quiz.questions.filter(q => selectedAnswers[q.id] === q.correctAnswerIndex).length}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{quiz.questions.filter(q => selectedAnswers[q.id] !== q.correctAnswerIndex && selectedAnswers[q.id] !== undefined).length}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{quiz.questions.filter(q => selectedAnswers[q.id] === undefined).length}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/referrals', { replace: true })} className="flex-1 max-w-xs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Referrals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <BookOpen className="h-5 w-5" />
                  {quiz.title}
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">{quiz.description}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <Badge variant="outline" className="flex items-center gap-1 text-sm">
                  <Timer className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 text-sm">
                  <Target className="h-4 w-4" />
                  {quiz.passingScore}% to pass
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {!quizStarted ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quiz Details for {quiz.jobTitle}</CardTitle>
              <CardDescription>
                Test your skills to apply for the <span className='font-bold text-base'>{quiz.jobTitle}</span> position.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Job Role: {quiz.jobTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>Total Questions: {quiz.questions.length}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>Time Limit: {quiz.timeLimit} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Passing Score: {quiz.passingScore}%</span>
                </div>
              </div>

              {quiz.jobSkills && quiz.jobSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Skills Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {quiz.jobSkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-sm px-2 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-red-500 flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Quiz Rules & Disqualification</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    <strong>Single Attempt Only:</strong> You are allowed to attempt this test <strong>only once</strong>. Ensure that you are fully prepared and in a suitable environment before beginning.
                  </li>
                  <li>
                    <strong>No Tab or Window Switching:</strong> Navigating away from the test screen — including switching to another browser tab or window — <strong>even once</strong> will result in disqualification.
                  </li>
                  <li>
                    <strong>Fullscreen Mode is Mandatory:</strong> The test must be taken in <strong>fullscreen mode</strong> at all times. Exiting fullscreen at any point during the test will result in disqualification.
                  </li>
                  <li>
                    <strong>No Notifications or Pop-ups:</strong> Ensure that <strong>all notifications, pop-ups, and system alerts</strong> are disabled before starting the test. Any such interruptions during the quiz will lead to disqualification.
                  </li>
                  <li>
                    <strong>Single Device Usage:</strong> You must use <strong>only one device</strong> throughout the duration of the test. Accessing the test from multiple devices is strictly prohibited.
                  </li>
                  <li>
                    <strong>No External Applications or Websites:</strong> Accessing any external applications (including AI tools or chatbots) or websites during the test is strictly forbidden and will result in disqualification.
                  </li>
                  <li>
                    <strong>Maintain Activity:</strong> Continuous activity is required throughout the test. Being <strong>inactive</strong> (no keyboard or mouse interaction) beyond the allowed time limit will result in disqualification.
                  </li>
                  <li>
                    <strong>Do Not Refresh or Reload the Page:</strong> Refreshing or reloading the quiz page for any reason will be treated as a violation and will result in disqualification.
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-border">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />
                <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to start the quiz and understand the rules.
                </label>
              </div>

              <Button
                onClick={handleStartQuiz}
                disabled={!agreedToTerms}
                className="w-full"
              >
                Start Test <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {currentQuestionIndex + 1} of {quiz.questions.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg sm:text-xl">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge className={`${getDifficultyColor(currentQuestion.difficulty)} text-sm px-3 py-1`}>
                    {currentQuestion.difficulty || "N/A"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed">{currentQuestion.question}</p>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={`${currentQuestion.id}-${index}`}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAnswers[currentQuestion.id] === index
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswers[currentQuestion.id] === index
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                          }`}>
                          {selectedAnswers[currentQuestion.id] === index && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </div>
                        <span className="flex-1">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    {Object.keys(selectedAnswers).length} of {quiz.questions.length} answered
                  </div>

                  {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <Button
                      onClick={() => handleSubmitQuiz('SUBMITTED')}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                      <Award className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === quiz.questions.length - 1}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
