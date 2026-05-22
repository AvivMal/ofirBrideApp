import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Phone, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../components/AuthGate'
import * as svc from '../lib/tripService'
import bgImg from '../assets/background.png'

export default function InvitePage() {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const { enterDemo } = useAuth()

  const [inviteData, setInviteData] = useState(null)    // { invite, trip, bride }
  const [invalid,    setInvalid]    = useState(false)
  const [step,       setStep]       = useState('preview') // preview | register
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const data = svc.getInviteByToken(token)
    if (data) {
      setInviteData(data)
    } else {
      setInvalid(true)
    }
  }, [token])

  async function handleJoin() {
    if (!name.trim()) { setError('נא להכניס שם'); return }
    setLoading(true)
    setError('')

    // Generate a stable user ID for this friend
    const userId = 'guest_' + Math.random().toString(36).substr(2, 9)

    // Write the guest member into the trip
    const result = svc.acceptInvite(token, {
      userId,
      displayName: name.trim(),
      email: email.trim() || null,
    })

    if (result.error) {
      setError('אירעה שגיאה. נסי שוב.')
      setLoading(false)
      return
    }

    // Authenticate as demo user with the pre-generated ID
    enterDemo(name.trim(), userId)

    // Navigate after brief delay to let context re-hydrate
    setTimeout(() => navigate('/schedule'), 150)
  }

  const { trip, bride } = inviteData || {}
  const brideInitial    = bride?.display_name?.[0] || '✨'
  const tripDates       = trip ? formatDates(trip.start_date, trip.end_date) : ''

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(160deg, rgba(0,20,50,0.6) 0%, rgba(0,8,25,0.82) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(142,235,255,0.07) 0%, transparent 60%)' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Invalid state */}
        {invalid && (
          <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease forwards' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔗</div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              הקישור לא תקין
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.6 }}>
              הקישור לא תקין או שפג תוקפו.
              <br />
              בבקשה בקשי מהכלה לשלוח קישור חדש.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '14px' }}>
              (במצב דמו, הקישור עובד רק על אותו מכשיר שבו נוצר)
            </p>
            <button onClick={() => navigate('/auth')} style={ctaStyle('#fff', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.2)')}>
              חזרה לדף הכניסה
            </button>
          </div>
        )}

        {/* Preview step */}
        {!invalid && inviteData && step === 'preview' && (
          <div style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
            {/* Glass card */}
            <div style={cardStyle}>
              {/* Bride avatar */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '30px', margin: '0 auto 14px',
                border: '3px solid rgba(255,255,255,0.25)',
                boxShadow: '0 0 24px rgba(142,235,255,0.45)',
              }}>
                {brideInitial}
              </div>

              <h1 style={{ textAlign: 'center', color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
                הוזמנת למסיבת הרווקות של {bride?.display_name || 'הכלה'} ✨
              </h1>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '18px' }}>
                סופ״ש חלומי ב{trip?.destination || 'Rhodes'} מחכה לך 🌊
              </p>

              {/* Trip details */}
              <div style={{
                background: 'rgba(142,235,255,0.1)',
                border: '1px solid rgba(142,235,255,0.2)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                marginBottom: '20px',
              }}>
                <Detail emoji="📍" label={trip?.destination} />
                <Detail emoji="📅" label={tripDates} />
                {trip?.estimated_guests && <Detail emoji="👯‍♀️" label={`${trip.estimated_guests} משתתפות`} />}
              </div>

              <button onClick={() => setStep('register')} style={ctaStyle('#fff', 'linear-gradient(135deg, rgba(142,235,255,0.45) 0%, rgba(14,165,233,0.6) 100%)', 'rgba(255,255,255,0.3)', true)}>
                <Sparkles size={16} />
                הצטרפי לסופ״ש ✨
              </button>
            </div>
          </div>
        )}

        {/* Register step */}
        {!invalid && inviteData && step === 'register' && (
          <div style={{ animation: 'fadeInUp 0.5s ease forwards' }}>
            <div style={cardStyle}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥂</div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                  ספרי לנו עליך
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
                  הכניסי את הפרטים שלך כדי להצטרף
                </p>
              </div>

              {/* Name */}
              <div style={{ marginBottom: '14px' }}>
                <FieldLabel icon={<User size={14} color="#8EEBFF" />} label="איך קוראים לך?" />
                <input
                  placeholder="השם שלך"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <FieldLabel icon={<Mail size={14} color="#8EEBFF" />} label="מייל (אופציונלי)" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ ...inputStyle, direction: 'ltr' }}
                />
              </div>

              {error && (
                <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>
              )}

              <button
                onClick={handleJoin}
                disabled={loading || !name.trim()}
                style={ctaStyle(
                  '#fff',
                  name.trim() ? 'linear-gradient(135deg, rgba(142,235,255,0.45) 0%, rgba(14,165,233,0.6) 100%)' : 'rgba(255,255,255,0.1)',
                  'rgba(255,255,255,0.3)',
                  !!name.trim()
                )}
              >
                <Sparkles size={16} />
                {loading ? 'כניסה...' : 'כניסה לאפליקציה ✨'}
              </button>

              <button onClick={() => setStep('preview')} style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', fontSize: '13px',
                marginTop: '12px', cursor: 'pointer', width: '100%', textAlign: 'center',
              }}>
                חזרה
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ emoji, label }) {
  if (!label) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '16px' }}>{emoji}</span>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{label}</span>
    </div>
  )
}

function FieldLabel({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
      {icon}
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function formatDates(start, end) {
  if (!start) return ''
  const s = new Date(start).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  const e = end ? new Date(end).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' }) : ''
  return e ? `${s} – ${e}` : s
}

function ctaStyle(color, bg, borderColor, shadow = false) {
  return {
    width: '100%', padding: '16px',
    background: bg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    borderRadius: '999px',
    color, fontSize: '16px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: shadow ? '0 10px 32px rgba(142,235,255,0.25)' : 'none',
    cursor: 'pointer', transition: 'all 0.2s',
  }
}

const cardStyle = {
  background: 'rgba(255,255,255,0.10)',
  backdropFilter: 'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '28px',
  padding: '28px 22px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
}

const inputStyle = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '14px', color: '#fff', fontSize: '15px',
  outline: 'none', direction: 'rtl',
  fontFamily: '"Assistant", sans-serif',
  boxSizing: 'border-box',
}
