import { HelmetProvider } from "react-helmet-async";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppWideDataProvider } from './context/JobCountContext';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import TitleManager from "./components/TitleManager";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Referrals from "./pages/Referrals";
import Connect from "./pages/Connect";
import PostReferral from "./pages/PostReferral";
import QuizInterface from "./pages/QuizInterface";
import AdminPanel from "./pages/AdminPanel";
import Unauthorized from "./pages/Unauthorized";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";
import Index from './pages/Index';
import Notifications from './pages/Notifications';
import ViewJobDetails from './pages/ViewJobDetails';
import AlumniProfile from './pages/AlumniProfile';
import MyReferrals from './pages/MyReferrals';
import Connections from './pages/Connections';
import StudentProfile from './pages/StudentProfile';
import AddEvent from './pages/AddEvent';
import ChatPage from './pages/ChatPage';
import VerifyStudentDetails from './pages/VerifyStudentDetails';
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword';
import Bookmark from './pages/BookMarks';
import SkillAssessmentHistory from "./pages/SkillAssessmentHistory";

const queryClient = new QueryClient();

// A custom hook to guard the quiz route
const useQuizGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const quizSessionToken = sessionStorage.getItem('quizSessionToken');
    const pathSegments = location.pathname.split('/');

    // Check if the URL has a session ID
    if (pathSegments.length === 4 && pathSegments[1] === 'quiz') {
      const pathSessionId = pathSegments[3];
      // If the session token is missing from storage or doesn't match the URL, redirect
      if (!quizSessionToken || quizSessionToken !== pathSessionId) {
        navigate('/referrals', { replace: true });
      }
    }
  }, [location.pathname, navigate]);
};

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background select-none">
      <Navbar />
      {children}
    </div>
  );
}

const AppContent = () => {
  const { isAuthLoaded } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Call the new quiz guard hook at the top level
  useQuizGuard();

  useEffect(() => {
    if (isAuthLoaded) {
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoaded]);

  if (showSplash || !isAuthLoaded) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AppWideDataProvider>
      <HelmetProvider>
        <TitleManager />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          <Route path="/verify-student-details" element={<VerifyStudentDetails />} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']} requireApproval={true}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <AppLayout>
                <Notifications />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['student', 'alumni']}>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/saved-referrals" element={
            <ProtectedRoute allowedRoles={['student', 'alumni']}>
              <AppLayout>
                <Bookmark />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/chat/:recipientId" element={
            <ProtectedRoute>
              <AppLayout>
                <ChatPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/referrals" element={
            <ProtectedRoute>
              <AppLayout>
                <Referrals />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/connect" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <AppLayout>
                <Connect />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/my-connections" element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
              <AppLayout>
                <Connections />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/post-referral" element={
            <ProtectedRoute allowedRoles={['alumni']} requireApproval={true}>
              <AppLayout>
                <PostReferral />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/job-details/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <ViewJobDetails />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* This route is for the initial quiz details page */}
          <Route path="/quiz/:jobId" element={
            <ProtectedRoute>
              <QuizInterface />
            </ProtectedRoute>
          } />
          {/* This route is for the actual live quiz with a session token */}
          <Route path="/quiz/:jobId/:sessionId" element={
            <ProtectedRoute>
              <QuizInterface />
            </ProtectedRoute>
          } />

          <Route path="/skill-assessment-history" element={
            <ProtectedRoute allowedRoles={['student', 'alumni']}>
              <AppLayout>
                <SkillAssessmentHistory />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']} requireApproval={true}>
                <AppLayout>
                  <AdminPanel />
                </AppLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="approvals" replace />} />
            <Route path="approvals" element={<AdminPanel />} />
            <Route path="analytics" element={<AdminPanel />} />
            <Route path="activities" element={<AdminPanel />} />
          </Route>


          <Route path="/admin/view-all-profiles" element={
            <ProtectedRoute allowedRoles={['admin']} requireApproval={true}>
              <AppLayout>
                <UserManagement />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/my-referrals" element={
            <ProtectedRoute allowedRoles={['alumni']}>
              <AppLayout>
                <MyReferrals />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/view-alumni-profile/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout>
                <AlumniProfile />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/view-student-profile/:id" element={
            <ProtectedRoute allowedRoles={['alumni', 'admin']}>
              <AppLayout>
                <StudentProfile />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/add-event" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout>
                <AddEvent />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HelmetProvider>
    </AppWideDataProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="alumni-portal-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
