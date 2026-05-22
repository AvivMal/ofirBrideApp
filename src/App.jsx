import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthGate'

import AuthPage     from './pages/AuthPage'
import WelcomePage  from './pages/WelcomePage'
import SchedulePage from './pages/SchedulePage'
import ChatPage     from './pages/ChatPage'
import PlacesPage   from './pages/PlacesPage'
import MemoriesPage from './pages/MemoriesPage'
import ProfilePage  from './pages/ProfilePage'

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
