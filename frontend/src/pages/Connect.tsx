import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  MessageCircle,
  MapPin,
  Building,
  Calendar,
  Star,
  UserPlus,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ListFilter
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
import { ConnectAgainInfoCard } from './ConnectAgainInfoCard';

interface AlumniData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  collegeName?: string;
  graduationYear: number;
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
  applicationStatus?: 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'NOT_CONNECTED' | 'SELF';
  requestId?: string;
}

const API_USERS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const API_CONNECTIONS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function Connect() {
  const [searchTerm, setSearchTerm] = useState('');
  const [alumniList, setAlumniList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConnectAgainInfo, setShowConnectAgainInfo] = useState(false);
  const [filterCompany, setFilterCompany] = useState('all');
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAlumniAndConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`,
      };

      if (!user?.token) {
        setIsLoading(false);
        setError("You must be logged in to view alumni profiles.");
        toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
        return;
      }

      const alumniResponse = await fetch(`${API_USERS_BASE_URL}/api/users?role=alumni&isApproved=true`, { headers });
      if (!alumniResponse.ok) {
        const errText = await alumniResponse.text();
        throw new Error(`Failed to fetch alumni: ${alumniResponse.status} ${errText}`);
      }
      let alumniData = await alumniResponse.json();

      const currentUserConnectionsResponse = await fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/accepted`, { headers });
      const pendingRequestsResponse = await fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/requests/pending`, { headers });
      const sentRequestsResponse = await fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/requests/sent`, { headers });


      if (!currentUserConnectionsResponse.ok || !pendingRequestsResponse.ok || !sentRequestsResponse.ok) {
        const errTextConn = await currentUserConnectionsResponse.text();
        const errTextPending = await pendingRequestsResponse.text();
        const errTextSent = await sentRequestsResponse.text();
        console.error("Error fetching connections:", errTextConn, errTextPending, errTextSent);
      }
      const acceptedConnections = await currentUserConnectionsResponse.json().catch(() => []);
      const pendingReceived = await pendingRequestsResponse.json().catch(() => []);
      const allSentRequests = await sentRequestsResponse.json().catch(() => []);

      const uniqueCompanies = [...new Set(alumniData.map(alumni => alumni.position).filter(Boolean))].sort();
      setAvailableCompanies(uniqueCompanies);

      alumniData = alumniData.map(alumni => {
        if (alumni.id === user.id) {
          return { ...alumni, connectionStatus: 'SELF' };
        }

        const accepted = acceptedConnections.find(
          conn => (conn.senderId === user.id && conn.receiverId === alumni.id) ||
            (conn.receiverId === user.id && conn.senderId === alumni.id)
        );
        if (accepted) {
          return { ...alumni, connectionStatus: 'ACCEPTED', requestId: accepted.id };
        }

        const sentRequest = allSentRequests.find(
          req => req.senderId === user.id && req.receiverId === alumni.id
        );
        if (sentRequest) {
          if (sentRequest.status === 'PENDING') {
            return { ...alumni, connectionStatus: 'PENDING_SENT', requestId: sentRequest.id };
          } else if (sentRequest.status === 'REJECTED') {
            return { ...alumni, connectionStatus: 'REJECTED', requestId: sentRequest.id };
          }
        }

        const received = pendingReceived.find(
          req => req.receiverId === user.id && req.senderId === alumni.id
        );
        if (received) {
          return { ...alumni, connectionStatus: 'PENDING_RECEIVED', requestId: received.id };
        }

        return { ...alumni, connectionStatus: 'NOT_CONNECTED' };
      });

      setAlumniList(alumniData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ title: "Error fetching alumni", description: err instanceof Error ? err.message : "Could not load alumni data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, user?.id, toast]);

  useEffect(() => {
    fetchAlumniAndConnectionStatus();
  }, [fetchAlumniAndConnectionStatus]);

  const filteredAlumni = alumniList.filter(person => {
    const matchesSearch = person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.position && person.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.skills && person.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCompany = filterCompany === 'all' || (person.position && person.position.toLowerCase().includes(filterCompany.toLowerCase()));
    const isAlumniApprovedByAdmin = person?.isApproved === true && person?.applicationStatus !== 'PENDING';

    return matchesSearch && matchesCompany && isAlumniApprovedByAdmin;
  });

  const handleConnect = async (alumniId) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`,
      };

      if (!user?.id || !user?.fullName) {
        toast({ title: "Login Required", description: "Your user details are missing. Please log in again.", variant: "destructive" });
        return { success: false };
      }

      const postData = {
        receiverId: alumniId,
        senderId: user.id,
        senderName: user.fullName
      };

      const response = await fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/request`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error("Backend Error on Connection Request:", errorData);
        throw new Error(errorData.message || `Failed to send request: ${response.status}`);
      }

      toast({ title: "Connection Request Sent!", description: "Your request has been sent to the alumnus.", variant: "default" });

      setAlumniList(prevList =>
        prevList.map(alumni =>
          alumni.id === alumniId
            ? { ...alumni, connectionStatus: 'PENDING_SENT', requestId: (response.headers.get('Location') || '').split('/').pop() }
            : alumni
        )
      );

      return { success: true };
    } catch (err) {
      toast({ title: "Failed to Send Request", description:"Could not send connection request. Because you have already crossed the limited requests of this alumni. Sorry for the inconvience", variant: "destructive" });
      return { success: false };
    }
  };

  const handleRespondToRequest = async (requestId, action) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`,
      };

      if (!user?.token) {
        toast({ title: "Authentication Required", description: "Please log in to respond to requests.", variant: "destructive" });
        return;
      }

      const response = await fetch(`${API_CONNECTIONS_BASE_URL}/api/connections/request/${requestId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error("Backend Error on Respond to Request:", errorData);
        throw new Error(errorData.message || `Failed to respond: ${response.status}`);
      }

      toast({ title: `Request ${action === 'ACCEPT' ? 'Accepted!' : 'Rejected!'}`, description: `Connection request has been ${action.toLowerCase()}d.`, variant: "default" });
      fetchAlumniAndConnectionStatus();
    } catch (err) {
      toast({ title: `Failed to ${action} Request`, description: err instanceof Error ? err.message : `Could not ${action.toLowerCase()} connection request.`, variant: "destructive" });
    }
  };

  const getConnectButton = (person) => {
    if (person.connectionStatus === 'SELF') {
      return null;
    } else if (person.connectionStatus === 'ACCEPTED') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/chat/${person.id}`)}
        >
          <MessageCircle className="mr-2 h-3 w-3" />
          Message
        </Button>
      );
    } else if (person.connectionStatus === 'PENDING_SENT') {
      return (
        <Button variant="secondary" size="sm" className="flex-1" disabled>
          <Clock className="mr-2 h-3 w-3" />
          Requested
        </Button>
      );
    } else if (person.connectionStatus === 'PENDING_RECEIVED') {
      return (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="premium"
            size="sm"
            className="flex-1"
            onClick={() => handleRespondToRequest(person.requestId, 'ACCEPT')}
          >
            <CheckCircle className="mr-2 h-3 w-3" />
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleRespondToRequest(person.requestId, 'REJECT')}
          >
            <XCircle className="mr-2 h-3 w-3" />
            Reject
          </Button>
        </div>
      );
    } else if (person.connectionStatus === 'REJECTED') {
      return (
        <Button
          variant="premium"
          size="sm"
          className="flex-1"
          onClick={async () => {
            const result = await handleConnect(person.id);
            if (result?.success) {
              setShowConnectAgainInfo(true);
            }
          }}
        >
          <UserPlus className="mr-2 h-3 w-3" />
          Connect Again
        </Button>
      );
    } else {
      return (
        <Button
          variant="premium"
          size="sm"
          className="flex-1"
          onClick={() => handleConnect(person.id)}
        >
          <UserPlus className="mr-2 h-3 w-3" />
          Connect
        </Button>
      );
    }
  };

  const getProfileInitials = (fullName) => {
    return fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
  };

  const getConnectAgainInfoCard = () => {
    if (!showConnectAgainInfo) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <ConnectAgainInfoCard onClose={() => setShowConnectAgainInfo(false)} />
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Connect with Alumni</h1>
          <p className="text-muted-foreground">Build meaningful connections with graduates in your field</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
            {filteredAlumni.length}
          </span>
          <span className="ml-2">Alumni's available to connect</span>
        </Badge>
      </div>
      <Card className="bg-gradient-card border-border shadow-soft">
        <CardContent className="p-6">
          <div className="flex md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, company, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            {/* Students can filter alumni's based on company. */}
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-[60px] md:w-[100px] h-10 flex items-center justify-center rounded-full border bg-background [&>svg:last-child]:hidden">
                <ListFilter className="text-xl" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {availableCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading alumni...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
          <p>Error: {error}</p>
        </div>
      ) : filteredAlumni.length === 0 ? (
        <Card className="bg-gradient-card border-border shadow-soft">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No alumni found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria to find more alumni to connect with.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((person) => (
            <Card key={person.id} className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={person.profileImage || "/placeholder-avatar.jpg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getProfileInitials(person.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{person.fullName}</CardTitle>
                      <CardDescription>
                        {person.position && person.company && (
                          <span className="flex items-center gap-1 mb-1">
                            <Building className="h-3 w-3" />
                            {person.position} at {person.company}
                          </span>
                        )}
                        {person.graduationYear && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Graduated Year: {person.graduationYear}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {person.connectionStatus === 'ACCEPTED' && (
                    <Badge className="text-xs bg-success text-success-foreground">
                      Connected
                    </Badge>
                  )}
                  {person.connectionStatus === 'PENDING_SENT' && (
                    <Badge className="text-xs bg-blue-500 text-white">
                      Requested
                    </Badge>
                  )}
                  {person.connectionStatus === 'PENDING_RECEIVED' && (
                    <Badge className="text-xs bg-yellow-500 text-white">
                      Accept Request
                    </Badge>
                  )}
                  {person.connectionStatus === 'REJECTED' && (
                    <Badge className="text-xs bg-red-500 text-white">
                      Rejected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {person.bio && <p className="text-sm text-foreground line-clamp-2">{person.bio}</p>}

                {person.skills && person.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {person.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {person.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{person.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    {person.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{person.rating}</span>
                      </div>
                    )}
                    {person.connectionsHelped && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{person.connectionsHelped} helped</span>
                      </div>
                    )}
                  </div>
                  {person.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{person.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {getConnectButton(person)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {getConnectAgainInfoCard()}
    </div>
  );
}
