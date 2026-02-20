import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DarkVeil from '@/components/ui/Darkveil';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    role: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    collegeName: '',
    graduationYear: '',
    rollNumber: '',
    company: '',
    bio: '',
    skills: '',
    linkedinProfile: '',
    githubProfile: '',
    branch: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillsArray, setSkillsArray] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const addSkill = () => {
    if (currentSkill.trim()) {
      setSkillsArray(prev => [...prev, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsArray(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const isStudent = formData.role === 'student';
  const isAlumni = formData.role === 'alumni';
  const isEmailValid = !isStudent || (formData.email.endsWith('@sves.org.in'));
  const is10CharEmail = formData.email.split('@')[0].length === 10;

  const isFormComplete = () => {
    if (!formData.role || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword || !formData.collegeName || !formData.graduationYear) {
      return false;
    }
    if (isStudent && (!formData.rollNumber || !formData.branch)) {
      return false;
    }
    if (isAlumni && !formData.company) {
      return false;
    }
    if (isStudent && !isEmailValid) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    const dataToSend = {
      role: formData.role,
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      collegeName: formData.collegeName,
      graduationYear: parseInt(formData.graduationYear as string, 10),
      rollNumber: isStudent ? formData.rollNumber : null,
      company: isAlumni ? formData.company : null,
      bio: formData.bio,
      skills: skillsArray,
      linkedinProfile: formData.linkedinProfile,
      githubProfile: formData.githubProfile,
      branch: isStudent ? formData.branch : null,
    };

    if (!isFormComplete()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('An unexpected server error occurred. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      if (formData.role === 'student') {
        toast({
          title: "Registration Successful!",
          description: "Please check your email for an OTP to verify your account.",
          variant: "default",
        });
        navigate('/verify-student-details', { state: { email: formData.email } });
      } else {
        toast({
          title: "Registration Successful!",
          description: "Your alumni account is currently in pending state. You will be notified via email once it updated.",
          variant: "default",
        });
        navigate('/login');
      }

    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during registration.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <DarkVeil />
      </div>
      <Card className="w-full max-w-2xl shadow-lg border-border/50 bg-black/10 text-white dark:border-white/80">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img
              src="public/project_logo.png"
              alt="AlumniConnect Logo"
              className="h-[80px] w-[80px] mr-[-10px]"
            />
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Join Alumni Connect
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Create your account and start networking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="role" className="text-sm font-medium">Select Your Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="h-12 dark:text-white bg-black/10">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4" />
                      <span>Student</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="alumni">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <span>Alumni</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className='bg-black/10'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  className='bg-black/10'
                />
                {isStudent && formData.email && !isEmailValid && (
                  <p className="text-xs text-red-500">Email must end with @sves.org.in</p>
                )}
                {isStudent && formData.email && !is10CharEmail && (
                  <p className="text-xs text-red-500">
                    Email must contain exactly 10 characters before <span className="font-bold">@sves.org.in</span> for OTP verification
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password"
                  required
                  className='bg-black/10'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className='bg-black/10'
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange('collegeName', e.target.value)}
                  placeholder="Sri Vasavi Engineering College"
                  required
                  className='bg-black/10'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="2026"
                  min="2001"
                  max="2050"
                  required
                  className='bg-black/10'
                />
              </div>
              {isStudent && (
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    placeholder="e.g., 22A81A0561"
                    required
                    className='bg-black/10'
                  />
                </div>
              )}
              {isAlumni && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Google or Microsoft...etc"
                    required
                    className='bg-black/10'
                  />
                </div>
              )}
              {isStudent && (
                <div className="space-y-2 md:w-[620px]">
                  <Label htmlFor="branch">Branch</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleInputChange('branch', value)}
                  >
                    <SelectTrigger className="h-12 w-full dark:text-white bg-black/10">
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science and Engineering">Computer Science and Engineering</SelectItem>
                      <SelectItem value="CSE(Artificial Intelligence)">CSE(Artificial Intelligence)</SelectItem>
                      <SelectItem value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</SelectItem>
                      <SelectItem value="Electronics and Communication Engineering">Electronics and Communication Engineering</SelectItem>
                      <SelectItem value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className='bg-black/10'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills <span className='text-red-600 text-[10px]'>(Enter skill and then press Enter)</span></Label>
                <Input
                  id="skills"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="React, Node.js, Python, etc."
                  className='bg-black/10'
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillsArray.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                      <Button type="button" variant="ghost" size="sm" className="ml-1 h-auto px-1 py-0" onClick={() => removeSkill(skill)}>
                        x
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinProfile">Linkedin Profile URL (Optional, but prefer to add)</Label>
                <Input
                  id="linkedinProfile"
                  value={formData.linkedinProfile}
                  onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-profile"
                  className='bg-black/10'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubProfile">Github Profile URL (Optional, but prefer to add)</Label>
                <Input
                  id="githubProfile"
                  value={formData.githubProfile}
                  onChange={(e) => handleInputChange('githubProfile', e.target.value)}
                  placeholder="https://github.com/your-username"
                  className='bg-black/10'
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={!isFormComplete() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
