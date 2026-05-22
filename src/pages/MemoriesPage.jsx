import React from 'react'
import { Camera, Heart } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'
import { memories, participants } from '../data/mockData'
import bgImg from '../assets/background.png'

export default function MemoriesPage() {
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
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🖼️</div>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0 }}>זיכרונות מהטיול</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '3px' }}>הרגעים הכי יפים שלנו ✨</p>
        </div>

        {/* Upload button */}
        <button style={{
          margin: '0 16px 16px',
          padding: '14px',
          background: 'rgba(45,212,191,0.15)',
          backdropFilter: 'blur(12px)',
          border: '2px dashed rgba(45,212,191,0.4)',
          borderRadius: '18px',
          color: '#2dd4bf',
          fontSize: '14px', fontWeight: 600,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Camera size={18} />
          העלי תמונה מהטיול
        </button>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {memories.map((mem, i) => (
              <div key={mem.id} style={{
                aspectRatio: '1',
                background: `linear-gradient(135deg, ${mem.color}44, ${mem.color}22)`,
                border: `1px solid ${mem.color}44`,
                borderRadius: '18px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                animation: `fadeInUp 0.5s ease ${i * 0.07}s both`,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '6px' }}>{mem.emoji}</div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '12px', textAlign: 'center', padding: '0 8px' }}>{mem.caption}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '3px' }}>{mem.day}</div>

                {/* Heart */}
                <button style={{
                  position: 'absolute', top: '8px', left: '8px',
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <Heart size={13} color="rgba(255,255,255,0.7)" />
                </button>
              </div>
            ))}

            {/* Add more placeholder */}
            <div style={{
              aspectRatio: '1',
              background: 'rgba(255,255,255,0.05)',
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: '18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.3)', gap: '6px',
            }}>
              <Camera size={24} />
              <span style={{ fontSize: '11px' }}>הוסיפי תמונה</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
