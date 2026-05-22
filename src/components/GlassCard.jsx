import React from 'react'

export default function GlassCard({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${className}`}
      style={{
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      onMouseEnter={e => {
        if (onClick) e.currentTarget.style.transform = 'scale(1.01)'
      }}
      onMouseLeave={e => {
        if (onClick) e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {children}
    </div>
  )
}
