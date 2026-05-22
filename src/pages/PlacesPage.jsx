import React from 'react'
import { MapPin, Star, Navigation } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'
import { savedPlaces } from '../data/mockData'
import bgImg from '../assets/background.png'

export default function PlacesPage() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.55) 0%, rgba(0,8,25,0.72) 100%)' }} />

      <StatusBar />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '60px', paddingBottom: '80px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '22px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📍</div>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0 }}>מקומות שמורים</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '3px' }}>המקומות הכי שווים ברודוס ✨</p>
        </div>

        {/* Places list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {savedPlaces.map((place, i) => (
            <div key={place.id} style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: `fadeInUp 0.5s ease ${i * 0.07}s both`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {place.emoji}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{place.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>{place.category}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={11} color="#fbbf24" fill="#fbbf24" />
                    <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>{place.rating}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Navigation size={11} color="rgba(255,255,255,0.4)" />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{place.distance}</span>
                  </div>
                </div>
              </div>

              <button style={{
                padding: '7px 12px',
                background: 'rgba(45,212,191,0.2)',
                border: '1px solid rgba(45,212,191,0.35)',
                borderRadius: '12px',
                color: '#2dd4bf', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <MapPin size={11} />
                מפה
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
