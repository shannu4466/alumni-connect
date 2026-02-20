import { Clock, Mail, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DarkVeil from '@/components/ui/Darkveil';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const pendingPageLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 w-full h-full">
        <DarkVeil />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full bg-gradient-card border-border shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
              {user?.applicationStatus === 'PENDING_ADMIN_APPROVAL' ? (
                <Clock className="h-10 w-10 text-warning" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {user?.applicationStatus === 'PENDING_ADMIN_APPROVAL'
                ? 'Account Pending Approval'
                : 'Account Rejected'}
            </CardTitle>
            <CardDescription>
              {user?.applicationStatus === 'PENDING_ADMIN_APPROVAL'
                ? 'Your alumni account is currently under review by our administrators.'
                : 'Your alumni account is rejected by our administrators.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">Email Verification</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
                <CheckCircle className="h-4 w-4 text-success ml-auto" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {user?.applicationStatus === 'PENDING_ADMIN_APPROVAL' ? (
                  <Clock className="h-5 w-5 text-warning" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-sm">Admin Review</p>
                  <p className="text-xs text-muted-foreground">{user?.applicationStatus}</p>
                </div>
              </div>
            </div>
            <div className="text-left space-y-2 p-4 bg-accent rounded-lg">
              {user?.applicationStatus === 'PENDING_ADMIN_APPROVAL' ? (
                <div>
                  <h4 className="font-medium text-sm mb-1">What happens next?</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Our team will verify your alumni status</li>
                    <li>• You'll receive an email confirmation</li>
                    <li>• Process typically takes 1-3 business days</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-sm mb-1">What happened?</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-2">
                    <li>• Your placement officer rejected your application</li>
                    <li>• Possible reason: you're not a student of that college</li>
                    <li>• Maybe your job role is not eligible to provide referrals</li>
                    <li>• Try contacting your placement officer</li>
                  </ul>
                  <h1 className="font-bold">Sorry for the inconvenience</h1>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium">{user?.email}</span>
              </p>
              <Button variant="outline" onClick={pendingPageLogout} className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
