import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, Send } from 'lucide-react'
import { useAuth } from '../components/AuthGate'
import { useTrip } from '../context/TripContext'
import * as svc from '../lib/tripService'
import bgImg from '../assets/background.png'

const COLORS = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa']

function initials(name = '') {
  return name.trim().charAt(0) || '?'
}

function colorFor(userId) {
  let h = 0
  for (const c of userId) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}

export default function PrivateChatPage() {
  const { memberId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { members, currentMember, isOwner } = useTrip()

  const other = members.find(m => m.user_id === memberId || m.id === memberId)
  const bride = members.find(m => m.role === 'owner')

  const chatId = other && user?.id
    ? [user.id, other.user_id].sort().join('__')
    : null

  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!chatId) return
    const chat = svc.getOrCreatePrivateChat(user.id, other.user_id)
    setMessages(chat?.messages || [])
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!input.trim() || !chatId) return
    const msg = {
      sender_user_id:      user.id,
      sender_display_name: currentMember?.display_name || user.display_name || 'אני',
      body: input.trim(),
    }
    svc.sendPrivateMessage(chatId, msg)
    setMessages(prev => [...prev, { ...msg, id: 'tmp_' + Date.now() }])
    setInput('')
  }

  const title = other
    ? (isOwner
        ? `שיחה עם ${other.display_name}`
        : `שיחה עם ${bride?.display_name || 'הכלה'} 💌`)
    : 'צ׳אט פרטי'

  if (!other) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: `url(${bgImg}) center/cover no-repeat`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,10,30,0.75)' }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💌</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>המשתמשת לא נמצאה</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: '16px', background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }}>
            חזרה
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.6) 0%, rgba(0,8,25,0.78) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '16px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          margin: '0 12px 10px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '20px',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </button>

          {/* Other user avatar */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: other.role === 'owner'
              ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)'
              : colorFor(other.user_id),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: '#fff',
            border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0,
          }}>
            {other.role === 'owner' ? '👑' : initials(other.display_name)}
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
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                שלחי הודעה ראשונה ✨
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender_user_id === user?.id
            return (
              <div key={msg.id || i} style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                gap: '8px', marginBottom: '10px',
                animation: 'fadeInUp 0.3s ease both',
              }}>
                {!isMe && (
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                    background: other.role === 'owner' ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)' : colorFor(other.user_id),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '2px',
                  }}>
                    {other.role === 'owner' ? '👑' : initials(other.display_name)}
                  </div>
                )}
                <div style={{
                  maxWidth: '72%',
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'rgba(142,235,255,0.22)' : 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(14px)',
                  border: isMe ? '1px solid rgba(142,235,255,0.35)' : '1px solid rgba(255,255,255,0.18)',
                  color: '#fff', fontSize: '14px', lineHeight: 1.5,
                }}>
                  {msg.body}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          margin: '8px 12px 4px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '24px',
          padding: '8px 8px 8px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="כתבי משהו…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '14px', fontFamily: '"Assistant", sans-serif',
            }}
          />
          <button onClick={send} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(142,235,255,0.35)',
          }}>
            <Send size={15} color="#fff" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
