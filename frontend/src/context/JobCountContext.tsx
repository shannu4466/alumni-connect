import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AppWideDataContextType {
    jobCount: number;
    setJobCount: (count: number) => void;
    isLoadingJobs: boolean;
    setIsLoadingJobs: (loading: boolean) => void;
    pendingRequestsCount: number;
    isLoadingPendingRequests: boolean;
    userConnectionsCount: number;
    isLoadingConnections: boolean;
    alumniPostedReferrals: number;
    alumniSuccessfulReferrals: number;
    studentActiveApplications: number;
    alumniAccountsCount: number;
    studentAccountsCount: number;
    pendingAlumniCount: number;
    lastFilteredReferralsCount: number;
    setLastFilteredReferralsCount: (count: number) => void;
    setPendingAlumniCount: (count: number) => void; // New method for direct update from other components
}

const AppWideDataContext = createContext(undefined);

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') || 'http://localhost:8080';

const API_JOB_COUNT_URL = API_BASE_URL + "/api/job-posts";
const API_PENDING_REQUESTS_URL = API_BASE_URL + "/api/connections/requests/pending";
const API_CONNECTIONS_URL = API_BASE_URL + "/api/connections/accepted";
const API_MESSAGES_CONVERSATIONS_URL = API_BASE_URL + "/api/messages/conversations";
const API_JOB_POSTS_BY_ALUMNI_URL = API_BASE_URL + "/api/job-posts/by-alumni";
const API_ALUMNI_COUNT_URL = API_BASE_URL + "/api/users?role=alumni&isApproved=true";
const API_STUDENT_COUNT_URL = API_BASE_URL + "/api/users?role=student&isApproved=true";
const API_QUIZ_RESULTS_BY_USER_URL = API_BASE_URL + "/api/quizzes/results/user";


export function AppWideDataProvider({ children }) {
    const [jobCount, setJobCount] = useState(0);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);

    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [isLoadingPendingRequests, setIsLoadingPendingRequests] = useState(true);

    const [userConnectionsCount, setUserConnectionsCount] = useState(0);
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);

    const [alumniPostedReferrals, setAlumniPostedReferrals] = useState(0);
    const [alumniSuccessfulReferrals, setAlumniSuccessfulReferrals] = useState(0);
    const [studentActiveApplications, setStudentActiveApplications] = useState(0);

    const [activeReferralsCount, setActiveReferralsCount] = useState(0);
    const [hiredReferralsCount, setHiredReferralsCount] = useState(0);
    const [closedReferralsCount, setClosedReferralsCount] = useState(0);

    const [alumniAccountsCount, setAlumniAccountsCount] = useState(0);
    const [studentAccountsCount, setStudentAccountsCount] = useState(0);
    const [pendingAlumniCount, setPendingAlumniCount] = useState(0);
    const [lastFilteredReferralsCount, setLastFilteredReferralsCount] = useState(0);

    const { user, isLoading: isLoadingAuth } = useAuth();
    const { toast } = useToast();

    const updateLastFilteredReferralsCount = useCallback((count) => {
        setLastFilteredReferralsCount(count);
        if (user?.role === 'student') {
            setStudentActiveApplications(count);
        }
    }, [user]);

    const fetchInitialData = useCallback(async () => {
        if (isLoadingAuth) return;

        if (!user || !user.token) {
            setJobCount(0);
            setIsLoadingJobs(false);
            setPendingRequestsCount(0);
            setIsLoadingPendingRequests(false);
            setUserConnectionsCount(0);
            setIsLoadingConnections(false);
            setAlumniPostedReferrals(0);
            setAlumniSuccessfulReferrals(0);
            setStudentActiveApplications(0);
            setAlumniAccountsCount(0);
            setStudentAccountsCount(0);
            setPendingAlumniCount(0);
            setLastFilteredReferralsCount(0);
            return;
        }

        const headers = { 'Authorization': `Bearer ${user.token}` };

        setIsLoadingJobs(true);
        try {
            const jobRes = await fetch(API_JOB_COUNT_URL, { headers });
            if (jobRes.ok) {
                const allJobPosts = await jobRes.json();
                setJobCount(allJobPosts.length);

                const defaultSearchTerm = '';
                const defaultFilterLocation = 'all';
                const defaultFilterType = 'all';
                // console.log(allJobPosts)

                const totalJobCounts = allJobPosts.filter((job) => {
                    const activeJobs = allJobPosts.filter(job => job.status.toUpperCase() === 'ACTIVE');
                    const hiredJobs = allJobPosts.filter(job => job.status.toUpperCase() === 'HIRED');
                    const closedJobs = allJobPosts.filter(job => job.status.toUpperCase() === 'CLOSED');

                    setActiveReferralsCount(activeJobs.length);
                    setHiredReferralsCount(hiredJobs.length);
                    setClosedReferralsCount(closedJobs.length);

                })

                const filteredJobsInternal = allJobPosts.filter(referral => {
                    const userSkills = user.skills ? user.skills.map(s => s.toLowerCase()) : [];
                    const jobSkills = referral.skills ? referral.skills.map(s => s.toLowerCase()) : [];

                    const SKILL_MATCH_THRESHOLD_VALUE = 70;
                    const matchedSkillsCount = jobSkills.filter(jobSkill => userSkills.includes(jobSkill)).length;
                    const skillMatchPercentage = jobSkills.length > 0 ? (matchedSkillsCount / jobSkills.length) * 100 : 100;
                    const matchesSkillsThreshold = skillMatchPercentage >= SKILL_MATCH_THRESHOLD_VALUE;

                    const matchesSearch = referral.title.toLowerCase().includes(defaultSearchTerm.toLowerCase()) ||
                        referral.company.toLowerCase().includes(defaultSearchTerm.toLowerCase()) ||
                        (referral.skills && referral.skills.some(skill => skill.toLowerCase().includes(defaultSearchTerm.toLowerCase()))) ||
                        referral.alumniName.toLowerCase().includes(defaultSearchTerm.toLowerCase());

                    const matchesLocation = defaultFilterLocation === 'all' || referral.location.toLowerCase().includes(defaultFilterLocation.toLowerCase());
                    const matchesType = defaultFilterType === 'all' || referral.jobType.toLowerCase() === defaultFilterType.toLowerCase();

                    const isPostedByCurrentUser = user.id === referral.alumniId;

                    if (user.role === 'student') {
                        return matchesSearch && matchesLocation && matchesType && matchesSkillsThreshold;
                    } else if (user.role === 'alumni') {
                        return matchesSearch && matchesLocation && matchesType && !isPostedByCurrentUser;
                    } else if (user.role === 'admin') {
                        return matchesSearch && matchesLocation && matchesType;
                    }
                    return false;
                });
                setLastFilteredReferralsCount(filteredJobsInternal.length);
                if (user.role === 'student') {
                    setStudentActiveApplications(filteredJobsInternal.length);
                }
            } else {
                console.error("Job Count failed:", await jobRes.text());
                setJobCount(0);
                setLastFilteredReferralsCount(0);
                setStudentActiveApplications(0);
            }
        } catch (err) {
            console.error("Job Count error:", err);
            setJobCount(0);
            setLastFilteredReferralsCount(0);
            setStudentActiveApplications(0);
        } finally {
            setIsLoadingJobs(false);
        }

        setIsLoadingPendingRequests(true);
        try {
            const pendingRes = await fetch(API_PENDING_REQUESTS_URL, { headers });
            if (pendingRes.ok) {
                const data = await pendingRes.json();
                setPendingRequestsCount(data.length);
            } else {
                console.error("Pending requests failed:", await pendingRes.text());
                setPendingRequestsCount(0);
            }
        } catch (err) {
            console.error("Pending requests error:", err);
            setPendingRequestsCount(0);
        } finally {
            setIsLoadingPendingRequests(false);
        }

        setIsLoadingConnections(true);
        try {
            const [acceptedConnectionsRes, conversationsRes] = await Promise.all([
                fetch(API_CONNECTIONS_URL, { headers }),
                fetch(API_MESSAGES_CONVERSATIONS_URL, { headers })
            ]);

            let acceptedIds = new Set();
            if (acceptedConnectionsRes.ok) {
                const acceptedData = await acceptedConnectionsRes.json();
                acceptedData.forEach(conn => {
                    const idToAdd = conn.senderId === user.id ? conn.receiverId : conn.senderId;
                    acceptedIds.add(idToAdd);
                });
            } else {
                console.error("Accepted connections failed:", await acceptedConnectionsRes.text());
            }

            let conversationPartnerIds = new Set();
            if (conversationsRes.ok) {
                const conversationsData = await conversationsRes.json();
                conversationsData.forEach(conv => {
                    conversationPartnerIds.add(conv.partnerId);
                });
            } else {
                console.error("Message conversations failed:", await conversationsRes.text());
            }

            const combinedUniqueConnections = new Set([...acceptedIds, ...conversationPartnerIds]);
            setUserConnectionsCount(combinedUniqueConnections.size);

        } catch (err) {
            console.error("Connections (combined) error:", err);
            setUserConnectionsCount(0);
        } finally {
            setIsLoadingConnections(false);
        }

        if (user.role === "alumni") {
            try {
                const alumniRes = await fetch(`${API_JOB_POSTS_BY_ALUMNI_URL}/${user.id}`, { headers });
                if (alumniRes.ok) {
                    const data = await alumniRes.json();
                    setAlumniPostedReferrals(data.length);

                    const successfulReferrals = data.filter(job => job.status === 'HIRED').length;
                    setAlumniSuccessfulReferrals(successfulReferrals);

                } else {
                    console.error("Alumni posts failed:", await alumniRes.text());
                    setAlumniPostedReferrals(0);
                    setAlumniSuccessfulReferrals(0);
                }
            } catch (err) {
                console.error("Alumni posts error:", err);
                setAlumniPostedReferrals(0);
                setAlumniSuccessfulReferrals(0);
            }
        } else {
            setAlumniPostedReferrals(0);
            setAlumniSuccessfulReferrals(0);
        }

        if (user.role === 'admin') {
            try {
                const alumniCountRes = await fetch(API_ALUMNI_COUNT_URL, { headers });
                if (alumniCountRes.ok) {
                    const text = await alumniCountRes.text();
                    if (text) {
                        const data = JSON.parse(text);
                        setAlumniAccountsCount(data.length);
                    } else {
                        setAlumniAccountsCount(0);
                    }
                } else {
                    console.error("Alumni count failed:", await alumniCountRes.text());
                    setAlumniAccountsCount(0);
                }
            } catch (err) {
                console.error("Alumni count error:", err);
                setAlumniAccountsCount(0);
            }

            try {
                const studentCountRes = await fetch(API_STUDENT_COUNT_URL, { headers });
                if (studentCountRes.ok) {
                    const text = await studentCountRes.text();
                    if (text) {
                        const data = JSON.parse(text);
                        setStudentAccountsCount(data.length);
                    } else {
                        setStudentAccountsCount(0);
                    }
                } else {
                    console.error("Student count failed:", await studentCountRes.text());
                    setStudentAccountsCount(0);
                }
            } catch (err) {
                console.error("Student count error:", err);
                setStudentAccountsCount(0);
            }

            try {
                const headersForPending = { 'Authorization': `Bearer ${user.token}` };
                const response = await fetch(API_BASE_URL + "/api/users?role=alumni&applicationStatus=PENDING_ADMIN_APPROVAL", { headers: headersForPending });

                if (!response.ok) {
                    throw new Error(`Failed to fetch pending alumni list: ${response.status}`);
                }

                const allAlumni = await response.json();
                const pendingAlumni = allAlumni.filter(alumni => alumni.applicationStatus === 'PENDING_ADMIN_APPROVAL').length;
                setPendingAlumniCount(pendingAlumni);

            } catch (error) {
                console.error("Error fetching pending alumni count:", error);
                setPendingAlumniCount(0);
            }
        } else {
            setAlumniAccountsCount(0);
            setStudentAccountsCount(0);
            setPendingAlumniCount(0);
        }

    }, [user, isLoadingAuth, toast, setJobCount, setIsLoadingJobs, setPendingRequestsCount, setIsLoadingPendingRequests, setUserConnectionsCount, setIsLoadingConnections, setAlumniPostedReferrals, setAlumniSuccessfulReferrals, setStudentActiveApplications, setAlumniAccountsCount, setStudentAccountsCount, setPendingAlumniCount, updateLastFilteredReferralsCount]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const contextValue = {
        jobCount,
        setJobCount,
        isLoadingJobs,
        setIsLoadingJobs,
        pendingRequestsCount,
        isLoadingPendingRequests,
        userConnectionsCount,
        isLoadingConnections,
        alumniPostedReferrals,
        alumniSuccessfulReferrals,
        studentActiveApplications,
        alumniAccountsCount,
        studentAccountsCount,
        pendingAlumniCount,
        lastFilteredReferralsCount,
        setLastFilteredReferralsCount: updateLastFilteredReferralsCount,
        setPendingAlumniCount,
        activeReferralsCount,
        hiredReferralsCount,
        closedReferralsCount,
    };

    return (
        <AppWideDataContext.Provider value={contextValue}>
            {children}
        </AppWideDataContext.Provider>
    );
}

export function useAppWideData() {
    const context = useContext(AppWideDataContext);
    if (context === undefined) {
        throw new Error("useAppWideData must be used within an AppWideDataProvider");
    }
    return context;
}
