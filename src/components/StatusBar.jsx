import React from 'react'

export default function StatusBar({ dark = false }) {
  const textColor = dark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)'

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '54px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px 0',
      zIndex: 100,
      direction: 'ltr',
    }}>
      {/* Time */}
      <span style={{ color: textColor, fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px' }}>9:41</span>

      {/* Dynamic island */}
      <div style={{
        width: '120px', height: '34px',
        background: '#000',
        borderRadius: '20px',
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
      }} />

      {/* Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill={textColor}>
          <rect x="0" y="7" width="3" height="5" rx="1"/>
          <rect x="4.5" y="5" width="3" height="7" rx="1"/>
          <rect x="9" y="3" width="3" height="9" rx="1"/>
          <rect x="13.5" y="0" width="3" height="12" rx="1"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill={textColor}/>
          <path d="M3.5 6.5C4.9 5.1 6.4 4.4 8 4.4s3.1.7 4.5 2.1" stroke={textColor} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M1 4C3.1 1.8 5.4.7 8 .7s4.9 1.1 7 3.3" stroke={textColor} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <div style={{
            width: '25px', height: '12px',
            border: `1.5px solid ${textColor}`,
            borderRadius: '3px',
            padding: '2px',
            position: 'relative',
          }}>
            <div style={{ width: '100%', height: '100%', background: textColor, borderRadius: '1px' }} />
          </div>
          <div style={{
            width: '2px', height: '5px',
            background: textColor,
            borderRadius: '0 1px 1px 0',
            opacity: 0.6,
          }} />
        </div>
      </div>
    </div>
  )
}
