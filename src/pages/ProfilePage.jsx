import React from 'react'
import { Settings, LogOut, Crown, Bell, Shield, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../components/AuthGate'
import { signOut } from '../lib/supabase'
import bgImg from '../assets/background.png'

const menuRows = [
  { icon: Bell,       label: 'התראות',          sub: 'ניהול עדכונים' },
  { icon: Shield,     label: 'פרטיות',           sub: 'הגדרות חשבון' },
  { icon: HelpCircle, label: 'עזרה ותמיכה',     sub: 'שאלות נפוצות' },
  { icon: Settings,   label: 'הגדרות',           sub: 'שפה ועיצוב' },
]

export default function ProfilePage() {
  const navigate    = useNavigate()
  const { enterDemo } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.55) 0%, rgba(0,8,25,0.72) 100%)' }} />

      <StatusBar />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '60px', paddingBottom: '80px', overflow: 'hidden' }}>

        {/* Profile card */}
        <div style={{
          margin: '0 16px 20px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '24px',
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 0 20px rgba(45,212,191,0.5)',
          }}>
            👑
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}>אופיר (הכלה)</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '3px' }}>Rhodes Bachelorette 2024 ✨</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
            {[['8', 'חברות'], ['3', 'ימים'], ['24+', 'תמונות']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ color: '#2dd4bf', fontWeight: 700, fontSize: '18px' }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuRows.map(({ icon: Icon, label, sub }, i) => (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              width: '100%', cursor: 'pointer',
              animation: `fadeInUp 0.5s ease ${i * 0.06}s both`,
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px',
                background: 'rgba(45,212,191,0.15)',
                border: '1px solid rgba(45,212,191,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color="#2dd4bf" />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{label}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{sub}</div>
              </div>
            </button>
          ))}

          {/* Sign out */}
          <button onClick={handleSignOut} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px', marginTop: '8px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '16px', width: '100%', cursor: 'pointer',
            color: '#f87171', fontSize: '14px', fontWeight: 600,
          }}>
            <LogOut size={16} />
            יציאה מהחשבון
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
