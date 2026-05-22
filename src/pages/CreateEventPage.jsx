import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MapPin, Calendar, Users, ArrowRight } from 'lucide-react'
import { useEvent } from '../context/EventContext'
import bgImg from '../assets/background.png'

const inputStyle = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '14px', color: '#fff', fontSize: '15px',
  outline: 'none', direction: 'rtl',
  fontFamily: '"Assistant", sans-serif',
  boxSizing: 'border-box',
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { createEvent, allEvents } = useEvent()

  const [brideName,       setBrideName]       = useState('')
  const [eventName,       setEventName]       = useState('')
  const [destination,     setDestination]     = useState('')
  const [startDate,       setStartDate]       = useState('')
  const [endDate,         setEndDate]         = useState('')
  const [estimatedGuests, setEstimatedGuests] = useState('')
  const [loading,         setLoading]         = useState(false)

  async function handleCreate() {
    if (!brideName.trim()) return
    setLoading(true)
    createEvent({
      brideName:       brideName.trim(),
      eventName:       eventName.trim() || `מסיבת הרווקות של ${brideName.trim()}`,
      destination:     destination.trim(),
      startDate,
      endDate,
      estimatedGuests: estimatedGuests ? parseInt(estimatedGuests) : null,
    })
    setLoading(false)
    navigate('/welcome')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(160deg, rgba(0,20,50,0.65) 0%, rgba(0,8,25,0.82) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 60% 20%, rgba(142,235,255,0.08) 0%, transparent 55%)' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '32px 20px 40px', display: 'flex', flexDirection: 'column', gap: '0', overflowY: 'auto', maxHeight: '100dvh' }}>

        {/* Back button (only if has events already) */}
        {allEvents.length > 0 && (
          <button
            onClick={() => navigate('/events')}
            style={{
              alignSelf: 'flex-start', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px', padding: '8px 14px',
              color: 'rgba(255,255,255,0.7)', fontSize: '13px',
              fontFamily: '"Assistant", sans-serif', cursor: 'pointer', direction: 'rtl',
            }}
          >
            <ArrowRight size={14} />
            חזרה לאירועים
          </button>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px', animation: 'fadeInUp 0.6s ease forwards' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>💍</div>
          <h1 style={{
            fontFamily: '"Great Vibes", cursive',
            fontSize: '46px', fontWeight: 400,
            color: '#fff', lineHeight: 1.2,
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            marginBottom: '8px', direction: 'ltr',
          }}>
            Create Your Weekend
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>
            צרי את מסיבת הרווקות שלך ✨
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '28px',
          padding: '28px 22px',
          display: 'flex', flexDirection: 'column', gap: '18px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
          animation: 'fadeInUp 0.7s ease 0.1s both',
        }}>
          <FormField icon="👑" label="שם הכלה *" placeholder="מה השם של הכלה?" value={brideName} onChange={setBrideName} required />
          <FormField icon="✨" label="שם האירוע (אופציונלי)" placeholder={`מסיבת הרווקות של ${brideName || '...'}`} value={eventName} onChange={setEventName} />
          <FormField icon={<MapPin size={16} color="#8EEBFF" />} label="יעד" placeholder="לדוגמה: Rhodes, Greece" value={destination} onChange={setDestination} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <FieldLabel icon={<Calendar size={14} color="#8EEBFF" />} label="תאריך התחלה" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel icon={<Calendar size={14} color="#8EEBFF" />} label="תאריך סיום" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <FormField icon={<Users size={16} color="#8EEBFF" />} label="כמה חברות? (אופציונלי)" placeholder="מספר משוער" value={estimatedGuests} onChange={setEstimatedGuests} type="number" />
        </div>

        {/* CTA */}
        <button
          onClick={handleCreate}
          disabled={!brideName.trim() || loading}
          style={{
            marginTop: '22px', padding: '18px',
            background: brideName.trim()
              ? 'linear-gradient(135deg, rgba(142,235,255,0.45) 0%, rgba(14,165,233,0.6) 100%)'
              : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '999px', color: '#fff',
            fontSize: '17px', fontWeight: 700, letterSpacing: '0.3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: brideName.trim() ? '0 12px 36px rgba(142,235,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            cursor: brideName.trim() && !loading ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            animation: 'fadeInUp 0.7s ease 0.25s both',
            fontFamily: '"Assistant", sans-serif',
          }}
        >
          <Sparkles size={18} />
          {loading ? 'יוצרת...' : 'צרי מסיבת רווקות'}
        </button>
      </div>
    </div>
  )
}

function FieldLabel({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
      {typeof icon === 'string' ? <span style={{ fontSize: '14px' }}>{icon}</span> : icon}
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, fontFamily: '"Assistant", sans-serif' }}>{label}</span>
    </div>
  )
}

function FormField({ icon, label, placeholder, value, onChange, required, type = 'text' }) {
  return (
    <div>
      <FieldLabel icon={icon} label={label} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={inputStyle}
      />
    </div>
  )
}
