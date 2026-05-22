import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, MessageCircle, MapPin, Image, User } from 'lucide-react'

const tabs = [
  { icon: Calendar,      label: 'לו״ז',     path: '/schedule' },
  { icon: MessageCircle, label: 'צ׳אט',     path: '/chat'     },
  { icon: MapPin,        label: 'מקומות',   path: '/places'   },
  { icon: Image,         label: 'זיכרונות', path: '/memories' },
  { icon: User,          label: 'פרופיל',   path: '/profile'  },
]

export default function BottomNav() {
  const navigate       = useNavigate()
  const { pathname }   = useLocation()
  const [pressed, setPressed] = useState(null)

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '91%',
      maxWidth: '420px',
      height: '76px',
      zIndex: 200,

      /* Pill shape */
      borderRadius: '999px',

      /* Glassmorphism */
      background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%)',
      backdropFilter: 'blur(30px) saturate(180%)',
      WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: `
        0 8px 32px rgba(0,0,0,0.18),
        inset 0 1px 1px rgba(255,255,255,0.32),
        0 0 28px rgba(125,240,255,0.10)
      `,

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 10px',
    }}>
      {tabs.map(({ icon: Icon, label, path }) => {
        const active      = pathname === path || (pathname === '/' && path === '/schedule')
        const isPressed   = pressed === path

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            onPointerDown={() => setPressed(path)}
            onPointerUp={() => setPressed(null)}
            onPointerLeave={() => setPressed(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              flex: 1,
              height: '100%',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              transform: isPressed ? 'scale(0.88)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Icon container */}
            <div style={{
              width: active ? '46px' : '36px',
              height: active ? '36px' : '28px',
              borderRadius: active ? '14px' : '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.28s cubic-bezier(0.34,1.4,0.64,1)',

              ...(active ? {
                background: 'linear-gradient(180deg, #8EEBFF 0%, #65DDF8 100%)',
                boxShadow: `
                  0 0 18px rgba(125,240,255,0.55),
                  0 4px 12px rgba(101,221,248,0.35),
                  inset 0 1px 1px rgba(255,255,255,0.45)
                `,
              } : {
                background: 'transparent',
                boxShadow: 'none',
              }),
            }}>
              <Icon
                size={active ? 20 : 22}
                strokeWidth={active ? 2.2 : 1.6}
                color={active ? '#fff' : 'rgba(255,255,255,0.72)'}
                style={{ transition: 'all 0.25s ease' }}
              />
            </div>

            {/* Label */}
            <span style={{
              fontSize: '11px',
              fontFamily: '"Assistant", sans-serif',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.2px',
              transition: 'all 0.25s ease',
              color: active
                ? 'rgba(255,255,255,0.97)'
                : 'rgba(255,255,255,0.58)',
              textShadow: active
                ? '0 0 12px rgba(142,235,255,0.6)'
                : 'none',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
