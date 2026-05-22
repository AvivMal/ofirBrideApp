import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, Send, Image as ImageIcon, Mic, Square, Play, Pause, X } from 'lucide-react'
import { useAuth } from '../components/AuthGate'
import { useTrip } from '../context/TripContext'
import * as cs from '../lib/chatService'
import bgImg from '../assets/background.png'

const COLORS = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa']
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
      padding: '10px 14px', width: '200px',
      background: isMe ? 'rgba(142,235,255,0.15)' : 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(14px)',
      border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.18)',
      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    }}>
      <button onClick={toggle} disabled={!loaded && !audioUrl} style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: playing ? 'rgba(239,68,68,0.25)' : 'rgba(142,235,255,0.2)',
        border: `1px solid ${playing ? 'rgba(239,68,68,0.4)' : 'rgba(142,235,255,0.35)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        {playing ? <Pause size={13} color="#f87171" /> : <Play size={13} color={accent} />}
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', direction: 'ltr', overflow: 'hidden' }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const filled = (i / 22) <= progress
          const h = 4 + Math.abs(Math.sin(i * 0.65 + 1.2)) * 12
          return <div key={i} style={{ width: '2px', flexShrink: 0, height: `${h}px`, borderRadius: '1px', background: filled ? (isMe ? 'rgba(142,235,255,0.9)' : 'rgba(255,255,255,0.85)') : (isMe ? 'rgba(142,235,255,0.28)' : 'rgba(255,255,255,0.22)') }} />
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
        overflow: 'hidden', maxWidth: '210px',
        border: isMe ? '1px solid rgba(142,235,255,0.3)' : '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}>
        {images.length === 1 ? (
          <img src={images[0].url} alt="" onClick={() => setLightbox(images[0].url)} style={{ width: '100%', display: 'block', maxHeight: '260px', objectFit: 'cover', cursor: 'zoom-in' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2px' }}>
            {images.map((img, i) => <img key={i} src={img.url} alt="" onClick={() => setLightbox(img.url)} style={{ width: '100%', height: '90px', objectFit: 'cover', cursor: 'zoom-in' }} />)}
          </div>
        )}
        {msg.body && <div style={{ padding: '5px 9px', background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{msg.body}</div>}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 501 }}><X size={18} color="#fff" /></button>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: '12px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PrivateChatPage() {
  const { memberId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { members, currentMember, activeTrip } = useTrip()
  const eventId = activeTrip?.id

  const other = members.find(m => m.user_id === memberId || m.id === memberId)
  const myId  = currentMember?.user_id || user?.id || 'demo'

  const [messages,      setMessages]      = useState([])
  const [input,         setInput]         = useState('')
  const [isRecording,   setIsRecording]   = useState(false)
  const [recordingSecs, setRecordingSecs] = useState(0)
  const [micError,      setMicError]      = useState(false)

  const imageInputRef    = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const secsRef          = useRef(0)
  const timerRef         = useRef(null)
  const bottomRef        = useRef(null)

  const reload = useCallback(() => {
    if (!eventId || !other) return
    setMessages(cs.getPrivateMessages(eventId, myId, other.user_id))
  }, [eventId, myId, other?.user_id])

  useEffect(() => { reload() }, [reload])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => () => {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }, [])

  function buildSender() {
    return { senderId: myId, senderName: currentMember?.display_name || 'אני', senderAvatarUrl: currentMember?.avatar_url || null }
  }

  function send() {
    if (!input.trim() || !eventId || !other) return
    cs.sendPrivateTextMessage(eventId, myId, other.user_id, { ...buildSender(), body: input.trim() })
    setInput('')
    reload()
  }

  async function handleImagePick(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !eventId || !other) return
    const compressed = await Promise.all(files.map(async f => {
      if (!f.type.startsWith('image/')) return f
      const reader = new FileReader()
      const dataUrl = await new Promise(r => { reader.onload = ev => r(ev.target.result); reader.readAsDataURL(f) })
      const c = await compressImage(dataUrl)
      return c
    }))
    await cs.sendPrivateImageMessage(eventId, myId, other.user_id, { ...buildSender(), files: compressed })
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
        audioChunksRef.current = []
        secsRef.current = 0

        recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          if (!eventId || !other) return
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType })
          const reader = new FileReader()
          reader.onload = () => {
            cs.sendPrivateTextMessage(eventId, myId, other.user_id, { ...buildSender(), body: `[הקלטה קולית ${fmtTime(secsRef.current)}]` })
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

  if (!other) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,10,30,0.75)' }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💌</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>המשתמשת לא נמצאה</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: '16px', background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }}>חזרה</button>
        </div>
      </div>
    )
  }

  const otherColor = other.role === 'owner' ? 'linear-gradient(135deg,#8EEBFF,#65DDF8)' : colorFor(other.user_id)

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg,rgba(0,15,40,0.6) 0%,rgba(0,8,25,0.78) 100%)' }} />

      <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagePick} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '16px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          margin: '0 12px 10px',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: '20px',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </button>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: otherColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0 }}>
            {other.role === 'owner' ? '👑' : (other.display_name?.[0] || '?')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
              {other.display_name}
              {other.role === 'owner' && <span style={{ color: '#8EEBFF', fontSize: '12px', marginRight: '6px' }}>הכלה</span>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>שיחה פרטית 💌</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>💌</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>שלחי הודעה ראשונה ✨</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_user_id === myId
            return (
              <div key={msg.id || i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '8px', marginBottom: '10px', animation: 'fadeInUp 0.3s ease both' }}>
                {!isMe && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: otherColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                    {other.role === 'owner' ? '👑' : (other.display_name?.[0] || '?')}
                  </div>
                )}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {(msg.type === 'photos' || msg.type === 'photo') && <PhotoMessage msg={msg} isMe={isMe} />}
                  {msg.type === 'voice' && <VoiceMessage msg={msg} isMe={isMe} />}
                  {(!msg.type || msg.type === 'text') && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'rgba(142,235,255,0.22)' : 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(14px)',
                      border: isMe ? '1px solid rgba(142,235,255,0.35)' : '1px solid rgba(255,255,255,0.18)',
                      color: '#fff', fontSize: '14px', lineHeight: 1.5,
                    }}>{msg.body}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', direction: 'ltr' }}>{fmtMsgTime(msg.created_at)}</span>
                    {isMe && <span style={{ fontSize: '10px', color: '#8EEBFF' }}>✓✓</span>}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Recording state */}
        {isRecording ? (
          <div style={{
            margin: '8px 12px',
            background: 'rgba(239,68,68,0.12)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px',
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', flexShrink: 0, boxShadow: '0 0 8px rgba(239,68,68,0.8)', animation: 'pulse-glow 1s ease-in-out infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 600 }}>מקליטה…</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', direction: 'ltr' }}>{fmtTime(recordingSecs)}</div>
            </div>
            <button onClick={toggleRecording} style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Square size={15} color="#f87171" fill="#f87171" />
            </button>
          </div>
        ) : (
          /* Input bar */
          <div style={{
            margin: '8px 12px 4px',
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
            padding: '8px 8px 8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <button onClick={() => imageInputRef.current?.click()} style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer', padding: '2px' }}>
              <ImageIcon size={18} color="rgba(255,255,255,0.45)" />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="כתבי משהו…"
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
                cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(142,235,255,0.35)',
              }}>
                <Send size={15} color="#fff" style={{ transform: 'rotate(180deg)' }} />
              </button>
            ) : <div style={{ width: '36px', height: '36px' }} />}
          </div>
        )}
        {micError && <div style={{ margin: '-2px 14px 6px', color: 'rgba(248,113,113,0.8)', fontSize: '11px', textAlign: 'center' }}>לא ניתן לגשת למיקרופון.</div>}
      </div>
    </div>
  )
}
