import React from 'react'
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
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '76px',
      background: 'rgba(10,18,35,0.75)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: '1px solid rgba(255,255,255,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px 8px',
      zIndex: 90,
      borderRadius: '0 0 44px 44px',
    }}>
      {tabs.map(({ icon: Icon, label, path }) => {
        const active = pathname === path || (pathname === '/' && path === '/schedule')
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '14px',
              transition: 'all 0.2s ease',
              ...(active ? { background: 'rgba(45,212,191,0.15)' } : {}),
            }}
          >
            <Icon
              size={22}
              color={active ? '#2dd4bf' : 'rgba(255,255,255,0.45)'}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 600 : 400,
              color: active ? '#2dd4bf' : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.3px',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
