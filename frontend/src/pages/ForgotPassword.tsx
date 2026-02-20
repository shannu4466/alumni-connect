import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, CheckCircle, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DarkVeil from '@/components/ui/Darkveil';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();
    const inputRefs = useRef([]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/password/forgot-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send OTP.');
            toast({ title: 'OTP Sent', description: 'An OTP has been sent to your email. Please check your inbox.' });
            setStep(2);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        const otp = otpDigits.join('');
        if (otp.length !== 6) {
            setError('Please enter all 6 digits of the OTP.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/password/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'OTP verification failed.');
            setToken(data.token);
            toast({ title: 'OTP Verified', description: 'You can now set a new password.' });
            setStep(3);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/password/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to reset password.');
            toast({ title: 'Password Reset Successful!', description: 'You can now log in with your new password.' });
            navigate('/login');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otpDigits];
        newOtp[index] = value;
        setOtpDigits(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            {error && <div className="text-red-600 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                            Send OTP
                        </Button>
                    </form>
                );
            case 2:
                return (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-2">
                            {error && <div className="text-red-600 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
                            <Label htmlFor="otp">OTP</Label>
                            <div className="flex justify-between gap-2">
                                {otpDigits.map((digit, idx) => (
                                    <Input
                                        key={idx}
                                        ref={(el) => (inputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        className="w-12 h-12 text-center text-xl font-bold"
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Verify OTP
                        </Button>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            {error && <div className="text-red-600 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                            Reset Password
                        </Button>
                    </form>
                );
            default:
                return null;
        }
    };

    const getStepIcon = (currentStep, icon) => {
        const activeColor = step === currentStep ? 'text-primary' : 'text-muted-foreground';
        const completedColor = step > currentStep ? 'text-white' : activeColor;
        const bgColor = step > currentStep ? 'bg-primary' : step === currentStep ? 'bg-primary/20' : 'bg-secondary';
        return (
            <div className={`rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 ${bgColor}`}>
                {step > currentStep ? <CheckCircle className="h-5 w-5 text-white" /> : React.cloneElement(icon, { className: `h-5 w-5 ${completedColor}` })}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 -z-10">
                <DarkVeil />
            </div>
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
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
                    <CardDescription>Follow these steps to securely reset your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center w-full mb-8">
                        <div className="flex flex-col items-center">
                            {getStepIcon(1, <Mail />)}
                            <span className={`text-xs mt-2 transition-colors duration-500 ${step === 1 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Enter Email</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${step > 1 ? 'bg-primary' : 'bg-border'}`} />
                        <div className="flex flex-col items-center">
                            {getStepIcon(2, <Smartphone />)}
                            <span className={`text-xs mt-2 transition-colors duration-500 ${step === 2 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Verify OTP</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${step > 2 ? 'bg-primary' : 'bg-border'}`} />
                        <div className="flex flex-col items-center">
                            {getStepIcon(3, <Lock />)}
                            <span className={`text-xs mt-2 transition-colors duration-500 ${step === 3 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Set Password</span>
                        </div>
                    </div>
                    {renderStep()}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link to="/login" className="text-sm text-primary hover:underline">
                        Remembered your password? Log in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
