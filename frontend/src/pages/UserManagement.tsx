import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Loader2,
    AlertCircle,
    Search,
    User,
    GraduationCap,
    Briefcase,
    ListFilter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    profileImage?: string;
    rollNumber?: string;
    company?: string;
    position?: string;
    isApproved: boolean;
    collegeName?: string;
    graduationYear: number;
}

const API_USERS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/users';

const ACTIVE_TAB_STORAGE_KEY = 'admin-usermanagement-active-tab';
const SCROLL_POSITION_STORAGE_KEY = 'admin-usermanagement-scroll-pos';

const engineeringBranches = [
    "Computer Science and Engineering",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Information Technology"
];

export default function UserManagement() {
    const [students, setStudents] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState(localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) || 'students');
    const scrollAreaRef = useRef(null);
    const [filterBranch, setFilterBranch] = useState('all');
    const [filterCompany, setFilterCompany] = useState('all');
    const [availableCompanies, setAvailableCompanies] = useState([]);

    const fetchUsers = useCallback(async () => {
        if (!user?.token) {
            setError("Authentication required to view this page.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const headers = {
                'Authorization': `Bearer ${user.token}`,
            };

            const [studentsRes, alumniRes] = await Promise.all([
                fetch(`${API_USERS_BASE_URL}?role=student`, { headers }),
                fetch(`${API_USERS_BASE_URL}?role=alumni`, { headers }),
            ]);

            if (!studentsRes.ok || !alumniRes.ok) {
                throw new Error(`Failed to fetch user lists. Students: ${studentsRes.status}, Alumni: ${alumniRes.status}`);
            }

            const studentsData = await studentsRes.json();
            const alumniData = await alumniRes.json();

            setStudents(studentsData);
            setAlumni(alumniData);

            const uniqueCompanies = [...new Set(alumniData.map(alumni => alumni.position).filter(Boolean))].sort();
            setAvailableCompanies(uniqueCompanies);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            toast({
                title: "Error fetching users",
                description: err instanceof Error ? err.message : "Could not load user data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const savedPosition = localStorage.getItem(SCROLL_POSITION_STORAGE_KEY);
            if (savedPosition) {
                scrollAreaRef.current.scrollTop = parseInt(savedPosition, 10);
            }
        }
        const handleBeforeUnload = () => {
            if (scrollAreaRef.current) {
                localStorage.setItem(SCROLL_POSITION_STORAGE_KEY, scrollAreaRef.current.scrollTop.toString());
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeTab]);

    const filteredStudents = students.filter(student =>
        (student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (filterBranch === 'all' || (student.branch && student.branch.toLowerCase().includes(filterBranch.toLowerCase())))
    );

    const filteredAlumni = alumni.filter(alumniUser =>
        (alumniUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (alumniUser.company && alumniUser.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (alumniUser.position && alumniUser.position.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (alumniUser.applicationStatus === 'APPROVED') &&
        (filterCompany === 'all' || (alumniUser.position && alumniUser.position.toLowerCase().includes(filterCompany.toLowerCase())))
    );

    const getProfileInitials = (fullName) => {
        return fullName ? String(fullName).split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
    };

    const handleViewProfile = (id, role) => {
        if (role === 'student') {
            navigate(`/view-student-profile/${id}`);
        } else if (role === 'alumni') {
            navigate(`/view-alumni-profile/${id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-5xl flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading user data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-5xl text-center text-red-500 flex flex-col justify-center items-center min-h-[400px]">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">Error: {error}</h2>
                <Button onClick={fetchUsers} className="mt-4">Retry Load</Button>
            </div>
        );
    }

    const renderFilterBar = () => {
        if (activeTab === 'students') {
            return (
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                    <SelectTrigger
                        className="md:w-[100px] w-[70px] h-10 flex items-center justify-center rounded-full border bg-background [&>svg:last-child]:hidden"
                    >
                        <ListFilter className="text-xl" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {engineeringBranches.map((branch) => (
                            <SelectItem key={branch} value={branch.toLowerCase()}>
                                {branch}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        } else if (activeTab === 'alumni') {
            return (
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger
                        className="md:w-[100px] w-[70px] h-10 flex items-center justify-center rounded-full border bg-background [&>svg:last-child]:hidden"
                    >
                        <ListFilter className="text-xl" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {availableCompanies.map((company) => (
                            <SelectItem key={company} value={company.toLowerCase()}>
                                {company}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
        return null;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
            <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Browse and manage all registered student and alumni accounts.</p>
                </div>
            </div>

            <Card className="bg-gradient-card border-border shadow-soft">
                <CardContent className="p-6">
                    <div className="flex md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by name, roll number, or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-background"
                            />
                        </div>
                        {renderFilterBar()}
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, value); }} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="students">Students ({filteredStudents.length})</TabsTrigger>
                    <TabsTrigger value="alumni">Alumni ({filteredAlumni.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="space-y-4">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">No students found matching your criteria.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredStudents.map(student => (
                                <Card key={student.id} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={student.profileImage || "/placeholder-avatar.jpg"} />
                                                <AvatarFallback className="bg-primary/10 text-primary">{getProfileInitials(student.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg font-semibold">{student.fullName}</CardTitle>
                                                <CardDescription className="text-sm text-muted-foreground">Roll No: {student.rollNumber}</CardDescription>
                                                <CardDescription className="text-sm text-muted-foreground">{student.branch}</CardDescription>
                                            </div>
                                        </div>
                                        <Button onClick={() => handleViewProfile(student.id, 'student')}>
                                            View Profile
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="alumni" className="space-y-4">
                    {filteredAlumni.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">No alumni found matching your criteria.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAlumni.map(alumniUser => (
                                <Card key={alumniUser.id} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={alumniUser.profileImage || "/placeholder-avatar.jpg"} />
                                                <AvatarFallback className="bg-primary/10 text-primary">{getProfileInitials(alumniUser.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg font-semibold">{alumniUser.fullName}</CardTitle>
                                                <CardDescription className="text-sm text-muted-foreground">
                                                    {alumniUser.company} at {alumniUser.position}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button onClick={() => handleViewProfile(alumniUser.id, 'alumni')}>
                                            View Profile
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
