import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  Mail,
  Building2,
  Calendar,
  MapPin,
  Award,
  Eye,
  Upload,
  MessageCircle,
  UserPlus,
  FileText,
  Edit,
  Save,
  X,
  LinkedinIcon,
  GithubIcon,
  Contact2Icon,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const API_USERS_URL = `${API_BASE_URL}/api/users`;

const Profile = () => {
  const { user, updateUserContext } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getStringOrArray = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') return value;
    return '';
  };

  const [profileData, setProfileData] = useState(() => ({
    fullName: user?.fullName || '',
    email: user?.email || '',
    collegeName: user?.collegeName || '',
    graduationYear: user?.graduationYear || '',
    company: user?.company || '',
    position: user?.position || '',
    bio: user?.bio || '',
    skills: getStringOrArray(user?.skills),
    location: user?.location || '',
    linkedinProfile: user?.linkedinProfile || '',
    githubProfile: user?.githubProfile || '',
    profileImage: user?.profileImage || '',
    resume: user?.resume || '',
    rollNumber: user?.rollNumber || '',
    branch: user?.branch || ''
  }));
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        collegeName: user.collegeName || '',
        graduationYear: user.graduationYear || '',
        company: user.company || '',
        position: user.position || '',
        bio: user.bio || '',
        skills: getStringOrArray(user.skills),
        location: user.location || '',
        linkedinProfile: user.linkedinProfile || '',
        githubProfile: user.githubProfile || '',
        profileImage: user.profileImage || '',
        resume: user.resume || '',
        rollNumber: user.rollNumber || '',
        branch: user.branch || ''
      });
    }
  }, [user]);

  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      try {
        const response = await fetch(`${API_USERS_URL}/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        if (response.ok) {
          const updatedUserData = await response.json();
          updateUserContext({ ...updatedUserData, token: user.token });
          toast({ title: "Success", description: "Profile data refreshed." });
        } else {
          toast({ title: "Error", description: "Failed to refresh profile data.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Network error refreshing profile data.", variant: "destructive" });
      }
    }
  }, [user, updateUserContext, toast]);

  const handleSave = async () => {
    if (!user?.id || !user?.token) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        fullName: profileData.fullName,
        collegeName: profileData.collegeName,
        graduationYear: profileData.graduationYear ? parseInt(profileData.graduationYear.toString(), 10) : null,
        bio: profileData.bio || null,
        skills: profileData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        location: profileData.location || null,
        linkedinProfile: profileData.linkedinProfile || null,
        githubProfile: profileData.githubProfile || null,
        company: user?.role === 'alumni' ? (profileData.company || null) : null,
        position: user?.role === 'alumni' ? (profileData.position || null) : null,
        rollNumber: user?.role === 'student' ? (profileData.rollNumber || null) : null,
        profileImage: profileData.profileImage || null,
        resume: profileData.resume || null,
      };

      const response = await fetch(`${API_USERS_URL}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        toast({ title: "Success", description: "Profile updated successfully!" });
        setIsEditing(false);
        updateUserContext({ ...user, ...updatedUser });
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.message || "Failed to update profile.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error during profile update. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageFileChange = async (e) => {
    if (!e.target.files?.[0] || !user?.id) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_USERS_URL}/upload/profile-image/${user.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: "Success", description: "Profile image uploaded!" });
        updateUserContext({ ...user, profileImage: data.imageUrl });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload image.");
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Network error during image upload.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleResumeFileChange = async (e) => {
    if (!e.target.files?.[0] || !user?.id) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      toast({ title: "Invalid File Type", description: "Please upload a PDF, DOC, or DOCX file.", variant: "destructive" });
      return;
    }

    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_USERS_URL}/upload/resume/${user.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: "Success", description: "Resume uploaded!" });
        updateUserContext({ ...user, resume: data.resumeUrl });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload resume.");
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Network error during resume upload.", variant: "destructive" });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDownloadResume = () => {
    if (profileData.resume) {
      window.open(profileData.resume, '_blank');
    } else {
      toast({ title: "No Resume", description: "No resume URL found for download.", variant: "destructive" });
    }
  };

  const isOwnProfile = true;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Please log in to view this profile.</div>
      </div>
    );
  }

  const getProfileInitials = (fullName) => {
    return fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'AA';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={profileData.profileImage || "/placeholder-avatar.jpg"}
                    alt={profileData.fullName}
                  />
                  <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                    {getProfileInitials(profileData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageFileChange}
                  disabled={isUploadingImage}
                />
                <label
                  htmlFor="profile-image-input"
                  className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-input bg-background text-foreground transition-colors
                  ${isUploadingImage
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                    }`}
                >
                  {isUploadingImage ? 'Image updating...' : 'Update Profile Photo'}
                </label>
              </div>
              <div className="space-y-2 mt-4">
                <CardTitle className="text-xl">
                  {profileData.fullName}
                </CardTitle>
                {user.role === 'student' && (
                  <div className="text-sm text-muted-foreground">
                    {profileData.rollNumber ? (
                      <p>Roll Number: {profileData.rollNumber}</p>
                    ) : (
                      <p className="text-muted-foreground">Roll No: Not added</p>
                    )}
                  </div>
                )}
                {user.role === 'student' && (
                  <div className="text-sm text-muted-foreground">
                    {profileData.branch ? (
                      <p>{profileData.branch}</p>
                    ) : (
                      <p className="text-muted-foreground">Branch Not added</p>
                    )}
                  </div>
                )}
                <Badge variant="secondary" className="capitalize">
                  {user?.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {isOwnProfile ? (
                  isEditing ? (
                    <div className="flex gap-2 w-full">
                      <Button variant="default" className="flex-1 w-[60%]" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Changes
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-[25%]" /> Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  )
                ) : (
                  <Button className="w-full" onClick={() => navigate(`/chat/${user?.id}`)}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2 text-sm">
                  <Label className="text-sm font-medium flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" /> Resume (.pdf)
                  </Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => document.getElementById('resume-upload')?.click()}
                          disabled={isUploadingResume}
                        >
                          {isUploadingResume ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                          {isUploadingResume ? "Selecting..." : "Select File"}
                        </Button>
                      </div>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleResumeFileChange}
                      />
                      {resumeFile && (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate flex-1">
                            Selected: {resumeFile.name}
                          </p>
                        </div>
                      )}
                      {profileData.resume && !resumeFile && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          Current: <a href={profileData.resume} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[200px]">{profileData.resume.split('/').pop()}</a>
                        </p>
                      )}
                      {!profileData.resume && !resumeFile && (
                        <p className="text-sm text-muted-foreground text-center">No resume uploaded</p>
                      )}
                    </div>
                  ) : (
                    profileData.resume ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleDownloadResume}
                      >
                        <Eye className="h-4 w-4 mr-2" /> View Resume
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Resume not available</p>
                    )
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2 text-sm">
                  <Label className="text-sm font-medium flex items-center justify-center gap-2">
                    <Contact2Icon className="h-4 w-4" /> Contact
                  </Label>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{profileData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{profileData.collegeName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Year of graduation : {profileData.graduationYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={profileData.location || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        className="flex-1 border-none focus-visible:ring-0"
                        placeholder="Your Location"
                      />
                    ) : (
                      <span>{profileData.location || 'Location not added'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LinkedinIcon className="h-4 w-4" />
                    {isEditing ? (
                      <Input
                        type="text"
                        value={profileData.linkedinProfile || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                        placeholder="Linkedin Profile URL"
                        className="flex-1 border-none focus-visible:ring-0"
                      />
                    ) : (
                      profileData.linkedinProfile ? (
                        <a href={profileData.linkedinProfile} target='_blank' rel="noopener noreferrer" className='text-primary underline truncate'>
                          {profileData.linkedinProfile}
                        </a>
                      ) : (
                        <span>Linkedin profile not added</span>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GithubIcon className="h-4 w-4" />
                    {isEditing ? (
                      <Input
                        type="text"
                        value={profileData.githubProfile || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, githubProfile: e.target.value }))}
                        placeholder="Github Profile URL"
                        className="flex-1 border-none focus-visible:ring-0"
                      />
                    ) : (
                      profileData.githubProfile ? (
                        <a href={profileData.githubProfile} target='_blank' rel="noopener noreferrer" className='text-primary underline truncate'>
                          {profileData.githubProfile}
                        </a>
                      ) : (
                        <span>Github profile not added</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> About
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md resize-none bg-white dark:bg-slate-800"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {profileData.bio || 'No bio provided. Click "Edit Profile" to add one.'}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" /> Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input
                    id="skills"
                    value={profileData.skills}
                    onChange={(e) => setProfileData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="React, Node.js, Python..."
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.split(',').filter(s => s.trim() !== '').map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill.trim()}
                    </Badge>
                  )) || <p className="text-muted-foreground">No skills added. Click "Edit Profile" to add some.</p>}
                </div>
              )}
            </CardContent>
          </Card>
          {user?.role === 'alumni' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Current working status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={profileData.position || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="Your Position"
                        className="w-full"
                        title='Current position in your company'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Your Company"
                        className="w-full"
                        title='Currently working company'
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary/20 pl-4">
                      {profileData.position || profileData.company ? (
                        <>
                          {profileData.company && (
                            <h4 className="font-semibold">Company: {profileData.position}</h4>
                          )}
                          {profileData.position && (
                            <p className="text-muted-foreground">Position: {profileData.company}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Update company and position in your profile section.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
