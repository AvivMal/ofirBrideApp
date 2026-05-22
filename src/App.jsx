import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthGate'
import { EventProvider, useEvent } from './context/EventContext'

import AuthPage            from './pages/AuthPage'
import WelcomePage         from './pages/WelcomePage'
import CreateEventPage     from './pages/CreateEventPage'
import EventSelectionPage  from './pages/EventSelectionPage'
import InvitePage          from './pages/InvitePage'
import SchedulePage        from './pages/SchedulePage'
import ChatPage            from './pages/ChatPage'
import PlacesPage          from './pages/PlacesPage'
import MemoriesPage        from './pages/MemoriesPage'
import ProfilePage         from './pages/ProfilePage'
import PrivateChatPage     from './pages/PrivateChatPage'

function Spinner() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #050d1e, #0a1428)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px', animation: 'float 2s ease-in-out infinite' }}>💍</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'Assistant, sans-serif' }}>טוענת…</div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, loading: authLoading, demoMode } = useAuth()
  const { activeEvent, allEvents, loading: eventLoading } = useEvent()
  const { pathname } = useLocation()

  const isLoading = authLoading || (!!user || demoMode) && eventLoading
  const isAuthed  = !!user || demoMode

  if (isLoading) return <Spinner />

  // Invite route is always public
  if (pathname.startsWith('/invite/')) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="*" element={<Navigate to={pathname} replace />} />
      </Routes>
    )
  }

  // Root redirect logic
  function rootRedirect() {
    if (!isAuthed) return <Navigate to="/auth" replace />
    if (allEvents.length === 0) return <Navigate to="/create-event" replace />
    if (allEvents.length === 1 || activeEvent) return <Navigate to="/welcome" replace />
    return <Navigate to="/events" replace />
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/auth"          element={<AuthPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Auth required — event optional */}
      <Route path="/create-event" element={
        !isAuthed ? <Navigate to="/auth" replace /> : <CreateEventPage />
      } />
      <Route path="/events" element={
        !isAuthed ? <Navigate to="/auth" replace /> : <EventSelectionPage />
      } />

      {/* Legacy route — OnboardingPage was at this path */}
      <Route path="/onboarding/create-trip" element={
        !isAuthed ? <Navigate to="/auth" replace /> : <CreateEventPage />
      } />

      {/* Auth + active event required */}
      <Route path="/welcome"   element={<ProtectedApp><WelcomePage /></ProtectedApp>} />
      <Route path="/schedule"  element={<ProtectedApp><SchedulePage /></ProtectedApp>} />
      <Route path="/chat"      element={<ProtectedApp><ChatPage /></ProtectedApp>} />
      <Route path="/places"    element={<ProtectedApp><PlacesPage /></ProtectedApp>} />
      <Route path="/memories"  element={<ProtectedApp><MemoriesPage /></ProtectedApp>} />
      <Route path="/profile"   element={<ProtectedApp><ProfilePage /></ProtectedApp>} />
      <Route path="/chat/private/:memberId" element={<ProtectedApp><PrivateChatPage /></ProtectedApp>} />

      {/* Root */}
      <Route path="/" element={rootRedirect()} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ProtectedApp({ children }) {
  const { user, demoMode } = useAuth()
  const { activeEvent, allEvents, loading } = useEvent()
  const isAuthed = !!user || demoMode

  if (!isAuthed) return <Navigate to="/auth" replace />
  if (loading)   return <Spinner />
  if (!activeEvent) {
    if (allEvents.length === 0) return <Navigate to="/create-event" replace />
    // 1 or more events but none active → go to selection so user can pick
    return <Navigate to="/events" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventProvider>
          <AppRoutes />
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
