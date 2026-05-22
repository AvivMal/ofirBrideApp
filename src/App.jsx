import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthGate'
import PhoneFrame from './components/PhoneFrame'

import AuthPage     from './pages/AuthPage'
import WelcomePage  from './pages/WelcomePage'
import SchedulePage from './pages/SchedulePage'
import ChatPage     from './pages/ChatPage'
import PlacesPage   from './pages/PlacesPage'
import MemoriesPage from './pages/MemoriesPage'
import ProfilePage  from './pages/ProfilePage'

function AppRoutes() {
  const { user, loading, demoMode, isDemoMode } = useAuth()

  if (loading) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #050d1e, #0a1428)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', animation: 'float 2s ease-in-out infinite' }}>💍</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>טוענת…</div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth"      element={<AuthPage />} />
      <Route path="/welcome"   element={<WelcomePage />} />
      <Route path="/schedule"  element={<SchedulePage />} />
      <Route path="/chat"      element={<ChatPage />} />
      <Route path="/places"    element={<PlacesPage />} />
      <Route path="/memories"  element={<MemoriesPage />} />
      <Route path="/profile"   element={<ProfilePage />} />
      <Route path="/"          element={<Navigate to="/welcome" replace />} />
      <Route path="*"          element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at 30% 20%, #0a1830 0%, #040a14 60%, #020710 100%)',
          padding: '20px',
        }}>
          <PhoneFrame>
            <AppRoutes />
          </PhoneFrame>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
