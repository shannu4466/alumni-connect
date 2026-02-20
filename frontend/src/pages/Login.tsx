import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DarkVeil from '@/components/ui/Darkveil';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        toast({
          title: 'Login successful!',
          variant: 'success'
        });
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (errorMessage.includes('pending admin approval')) {
        toast({
          title: 'Account Pending Approval',
          description: 'Your alumni account is pending admin approval. You will be notified via email.',
          variant: 'destructive',
        });
        navigate('/pending-approval');
      } else if (errorMessage.includes('email is not verified')) {
        toast({
          title: 'Email Verification Pending',
          description: 'Please check your email for the verification link.',
          variant: 'destructive',
        });
        navigate('/verify-student-details', { state: { email } });
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <DarkVeil />
      </div>

      {/* <div className="absolute top-4 right-4 z-20 text-white">
        <ThemeToggle/>
      </div> */}

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/project_logo.png"
              alt="AlumniConnect Logo"
              className="h-[72px] w-[72px] object-contain mr-[-8px]"
            />
            <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AlumniConnect
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white dark:text-white">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <Card className="dark:bg-background/80 backdrop-blur-md shadow-xl border border-border bg-black/10 text-white dark:border-white/80">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className='bg-black/10'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10 bg-black/10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                variant="premium"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className='flex flex-col justify-end items-end mt-2'>
              <button className='text-primary hover:underline' onClick={() => navigate("/reset-password")} disabled={isLoading}>Forgot Password...?</button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                {isLoading ? (
                  <span className="text-muted-foreground cursor-not-allowed font-medium">
                    Sign up
                  </span>
                ) : (
                  <Link
                    to="/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </Link>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
