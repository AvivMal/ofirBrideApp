import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthGate'
import { TripProvider, useTrip } from './context/TripContext'

import AuthPage         from './pages/AuthPage'
import WelcomePage      from './pages/WelcomePage'
import OnboardingPage   from './pages/OnboardingPage'
import InvitePage       from './pages/InvitePage'
import SchedulePage     from './pages/SchedulePage'
import ChatPage         from './pages/ChatPage'
import PlacesPage       from './pages/PlacesPage'
import MemoriesPage     from './pages/MemoriesPage'
import ProfilePage      from './pages/ProfilePage'
import PrivateChatPage  from './pages/PrivateChatPage'

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
  const { activeTrip, loading: tripLoading }     = useTrip()
  const { pathname } = useLocation()

  const isLoading = authLoading || (!!user && tripLoading)
  const isAuthed  = !!user || demoMode

  if (isLoading) return <Spinner />

  // Invite route is always public — no auth guard needed
  if (pathname.startsWith('/invite/')) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="*" element={<Navigate to={pathname} replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/auth"           element={<AuthPage />} />
      <Route path="/invite/:token"  element={<InvitePage />} />

      {/* Auth required */}
      <Route path="/onboarding/create-trip" element={
        !isAuthed ? <Navigate to="/auth" replace /> : <OnboardingPage />
      } />

      {/* Auth + trip required */}
      <Route path="/welcome"   element={<ProtectedApp><WelcomePage /></ProtectedApp>} />
      <Route path="/schedule"  element={<ProtectedApp><SchedulePage /></ProtectedApp>} />
      <Route path="/chat"      element={<ProtectedApp><ChatPage /></ProtectedApp>} />
      <Route path="/places"    element={<ProtectedApp><PlacesPage /></ProtectedApp>} />
      <Route path="/memories"  element={<ProtectedApp><MemoriesPage /></ProtectedApp>} />
      <Route path="/profile"   element={<ProtectedApp><ProfilePage /></ProtectedApp>} />
      <Route path="/chat/private/:memberId" element={<ProtectedApp><PrivateChatPage /></ProtectedApp>} />

      {/* Root redirect */}
      <Route path="/" element={
        !isAuthed   ? <Navigate to="/auth" replace /> :
        !activeTrip ? <Navigate to="/onboarding/create-trip" replace /> :
                      <Navigate to="/welcome" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Wraps routes that need auth + an active trip
function ProtectedApp({ children }) {
  const { user, demoMode } = useAuth()
  const { activeTrip }     = useTrip()
  const isAuthed = !!user || demoMode

  if (!isAuthed)   return <Navigate to="/auth" replace />
  if (!activeTrip) return <Navigate to="/onboarding/create-trip" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripProvider>
          <AppRoutes />
        </TripProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
