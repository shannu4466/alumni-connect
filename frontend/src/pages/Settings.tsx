import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { User, Trash2, Settings2, Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const API_USERS_URL = `${API_BASE_URL}/api/users`;

const Settings = () => {
  const { user, logout, updateUserContext } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileImageFileChange = async (e) => {
    if (!e.target.files?.[0] || !user?.id) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_USERS_URL}/upload/profile/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile image.');
      }
      const data = await response.json();
      toast({ title: 'Success', description: 'Profile photo updated!' });
      updateUserContext({ ...user, profileImage: data.profileImage });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while uploading.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getProfileInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const deleteAccount = async () => {
    if (!user?.id || !user?.token) return;
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undo.')) {
      setIsDeleting(true);
      try {
        const response = await fetch(`${API_USERS_URL}/${user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to delete account.' }));
          throw new Error(errorData.message);
        }
        logout();
        navigate('/login');
        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          variant: 'destructive'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      toast({ title: 'Settings Saved', description: 'Your settings have been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Please log in to view this profile.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto flex flex-col items-center gap-3 p-6 rounded-2xl bg-card shadow-lg w-full max-w-sm">
                <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-md">
                  <AvatarImage
                    src={user?.profileImage || "/placeholder-avatar.jpg"}
                    alt={user?.fullName || "User"}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {getProfileInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold text-foreground text-center">
                  {"@" + user?.fullName.toUpperCase() || "EXAMPLE"}
                </h1>

                <p className="text-md text-muted-foreground text-center break-words max-w-[90%]">
                  {user?.email || "email@example.com"}
                </p>

                <p className="text-md text-muted-foreground text-center break-words max-w-[90%]">
                  {user?.rollNumber || "1234567890"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Once you delete your account, this action cannot be undo. All of your data will be permanently removed from our systems and cannot be recovered.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={deleteAccount}
                disabled={isDeleting}
                className="w-full md:w-auto"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
