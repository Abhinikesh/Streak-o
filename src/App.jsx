import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import JournalPage from './pages/JournalPage';
import FriendsPage from './pages/FriendsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotFoundPage from './pages/NotFoundPage';
import FeedbackWidget from './components/FeedbackWidget';
import ComingSoonAnnouncement from './components/ComingSoonAnnouncement';
import NotificationPrompt from './components/notifications/NotificationPrompt';

const queryClient = new QueryClient();

// ── Inner component — must live inside AuthProvider to use useAuth ────────────
function NotificationPromptManager() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Don't show if browser already has a decision (granted or denied)
    if (typeof Notification !== 'undefined' && Notification.permission !== 'default') return;

    // Don't show if user already accepted
    if (localStorage.getItem('notificationPromptSeen')) return;

    // Don't show if currently snoozed
    const snoozed = localStorage.getItem('notificationPromptSnoozed');
    if (snoozed && Date.now() < parseInt(snoozed, 10)) return;

    // Delay 3 s so the page finishes loading before the prompt appears
    const timer = setTimeout(() => setShowPrompt(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  if (!showPrompt) return null;

  return (
    <NotificationPrompt onDismiss={() => setShowPrompt(false)} />
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ComingSoonAnnouncement />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FeedbackWidget />
            <NotificationPromptManager />
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              {/* Public — no auth required */}
              <Route path="/u/:shareCode" element={<PublicProfilePage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

