import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Building,
  IndianRupee,
  BookmarkPlus,
  ExternalLink,
  Star,
  Clock,
  Loader2,
  Calendar
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAppWideData } from '@/context/JobCountContext';

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
  applicants?: number;
  avatar?: string;
  companyLogo?: string;
  isBookmarked?: boolean;
  rating?: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [jobPosts, setJobPosts] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState(new Set());
  const [availableLocations, setAvailableLocations] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setJobCount, setIsLoadingJobs, isLoadingJobs } = useAppWideData();

  const fetchJobPosts = useCallback(async () => {
    setIsLoadingJobs(true);
    setError(null);
    try {
      if (!user?.token) {
        setIsLoadingJobs(false);
        setError("You must be logged in to view job referrals.");
        toast({
          title: "Authentication Required",
          description: "Please log in to view job referrals.",
          variant: "destructive",
        });
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      };

      const [jobsResponse, bookmarksResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/job-posts`, { headers }),
        fetch(`${API_BASE_URL}/api/bookmarks/user/${user.id}`, { headers })
      ]);

      if (!jobsResponse.ok) {
        const errorText = await jobsResponse.text();
        throw new Error(`Failed to fetch job posts: ${jobsResponse.status} ${errorText}`);
      }
      if (!bookmarksResponse.ok) {
        const errorText = await bookmarksResponse.text();
        throw new Error(`Failed to fetch bookmarks: ${bookmarksResponse.status} ${errorText}`);
      }

      const jobsData = await jobsResponse.json();
      const bookmarkedIds = await bookmarksResponse.json();

      const bookmarkedIdsSet = new Set(bookmarkedIds);
      setBookmarkedJobs(bookmarkedIdsSet);

      const jobPostsWithBookmarkStatus = jobsData.map(job => ({
        ...job,
        isBookmarked: bookmarkedIdsSet.has(job.id)
      }));

      jobPostsWithBookmarkStatus.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

      setJobPosts(jobPostsWithBookmarkStatus);
      setJobCount(jobPostsWithBookmarkStatus.length);

      const uniqueLocations = [...new Set(jobsData.map(job => job.location))].filter(Boolean);
      setAvailableLocations(uniqueLocations);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({
        title: "Error fetching jobs",
        description: err instanceof Error ? err.message : "Could not load job referrals.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user?.token, user?.id, toast, setJobCount, setIsLoadingJobs]);

  const handleBookmark = async (jobPostId, isBookmarked) => {
    if (!user?.token) {
      toast({ title: "Error", description: "Please log in to bookmark jobs.", variant: "destructive" });
      return;
    }

    const method = isBookmarked ? 'DELETE' : 'POST';
    const endpoint = isBookmarked ? `${API_BASE_URL}/api/bookmarks/${jobPostId}` : `${API_BASE_URL}/api/bookmarks`;
    const body = isBookmarked ? null : JSON.stringify({ jobPostId });

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update bookmark.');
      }

      if (isBookmarked) {
        setBookmarkedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobPostId);
          return newSet;
        });
        toast({ title: "Bookmark Removed", description: "Job removed from your bookmarks.", });
      } else {
        setBookmarkedJobs(prev => new Set(prev).add(jobPostId));
        toast({ title: "Bookmarked", description: "Job saved to your bookmarks.", });
      }

      fetchJobPosts();

    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive", });
    }
  };

  useEffect(() => {
    fetchJobPosts();
  }, [fetchJobPosts]);

  const filteredReferrals = jobPosts.filter(referral => {
    const userSkills = user?.skills ? user.skills.map(s => s.toLowerCase()) : [];
    const jobSkills = referral.skills ? referral.skills.map(s => s.toLowerCase()) : [];

    const matchedSkillsCount = jobSkills.filter(jobSkill => userSkills.includes(jobSkill)).length;
    const skillMatchPercentage = jobSkills.length > 0 ? (matchedSkillsCount / jobSkills.length) * 100 : 100;

    const SKILL_MATCH_THRESHOLD = 70;
    const matchesSkillsThreshold = skillMatchPercentage >= SKILL_MATCH_THRESHOLD;

    const matchesSearch = referral.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.skills && referral.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      referral.alumniName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = filterLocation === 'all' || (referral.location && referral.location.toLowerCase().includes(filterLocation.toLowerCase()));
    const matchesType = filterType === 'all' || (referral.jobType && referral.jobType.toLowerCase() === filterType.toLowerCase());

    const isPostedByCurrentUser = user?.id === referral.alumniId;

    if (user?.role === 'student') {
      return matchesSearch && matchesLocation && matchesType && matchesSkillsThreshold;
    } else if (user?.role === 'alumni') {
      return matchesSearch && matchesLocation && matchesType && !isPostedByCurrentUser;
    } else if (user?.role === 'admin') {
      return matchesSearch && matchesLocation && matchesType;
    }
    return false;
  });

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

  const handleViewDetails = (id) => {
    navigate(`/job-details/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Referrals</h1>
          <p className="text-muted-foreground">Discover opportunities shared by our alumni network</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
            {filteredReferrals.length}
          </span>
          <span className="ml-2">Referrals Available</span>
        </Badge>
      </div>

      <Card className="bg-gradient-card border-border shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search jobs, companies, skills, alumni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full md:w-[200px] bg-background">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {availableLocations.map(loc => (
                  <SelectItem key={loc} value={loc.toLowerCase()}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[200px] bg-background">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoadingJobs ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading job referrals...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
          <p>Error: {error}</p>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <Card className="bg-gradient-card border-border shadow-soft">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No referrals found</h3>
            <p className="text-muted-foreground">
              {user?.role === 'student' ? 'Currently there are no referrals matching at least 70% of your skills. Try updating your skills or checking back later for new opportunities.' : 'Try adjusting your search criteria or check back later for new opportunities.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
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
                      {user?.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(referral.id, bookmarkedJobs.has(referral.id));
                          }}
                        >
                          <BookmarkPlus className={`h-4 w-4 ${bookmarkedJobs.has(referral.id) ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {referral.requirements && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
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
