import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, Phone, Paperclip, Image as ImageIcon, Mic, Send, Play, Pause, MapPin, X, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../components/AuthGate'
import { useTrip } from '../context/TripContext'
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

// Compress an image data-URL to JPEG ≤800px wide, quality 0.72
function compressImage(dataUrl) {
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

function Avatar({ member, size = 36 }) {
  if (!member) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#444', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)' }}>?</div>
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: member.role === 'owner' ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)' : colorFor(member.user_id),
      flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, color: '#fff', fontWeight: 700,
      border: '2px solid rgba(255,255,255,0.25)',
    }}>
      {member.role === 'owner' ? '👑' : (member.display_name?.[0] || '?')}
    </div>
  )
}

// ── Voice message player ──────────────────────────────────────────────────────
function VoiceMessage({ msg, isMe }) {
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded,   setLoaded]   = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (!msg.audio_url) return
    const audio = new Audio(msg.audio_url)
    audioRef.current = audio
    audio.oncanplaythrough = () => setLoaded(true)
    audio.onended = () => { setPlaying(false); setProgress(0) }
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    return () => { audio.pause(); audioRef.current = null }
  }, [msg.audio_url])

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else         { a.play();  setPlaying(true) }
  }

  const bars = 28
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
      <button onClick={toggle} disabled={!loaded} style={{
        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
        background: playing ? 'rgba(239,68,68,0.25)' : 'rgba(142,235,255,0.2)',
        border: `1px solid ${playing ? 'rgba(239,68,68,0.4)' : 'rgba(142,235,255,0.35)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: loaded ? 'pointer' : 'default', transition: 'all 0.2s',
      }}>
        {playing
          ? <Pause size={14} color="#f87171" />
          : <Play  size={14} color={accent} />
        }
      </button>

      {/* Waveform */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', direction: 'ltr', overflow: 'hidden' }}>
        {Array.from({ length: bars }).map((_, i) => {
          const filled = (i / bars) <= progress
          const h = 4 + Math.abs(Math.sin(i * 0.65 + 1.2)) * 14
          return (
            <div key={i} style={{
              width: '2px', flexShrink: 0,
              height: `${h}px`,
              borderRadius: '1px',
              background: filled
                ? (isMe ? 'rgba(142,235,255,0.9)' : 'rgba(255,255,255,0.85)')
                : (isMe ? 'rgba(142,235,255,0.28)' : 'rgba(255,255,255,0.22)'),
              transition: 'background 0.1s',
            }} />
          )
        })}
      </div>

      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', flexShrink: 0, direction: 'ltr' }}>
        {fmtTime(msg.duration || 0)}
      </span>
    </div>
  )
}

// ── Photo message ─────────────────────────────────────────────────────────────
function PhotoMessage({ msg, isMe }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        style={{
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          overflow: 'hidden', maxWidth: '230px', cursor: 'zoom-in',
          border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <img
          src={msg.image_url}
          alt=""
          style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
        />
        {msg.caption && (
          <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
            {msg.caption}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <button onClick={() => setExpanded(false)} style={{
            position: 'absolute', top: '20px', left: '20px',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 501,
          }}>
            <X size={18} color="#fff" />
          </button>
          <img
            src={msg.image_url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: '12px', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { members, currentMember, activeTrip } = useTrip()

  const [messages,  setMessages]  = useState(() => svc.getGroupMessages())
  const [input,     setInput]     = useState('')
  const [showEvent, setShowEvent] = useState(true)

  // File / image
  const fileInputRef  = useRef(null)
  const imageInputRef = useRef(null)

  // Voice recording
  const [isRecording,    setIsRecording]    = useState(false)
  const [recordingSecs,  setRecordingSecs]  = useState(0)
  const [micError,       setMicError]       = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const secsRef          = useRef(0)
  const timerRef         = useRef(null)

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop()
    }
  }, [])

  function addMessage(msgData) {
    const saved = svc.sendGroupMessage({
      trip_id:             activeTrip?.id,
      sender_user_id:      currentMember?.user_id,
      sender_display_name: currentMember?.display_name,
      ...msgData,
    })
    setMessages(prev => [...prev, saved])
  }

  // ── Text send ──
  function send() {
    if (!input.trim() || !currentMember) return
    addMessage({ type: 'text', body: input.trim() })
    setInput('')
  }

  // ── Image / file pick ──
  function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file || !currentMember) return
    const reader = new FileReader()
    reader.onload = async () => {
      const compressed = file.type.startsWith('image/')
        ? await compressImage(reader.result)
        : reader.result
      addMessage({ type: 'photo', image_url: compressed, body: file.name })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Voice recording ──
  async function toggleRecording() {
    if (isRecording) {
      // Stop
      clearInterval(timerRef.current)
      mediaRecorderRef.current?.stop()  // onstop fires async, handled below
      setIsRecording(false)
    } else {
      setMicError(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: getSupportedMime() })
        mediaRecorderRef.current = recorder
        audioChunksRef.current   = []
        secsRef.current          = 0

        recorder.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          if (!currentMember) return
          const blob   = new Blob(audioChunksRef.current, { type: recorder.mimeType })
          const reader = new FileReader()
          reader.onload = () => {
            addMessage({
              type:      'voice',
              audio_url: reader.result,
              duration:  secsRef.current,
              body:      `הקלטה קולית`,
            })
          }
          reader.readAsDataURL(blob)
        }

        recorder.start(250)  // collect data every 250ms
        setIsRecording(true)
        setRecordingSecs(0)
        timerRef.current = setInterval(() => {
          secsRef.current += 1
          setRecordingSecs(secsRef.current)
        }, 1000)
      } catch {
        setMicError(true)
      }
    }
  }

  const shownMembers = members.slice(0, 5)

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.6) 0%, rgba(0,8,25,0.78) 100%)' }} />

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImagePick}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleImagePick}
      />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '108px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          margin: '0 12px 8px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: '20px',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <button onClick={() => navigate('/welcome')} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
          }}>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>צ׳אט הבנות</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              {members.length > 0 ? `${members.length} משתתפות ✨` : 'הקבוצה שלנו ✨'}
            </div>
          </div>
          <div style={{ display: 'flex', marginLeft: '8px' }}>
            {shownMembers.map((m, i) => (
              <div key={m.id} style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: shownMembers.length - i }}>
                <Avatar member={m} size={26} />
              </div>
            ))}
          </div>
          <button style={{
            background: 'rgba(142,235,255,0.2)', border: '1px solid rgba(142,235,255,0.35)',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
          }}>
            <Phone size={14} color="#8EEBFF" />
          </button>
        </div>

        {/* Pinned update */}
        <div style={{
          margin: '0 12px 10px',
          background: 'rgba(142,235,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(142,235,255,0.28)', borderRadius: '16px',
          padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#8EEBFF', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', marginBottom: '3px' }}>📌 עדכון לו״ז</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>מחר הולך להיות אגדי 💙</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginBottom: '4px' }}>יום יאכטה, ביץ׳ קלאב וארוחת שקיעה!</div>
            <button onClick={() => navigate('/schedule')} style={{ background: 'none', border: 'none', color: '#8EEBFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              צפי בלו״ז ←
            </button>
          </div>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f4c75, #1a6b9a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>⛵</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>💬</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>אין הודעות עדיין. שלחי ראשונה! ✨</p>
            </div>
          )}
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} userId={user?.id} members={members} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Floating event card */}
        {showEvent && (
          <div style={{
            margin: '8px 12px',
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px',
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🍷</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginBottom: '2px' }}>הערב • 21:00</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>ארוחת שקיעה ברופטופ 🍷</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <MapPin size={10} color="rgba(255,255,255,0.4)" />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Skybar Rhodes</span>
              </div>
            </div>
            <button onClick={() => navigate('/schedule')} style={{ padding: '5px 10px', background: 'rgba(142,235,255,0.25)', border: '1px solid rgba(142,235,255,0.4)', borderRadius: '8px', color: '#8EEBFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>פתחי לו״ז</button>
            <button onClick={() => setShowEvent(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Input bar ── */}
        {isRecording ? (
          /* Recording state */
          <div style={{
            margin: '4px 12px 4px',
            background: 'rgba(239,68,68,0.12)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '24px',
            padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            {/* Pulsing dot */}
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#f87171', flexShrink: 0,
              animation: 'pulse-glow 1s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(239,68,68,0.8)',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 600 }}>מקליטה…</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', direction: 'ltr' }}>{fmtTime(recordingSecs)}</div>
            </div>
            {/* Live waveform animation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  width: '2px',
                  height: `${6 + Math.abs(Math.sin(Date.now() * 0.01 + i)) * 10}px`,
                  background: 'rgba(248,113,113,0.6)',
                  borderRadius: '1px',
                  animation: `shimmer ${0.6 + i * 0.08}s ease-in-out infinite alternate`,
                }} />
              ))}
            </div>
            {/* Stop button */}
            <button onClick={toggleRecording} style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(239,68,68,0.3)',
              border: '1px solid rgba(239,68,68,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Square size={16} color="#f87171" fill="#f87171" />
            </button>
          </div>
        ) : (
          /* Normal input */
          <div style={{
            margin: '4px 12px 4px',
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
            padding: '8px 8px 8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {/* Paperclip → any file */}
            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer', padding: '2px' }}>
              <Paperclip size={18} color="rgba(255,255,255,0.45)" />
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="כתבי משהו קסום…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', fontFamily: '"Assistant", sans-serif' }}
            />

            {/* Image icon → images only */}
            <button onClick={() => imageInputRef.current?.click()} style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer', padding: '2px' }}>
              <ImageIcon size={18} color="rgba(255,255,255,0.45)" />
            </button>

            {/* Mic → voice recording */}
            <button
              onClick={toggleRecording}
              title={micError ? 'אין גישה למיקרופון' : 'הקלטה קולית'}
              style={{
                background: 'none', border: 'none', flexShrink: 0,
                cursor: 'pointer', padding: '2px',
                opacity: micError ? 0.4 : 1,
              }}
            >
              <Mic size={18} color={micError ? '#f87171' : 'rgba(255,255,255,0.45)'} />
            </button>

            {/* Send */}
            {input.trim() ? (
              <button onClick={send} style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(142,235,255,0.4)',
              }}>
                <Send size={15} color="#050d1e" style={{ transform: 'rotate(180deg)' }} />
              </button>
            ) : (
              <div style={{ width: '36px', height: '36px' }} />
            )}
          </div>
        )}

        {micError && (
          <div style={{ margin: '-2px 14px 6px', color: 'rgba(248,113,113,0.8)', fontSize: '11px', textAlign: 'center' }}>
            לא ניתן לגשת למיקרופון. אפשרי הרשאה בדפדפן.
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

// ── Message renderer ──────────────────────────────────────────────────────────
function Message({ msg, userId, members }) {
  const isMe   = msg.sender_user_id === userId
  const member = members.find(m => m.user_id === msg.sender_user_id)

  return (
    <div style={{
      display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
      gap: '8px', marginBottom: '10px', padding: '0 4px',
      animation: 'fadeInUp 0.3s ease both',
    }}>
      {!isMe && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: member
            ? (member.role === 'owner' ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)' : colorFor(member.user_id))
            : 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: '#fff',
          border: '2px solid rgba(255,255,255,0.2)', marginTop: '2px',
        }}>
          {member?.role === 'owner' ? '👑' : (msg.sender_display_name?.[0] || '?')}
        </div>
      )}

      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {!isMe && (
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', paddingRight: '4px' }}>
            {msg.sender_display_name}{member?.role === 'owner' ? ' 👑' : ''}
          </span>
        )}

        {msg.type === 'text' && (
          <div style={{
            padding: '10px 14px',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMe ? 'rgba(142,235,255,0.22)' : 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(14px)',
            border: isMe ? '1px solid rgba(142,235,255,0.35)' : '1px solid rgba(255,255,255,0.18)',
            color: '#fff', fontSize: '14px', lineHeight: 1.5,
          }}>
            {msg.body}
          </div>
        )}

        {msg.type === 'photo' && <PhotoMessage msg={msg} isMe={isMe} />}

        {msg.type === 'voice' && <VoiceMessage msg={msg} isMe={isMe} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', direction: 'ltr' }}>
            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          {isMe && <span style={{ fontSize: '10px', color: '#8EEBFF' }}>✓✓</span>}
        </div>
      </div>
    </div>
  )
}

// Returns the first supported audio MIME type
function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
}
