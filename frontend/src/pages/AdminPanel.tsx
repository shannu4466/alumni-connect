import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Briefcase,
  TrendingUp,
  MessageCircle,
  Eye,
  Search,
  XCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Award,
  Calendar,
  UserRoundSearch
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAlumniApproval } from '@/hooks/useAlumniApproval';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppWideData } from '@/context/JobCountContext';

interface AlumniApplication {
  id: string;
  fullName: string;
  email: string;
  graduationYear: number;
  company?: string;
  position?: string;
  submittedDate?: string;
  collegeName: string;
  linkedinProfile?: string;
  profileImage?: string;
  isApproved: boolean;
  bio?: string;
  skills?: string[];
  location?: string;
  rollNumber?: string;
  applicationStatus?: 'PENDING_ADMIN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PENDING_EMAIL_VERIFICATION';
}

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalAlumni: number;
  activeReferrals: number;
  connectionsMade: number;
  pendingAlumni: number;
  hiredReferrals: number;
  successRate: number;
}

interface MonthlyAnalytics {
  month: string;
  newUsers: number;
  newReferrals: number;
  newConnections: number;
}

interface UserRoleAnalytics {
  students: number;
  alumni: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const API_ALUMNI_URL = `${API_BASE_URL}/api/users?role=alumni`;
const API_ADMIN_STATS_URL = `${API_BASE_URL}/api/admin/stats`;
const API_ADMIN_ACTIVITIES_URL = `${API_BASE_URL}/api/admin/recent-activities`;
const API_ADMIN_ANALYTICS_MONTHLY_URL = `${API_BASE_URL}/api/admin/analytics/monthly`;
const API_ADMIN_ANALYTICS_USER_ROLES_URL = `${API_BASE_URL}/api/admin/analytics/user-roles`;
const API_ADMIN_ANALYTICS_REFERRAL_STATUS_URL = `${API_BASE_URL}/api/admin/analytics/referral-status`;

const PIE_CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

export default function AdminPanel() {
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateAlumniApprovalStatus, isUpdatingApproval } = useAlumniApproval();
  const { setPendingAlumniCount, activeReferralsCount, hiredReferralsCount, closedReferralsCount } = useAppWideData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allAlumni, setAllAlumni] = useState([]);
  const [isLoadingAlumni, setIsLoadingAlumni] = useState(true);
  const [errorAlumni, setErrorAlumni] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [errorActivities, setErrorActivities] = useState(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([]);
  const [userRoleAnalytics, setUserRoleAnalytics] = useState(null);
  const [referralStatusAnalytics, setReferralStatusAnalytics] = useState([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [errorAnalytics, setErrorAnalytics] = useState(null);

  const formatEventDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const fetchAlumniData = useCallback(async () => {
    setIsLoadingAlumni(true);
    setErrorAlumni(null);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const response = await fetch(`${API_ALUMNI_URL}`, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch alumni: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setAllAlumni(data);
    } catch (error) {
      setErrorAlumni(error instanceof Error ? error.message : 'An unknown error occurred while fetching alumni.');
      toast({
        title: "Error fetching alumni",
        description: error instanceof Error ? error.message : "Could not load alumni data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAlumni(false);
    }
  }, [user, toast]);

  const fetchAdminStats = useCallback(async () => {
    setIsLoadingStats(true);
    setErrorStats(null);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const response = await fetch(API_ADMIN_STATS_URL, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch admin stats: ${response.status}`);
      }
      const data = await response.json();
      setAdminStats(data);
      setPendingAlumniCount(data.pendingAlumni);
    } catch (error) {
      setErrorStats(error instanceof Error ? error.message : 'An unknown error occurred while fetching stats.');
      toast({
        title: "Error fetching stats",
        description: error instanceof Error ? error.message : "Could not load admin stats.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [user, toast, setPendingAlumniCount]);

  const fetchRecentActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    setErrorActivities(null);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const response = await fetch(API_ADMIN_ACTIVITIES_URL, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch recent activities: ${response.status}`);
      }
      const data = await response.json();
      setRecentActivities(data);
    } catch (error) {
      setErrorActivities(error instanceof Error ? error.message : 'An unknown error occurred while fetching activities.');
      toast({
        title: "Error fetching activities",
        description: error instanceof Error ? error.message : "Could not load recent activities.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingActivities(false);
    }
  }, [user, toast]);

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoadingAnalytics(true);
    setErrorAnalytics(null);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const [monthlyRes, userRolesRes, referralStatusRes] = await Promise.all([
        fetch(API_ADMIN_ANALYTICS_MONTHLY_URL, { headers }),
        fetch(API_ADMIN_ANALYTICS_USER_ROLES_URL, { headers }),
        fetch(API_ADMIN_ANALYTICS_REFERRAL_STATUS_URL, { headers })
      ]);

      if (!monthlyRes.ok || !userRolesRes.ok || !referralStatusRes.ok) {
        throw new Error("Failed to fetch all analytics data.");
      }

      const monthlyData = await monthlyRes.json();
      const userRolesData = await userRolesRes.json();
      const referralStatusData = await referralStatusRes.json();

      setMonthlyAnalytics(monthlyData);
      setUserRoleAnalytics(userRolesData);
    } catch (error) {
      setErrorAnalytics(error instanceof Error ? error.message : 'An unknown error occurred while fetching analytics.');
      toast({
        title: "Error fetching analytics",
        description: error instanceof Error ? error.message : "Could not load analytics data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [user, toast]);

  useEffect(() => {
    setReferralStatusAnalytics([
      { name: 'Active', value: activeReferralsCount, color: PIE_CHART_COLORS[0] },
      { name: 'Hired', value: hiredReferralsCount, color: PIE_CHART_COLORS[1] },
      { name: 'Closed', value: closedReferralsCount, color: PIE_CHART_COLORS[2] },
    ]);
  }, [activeReferralsCount, hiredReferralsCount, closedReferralsCount]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAlumniData();
      fetchAdminStats();
      fetchRecentActivities();
      fetchAnalyticsData();
    }
  }, [user, fetchAlumniData, fetchAdminStats, fetchRecentActivities, fetchAnalyticsData]);

  const handleApprovalAction = async (alumniId, approved) => {
    const result = await updateAlumniApprovalStatus(alumniId, approved);
    if (result) {
      fetchAlumniData();
      fetchAdminStats();
      fetchRecentActivities();
    }
  };

  const alumniToDisplay = allAlumni.filter(alumni => {
    const matchesSearch = alumni.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.company && alumni.company.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'all') {
      return matchesSearch;
    } else if (statusFilter === 'approved') {
      return matchesSearch && alumni.applicationStatus === 'APPROVED';
    } else if (statusFilter === 'pending') {
      return matchesSearch && alumni.applicationStatus === 'PENDING_ADMIN_APPROVAL';
    } else if (statusFilter === 'rejected') {
      return matchesSearch && alumni.applicationStatus === 'REJECTED';
    }
    return false;
  });

  const getProfileInitials = (fullName) => {
    return fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_ADMIN_APPROVAL': return 'warning';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  const getRecentActivityIcon = (type) => {
    switch (type) {
      case 'ACCOUNT': return <UserCheck className="h-4 w-4" />;
      case 'JOB': return <Briefcase className="h-4 w-4" />;
      case 'CONNECTION': return <MessageCircle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (user?.role !== 'admin') {
    navigate('/unauthorized');
    return null;
  }
  // Get current active tab
  const currentTab = location.pathname.split("/")[2] || "approvals";

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage the alumni network and monitor platform activity</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {adminStats?.pendingAlumni || 0} pending approvals
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-2xl font-bold text-foreground">{adminStats?.totalUsers - 1 || 0}</p>}
                <p className="text-xs text-success">{adminStats?.totalStudents || 0} Students, {adminStats?.totalAlumni || 0} Alumni</p>
              </div>
              <Users className={`h-8 w-8 text-blue-600`} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Referrals</p>
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-2xl font-bold text-foreground">{activeReferralsCount || 0}</p>}
                <p className="text-xs text-success">Total: {activeReferralsCount + hiredReferralsCount + closedReferralsCount || 0}</p>
              </div>
              <Briefcase className={`h-8 w-8 text-green-600`} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connections Made</p>
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-2xl font-bold text-foreground">{adminStats?.connectionsMade || 0}</p>}
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <MessageCircle className={`h-8 w-8 text-purple-600`} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Referral Success Rate</p>
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-2xl font-bold text-foreground">{adminStats?.successRate.toFixed(1) || '0.0'}%</p>}
                <p className="text-xs text-orange-600">{adminStats?.hiredReferrals || 0} Hired</p>
              </div>
              <Award className={`h-8 w-8 text-orange-600`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approvals" asChild>
            <Link to="/admin/approvals">Alumni Applications</Link>
          </TabsTrigger>
          <TabsTrigger value="analytics" asChild>
            <Link to="/admin/analytics">Analytics</Link>
          </TabsTrigger>
          <TabsTrigger value="activities" asChild>
            <Link to="/admin/activities">Recent Activities</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search alumni applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px] bg-background">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoadingAlumni ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading alumni data...</p>
            </div>
          ) : errorAlumni ? (
            <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
              <p>Error: {errorAlumni}</p>
            </div>
          ) : alumniToDisplay.length === 0 ? (
            <div className="text-center text-muted-foreground min-h-[200px] flex items-center justify-center">
              <p>No alumni applications found matching the criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alumniToDisplay.map((alumni) => (
                <Card key={alumni.id} className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between flex-col md:flex-row gap-4 md:gap-0">
                      <div className="flex items-start space-x-4 flex-grow">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={alumni.profileImage || "/placeholder-avatar.jpg"} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {alumni.fullName ? alumni.fullName.split(' ').map(n => n[0]).join('') : 'AA'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{alumni.fullName}</h3>
                          <p className="text-sm text-muted-foreground truncate">{alumni.email}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                            {alumni.position && alumni.company && (
                              <>
                                <span>•</span>
                                <span className="truncate">{alumni.company} at {alumni.position}</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {alumni.company ? alumni.company : "Company : Null"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <span className='font-bold'>Applied On: </span> {formatEventDateTime(alumni.submittedDate) || 'N/A'}
                            </span>
                          </div>
                          <Badge className="mt-2" variant={getStatusBadgeVariant(alumni.applicationStatus)}>
                            {alumni.applicationStatus === 'PENDING_ADMIN_APPROVAL' ? 'PENDING' : alumni.applicationStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-2 mt-4 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/view-alumni-profile/${alumni.id}`)}
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View Profile
                        </Button>
                        {alumni.applicationStatus === 'PENDING_ADMIN_APPROVAL' && (
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleApprovalAction(alumni.id, false)}
                              disabled={isUpdatingApproval}
                            >
                              <XCircle className="mr-2 h-3 w-3" />
                              Reject
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {isLoadingAnalytics ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : errorAnalytics ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Error loading analytics data.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-border shadow-soft">
                <CardHeader>
                  <CardTitle>Monthly Platform Activity</CardTitle>
                  <CardDescription>New users, referrals, and connections over time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={256}>
                    <LineChart data={monthlyAnalytics} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="newUsers" stroke="#8884d8" name="New Users" />
                      <Line type="monotone" dataKey="newReferrals" stroke="#82ca9d" name="New Referrals" />
                      <Line type="monotone" dataKey="newConnections" stroke="#ffc658" name="New Connections" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border shadow-soft">
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                  <CardDescription>Student vs. Alumni distribution.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={[{ name: 'Roles', Students: userRoleAnalytics.students, Alumni: userRoleAnalytics.alumni }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Students" fill="#8884d8" />
                      <Bar dataKey="Alumni" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border shadow-soft lg:col-span-2">
                <CardHeader>
                  <CardTitle>Referral Status</CardTitle>
                  <CardDescription>Distribution of jobs by their current status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={referralStatusAnalytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {referralStatusAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader>
              <CardTitle>Platform Activity Feed</CardTitle>
              <CardDescription>Real-time updates from across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : errorActivities ? (
                <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
                  <p>Error: {errorActivities}</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center text-muted-foreground min-h-[200px] flex items-center justify-center">
                  <p>No recent activities found.</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getRecentActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
