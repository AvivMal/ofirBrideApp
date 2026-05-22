import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Crown, Shield, Heart, Plus, Link as LinkIcon, ChevronLeft, LogOut } from 'lucide-react'
import { useEvent } from '../context/EventContext'
import { useAuth } from '../components/AuthGate'
import bgImg from '../assets/background.png'

const roleMeta = {
  owner: { label: 'כלה 👑', color: 'rgba(255,215,80,0.9)', bg: 'rgba(255,215,80,0.15)', Icon: Crown },
  admin: { label: 'מנהלת ⭐', color: 'rgba(142,235,255,0.9)', bg: 'rgba(142,235,255,0.12)', Icon: Shield },
  guest: { label: 'חברה 🩷', color: 'rgba(255,182,193,0.9)', bg: 'rgba(255,182,193,0.12)', Icon: Heart },
}

function gradientForEvent(event, idx) {
  const gradients = [
    'linear-gradient(135deg, rgba(45,212,191,0.5) 0%, rgba(14,165,233,0.6) 100%)',
    'linear-gradient(135deg, rgba(168,85,247,0.5) 0%, rgba(236,72,153,0.5) 100%)',
    'linear-gradient(135deg, rgba(251,146,60,0.5) 0%, rgba(234,179,8,0.5) 100%)',
    'linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.5) 100%)',
  ]
  return gradients[idx % gradients.length]
}

export default function EventSelectionPage() {
  const navigate = useNavigate()
  const { allEvents, switchEvent, loading } = useEvent()
  const { signOut } = useAuth()

  function handleSelectEvent(eventId) {
    switchEvent(eventId)
    navigate('/welcome')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Overlays */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.75) 0%, rgba(0,8,24,0.85) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(142,235,255,0.1) 0%, transparent 55%)' }} />

      {/* Scrollable content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', padding: '60px 20px 40px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeInUp 0.6s ease forwards' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>💍</div>
          <h1 style={{
            fontFamily: '"Assistant", sans-serif',
            fontSize: '26px', fontWeight: 700,
            color: '#fff',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            marginBottom: '10px', direction: 'rtl',
          }}>
            לאיזה אירוע להיכנס?
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '14px',
            fontFamily: '"Assistant", sans-serif', direction: 'rtl',
            lineHeight: 1.5, maxWidth: '280px', margin: '0 auto',
          }}>
            בחרי את מסיבת הרווקות שתרצי לנהל או להצטרף אליה ✨
          </p>
        </div>

        {/* Event cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', paddingTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💫</div>
            <div>טוענת...</div>
          </div>
        ) : allEvents.length === 0 ? (
          <NoEventsView navigate={navigate} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            {allEvents.map(({ event, member }, idx) => {
              const meta = roleMeta[member.role] || roleMeta.guest
              const RoleIcon = meta.Icon
              const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin'
              const destParts = event.destination ? event.destination.split(',') : []
              const city = destParts[0]?.trim() || ''
              const country = destParts[1]?.trim() || ''
              const dateStr = event.start_date && event.end_date
                ? `${formatDate(event.start_date)} – ${formatDate(event.end_date)}`
                : event.start_date ? formatDate(event.start_date) : ''

              return (
                <div
                  key={event.id}
                  style={{
                    background: 'rgba(255,255,255,0.09)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                    animation: `fadeInUp 0.6s ease ${0.1 + idx * 0.1}s both`,
                  }}
                >
                  {/* Cover */}
                  <div style={{
                    height: '100px',
                    background: event.cover_image_url
                      ? `url(${event.cover_image_url}) center/cover`
                      : gradientForEvent(event, idx),
                    position: 'relative',
                    display: 'flex', alignItems: 'flex-end',
                    padding: '12px 18px',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)',
                    }} />
                    {/* Role badge */}
                    <div style={{
                      position: 'absolute', top: '12px', left: '14px',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: meta.bg,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${meta.color}40`,
                      borderRadius: '20px',
                      padding: '4px 10px',
                    }}>
                      <RoleIcon size={12} color={meta.color} />
                      <span style={{ color: meta.color, fontSize: '11px', fontWeight: 600, fontFamily: '"Assistant", sans-serif' }}>
                        {meta.label}
                      </span>
                    </div>
                    {isOwnerOrAdmin && (
                      <div style={{
                        position: 'absolute', top: '12px', right: '14px',
                        background: 'rgba(45,212,191,0.15)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(45,212,191,0.3)',
                        borderRadius: '20px',
                        padding: '4px 10px',
                      }}>
                        <span style={{ color: 'rgba(45,212,191,0.9)', fontSize: '10px', fontWeight: 600, fontFamily: '"Assistant", sans-serif' }}>
                          יש לך הרשאות ניהול
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '18px 18px 20px' }}>
                    <div style={{ direction: 'rtl', marginBottom: '14px' }}>
                      <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: '"Assistant", sans-serif', marginBottom: '4px' }}>
                        {event.bride_name ? `מסיבת הרווקות של ${event.bride_name}` : event.name}
                      </div>
                      {event.name && event.bride_name && event.name !== `מסיבת הרווקות של ${event.bride_name}` && (
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: '"Assistant", sans-serif', marginBottom: '6px' }}>
                          {event.name}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                        {city && (
                          <span style={{ color: 'rgba(142,235,255,0.85)', fontSize: '13px', fontFamily: '"Assistant", sans-serif' }}>
                            📍 {city}{country ? `, ${country}` : ''}
                          </span>
                        )}
                        {dateStr && (
                          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontFamily: '"Assistant", sans-serif' }}>
                            📅 {dateStr}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectEvent(event.id)}
                      style={{
                        width: '100%', padding: '14px',
                        background: 'linear-gradient(135deg, rgba(45,212,191,0.4) 0%, rgba(14,165,233,0.5) 100%)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: '16px',
                        color: '#fff', fontSize: '15px', fontWeight: 700,
                        fontFamily: '"Assistant", sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(45,212,191,0.25)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(45,212,191,0.35)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,212,191,0.25)' }}
                    >
                      <Sparkles size={16} />
                      כניסה לאירוע
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create new event CTA */}
        {allEvents.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => navigate('/create-event')}
              style={{
                width: '100%', padding: '15px',
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
                border: '1px dashed rgba(255,255,255,0.25)',
                borderRadius: '20px',
                color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600,
                fontFamily: '"Assistant", sans-serif', direction: 'rtl',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              צרי אירוע חדש
            </button>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '13px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            color: 'rgba(255,255,255,0.4)', fontSize: '13px',
            fontFamily: '"Assistant", sans-serif', direction: 'rtl',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} />
          התנתקי
        </button>
      </div>
    </div>
  )
}

function NoEventsView({ navigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '14px', fontFamily: '"Assistant", sans-serif', direction: 'rtl', marginBottom: '8px' }}>
        עדיין אין לך אירועים 🌸
      </p>
      <button
        onClick={() => navigate('/create-event')}
        style={ctaCardStyle('rgba(45,212,191,0.2)', 'rgba(45,212,191,0.35)')}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💍</div>
        <div style={{ color: '#fff', fontSize: '17px', fontWeight: 700, fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>צרי מסיבת רווקות</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontFamily: '"Assistant", sans-serif', direction: 'rtl', marginTop: '4px' }}>את הכלה? התחילי כאן</div>
      </button>
      <button
        onClick={() => navigate('/invite/join')}
        style={ctaCardStyle('rgba(168,85,247,0.15)', 'rgba(168,85,247,0.3)')}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔗</div>
        <div style={{ color: '#fff', fontSize: '17px', fontWeight: 700, fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>הצטרפי עם קישור הזמנה</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontFamily: '"Assistant", sans-serif', direction: 'rtl', marginTop: '4px' }}>קיבלת קישור מהכלה? לחצי כאן</div>
      </button>
    </div>
  )
}

function ctaCardStyle(bg, border) {
  return {
    width: '100%', padding: '28px 20px',
    background: bg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${border}`,
    borderRadius: '28px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease',
  }
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}
