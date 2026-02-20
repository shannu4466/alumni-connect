import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoveLeft } from 'lucide-react';

const API_VERIFY_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/verify';

export default function VerifyStudentDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const userEmail = location.state?.email || '';
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<HTMLInputElement[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState('05:00');
    const [otpExpired, setOtpExpired] = useState(false);
    const [dailySendsLeft, setDailySendsLeft] = useState(3); // NEW: State for daily sends left

    useEffect(() => {
        if (!userEmail) {
            toast({
                title: "Missing Email",
                description: "Please register to receive an OTP.",
                variant: "destructive",
            });
            navigate('/register', { replace: true });
        }

        const savedExpiry = sessionStorage.getItem('otpExpiresAt');
        if (savedExpiry) {
            setOtpExpiry(new Date(savedExpiry));
        } else {
            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 5);
            setOtpExpiry(expiry);
            sessionStorage.setItem('otpExpiresAt', expiry.toISOString());
        }

        const savedResendEnd = sessionStorage.getItem('resendCooldownEnd');
        if (savedResendEnd) {
            const end = new Date(savedResendEnd);
            const now = new Date();
            const diff = Math.max(Math.floor((end.getTime() - now.getTime()) / 1000), 0);
            setResendCooldown(diff);
        }

        const savedSendsLeft = sessionStorage.getItem('dailySendsLeft');
        if (savedSendsLeft !== null) {
            setDailySendsLeft(parseInt(savedSendsLeft, 10));
        }
    }, [userEmail, navigate, toast]);

    useEffect(() => {
        let cooldownTimer: NodeJS.Timeout;
        if (resendCooldown > 0) {
            cooldownTimer = setInterval(() => {
                setResendCooldown(prev => {
                    const newVal = prev - 1;
                    if (newVal <= 0) {
                        sessionStorage.removeItem('resendCooldownEnd');
                    }
                    return newVal;
                });
            }, 1000);
        }
        return () => clearInterval(cooldownTimer);
    }, [resendCooldown]);

    useEffect(() => {
        let expiryTimer: NodeJS.Timeout;
        if (!otpExpiry) return;

        expiryTimer = setInterval(() => {
            const now = new Date();
            const diff = otpExpiry.getTime() - now.getTime();

            if (diff <= 0) {
                clearInterval(expiryTimer);
                setTimeLeft('');
                setOtpExpired(true);
                sessionStorage.removeItem('otpExpiresAt');
            } else {
                const mins = Math.floor(diff / 1000 / 60).toString().padStart(2, '0');
                const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                setTimeLeft(`${mins}:${secs}`);
            }
        }, 1000);

        return () => clearInterval(expiryTimer);
    }, [otpExpiry]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otpDigits];
        newOtp[index] = value;
        setOtpDigits(newOtp);

        if (value && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = otpDigits.join('');
        if (otp.length !== 6) {
            toast({
                title: "Incomplete OTP",
                description: "Please enter all 6 digits.",
                variant: "destructive",
            });
            return;
        }

        if (otpExpired) {
            toast({
                title: "OTP Expired",
                description: "Please click Resend OTP to get a new one.",
                variant: "destructive",
            });
            return;
        }

        setIsVerifying(true);

        try {
            const response = await fetch(`${API_VERIFY_BASE_URL}/check-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'OTP verification failed.');
            }

            toast({
                title: "Verification Successful!",
                description: "Your email has been verified. You can now log in.",
                variant: "default",
            });

            sessionStorage.removeItem('otpExpiresAt');
            sessionStorage.removeItem('resendCooldownEnd');
            sessionStorage.removeItem('dailySendsLeft');
            navigate('/login');

        } catch (error) {
            toast({
                title: "Verification Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        setIsResending(true);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpExpired(false);

        try {
            const response = await fetch(`${API_VERIFY_BASE_URL}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend OTP.');
            }

            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 5);
            setOtpExpiry(expiry);
            sessionStorage.setItem('otpExpiresAt', expiry.toISOString());

            const resendEnd = new Date();
            resendEnd.setSeconds(resendEnd.getSeconds() + 60);
            setResendCooldown(60);
            sessionStorage.setItem('resendCooldownEnd', resendEnd.toISOString());

            setDailySendsLeft(data.dailySendsLeft);
            sessionStorage.setItem('dailySendsLeft', data.dailySendsLeft.toString());


            toast({
                title: "OTP Resent!",
                description: "A new OTP has been sent to your email.",
                variant: "default",
            });

        } catch (error) {
            toast({
                title: "Resend Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col px-4 py-6">
            <div className="flex mb-6">
                <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <MoveLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className="flex flex-1 items-center justify-center">
                <Card className="w-full max-w-md shadow-lg border border-border/50">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
                        <CardDescription>
                            An OTP has been sent to{' '}
                            <span className="font-bold underline break-all">{userEmail}</span>.
                            <br />
                            Please enter it below to verify your account.
                        </CardDescription>
                        {otpExpired ? (
                            <p className="text-xs text-red-600">OTP expired. Please click Resend OTP to get a new one.</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">OTP will expire in {timeLeft}</p>
                        )}
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="flex justify-center gap-2">
                                {otpDigits.map((digit, idx) => (
                                    <Input
                                        key={idx}
                                        ref={(el) => (inputRefs.current[idx] = el!)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-12 h-12 text-center text-xl font-bold"
                                    />
                                ))}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold"
                                disabled={isVerifying || otpExpired}
                            >
                                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify Account
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col items-center space-y-2">
                        <Button
                            variant="link"
                            onClick={handleResendOtp}
                            disabled={isResending || resendCooldown > 0 || dailySendsLeft <= 0}
                            className="text-sm"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Resend OTP in ${resendCooldown}s`
                            ) : (
                                `Resend OTP (${dailySendsLeft} attempts left)`
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Having trouble? Ensure your email is correct and check your spam folder.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
