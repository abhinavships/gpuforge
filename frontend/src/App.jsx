import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAuth } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import ProblemsPage from './pages/ProblemsPage.jsx';
import ProblemDetailPage from './pages/ProblemDetailPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AuthPage from './pages/AuthPage.jsx';

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" />
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: 12, letterSpacing: '0.2em' }}>BOOTING GPU...</span>
    </div>
  );
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:slug" element={<ProblemDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
