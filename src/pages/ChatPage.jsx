import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronRight, Paperclip, Image as ImageIcon, Mic, Send, Play, Pause,
  MapPin, X, Square, Pin, Heart, Smile, Trash2, MoreVertical, Plus,
  Calendar, Navigation,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../components/AuthGate'
import { useTrip } from '../context/TripContext'
import * as cs from '../lib/chatService'
import * as svc from '../lib/tripService'
import bgImg from '../assets/background.png'

const COLORS = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa','#e879f9','#fbbf24']
function colorFor(uid = '') {
  let h = 0
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}
function fmtTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
function fmtMsgTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}
async function compressImage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      const ratio = Math.min(1, MAX / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.src = dataUrl
  })
}
function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ member, name, size = 32 }) {
  const displayName = member?.display_name || name || '?'
  const isOwner = member?.role === 'owner'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isOwner ? 'linear-gradient(135deg,#8EEBFF,#65DDF8)' : colorFor(member?.user_id || name || ''),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, color: '#fff', fontWeight: 700,
      border: '2px solid rgba(255,255,255,0.25)',
    }}>
      {isOwner ? '👑' : (displayName[0] || '?')}
    </div>
  )
}

// ── Voice player ──────────────────────────────────────────────────────────────
function VoiceMessage({ msg, isMe }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const audioRef = useRef(null)
  const audioUrl = msg.metadata?.audioDataUrl || msg.audio_url

  useEffect(() => {
    if (!audioUrl) return
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.oncanplaythrough = () => setLoaded(true)
    audio.onended = () => { setPlaying(false); setProgress(0) }
    audio.ontimeupdate = () => { if (audio.duration) setProgress(audio.currentTime / audio.duration) }
    return () => { audio.pause(); audioRef.current = null }
  }, [audioUrl])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    playing ? (a.pause(), setPlaying(false)) : (a.play(), setPlaying(true))
  }

  const duration = msg.metadata?.durationSec || msg.duration || 0
  const accent = isMe ? '#8EEBFF' : '#fff'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', width: '220px',
      background: isMe ? 'rgba(142,235,255,0.15)' : 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(14px)',
      border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.18)',
      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    }}>
      <button onClick={toggle} disabled={!loaded && !audioUrl} style={{
        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
        background: playing ? 'rgba(239,68,68,0.25)' : 'rgba(142,235,255,0.2)',
        border: `1px solid ${playing ? 'rgba(239,68,68,0.4)' : 'rgba(142,235,255,0.35)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
        {playing ? <Pause size={14} color="#f87171" /> : <Play size={14} color={accent} />}
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', direction: 'ltr', overflow: 'hidden' }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const filled = (i / 28) <= progress
          const h = 4 + Math.abs(Math.sin(i * 0.65 + 1.2)) * 14
          return <div key={i} style={{ width: '2px', flexShrink: 0, height: `${h}px`, borderRadius: '1px', background: filled ? (isMe ? 'rgba(142,235,255,0.9)' : 'rgba(255,255,255,0.85)') : (isMe ? 'rgba(142,235,255,0.28)' : 'rgba(255,255,255,0.22)'), transition: 'background 0.1s' }} />
        })}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', flexShrink: 0, direction: 'ltr' }}>{fmtTime(duration)}</span>
    </div>
  )
}

// ── Photo message ─────────────────────────────────────────────────────────────
function PhotoMessage({ msg, isMe }) {
  const [lightbox, setLightbox] = useState(null)
  const images = msg.metadata?.images || (msg.image_url ? [{ url: msg.image_url }] : [])

  return (
    <>
      <div style={{
        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        overflow: 'hidden', maxWidth: '230px',
        border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}>
        {images.length === 1 ? (
          <img src={images[0].url} alt="" onClick={() => setLightbox(images[0].url)} style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover', cursor: 'zoom-in' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2px' }}>
            {images.map((img, i) => (
              <img key={i} src={img.url} alt="" onClick={() => setLightbox(img.url)} style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'zoom-in' }} />
            ))}
          </div>
        )}
        {msg.body && <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{msg.body}</div>}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 501 }}>
            <X size={18} color="#fff" />
          </button>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: '12px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

// ── Location card ─────────────────────────────────────────────────────────────
function LocationMessage({ msg, isMe, onSavePlace, canSave }) {
  const meta = msg.metadata || {}
  return (
    <div style={{
      width: '230px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      overflow: 'hidden',
      border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.18)',
      background: isMe ? 'rgba(142,235,255,0.12)' : 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{ height: '90px', background: 'linear-gradient(135deg,#0f4c75,#1a6b9a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>📍</div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{meta.locationName || msg.body || 'מיקום'}</div>
        {meta.address && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '6px' }}>{meta.address}</div>}
        <div style={{ display: 'flex', gap: '6px' }}>
          {meta.mapUrl && (
            <a href={meta.mapUrl} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: '5px', borderRadius: '8px', background: 'rgba(142,235,255,0.2)',
              border: '1px solid rgba(142,235,255,0.35)', color: '#8EEBFF',
              fontSize: '11px', fontWeight: 600, textAlign: 'center', textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              <Navigation size={10} />פתחי במפות
            </a>
          )}
          {canSave && (
            <button onClick={() => onSavePlace?.(meta)} style={{
              flex: 1, padding: '5px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            }}>שמרי</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCardMessage({ msg, isMe, onNavigateSchedule }) {
  const meta = msg.metadata || {}
  const item = meta.item || {}
  return (
    <div style={{
      width: '230px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      overflow: 'hidden',
      border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.18)',
      background: isMe ? 'rgba(142,235,255,0.12)' : 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ color: '#8EEBFF', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>
          {meta.isReminder ? '🔔 תזכורת' : '📅 פעילות'}
        </div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{item.title || meta.title || msg.body}</div>
        {(item.time || item.location_name || meta.subtitle) && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px' }}>
            {item.time && `${item.time} • `}{item.location_name || meta.subtitle}
          </div>
        )}
        <button onClick={onNavigateSchedule} style={{
          padding: '5px 12px', borderRadius: '8px',
          background: 'rgba(142,235,255,0.2)', border: '1px solid rgba(142,235,255,0.35)',
          color: '#8EEBFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
        }}>
          {meta.ctaLabel || 'לו״ז ←'}
        </button>
      </div>
    </div>
  )
}

// ── Quick reactions bar ───────────────────────────────────────────────────────
const QUICK_REACTIONS = ['❤️','😂','😍','🔥','👏','😢']

// ── Message actions sheet ─────────────────────────────────────────────────────
function MessageActionsSheet({ msg, isMe, canPin, canDelete, reactions, onReact, onPin, onDelete, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)' }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(15,25,50,0.96)', backdropFilter: 'blur(28px)',
        borderRadius: '24px 24px 0 0', padding: '20px 20px 32px',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        {/* Quick reactions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          {QUICK_REACTIONS.map(emoji => {
            const myReaction = Object.entries(reactions || {}).find(([, v]) => v === emoji)
            const count = Object.values(reactions || {}).filter(v => v === emoji).length
            return (
              <button key={emoji} onClick={() => { onReact(emoji); onClose() }} style={{
                background: myReaction ? 'rgba(142,235,255,0.2)' : 'rgba(255,255,255,0.08)',
                border: myReaction ? '1px solid rgba(142,235,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '6px 8px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '22px' }}>{emoji}</span>
                {count > 0 && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {canPin && (
            <button onClick={() => { onPin(); onClose() }} style={actionRowStyle}>
              <Pin size={16} color="#8EEBFF" /><span>הצמדי הודעה</span>
            </button>
          )}
          {isMe && canDelete && (
            <button onClick={() => { onDelete(); onClose() }} style={{ ...actionRowStyle, color: '#f87171' }}>
              <Trash2 size={16} color="#f87171" /><span>מחקי הודעה</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
const actionRowStyle = {
  display: 'flex', alignItems: 'center', gap: '12px',
  padding: '13px 16px', borderRadius: '14px', width: '100%', textAlign: 'right',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
}

// ── Attachment menu ───────────────────────────────────────────────────────────
function AttachMenu({ onImage, onLocation, onSchedule, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: '90px', right: '20px',
        background: 'rgba(15,25,50,0.96)', backdropFilter: 'blur(28px)',
        borderRadius: '18px', padding: '8px',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', flexDirection: 'column', gap: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '160px',
      }}>
        {[
          { icon: <ImageIcon size={15} color="#a78bfa" />, label: 'תמונות', action: onImage },
          { icon: <MapPin size={15} color="#2dd4bf" />, label: 'שתפי מיקום', action: onLocation },
          { icon: <Calendar size={15} color="#fb923c" />, label: 'פעילות בלו״ז', action: onSchedule },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={() => { action(); onClose() }} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', width: '100%',
          }}>
            {icon}{label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Send location modal ───────────────────────────────────────────────────────
function SendLocationModal({ onSend, onClose }) {
  const [name, setName] = useState('')
  const [addr, setAddr] = useState('')
  const [url, setUrl]   = useState('')

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'rgba(15,25,50,0.97)', backdropFilter: 'blur(28px)',
        borderRadius: '24px 24px 0 0', padding: '24px 20px 36px',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '16px', textAlign: 'center' }}>📍 שיתוף מיקום</div>
        {[
          { label: 'שם המקום *', value: name, set: setName, placeholder: 'למשל: הבר שלנו' },
          { label: 'כתובת', value: addr, set: setAddr, placeholder: 'כתובת או אזור' },
          { label: 'קישור למפות', value: url, set: setUrl, placeholder: 'https://maps.google.com/...' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} style={{ marginBottom: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>{label}</div>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} style={{
              width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px',
              fontFamily: '"Assistant",sans-serif', outline: 'none', boxSizing: 'border-box',
            }} />
          </div>
        ))}
        <button
          disabled={!name.trim()}
          onClick={() => { if (name.trim()) { onSend({ locationName: name.trim(), address: addr.trim(), mapUrl: url.trim() }); onClose() } }}
          style={{
            width: '100%', padding: '13px', borderRadius: '14px',
            background: name.trim() ? 'linear-gradient(135deg,#8EEBFF,#65DDF8)' : 'rgba(255,255,255,0.1)',
            border: 'none', color: name.trim() ? '#050d1e' : 'rgba(255,255,255,0.3)',
            fontSize: '15px', fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
            marginTop: '4px',
          }}
        >שלחי מיקום</button>
      </div>
    </div>
  )
}

// ── Schedule picker modal ─────────────────────────────────────────────────────
function SchedulePickerModal({ eventId, onSend, onClose }) {
  const days = ['thu','fri','sat','sun']
  const items = days.flatMap(d => svc.getScheduleItemsByDay ? svc.getScheduleItemsByDay(d) : [])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: '60dvh', background: 'rgba(15,25,50,0.97)', backdropFilter: 'blur(28px)',
        borderRadius: '24px 24px 0 0', padding: '20px 20px 36px', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '16px', textAlign: 'center' }}>📅 שיתוף פעילות מהלו״ז</div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '20px 0' }}>אין פעילויות בלו״ז עדיין</div>
        ) : items.map(item => (
          <button key={item.id} onClick={() => { onSend(item); onClose() }} style={{
            width: '100%', display: 'flex', gap: '12px', alignItems: 'center',
            padding: '10px 14px', marginBottom: '6px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer', textAlign: 'right',
          }}>
            <span style={{ fontSize: '20px' }}>{item.emoji || item.icon || '📅'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.title}</div>
              {item.time && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{item.time}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Pinned banner ─────────────────────────────────────────────────────────────
function PinnedBanner({ msg, onNavigateSchedule, canUnpin, onUnpin }) {
  if (!msg) return null
  return (
    <div style={{
      margin: '0 12px 10px',
      background: 'rgba(142,235,255,0.08)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(142,235,255,0.25)', borderRadius: '16px',
      padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'center',
    }}>
      <Pin size={14} color="#8EEBFF" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#8EEBFF', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', marginBottom: '2px' }}>📌 הודעה מוצמדת</div>
        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body || '(תמונה/קול)'}</div>
      </div>
      <button onClick={onNavigateSchedule} style={{ background: 'none', border: 'none', color: '#8EEBFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', padding: 0 }}>לו״ז ←</button>
      {canUnpin && <button onClick={onUnpin} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }}><X size={14} /></button>}
    </div>
  )
}

// ── Reaction chips on a message ───────────────────────────────────────────────
function ReactionChips({ reactions }) {
  if (!reactions || Object.keys(reactions).length === 0) return null
  const counts = {}
  Object.values(reactions).forEach(e => { counts[e] = (counts[e] || 0) + 1 })
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
      {Object.entries(counts).map(([emoji, count]) => (
        <div key={emoji} style={{
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '10px', padding: '2px 7px', fontSize: '12px',
          display: 'flex', alignItems: 'center', gap: '3px',
        }}>
          <span>{emoji}</span>
          {count > 1 && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>{count}</span>}
        </div>
      ))}
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Message({ msg, userId, members, reactions, canPin, canDelete, onReact, onPin, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const navigate = useNavigate()
  const isMe   = msg.sender_user_id === userId
  const member = members.find(m => m.user_id === msg.sender_user_id)

  if (msg.type === 'system') {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0', padding: '0 16px' }}>
        <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
          {msg.body}
        </span>
      </div>
    )
  }

  return (
    <>
      <div
        onContextMenu={e => { e.preventDefault(); setShowActions(true) }}
        style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '8px', marginBottom: '10px', padding: '0 4px', animation: 'fadeInUp 0.3s ease both' }}
      >
        {!isMe && <Avatar member={member} name={msg.sender_display_name} size={30} />}

        <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          {!isMe && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', paddingRight: '4px' }}>
              {msg.sender_display_name}{member?.role === 'owner' ? ' 👑' : ''}
            </span>
          )}

          <div onTouchStart={() => { const t = setTimeout(() => setShowActions(true), 500); return () => clearTimeout(t) }}>
            {msg.type === 'text' && (
              <div style={{
                padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? 'rgba(142,235,255,0.22)' : 'rgba(255,255,255,0.13)',
                backdropFilter: 'blur(14px)',
                border: isMe ? '1px solid rgba(142,235,255,0.35)' : '1px solid rgba(255,255,255,0.18)',
                color: '#fff', fontSize: '14px', lineHeight: 1.5,
              }}>{msg.body}</div>
            )}
            {(msg.type === 'photos' || msg.type === 'photo') && <PhotoMessage msg={msg} isMe={isMe} />}
            {msg.type === 'voice' && <VoiceMessage msg={msg} isMe={isMe} />}
            {msg.type === 'location' && <LocationMessage msg={msg} isMe={isMe} />}
            {msg.type === 'event_card' && <EventCardMessage msg={msg} isMe={isMe} onNavigateSchedule={() => navigate('/schedule')} />}
          </div>

          <ReactionChips reactions={reactions} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', direction: 'ltr' }}>{fmtMsgTime(msg.created_at)}</span>
            {isMe && <span style={{ fontSize: '10px', color: '#8EEBFF' }}>✓✓</span>}
          </div>
        </div>
      </div>

      {showActions && (
        <MessageActionsSheet
          msg={msg} isMe={isMe} canPin={canPin} canDelete={canDelete}
          reactions={reactions}
          onReact={emoji => onReact(msg.id, emoji)}
          onPin={() => onPin(msg.id)}
          onDelete={() => onDelete(msg.id)}
          onClose={() => setShowActions(false)}
        />
      )}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { members, currentMember, activeTrip, role } = useTrip()
  const eventId = activeTrip?.id

  const [messages,     setMessages]     = useState([])
  const [reactions,    setReactions]    = useState({})
  const [pinnedMsg,    setPinnedMsg]    = useState(null)
  const [input,        setInput]        = useState('')
  const [showAttach,   setShowAttach]   = useState(false)
  const [showLocation, setShowLocation] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [isRecording,  setIsRecording]  = useState(false)
  const [recordingSecs,setRecordingSecs]= useState(0)
  const [micError,     setMicError]     = useState(false)

  const imageInputRef    = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const secsRef          = useRef(0)
  const timerRef         = useRef(null)
  const bottomRef        = useRef(null)

  const canPin    = role === 'owner' || role === 'admin'
  const canDelete = role === 'owner' || role === 'admin'

  const reload = useCallback(() => {
    if (!eventId) return
    const msgs = cs.getGroupMessages(eventId, currentMember?.display_name)
    setMessages(msgs)
    const rxMap = {}
    msgs.forEach(m => { rxMap[m.id] = cs.getMessageReactions(eventId, m.id) })
    setReactions(rxMap)
    setPinnedMsg(cs.getPinnedMessage(eventId))
  }, [eventId, currentMember?.display_name])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (eventId && user?.id && messages.length > 0) {
      cs.markGroupSeen(eventId, user.id, messages[messages.length - 1]?.id)
    }
  }, [messages, eventId, user?.id])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }, [])

  function buildSender() {
    return {
      senderId: currentMember?.user_id || user?.id || 'demo',
      senderName: currentMember?.display_name || 'אנונימית',
      senderAvatarUrl: currentMember?.avatar_url || null,
    }
  }

  function send() {
    if (!input.trim() || !eventId) return
    cs.sendTextMessage(eventId, { ...buildSender(), body: input.trim() })
    setInput('')
    reload()
  }

  async function handleImagePick(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !eventId) return
    const compressed = await Promise.all(files.map(async f => {
      if (!f.type.startsWith('image/')) return f
      const reader = new FileReader()
      const dataUrl = await new Promise(r => { reader.onload = ev => r(ev.target.result); reader.readAsDataURL(f) })
      return { ...f, _compressed: await compressImage(dataUrl) }
    }))
    const toSend = compressed.map(f => f._compressed || f)
    await cs.sendImageMessage(eventId, { ...buildSender(), files: toSend })
    e.target.value = ''
    reload()
  }

  async function toggleRecording() {
    if (isRecording) {
      clearInterval(timerRef.current)
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      setMicError(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: getSupportedMime() })
        mediaRecorderRef.current = recorder
        audioChunksRef.current   = []
        secsRef.current          = 0

        recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          if (!eventId) return
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType })
          const reader = new FileReader()
          reader.onload = () => {
            cs.sendVoiceMessage(eventId, { ...buildSender(), audioDataUrl: reader.result, durationSec: secsRef.current })
            reload()
          }
          reader.readAsDataURL(blob)
        }

        recorder.start(250)
        setIsRecording(true)
        setRecordingSecs(0)
        timerRef.current = setInterval(() => { secsRef.current += 1; setRecordingSecs(secsRef.current) }, 1000)
      } catch { setMicError(true) }
    }
  }

  function handleReact(msgId, emoji) {
    if (!eventId || !user?.id) return
    const updated = cs.toggleMessageReaction(eventId, msgId, user.id, emoji)
    setReactions(prev => ({ ...prev, [msgId]: updated }))
  }

  function handlePin(msgId) {
    if (!eventId) return
    cs.pinMessage(eventId, msgId)
    reload()
  }

  function handleUnpin() {
    if (!eventId || !pinnedMsg) return
    cs.unpinMessage(eventId, pinnedMsg.id)
    setPinnedMsg(null)
  }

  function handleDeleteMsg(msgId) {
    if (!eventId) return
    cs.deleteMessage(eventId, msgId)
    reload()
  }

  function handleSendLocation(meta) {
    if (!eventId) return
    cs.sendLocationMessage(eventId, { ...buildSender(), ...meta })
    reload()
  }

  function handleSendScheduleItem(item) {
    if (!eventId) return
    cs.sendScheduleActivityMessage(eventId, { ...buildSender(), item })
    reload()
  }

  const shownMembers = members.slice(0, 5)

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg,rgba(0,15,40,0.6) 0%,rgba(0,8,25,0.78) 100%)' }} />

      <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagePick} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '108px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          margin: '0 12px 8px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: '20px',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <button onClick={() => navigate('/welcome')} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>צ׳אט הבנות</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              {members.length > 0 ? `${members.length} משתתפות ✨` : 'הקבוצה שלנו ✨'}
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            {shownMembers.map((m, i) => (
              <div key={m.id} style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: shownMembers.length - i }}>
                <Avatar member={m} size={26} />
              </div>
            ))}
          </div>
        </div>

        {/* Pinned banner */}
        <PinnedBanner
          msg={pinnedMsg}
          onNavigateSchedule={() => navigate('/schedule')}
          canUnpin={canPin}
          onUnpin={handleUnpin}
        />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>💬</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>אין הודעות עדיין. שלחי ראשונה! ✨</p>
            </div>
          )}
          {messages.map(msg => (
            <Message
              key={msg.id}
              msg={msg}
              userId={user?.id || 'demo'}
              members={members}
              reactions={reactions[msg.id] || {}}
              canPin={canPin}
              canDelete={canDelete}
              onReact={handleReact}
              onPin={handlePin}
              onDelete={handleDeleteMsg}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Recording state */}
        {isRecording ? (
          <div style={{
            margin: '4px 12px', background: 'rgba(239,68,68,0.12)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px',
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', flexShrink: 0, boxShadow: '0 0 8px rgba(239,68,68,0.8)', animation: 'pulse-glow 1s ease-in-out infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 600 }}>מקליטה…</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', direction: 'ltr' }}>{fmtTime(recordingSecs)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{ width: '2px', height: `${6 + Math.abs(Math.sin(i * 0.9)) * 10}px`, background: 'rgba(248,113,113,0.6)', borderRadius: '1px', animation: `shimmer ${0.6 + i * 0.08}s ease-in-out infinite alternate` }} />
              ))}
            </div>
            <button onClick={toggleRecording} style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Square size={16} color="#f87171" fill="#f87171" />
            </button>
          </div>
        ) : (
          /* Normal input bar */
          <div style={{
            margin: '4px 12px',
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
            padding: '8px 8px 8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <button onClick={() => setShowAttach(v => !v)} style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer', padding: '2px' }}>
              <Plus size={18} color="rgba(255,255,255,0.45)" />
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="כתבי משהו קסום…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', fontFamily: '"Assistant",sans-serif' }}
            />

            <button
              onClick={toggleRecording}
              title={micError ? 'אין גישה למיקרופון' : 'הקלטה קולית'}
              style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer', padding: '2px', opacity: micError ? 0.4 : 1 }}
            >
              <Mic size={18} color={micError ? '#f87171' : 'rgba(255,255,255,0.45)'} />
            </button>

            {input.trim() ? (
              <button onClick={send} style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#8EEBFF,#65DDF8)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(142,235,255,0.4)',
              }}>
                <Send size={15} color="#050d1e" style={{ transform: 'rotate(180deg)' }} />
              </button>
            ) : <div style={{ width: '36px', height: '36px' }} />}
          </div>
        )}

        {micError && <div style={{ margin: '-2px 14px 6px', color: 'rgba(248,113,113,0.8)', fontSize: '11px', textAlign: 'center' }}>לא ניתן לגשת למיקרופון. אפשרי הרשאה בדפדפן.</div>}
      </div>

      {/* Overlays */}
      {showAttach && (
        <AttachMenu
          onImage={() => imageInputRef.current?.click()}
          onLocation={() => setShowLocation(true)}
          onSchedule={() => setShowSchedule(true)}
          onClose={() => setShowAttach(false)}
        />
      )}
      {showLocation && <SendLocationModal onSend={handleSendLocation} onClose={() => setShowLocation(false)} />}
      {showSchedule && <SchedulePickerModal eventId={eventId} onSend={handleSendScheduleItem} onClose={() => setShowSchedule(false)} />}

      <BottomNav />
    </div>
  )
}
