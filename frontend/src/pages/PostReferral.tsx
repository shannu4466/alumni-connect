import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  X,
  IndianRupee,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function PostReferral() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [tipsBox, setTipsBox] = useState(false);
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState(
    Array.from({ length: 10 }, () => ({
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
    }))
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    applicationDeadline: '',
    applicationUrl: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const validateCurrentQuizQuestion = () => {
    const currentQ = quizQuestions[currentQuizIndex];
    if (!currentQ.question.trim()) {
      toast({ title: "Validation Error", description: `Question ${currentQuizIndex + 1} content is required.`, variant: "destructive" });
      return false;
    }
    if (currentQ.options.some(opt => !opt.trim())) {
      toast({ title: "Validation Error", description: `Question ${currentQuizIndex + 1} must have all 4 options filled.`, variant: "destructive" });
      return false;
    }
    if (currentQ.correctAnswerIndex === undefined || currentQ.correctAnswerIndex < 0 || currentQ.correctAnswerIndex > 3) {
      toast({ title: "Validation Error", description: `Question ${currentQuizIndex + 1} requires a valid correct answer index.`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleQuizChange = (field, value, optionIndex) => {
    const newQuiz = [...quizQuestions];
    if (field === 'question') {
      newQuiz[currentQuizIndex].question = value;
    } else if (field === 'options' && optionIndex !== undefined) {
      newQuiz[currentQuizIndex].options[optionIndex] = value;
    }
    setQuizQuestions(newQuiz);
  };

  const handleCorrectAnswerChange = (index) => {
    const newQuiz = [...quizQuestions];
    newQuiz[currentQuizIndex].correctAnswerIndex = parseInt(index, 10);
    setQuizQuestions(newQuiz);
  };

  const nextQuestion = () => {
    if (!validateCurrentQuizQuestion()) {
      return;
    }
    if (currentQuizIndex < 9) setCurrentQuizIndex(prev => prev + 1);
  };

  const prevQuestion = () => {
    if (currentQuizIndex > 0) setCurrentQuizIndex(prev => prev - 1);
  };

  const validateForm = (data) => {
    const requiredFields = ['title', 'company', 'location', 'jobType', 'description', 'requirements', 'applicationDeadline'];
    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === '') {
        toast({ title: "Validation Error", description: `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`, variant: "destructive" });
        return false;
      }
    }
    if (skills.length === 0) {
      toast({ title: "Validation Error", description: "At least one skill is required.", variant: "destructive" });
      return false;
    }
    if (quizEnabled) {
      for (let i = 0; i < 10; i++) {
        const q = quizQuestions[i];
        if (!q.question.trim() || q.options.some(opt => !opt.trim())) {
          toast({ title: "Quiz Error", description: `Quiz Question ${i + 1} must be fully completed.`, variant: "destructive" });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);
    if (!user || !user.id || !user.fullName) {
      toast({
        title: "Authentication Error",
        description: "User details missing. Please log in again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const postData = {
      alumniId: user.id,
      alumniName: user.fullName,
      title: formData.title,
      company: formData.company,
      location: formData.location,
      jobType: formData.jobType,
      salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
      salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
      description: formData.description,
      requirements: formData.requirements,
      skills: skills,
      applicationDeadline: formData.applicationDeadline,
      applicationUrl: formData.applicationUrl,
      quizEnabled: quizEnabled,
      quizQuestions: quizEnabled ? quizQuestions : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/job-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to post referral: ${response.status}`);
      }

      toast({
        title: "Referral posted successfully!",
        description: "Your job referral has been published and is now visible to students.",
      });

      setFormData({
        title: '',
        company: '',
        location: '',
        jobType: '',
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: '',
        applicationDeadline: '',
        applicationUrl: '',
      });
      setSkills([]);
      setQuizEnabled(false);
      setCurrentQuizIndex(0);
      setQuizQuestions(Array.from({ length: 10 }, () => ({ question: '', options: ['', '', '', ''], correctAnswerIndex: 0 })));
    } catch (error) {
      toast({
        title: "Failed to post referral",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openJobPostTips = () => setTipsBox(!tipsBox);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Post a Job Referral</h1>
          <p className="text-muted-foreground">
            Help fellow graduates find their next opportunity by sharing open positions at your company
          </p>
        </div>

        <Card className="bg-gradient-card border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex justify-between" onClick={openJobPostTips}>
              Tips for a Great Referral Post
              <ChevronDown className={`transition-transform duration-300 ${tipsBox ? "rotate-180" : "rotate-0"}`} />
            </CardTitle>
          </CardHeader>
          {tipsBox && (
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Be Detailed</h4>
                  <p>Include specific requirements, day-to-day responsibilities, and growth opportunities.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Set Expectations</h4>
                  <p>Mention the application process, timeline, and what students should expect.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Be Honest</h4>
                  <p>Share both the exciting aspects and challenges of the role.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Stay Available</h4>
                  <p>Be prepared to answer questions from interested students.</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Details
            </CardTitle>
            <CardDescription>
              Provide comprehensive information about the position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="e.g., Google"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type *</Label>
                  <Select value={formData.jobType} onValueChange={(value) => handleSelectChange('jobType', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Salary Range (Monthly/Annual) *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      name="salaryMin"
                      placeholder="Enter Minimum Salary"
                      value={formData.salaryMin}
                      onChange={handleInputChange}
                      className="pl-10 bg-background"
                      type="number"
                      required
                    />
                  </div>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      name="salaryMax"
                      placeholder="Enter Maximum Salary"
                      value={formData.salaryMax}
                      onChange={handleInputChange}
                      className="pl-10 bg-background"
                      type="number"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="bg-background resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements & Qualifications *</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  placeholder="List the required skills, experience, and qualifications..."
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-background resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills * (Add a skill and press ENTER)</Label>
                <div className="flex gap-2">
                  <Input
                    id="skills"
                    placeholder="Add a skill and press Enter"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="bg-background"
                  />
                  <Button type="button" onClick={addSkill} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="applicationDeadline">Application Deadline *</Label>
                  <Input
                    id="applicationDeadline"
                    name="applicationDeadline"
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicationUrl">Application URL (Optional)</Label>
                  <Input
                    id="applicationUrl"
                    name="applicationUrl"
                    placeholder="e.g., https://careers.google.com/jobs/..."
                    value={formData.applicationUrl}
                    onChange={handleInputChange}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="quiz" className="font-medium">
                    Want to add your own Quiz questions...?
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Quiz questions are used to filter students based on quiz score. Minimum 10 questions required.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={quizEnabled}
                      onChange={() => setQuizEnabled(!quizEnabled)}
                    />
                    <div className="w-14 h-7 bg-red-600 rounded-full peer peer-checked:bg-green-600 transition-all duration-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500"></div>
                    <span className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-7"></span>
                  </label>
                </div>
              </div>

              {quizEnabled && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-lg">Quiz Question {currentQuizIndex + 1}/10</Label>
                    <div className="flex gap-2">
                      <Button onClick={prevQuestion} disabled={currentQuizIndex === 0} type="button" variant="outline" size="sm">&lt;</Button>
                      <Button onClick={nextQuestion} disabled={currentQuizIndex === 9} type="button" variant="outline" size="sm">&gt;</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Question *</Label>
                    <Input
                      value={quizQuestions[currentQuizIndex].question}
                      onChange={(e) => handleQuizChange('question', e.target.value)}
                      placeholder="Enter your question"
                      className="w-full bg-background"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quizQuestions[currentQuizIndex].options.map((opt, index) => (
                      <div key={index}>
                        <Label>Option {index + 1} *</Label>
                        <Input
                          value={opt}
                          onChange={(e) => handleQuizChange('options', e.target.value, index)}
                          placeholder={`Enter option ${index + 1}`}
                          className="w-full bg-background"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="correctAnswer">Correct Answer (Index: Default - 0) *</Label>
                    <Select
                      onValueChange={(value) => handleCorrectAnswerChange(value)}
                      value={String(quizQuestions[currentQuizIndex].correctAnswerIndex)}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select correct option index (0-3)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Post Referral
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
