import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, ArrowRight, Eye, Sparkles } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { useAuth } from '../components/AuthGate'
import {
  signInWithEmailOtp,
  signInWithPhoneOtp,
  signInWithGoogle,
  verifyOtp,
  isDemoMode,
} from '../lib/supabase'
import bgImg from '../assets/background.png'

export default function AuthPage() {
  const navigate   = useNavigate()
  const { enterDemo } = useAuth()
  const [tab, setTab]         = useState('email') // email | phone
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [step, setStep]       = useState('input') // input | verify
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')

  async function handleSend() {
    setLoading(true)
    setMsg('')
    let res
    if (tab === 'email') res = await signInWithEmailOtp(email)
    else                 res = await signInWithPhoneOtp(phone)

    if (res.demo) {
      setMsg('מצב דמו – לא נשלחה הודעה אמיתית. לחצי אישור למעבר לאפליקציה.')
      setStep('verify')
    } else if (res.error) {
      setMsg('שגיאה: ' + res.error.message)
    } else {
      setMsg('קוד נשלח! בדקי את ' + (tab === 'email' ? 'המייל' : 'הטלפון') + ' שלך.')
      setStep('verify')
    }
    setLoading(false)
  }

  async function handleVerify() {
    setLoading(true)
    const res = await verifyOtp({
      email: tab === 'email' ? email : undefined,
      phone: tab === 'phone' ? phone : undefined,
      token: otp,
      type:  tab === 'email' ? 'email' : 'sms',
    })
    if (res.demo || res.data?.session) {
      enterDemo()
      navigate('/welcome')
    } else {
      setMsg('קוד שגוי. נסי שוב.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    const res = await signInWithGoogle()
    if (res.demo) { enterDemo(); navigate('/welcome') }
  }

  function handleDemoEnter() {
    enterDemo()
    navigate('/welcome')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(160deg, rgba(0,30,60,0.6) 0%, rgba(0,10,30,0.75) 100%)' }} />

      <StatusBar />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '80px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '36px', marginBottom: '6px' }}>💍</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: 400, color: '#fff', letterSpacing: '0.5px', textShadow: '0 4px 20px rgba(0,0,0,0.5)', marginBottom: '6px' }}>
            Rhodes Bachelorette
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px' }}>ברוכה הבאה לסוף שבוע האגדה ✨</p>
        </div>

        {/* Demo banner */}
        {isDemoMode && (
          <div style={{
            background: 'rgba(45,212,191,0.15)',
            border: '1px solid rgba(45,212,191,0.4)',
            borderRadius: '14px', padding: '12px 16px',
            color: '#2dd4bf', fontSize: '13px', textAlign: 'center', lineHeight: 1.5,
          }}>
            <Sparkles size={14} style={{ display: 'inline', marginLeft: '6px' }} />
            מצב דמו פעיל – הכנסי ישירות לאפליקציה
          </div>
        )}

        {/* Glass auth card */}
        <div className="glass-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {step === 'input' ? (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px' }}>
                {['email','phone'].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex: 1, padding: '8px', borderRadius: '9px', border: 'none',
                    background: tab === t ? 'rgba(45,212,191,0.3)' : 'transparent',
                    color: tab === t ? '#2dd4bf' : 'rgba(255,255,255,0.5)',
                    fontWeight: tab === t ? 600 : 400, fontSize: '14px',
                    transition: 'all 0.2s',
                  }}>
                    {t === 'email' ? '📧 מייל' : '📱 טלפון'}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                  {tab === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                </div>
                <input
                  type={tab === 'email' ? 'email' : 'tel'}
                  placeholder={tab === 'email' ? 'כתובת מייל שלך' : 'מספר טלפון שלך'}
                  value={tab === 'email' ? email : phone}
                  onChange={e => tab === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 42px 13px 14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '12px', color: '#fff', fontSize: '15px',
                    outline: 'none', direction: tab === 'email' ? 'ltr' : 'rtl',
                    textAlign: 'right',
                  }}
                />
              </div>

              {/* Send OTP button */}
              <button onClick={handleSend} disabled={loading} style={{
                padding: '14px', background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
                border: 'none', borderRadius: '14px', color: '#fff',
                fontWeight: 700, fontSize: '15px', letterSpacing: '0.3px',
                boxShadow: '0 4px 20px rgba(45,212,191,0.4)',
                transition: 'opacity 0.2s',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'שולחת...' : 'שלחי קוד אישור'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>או</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
              </div>

              {/* Google */}
              <button onClick={handleGoogle} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '13px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px',
                color: '#fff', fontSize: '14px', fontWeight: 500,
                transition: 'background 0.2s',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                המשיכי עם Google
              </button>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: '14px', lineHeight: 1.5 }}>
                {msg || 'הכניסי את הקוד שקיבלת'}
              </p>

              {/* OTP inputs */}
              <input
                type="text"
                placeholder="הכניסי קוד 6 ספרות"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                style={{
                  width: '100%', padding: '14px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '12px', color: '#fff', fontSize: '22px',
                  letterSpacing: '8px', outline: 'none', direction: 'ltr',
                }}
              />

              <button onClick={handleVerify} disabled={loading} style={{
                padding: '14px', background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
                border: 'none', borderRadius: '14px', color: '#fff',
                fontWeight: 700, fontSize: '15px',
                boxShadow: '0 4px 20px rgba(45,212,191,0.4)',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'מאמתת...' : 'אישור וכניסה ✨'}
              </button>

              <button onClick={() => setStep('input')} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px',
              }}>
                חזרה
              </button>
            </>
          )}

          {msg && step === 'input' && (
            <p style={{ color: '#2dd4bf', textAlign: 'center', fontSize: '13px' }}>{msg}</p>
          )}
        </div>

        {/* Demo enter */}
        <button onClick={handleDemoEnter} style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '14px', padding: '14px',
          color: 'rgba(255,255,255,0.55)', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Sparkles size={14} />
          כניסה במצב דמו (ללא חיבור)
        </button>
      </div>
    </div>
  )
}
