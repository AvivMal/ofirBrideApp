import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MessageCircle, MapPin, Image, ChevronLeft, Sparkles } from 'lucide-react'
import bgImg from '../assets/background.png'

const menuItems = [
  { icon: Calendar,      label: 'לוח זמנים',     sub: 'ראה את כל האירועים',    path: '/schedule' },
  { icon: MessageCircle, label: 'צ׳אט קבוצתי',   sub: '8 מחוברות עכשיו ✨',    path: '/chat' },
  { icon: MapPin,        label: 'מקומות שמורים', sub: 'מסעדות, חופים ועוד',    path: '/places' },
  { icon: Image,         label: 'זיכרונות מהטיול', sub: 'התמונות שלנו',         path: '/memories' },
]

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Layered overlays for depth */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,20,50,0.15) 0%, rgba(0,10,30,0.55) 55%, rgba(0,5,20,0.8) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(255,180,100,0.18) 0%, transparent 60%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 70% 80%, rgba(45,212,191,0.12) 0%, transparent 60%)' }} />


      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px 100px' }}>

        {/* Hero Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px', animation: 'fadeInUp 0.8s ease forwards' }}>
          <h1 style={{
            fontFamily: '"Great Vibes", cursive',
            fontSize: '64px',
            fontWeight: 400,
            color: '#fff',
            lineHeight: 1.15,
            textShadow: '0 4px 24px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
            marginBottom: '10px',
            letterSpacing: '1px',
            direction: 'ltr',
          }}>
            Rhodes<br />Bachelorette
          </h1>
          <p style={{
            fontFamily: '"Assistant", sans-serif',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '15px',
            letterSpacing: '1px',
            fontWeight: 300,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            direction: 'ltr',
          }}>
            The trip begins here ✨
          </p>
        </div>

        {/* Menu card */}
        <div className="glass-card glass-card-fancy" style={{
          position: 'relative',
          padding: '18px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'visible',
          background: 'rgba(255,255,255,0.12)',
        }}>
          <div className="sparkle-dot sparkle-dot--top-right" />
          <div className="sparkle-dot sparkle-dot--bottom-left" />

          {menuItems.map(({ icon: Icon, label, sub, path, emoji }, i) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 18px',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'transform 0.25s ease, background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                animation: `fadeInUp 0.7s ease ${0.1 + i * 0.08}s both`,
                width: '100%',
                textAlign: 'right',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                e.currentTarget.style.transform = 'translateY(0px)'
              }}
            >
              <ChevronLeft size={18} color="rgba(255,255,255,0.55)" style={{ marginRight: 'auto', flexShrink: 0 }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px', lineHeight: 1.3 }}>{label}</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '4px' }}>{sub}</div>
              </div>

              <div style={{
                width: '46px', height: '46px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 10px 24px rgba(45,212,191,0.08)',
              }}>
                <Icon size={20} color="#2dd4bf" strokeWidth={1.8} />
              </div>
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/schedule')}
          style={{
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, rgba(45,212,191,0.45) 0%, rgba(255,255,255,0.2) 38%, rgba(14,165,233,0.55) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: '999px',
            color: '#fff',
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 12px 36px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            animation: 'fadeInUp 0.8s ease 0.5s both, pulse-glow 3s ease-in-out 1.5s infinite',
            cursor: 'pointer',
            direction: 'ltr',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 18px 46px rgba(45,212,191,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0px)'
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          <Sparkles size={18} />
          Enter the Weekend
        </button>
      </div>
    </div>
  )
}
