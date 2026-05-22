import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isDemoMode as isPlaceholder } from '../lib/supabase'
import {
  signInWithEmailOtp,
  signInWithPhoneOtp,
  signInWithGoogle,
  verifyOtp,
} from '../lib/supabase'
import { loadDemoUser, saveDemoUser, clearDemoUser } from '../lib/eventService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    // Restore persisted demo session first
    const saved = loadDemoUser()
    if (saved) {
      setUser(saved)
      setDemoMode(true)
      setLoading(false)
      return
    }

    if (isPlaceholder) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // enterDemo / demoLogin: creates a persisted demo identity.
  // Accepts optional (displayName, userId) so InvitePage can supply a pre-generated ID.
  function enterDemo(displayName, userId) {
    const id = userId || ('demo_' + Math.random().toString(36).substr(2, 9))
    const demoUser = {
      id,
      email: 'demo@example.com',
      display_name: displayName || 'אורחת',
      is_demo: true,
    }
    saveDemoUser(demoUser)
    setUser(demoUser)
    setDemoMode(true)
  }

  async function handleSignOut() {
    clearDemoUser()
    setUser(null)
    setSession(null)
    setDemoMode(false)
    if (!isPlaceholder) await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, demoMode,
      isDemoMode: isPlaceholder,
      enterDemo,
      demoLogin: enterDemo,
      signInWithEmailOtp,
      signInWithPhoneOtp,
      signInWithGoogle,
      verifyOtp,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
