import React, { useState } from 'react'
import { Settings, LogOut, Crown, Bell, Shield, HelpCircle, Users, Copy, MessageCircle, ChevronLeft, Check, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../components/AuthGate'
import { useTrip } from '../context/EventContext'
import bgImg from '../assets/background.png'

const COLORS = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa','#e879f9','#fbbf24']
function colorFor(userId = '') {
  let h = 0
  for (const c of userId) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { activeTrip, currentMember, members, isOwner, isGuest, createInvite, allEvents } = useTrip()

  const [inviteModal, setInviteModal]   = useState(false)
  const [currentInvite, setCurrentInvite] = useState(null)
  const [copied, setCopied]             = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  function openInviteModal() {
    const invite = createInvite()
    setCurrentInvite(invite)
    setInviteModal(true)
    setCopied(false)
  }

  const inviteLink = currentInvite
    ? `${window.location.origin}/invite/${currentInvite.token}`
    : ''

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `הוזמנת למסיבת הרווקות של ${activeTrip?.bride_name}! 🥂\nהצטרפי כאן: ${inviteLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function shareNative() {
    if (!navigator.share) return
    navigator.share({
      title: 'הזמנה למסיבת רווקות ✨',
      text: `הוזמנת למסיבת הרווקות של ${activeTrip?.bride_name}!`,
      url: inviteLink,
    })
  }

  const guestCount  = members.filter(m => m.role === 'guest').length
  const ownerMember = members.find(m => m.role === 'owner')

  const menuRows = [
    { icon: Bell,        label: 'התראות',       sub: 'ניהול עדכונים' },
    { icon: Shield,      label: 'פרטיות',        sub: 'הגדרות חשבון' },
    { icon: HelpCircle,  label: 'עזרה ותמיכה',  sub: 'שאלות נפוצות' },
    { icon: Settings,    label: 'הגדרות',        sub: 'שפה ועיצוב' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.55) 0%, rgba(0,8,25,0.72) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '108px', overflow: 'hidden' }}>

        {/* ── Profile card ── */}
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '24px',
          padding: '22px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          textAlign: 'center',
        }}>
          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: isOwner
              ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)'
              : colorFor(currentMember?.user_id || ''),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: isOwner ? '0 0 22px rgba(142,235,255,0.5)' : '0 0 16px rgba(255,255,255,0.15)',
          }}>
            {isOwner ? '👑' : (currentMember?.display_name?.[0] || '✨')}
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}>
              {currentMember?.display_name || 'אורחת'}
              {isOwner && <span style={{ color: '#8EEBFF', fontSize: '13px', marginRight: '6px' }}>• הכלה</span>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '3px' }}>
              {activeTrip?.name || 'מסיבת הרווקות'} ✨
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
            {[
              [members.length.toString(), 'משתתפות'],
              [activeTrip ? daysBetween(activeTrip.start_date, activeTrip.end_date) : '–', 'ימים'],
            ].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ color: '#8EEBFF', fontWeight: 700, fontSize: '20px' }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* ── OWNER SECTIONS ── */}
          {isOwner && (
            <>
              {/* Trip details */}
              <SectionHeader icon="🗓️" title="פרטי האירוע" />
              <InfoCard>
                <InfoRow label="יעד"   value={activeTrip?.destination} />
                <InfoRow label="תאריכים" value={activeTrip ? formatRange(activeTrip.start_date, activeTrip.end_date) : ''} />
                <InfoRow label="שם האירוע" value={activeTrip?.name} />
              </InfoCard>

              {/* Member management */}
              <SectionHeader icon="👯‍♀️" title="ניהול חברות" />
              <div style={glassCard}>
                {members.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 0',
                    borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: m.role === 'owner' ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)' : colorFor(m.user_id),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 700, color: '#fff',
                    }}>
                      {m.role === 'owner' ? '👑' : m.display_name?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{m.display_name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                        {m.role === 'owner' ? 'הכלה 👑' : 'חברה • הצטרפה ' + shortDate(m.joined_at)}
                      </div>
                    </div>
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => navigate(`/chat/private/${m.user_id}`)}
                        style={{
                          background: 'rgba(142,235,255,0.15)',
                          border: '1px solid rgba(142,235,255,0.25)',
                          borderRadius: '10px', padding: '6px 10px',
                          color: '#8EEBFF', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <MessageCircle size={12} />
                        צ׳אט
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite */}
              <button onClick={openInviteModal} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(142,235,255,0.25) 0%, rgba(14,165,233,0.35) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(142,235,255,0.35)',
                borderRadius: '18px', width: '100%', cursor: 'pointer',
                color: '#8EEBFF', fontSize: '15px', fontWeight: 700,
                boxShadow: '0 6px 20px rgba(142,235,255,0.15)',
              }}>
                <Plus size={18} />
                הזמיני חברה ✨
              </button>
            </>
          )}

          {/* ── GUEST SECTIONS ── */}
          {isGuest && (
            <>
              <SectionHeader icon="💌" title="שיחות" />
              {ownerMember && (
                <button
                  onClick={() => navigate(`/chat/private/${ownerMember.user_id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px', width: '100%', cursor: 'pointer',
                    animation: 'fadeInUp 0.5s ease both',
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0,
                  }}>👑</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                      שלחי הודעה ל{ownerMember.display_name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>
                      שיחה פרטית עם הכלה 💌
                    </div>
                  </div>
                  <ChevronLeft size={16} color="rgba(255,255,255,0.4)" />
                </button>
              )}
            </>
          )}

          {/* ── Common settings ── */}
          <SectionHeader icon="⚙️" title="הגדרות" />
          {menuRows.map(({ icon: Icon, label, sub }, i) => (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px', width: '100%', cursor: 'pointer',
              animation: `fadeInUp 0.5s ease ${i * 0.06}s both`,
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px',
                background: 'rgba(142,235,255,0.1)',
                border: '1px solid rgba(142,235,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color="#8EEBFF" />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{label}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{sub}</div>
              </div>
            </button>
          ))}

          {/* Switch event (if multiple) */}
          {allEvents.length > 1 && (
            <button onClick={() => navigate('/events')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px',
              background: 'rgba(142,235,255,0.08)',
              border: '1px solid rgba(142,235,255,0.2)',
              borderRadius: '16px', width: '100%', cursor: 'pointer',
              color: '#8EEBFF', fontSize: '14px', fontWeight: 600,
              fontFamily: '"Assistant", sans-serif', direction: 'rtl',
            }}>
              <RefreshCw size={15} />
              החלפת אירוע
            </button>
          )}

          {/* Sign out */}
          <button onClick={handleSignOut} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px', marginTop: '8px',
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: '16px', width: '100%', cursor: 'pointer',
            color: '#f87171', fontSize: '14px', fontWeight: 600,
          }}>
            <LogOut size={16} />
            יציאה מהחשבון
          </button>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {inviteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,5,20,0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 20px',
          animation: 'fadeInUp 0.25s ease forwards',
        }} onClick={e => { if (e.target === e.currentTarget) setInviteModal(false) }}>
          <div style={{
            background: 'rgba(10,20,45,0.88)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '28px 28px 20px 20px',
            padding: '28px 22px',
            width: '100%', maxWidth: '420px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.4)',
          }}>
            {/* Drag handle */}
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '-10px auto 0' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✨</div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                הזמיני חברה לסופ״ש
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: 1.5 }}>
                שלחי לה קישור אישי והיא תצטרף לאפליקציה
              </p>
            </div>

            {/* Link preview */}
            <div style={{
              background: 'rgba(142,235,255,0.08)',
              border: '1px solid rgba(142,235,255,0.2)',
              borderRadius: '14px', padding: '12px 14px',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>
                קישור הזמנה
              </div>
              <div style={{ color: '#8EEBFF', fontSize: '13px', direction: 'ltr', wordBreak: 'break-all' }}>
                {inviteLink}
              </div>
            </div>

            {/* Copy */}
            <button onClick={copyLink} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px',
              background: copied
                ? 'rgba(45,212,191,0.2)'
                : 'linear-gradient(135deg, rgba(142,235,255,0.3) 0%, rgba(14,165,233,0.4) 100%)',
              border: '1px solid rgba(142,235,255,0.4)',
              borderRadius: '16px', color: copied ? '#2dd4bf' : '#fff',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.25s',
            }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'הקישור הועתק ✨' : 'העתיקי קישור'}
            </button>

            {/* WhatsApp */}
            <button onClick={shareWhatsApp} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '14px',
              background: 'rgba(37,211,102,0.15)',
              border: '1px solid rgba(37,211,102,0.3)',
              borderRadius: '16px', color: '#25d366',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              שתפי ב-WhatsApp
            </button>

            {/* Native share (if available) */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button onClick={shareNative} style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px', color: 'rgba(255,255,255,0.65)',
                fontSize: '14px', cursor: 'pointer',
              }}>
                שיתוף נוסף...
              </button>
            )}

            <button onClick={() => setInviteModal(false)} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: '13px',
              cursor: 'pointer', paddingTop: '4px',
            }}>
              סגירה
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 4px 2px' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
        {title.toUpperCase()}
      </span>
    </div>
  )
}

const glassCard = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '18px',
  padding: '4px 14px',
}

function InfoCard({ children }) {
  return <div style={glassCard}>{children}</div>
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ color: '#fff', fontSize: '14px' }}>{value}</span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{label}</span>
    </div>
  )
}

function daysBetween(a, b) {
  if (!a || !b) return '–'
  const diff = Math.round((new Date(b) - new Date(a)) / 86400000)
  return String(diff)
}

function formatRange(start, end) {
  if (!start) return ''
  const fmt = d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

function shortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
}
