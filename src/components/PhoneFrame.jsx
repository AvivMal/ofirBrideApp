import React from 'react'

export default function PhoneFrame({ children }) {
  return (
    <div className="phone-outer" style={{
      width: '390px',
      height: '844px',
      background: '#0d0d0f',
      borderRadius: '54px',
      padding: '12px',
      boxShadow: `
        0 0 0 1px #2a2a2e,
        0 0 0 3px #1a1a1e,
        0 30px 80px rgba(0,0,0,0.8),
        0 0 60px rgba(0,0,0,0.5),
        inset 0 0 0 1px rgba(255,255,255,0.06)
      `,
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Side buttons */}
      <div style={{
        position: 'absolute', left: '-3px', top: '120px',
        width: '3px', height: '32px', background: '#222', borderRadius: '2px 0 0 2px',
      }} />
      <div style={{
        position: 'absolute', left: '-3px', top: '170px',
        width: '3px', height: '64px', background: '#222', borderRadius: '2px 0 0 2px',
      }} />
      <div style={{
        position: 'absolute', left: '-3px', top: '244px',
        width: '3px', height: '64px', background: '#222', borderRadius: '2px 0 0 2px',
      }} />
      <div style={{
        position: 'absolute', right: '-3px', top: '180px',
        width: '3px', height: '80px', background: '#222', borderRadius: '0 2px 2px 0',
      }} />

      {/* Inner screen area */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '44px',
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
      }}>
        {children}
      </div>
    </div>
  )
}
