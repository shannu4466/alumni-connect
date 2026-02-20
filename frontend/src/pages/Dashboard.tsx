import {
  Users,
  Briefcase,
  MessageCircle,
  TrendingUp,
  Calendar,
  Award,
  Building,
  ArrowRight,
  Bell,
  Star,
  Loader2,
  ExternalLink,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TextType from '@/components/ui/textType';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { useAppWideData } from '@/context/JobCountContext';
import { useToast } from '@/hooks/use-toast';

interface EventData {
  id: string;
  title: string;
  description: string;
  eventDateTime: string;
  location: string;
  createdByUserId: string;
  createdByUserName: string;
  postedAt: string;
  imageUrl?: string;
  registrationUrl?: string;
}

interface JobPostData {
  id: string;
  alumniId: string;
  alumniName: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
}

interface ConnectionData {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  status: 'PENDING_ADMIN_APPROVAL' | 'ACCEPTED' | 'REJECTED';
  sentAt: string;
  respondedAt?: string;
}

interface Activity {
  id: string;
  type: 'event' | 'referral' | 'connection' | 'message';
  title: string;
  description: string;
  time: string;
  avatar: string;
  link?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') || 'http://localhost:8080';
const API_JOB_POSTS_BASE_URL = API_BASE_URL + '/api/job-posts';
const API_CONNECTIONS_BASE_URL = API_BASE_URL + '/api/connections';
const API_EVENTS_BASE_URL = API_BASE_URL + '/api/events';

export default function Dashboard() {
  const { user } = useAuth();
  const { jobCount, isLoadingJobs, pendingRequestsCount, alumniSuccessfulReferrals, isLoadingPendingRequests, userConnectionsCount, isLoadingConnections, alumniPostedReferrals, alumniAccountsCount, studentAccountsCount, pendingAlumniCount, studentActiveApplications } = useAppWideData();
  const { toast } = useToast();

  const animatedJobCount = useAnimatedNumber(jobCount, 1000);
  const animatedstudentActiveApplications = useAnimatedNumber(studentActiveApplications, 1000);
  const animatedPendingRequestsCount = useAnimatedNumber(pendingRequestsCount, 1000);
  const animatedUserConnectionsCount = useAnimatedNumber(userConnectionsCount, 1000);
  const animatedAlumniPostedReferrals = useAnimatedNumber(alumniPostedReferrals, 1000);
  const animatedAlumniAccountsCount = useAnimatedNumber(alumniAccountsCount, 1000);
  const animatedStudentAccountsCount = useAnimatedNumber(studentAccountsCount, 1000);
  const animatedPendingAlumniCount = useAnimatedNumber(pendingAlumniCount, 1000);

  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState(true);
  const [dashboardStatsError, setDashboardStatsError] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingRecentActivities, setIsLoadingRecentActivities] = useState(true);
  const [recentActivitiesError, setRecentActivitiesError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    if (!user?.token || !user?.id) {
      setIsLoadingDashboardStats(false);
      setDashboardStatsError("Please log in to view dashboard stats.");
      return;
    }

    setIsLoadingDashboardStats(true);
    setDashboardStatsError(null);

    const headers = { 'Authorization': `Bearer ${user.token}` };
    const fetches = [];

    if (user.role === 'alumni') {
      fetches.push(
        fetch(`${API_JOB_POSTS_BASE_URL}/by-alumni/${user.id}`, { headers })
          .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch alumni's job posts: ${res.status}`))
          .then(data => { })
          .catch(err => {
            console.error("Error fetching alumni's job posts:", err);
          })
      );
    }

    fetches.push(
      fetch(`${API_CONNECTIONS_BASE_URL}/accepted`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch user connections: ${res.status}`))
        .then(data => { })
        .catch(err => {
          console.error("Error fetching user connections:", err);
        })
    );

    // if (user.role === 'student' && API_APPLICATIONS_BASE_URL) {
    //   fetches.push(
    //     fetch(`${API_APPLICATIONS_BASE_URL}/active/${user.id}`, { headers })
    //       .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch active applications: ${res.status}`))
    //       .then(data => {
    //         setStudentActiveApplications(data.length);
    //       })
    //       .catch(err => {
    //         console.error("Error fetching student applications:", err);
    //         setStudentActiveApplications(0);
    //       })
    //   );
    // }

    try {
      await Promise.allSettled(fetches);
    } catch (err) {
      setDashboardStatsError(err instanceof Error ? err.message : "Error loading some dashboard stats.");
      toast({
        title: "Dashboard Data Error",
        description: "Some statistics could not be loaded.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDashboardStats(false);
    }
  }, [user?.id, user?.token, user?.role, toast]);

  const fetchUpcomingEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const headers = { 'Authorization': `Bearer ${user?.token}` };
      if (!user?.token) {
        setEventsError("Please log in to see events.");
        setIsLoadingEvents(false);
        return;
      }

      const response = await fetch(`${API_EVENTS_BASE_URL}/upcoming`, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch upcoming events: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUpcomingEvents(data.slice(0, 2)); // Get only the first 2 upcoming events
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : 'An unknown error occurred while fetching events.');
      toast({
        title: "Error fetching events",
        description: err instanceof Error ? err.message : "Could not load upcoming events.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user?.token, toast]);

  const fetchRecentActivities = useCallback(async () => {
    if (!user?.token || !user?.id) {
      setIsLoadingRecentActivities(false);
      setRecentActivitiesError("Please log in to see activities.");
      return;
    }

    setIsLoadingRecentActivities(true);
    setRecentActivitiesError(null);

    const headers = { 'Authorization': `Bearer ${user.token}` };
    const activities: Activity[] = [];
    const fetchPromises = [];

    // Fetch Recent Job Referrals (last 2-3 posted)
    fetchPromises.push(
      fetch(`${API_JOB_POSTS_BASE_URL}`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch recent job posts: ${res.status}`))
        .then((data: JobPostData[]) => {
          data.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
          data.slice(0, 2).forEach(job => {
            activities.push({
              id: job.id,
              type: 'referral',
              title: `New referral: ${job.title}`,
              description: `at ${job.company}, ${job.location}`,
              time: `${Math.floor((new Date().getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60))} hours ago`, // Simple time diff
              avatar: job.companyLogo || `/api/placeholder/32/32?text=${job.company.substring(0, 2).toUpperCase()}`,
              link: `/job-details/${job.id}`
            });
          });
        })
        .catch(err => console.error("Error fetching recent job posts for activities:", err))
    );

    fetchPromises.push(
      fetch(`${API_CONNECTIONS_BASE_URL}/accepted`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch recent connections: ${res.status}`))
        .then((data: ConnectionData[]) => {
          data.sort((a, b) => new Date(b.respondedAt || b.sentAt).getTime() - new Date(a.respondedAt || a.sentAt).getTime());
          data.slice(0, 2).forEach(conn => { // Take top 2
            const otherUserName = conn.senderId === user.id ? conn.receiverName : conn.senderName;
            activities.push({
              id: conn.id,
              type: 'connection',
              title: `Connected with ${otherUserName}`,
              description: `Connection accepted.`,
              time: `${Math.floor((new Date().getTime() - new Date(conn.respondedAt || conn.sentAt).getTime()) / (1000 * 60 * 60))} hours ago`,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`,
              link: `/chat/${otherUserName === conn.receiverName ? conn.receiverId : conn.senderId}`
            });
          });
        })
        .catch(err => console.error("Error fetching recent connections for activities:", err))
    );

    if (user.role === 'admin') {
      activities.push({
        id: 'admin_act_1',
        type: 'approval',
        title: 'Alumni account approved',
        description: 'A new alumnus was approved.',
        time: 'just now',
        avatar: '/api/placeholder/32/32?text=AD'
      });
    }

    try {
      await Promise.allSettled(fetchPromises);
      // Sort all activities by time (most recent first)
      activities.sort((a, b) => {
        const timeA = parseFloat(a.time.split(' ')[0]);
        const timeB = parseFloat(b.time.split(' ')[0]);
        return timeA - timeB;
      });
      setRecentActivities(activities.slice(0, 5)); // Display top 5 activities
    } catch (err) {
      setRecentActivitiesError(err instanceof Error ? err.message : "Error loading recent activities.");
    } finally {
      setIsLoadingRecentActivities(false);
    }
  }, [user?.id, user?.token, user?.role]);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      fetchUpcomingEvents();
      fetchRecentActivities();
    }
  }, [user, fetchDashboardStats, fetchUpcomingEvents, fetchRecentActivities]);

  const quickStats = {
    student: [
      { label: 'Active Applications for You', value: animatedstudentActiveApplications, icon: Briefcase, color: 'text-blue-600', dynamic: true, isLoading: isLoadingDashboardStats },
      { label: 'Alumni Connections', value: animatedUserConnectionsCount, icon: Users, color: 'text-green-600', dynamic: true, isLoading: isLoadingConnections },
      { label: 'Job Referrals available on portal', value: animatedJobCount, icon: Briefcase, color: 'text-blue-600', dynamic: true, isLoading: isLoadingJobs },
      { label: 'Pending Incoming', value: animatedPendingRequestsCount, icon: MessageCircle, color: 'text-orange-600', dynamic: true, isLoading: isLoadingPendingRequests },
    ],
    alumni: [
      { label: 'Posted Referrals', value: animatedAlumniPostedReferrals, icon: Briefcase, color: 'text-blue-600', dynamic: true, isLoading: isLoadingDashboardStats },
      { label: 'Total Connections', value: animatedUserConnectionsCount, icon: Users, color: 'text-green-600', dynamic: true, isLoading: isLoadingConnections },
      { label: 'Pending Incoming Connections', value: animatedPendingRequestsCount, icon: Bell, color: 'text-red-600', dynamic: true, isLoading: isLoadingPendingRequests },
      { label: 'Successful Referrals', value: alumniSuccessfulReferrals, icon: Award, color: 'text-purple-600' },
    ],
    admin: [
      { label: 'Pending Approvals', value: animatedPendingAlumniCount, icon: Users, color: 'text-red-600', dynamic: true, isLoading: isLoadingPendingRequests },
      { label: 'Total Referrals', value: animatedJobCount, icon: Briefcase, color: 'text-blue-600', dynamic: true, isLoading: isLoadingJobs },
      { label: 'Alumni Accounts', value: animatedAlumniAccountsCount, icon: Building, color: 'text-green-600', dynamic: true, isLoading: isLoadingDashboardStats },
      { label: 'Student Accounts', value: animatedStudentAccountsCount, icon: Users, color: 'text-blue-600', dynamic: true, isLoading: isLoadingDashboardStats },
    ],
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.fullName || 'User'}!`;
  };

  const formatEventDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString + 'Z');
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const currentStats = user ? quickStats[user.role] : [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="bg-gradient-card rounded-lg border border-border p-6 shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 dark:text-white">
              <TextType
                text={getWelcomeMessage()}
                typingSpeed={90}
                pauseDuration={100}
                showCursor={true}
                cursorCharacter="_"
                variableSpeed={undefined}
                onSentenceComplete={undefined}
              />
            </h1>
            <p className="text-muted-foreground">
              {user?.role === 'student' && "Ready to find your next opportunity?"}
              {user?.role === 'alumni' && "Help fellow graduates succeed in their careers."}
              {user?.role === 'admin' && "Manage the alumni network effectively."}
              {!user && "Welcome! Log in to explore opportunities."}
            </p>
            {user?.collegeName && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Building className="h-4 w-4" />
                {user.collegeName} in {user.branch}
                {user.graduationYear && ` (Class of ${user.graduationYear})`}
              </p>
            )}
            {user?.role === 'alumni' && user?.company && user?.position && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {user.position} at {user.company}
              </p>
            )}
            {user?.skills && user.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {user.skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <Badge variant="secondary" className="text-sm">
              {user?.role === 'student' && 'Student'}
              {user?.role === 'alumni' && 'Alumni'}
              {user?.role === 'admin' && 'Administrator'}
              {!user && 'Guest'}
            </Badge>
            {(user?.isApproved === false && user?.role === 'alumni') && (
              <Badge variant="destructive" className="ml-2 text-sm">
                Pending Approval
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  {(isLoadingDashboardStats && stat.dynamic) || (stat.isLoading) ? (
                    <div className="flex items-center text-2xl font-bold">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>...</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  )}
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Stay updated with the latest happenings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingRecentActivities ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentActivitiesError ? (
                <p className="text-muted-foreground text-center text-sm">Error loading activities: {recentActivitiesError}</p>
              ) : recentActivities.length === 0 ? (
                <p className="text-muted-foreground text-center text-sm py-4">No recent activities.</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.avatar} />
                      <AvatarFallback>
                        {activity.type === 'referral' && <Briefcase className="h-4 w-4" />}
                        {activity.type === 'connection' && <Users className="h-4 w-4" />}
                        {activity.type === 'message' && <MessageCircle className="h-4 w-4" />}
                        {activity.type === 'event' && <Calendar className="h-4 w-4" />}
                        {activity.type === 'approval' && <UserCheck className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingEvents ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : eventsError ? (
                <p className="text-muted-foreground text-center text-sm">Error loading events: {eventsError}</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-center text-sm py-4">No upcoming events.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDateTime(event.eventDateTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                    {event.registrationUrl && (
                      <Button variant="link" size="sm" className="px-0 mt-1">
                        <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">Click here for the link</a>
                      </Button>
                    )}
                    {event.imageUrl && (
                      <div>
                        <img src={event.imageUrl} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.role === 'student' && (
                <>
                  <Link to="/referrals">
                    <Button variant="outline" className="w-full justify-start mb-1">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Browse Referrals
                    </Button>
                  </Link>
                  <Link to="/connect">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Connect with Alumni
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'alumni' && (
                <>
                  <Link to="/post-referral">
                    <Button variant="premium" className="w-full justify-start mb-1">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Post New Referral
                    </Button>
                  </Link>
                  <Link to="/my-connections">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Connections
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/approvals">
                    <Button variant="outline" className="w-full justify-start mb-1">
                      <Users className="mr-2 h-4 w-4" />
                      Pending Approvals
                    </Button>
                  </Link>
                  <Link to="/admin/analytics">
                    <Button variant="outline" className="w-full justify-start mb-1">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Reports
                    </Button>
                  </Link>
                  <Link to="/admin/add-event">
                    <Button variant="premium" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add New Event
                    </Button>
                  </Link>
                </>
              )}
              {!user && (
                <>
                  <Link to="/login">
                    <Button variant="premium" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="outline" className="w-full justify-start">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
