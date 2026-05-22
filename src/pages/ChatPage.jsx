import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, Phone, Paperclip, Image as ImageIcon, Mic, Send, Play, MapPin, X } from 'lucide-react'
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

function Avatar({ member, size = 36 }) {
  if (!member) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#444', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, border: '2px solid rgba(255,255,255,0.2)' }}>?</div>
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

export default function ChatPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { members, currentMember, activeTrip } = useTrip()

  const [messages,  setMessages]  = useState(() => svc.getGroupMessages())
  const [input,     setInput]     = useState('')
  const [showEvent, setShowEvent] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!input.trim() || !currentMember) return
    const msg = svc.sendGroupMessage({
      trip_id:             activeTrip?.id,
      sender_user_id:      currentMember.user_id,
      sender_display_name: currentMember.display_name,
      sender_avatar_url:   currentMember.avatar_url,
      body:                input.trim(),
      type:                'text',
    })
    setMessages(prev => [...prev, msg])
    setInput('')
  }

  const shownMembers = members.slice(0, 5)
  const guestCount   = members.filter(m => m.role === 'guest').length

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.6) 0%, rgba(0,8,25,0.78) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '108px', overflow: 'hidden' }}>

        {/* Top header */}
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

          {/* Avatar strip */}
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
            <button onClick={() => navigate('/schedule')} style={{
              background: 'none', border: 'none', color: '#8EEBFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
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
          {messages.map(msg => <Message key={msg.id} msg={msg} userId={user?.id} members={members} />)}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => navigate('/schedule')} style={{
                padding: '5px 10px', background: 'rgba(142,235,255,0.25)',
                border: '1px solid rgba(142,235,255,0.4)', borderRadius: '8px',
                color: '#8EEBFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>פתחי לו״ז</button>
            </div>
            <button onClick={() => setShowEvent(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          margin: '4px 12px 4px',
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
          padding: '8px 8px 8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <button style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer' }}>
            <Paperclip size={18} color="rgba(255,255,255,0.4)" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="כתבי משהו קסום…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '14px', fontFamily: '"Assistant", sans-serif',
            }}
          />
          <button style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer' }}>
            <ImageIcon size={18} color="rgba(255,255,255,0.4)" />
          </button>
          <button style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer' }}>
            <Mic size={18} color="rgba(255,255,255,0.4)" />
          </button>
          <button onClick={send} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(142,235,255,0.4)',
          }}>
            <Send size={15} color="#050d1e" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

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

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {!isMe && (
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', paddingRight: '4px' }}>
            {msg.sender_display_name}
            {member?.role === 'owner' ? ' 👑' : ''}
          </span>
        )}

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
