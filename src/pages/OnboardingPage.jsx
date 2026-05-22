import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MapPin, Calendar, Users } from 'lucide-react'
import { useTrip } from '../context/TripContext'
import bgImg from '../assets/background.png'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { createTrip } = useTrip()

  const [brideName,        setBrideName]        = useState('')
  const [destination,      setDestination]      = useState('Rhodes, Greece')
  const [startDate,        setStartDate]        = useState('2026-06-06')
  const [endDate,          setEndDate]          = useState('2026-06-09')
  const [estimatedGuests,  setEstimatedGuests]  = useState('')
  const [loading,          setLoading]          = useState(false)

  async function handleCreate() {
    if (!brideName.trim()) return
    setLoading(true)
    createTrip({
      brideName: brideName.trim(),
      name: `מסיבת הרווקות של ${brideName.trim()}`,
      destination: destination.trim() || 'Rhodes, Greece',
      startDate,
      endDate,
      estimatedGuests: estimatedGuests ? parseInt(estimatedGuests) : null,
    })
    setLoading(false)
    navigate('/schedule')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Overlays */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(160deg, rgba(0,20,50,0.65) 0%, rgba(0,8,25,0.82) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 60% 20%, rgba(142,235,255,0.08) 0%, transparent 55%)' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '0', overflowY: 'auto', maxHeight: '100dvh' }}>

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
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontFamily: '"Assistant", sans-serif' }}>
            צרי את סוף השבוע שלך ✨
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

          {/* Bride name */}
          <FormField
            icon="👑"
            label="שם הכלה"
            placeholder="מה השם שלך?"
            value={brideName}
            onChange={setBrideName}
            required
          />

          {/* Destination */}
          <FormField
            icon={<MapPin size={16} color="#8EEBFF" />}
            label="יעד"
            placeholder="Rhodes, Greece"
            value={destination}
            onChange={setDestination}
          />

          {/* Date row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <FieldLabel icon={<Calendar size={14} color="#8EEBFF" />} label="תאריך התחלה" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel icon={<Calendar size={14} color="#8EEBFF" />} label="תאריך סיום" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Guest count */}
          <FormField
            icon={<Users size={16} color="#8EEBFF" />}
            label="כמה חברות? (אופציונלי)"
            placeholder="מספר משוער"
            value={estimatedGuests}
            onChange={setEstimatedGuests}
            type="number"
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleCreate}
          disabled={!brideName.trim() || loading}
          style={{
            marginTop: '22px',
            padding: '18px',
            background: brideName.trim()
              ? 'linear-gradient(135deg, rgba(142,235,255,0.45) 0%, rgba(14,165,233,0.6) 100%)'
              : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '999px',
            color: '#fff',
            fontSize: '17px', fontWeight: 700,
            letterSpacing: '0.3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: brideName.trim() ? '0 12px 36px rgba(142,235,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            cursor: brideName.trim() ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            animation: 'fadeInUp 0.7s ease 0.25s both',
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
      <span style={{ fontSize: '14px', lineHeight: 1 }}>
        {typeof icon === 'string' ? icon : null}
      </span>
      {typeof icon !== 'string' && icon}
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>{label}</span>
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

const inputStyle = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '14px', color: '#fff', fontSize: '15px',
  outline: 'none', direction: 'rtl',
  fontFamily: '"Assistant", sans-serif',
  boxSizing: 'border-box',
}
