import React, { useState } from 'react'
import { Bell, MapPin, ChevronLeft } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { scheduleDays, scheduleItems, participants } from '../data/mockData'
import bgImg from '../assets/background.png'

const iconMap = {
  sun:      '☀️',
  ship:     '⛵',
  wine:     '🍷',
  sparkles: '✨',
  leaf:     '🕊️',
  hotel:    '🏨',
  plane:    '✈️',
  utensils: '🍋',
  sunset:   '🌅',
  star:     '👗',
  coffee:   '🥐',
}

function ParticipantAvatars({ ids, max = 4 }) {
  const shown = ids.slice(0, max)
  const rest  = ids.length - max
  const colors = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa','#e879f9','#fbbf24']

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((id, i) => {
        const p = participants.find(p => p.id === id)
        return (
          <div key={id} style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: colors[i % colors.length],
            border: '2px solid rgba(255,255,255,0.3)',
            marginLeft: i === 0 ? 0 : '-6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', zIndex: shown.length - i,
            flexShrink: 0,
          }}>
            {p ? p.name[0] : '?'}
          </div>
        )
      })}
      {rest > 0 && (
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          marginLeft: '-6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', color: '#fff', fontWeight: 600,
          flexShrink: 0, zIndex: 0,
        }}>
          +{rest}
        </div>
      )}
    </div>
  )
}

export default function SchedulePage() {
  const [activeDay, setActiveDay] = useState('fri')
  const items = scheduleItems[activeDay] || []

  function openMaps(query) {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(query)}`, '_blank')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.55) 0%, rgba(0,8,25,0.72) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,180,100,0.15) 0%, transparent 50%)' }} />


      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '108px', overflow: 'hidden' }}>

        {/* Top header */}
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '22px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* Bride avatar */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 0 16px rgba(45,212,191,0.5)',
          }}>
            👑
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0, lineHeight: 1.3 }}>לו״ז סוף השבוע ברודוס</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>3 ימים בלתי נשכחים יחד ✨</p>
          </div>

          <button style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Bell size={16} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* Day tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 16px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {scheduleDays.map(day => (
            <button
              key={day.value}
              onClick={() => setActiveDay(day.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '16px',
                border: 'none',
                background: activeDay === day.value
                  ? 'linear-gradient(135deg, #2dd4bf, #0ea5e9)'
                  : 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                color: activeDay === day.value ? '#fff' : 'rgba(255,255,255,0.55)',
                fontWeight: activeDay === day.value ? 700 : 400,
                fontSize: '13px',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: activeDay === day.value ? '0 4px 16px rgba(45,212,191,0.4)' : 'none',
                transition: 'all 0.2s',
                textAlign: 'center',
                minWidth: '70px',
              }}
            >
              <div>{day.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{day.date}</div>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
          <div style={{ position: 'relative', paddingRight: '0' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              right: '58px',
              top: 0, bottom: 0,
              width: '2px',
              background: 'linear-gradient(180deg, rgba(45,212,191,0.6) 0%, rgba(45,212,191,0.1) 100%)',
            }} />

            {items.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px',
                animation: `fadeInUp 0.5s ease ${i * 0.07}s both`,
              }}>
                {/* Time label */}
                <div style={{
                  width: '52px',
                  flexShrink: 0,
                  paddingTop: '14px',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, lineHeight: 1.2 }}>
                    {item.time.split(':')[0]}
                    <br />
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{item.time.split(':')[1]}</span>
                  </span>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%) translateX(4px)',
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    background: '#2dd4bf',
                    boxShadow: '0 0 8px rgba(45,212,191,0.8)',
                    marginTop: '6px',
                  }} />
                </div>

                {/* Card */}
                <div style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '18px',
                  padding: '13px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {/* Icon box */}
                  <div style={{
                    width: '44px', height: '44px',
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: '13px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                    {iconMap[item.icon] || item.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', lineHeight: 1.3 }}>{item.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                      <MapPin size={11} color="rgba(255,255,255,0.45)" />
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{item.location}</span>
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ParticipantAvatars ids={item.participants} />
                      <button
                        onClick={() => openMaps(item.maps)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '20px',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          direction: 'ltr',
                        }}
                      >
                        <MapPin size={9} />
                        <span>מפה</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
                אין אירועים ביום זה עדיין ✨
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
