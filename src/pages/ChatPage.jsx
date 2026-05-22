import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, Phone, Paperclip, Image as ImageIcon, Mic, Send, Play, Pause, MapPin, Calendar, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import BottomNav from '../components/BottomNav'
import { chatMessages, participants } from '../data/mockData'
import bgImg from '../assets/background.png'

const colors = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa','#e879f9','#fbbf24']

function Avatar({ userId, size = 36 }) {
  const p   = participants.find(x => x.id === userId)
  const idx = participants.findIndex(x => x.id === userId)
  const bg  = colors[idx % colors.length] || '#2dd4bf'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, color: '#fff', fontWeight: 700,
      border: '2px solid rgba(255,255,255,0.25)',
    }}>
      {p ? p.name[0] : '?'}
    </div>
  )
}

function AvatarStrip({ ids, max = 5 }) {
  const shown = ids.slice(0, max)
  return (
    <div style={{ display: 'flex', marginRight: '8px' }}>
      {shown.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: shown.length - i }}>
          <Avatar userId={id} size={26} />
        </div>
      ))}
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        border: '2px solid rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '9px', color: '#fff', fontWeight: 600, marginLeft: '-8px',
      }}>+3</div>
    </div>
  )
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [input, setInput]         = useState('')
  const [messages, setMessages]   = useState(chatMessages)
  const [showEvent, setShowEvent] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: 'new' + Date.now(),
      userId: 'me',
      type: 'text',
      content: input.trim(),
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    }])
    setInput('')
  }

  function renderMessage(msg) {
    const isMe = msg.userId === 'me'
    const p    = participants.find(x => x.id === msg.userId)

    return (
      <div key={msg.id} style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        gap: '8px',
        marginBottom: '10px',
        padding: '0 4px',
        animation: 'fadeInUp 0.3s ease both',
      }}>
        {!isMe && <Avatar userId={msg.userId} size={32} />}

        <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          {!isMe && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', paddingRight: '4px' }}>
              {p?.name}{p?.emoji ? ' ' + p.emoji : ''}
              {p?.role === 'bride' ? ' 👑' : ''}
            </span>
          )}

          {msg.type === 'text' && (
            <div style={{
              padding: '10px 14px',
              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: isMe
                ? 'rgba(45,212,191,0.28)'
                : 'rgba(255,255,255,0.13)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: isMe
                ? '1px solid rgba(45,212,191,0.4)'
                : '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              fontSize: '14px',
              lineHeight: 1.5,
            }}>
              {msg.content}
            </div>
          )}

          {msg.type === 'voice' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', width: '200px',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '18px 18px 18px 4px',
            }}>
              <button style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(45,212,191,0.3)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                cursor: 'pointer',
              }}>
                <Play size={14} color="#2dd4bf" />
              </button>
              {/* Waveform */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', direction: 'ltr' }}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} style={{
                    width: '2px',
                    height: `${6 + Math.sin(i * 0.8) * 8 + Math.random() * 6}px`,
                    background: 'rgba(45,212,191,0.7)',
                    borderRadius: '1px',
                    flexShrink: 0,
                  }} />
                ))}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', flexShrink: 0, direction: 'ltr' }}>{msg.content}</span>
            </div>
          )}

          {msg.type === 'location' && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '18px', overflow: 'hidden', width: '220px',
            }}>
              {/* Map placeholder */}
              <div style={{
                height: '90px',
                background: 'linear-gradient(135deg, #1a3a5c 0%, #0f4c75 50%, #1a6b9a 100%)',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '28px' }}>🗺️</div>
                <div style={{
                  position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
                  width: '20px', height: '20px', borderRadius: '50% 50% 50% 0',
                  background: '#2dd4bf', transform: 'rotate(-45deg)',
                  boxShadow: '0 0 8px rgba(45,212,191,0.8)',
                }} />
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>אנחנו כאן!</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '8px' }}>{msg.content}</div>
                <button style={{
                  width: '100%', padding: '6px',
                  background: 'rgba(45,212,191,0.2)',
                  border: '1px solid rgba(45,212,191,0.35)',
                  borderRadius: '8px', color: '#2dd4bf', fontSize: '12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>
                  <MapPin size={11} />
                  פתחי במפות
                </button>
              </div>
            </div>
          )}

          {msg.type === 'photos' && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '18px',
              overflow: 'hidden',
              width: '230px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', padding: '2px' }}>
                {['#4a1f6b','#1a4a6b','#6b3a1f','#1a6b4a'].map((bg, i) => (
                  <div key={i} style={{
                    height: '70px', background: bg, borderRadius: i === 0 ? '14px 2px 2px 2px' : i === 1 ? '2px 14px 2px 2px' : i === 2 ? '2px 2px 2px 14px' : '2px 2px 14px 2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                  }}>
                    {['🥂','🌊','🍽️','🌅'][i]}
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                {msg.content}
              </div>
            </div>
          )}

          {/* Time + reactions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', direction: 'ltr' }}>{msg.time}</span>
            {isMe && <span style={{ fontSize: '10px', color: '#2dd4bf' }}>✓✓</span>}
            {msg.reactions?.map((r, i) => (
              <span key={i} style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
                padding: '1px 5px', fontSize: '11px',
              }}>{r}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `url(${bgImg}) center/cover no-repeat`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.6) 0%, rgba(0,8,25,0.78) 100%)' }} />

      <StatusBar />

      {/* Chat container */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '58px', paddingBottom: '76px', overflow: 'hidden' }}>

        {/* Top header */}
        <div style={{
          margin: '0 12px 8px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '20px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <button onClick={() => navigate('/welcome')} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            cursor: 'pointer',
          }}>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>צ׳אט הבנות</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>8 מחוברות עכשיו ✨</div>
          </div>

          <AvatarStrip ids={['u1','u2','u3','u4','u5']} />

          <button style={{
            background: 'rgba(45,212,191,0.2)', border: '1px solid rgba(45,212,191,0.35)',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            cursor: 'pointer',
          }}>
            <Phone size={14} color="#2dd4bf" />
          </button>
        </div>

        {/* Pinned update */}
        <div style={{
          margin: '0 12px 10px',
          background: 'rgba(45,212,191,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(45,212,191,0.3)',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#2dd4bf', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', marginBottom: '3px' }}>
              📌 עדכון לו״ז
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>מחר הולך להיות אגדי 💙</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginBottom: '4px' }}>יום יאכטה, ביץ׳ קלאב וארוחת שקיעה!</div>
            <button onClick={() => navigate('/schedule')} style={{
              background: 'none', border: 'none', color: '#2dd4bf', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              צפי בלו״ז ←
            </button>
          </div>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f4c75, #1a6b9a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0,
          }}>⛵</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
          {messages.map(renderMessage)}
          <div ref={bottomRef} />
        </div>

        {/* Floating event card */}
        {showEvent && (
          <div style={{
            margin: '8px 12px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '18px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0,
            }}>🍷</div>
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
                padding: '5px 10px', background: 'rgba(45,212,191,0.3)',
                border: '1px solid rgba(45,212,191,0.5)', borderRadius: '8px',
                color: '#2dd4bf', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                פתחי לו״ז
              </button>
              <button style={{
                padding: '5px 10px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                פתחי מפה
              </button>
            </div>
            <button onClick={() => setShowEvent(false)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0,
            }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          margin: '4px 12px 4px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '24px',
          padding: '8px 8px 8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
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
              color: '#fff', fontSize: '14px',
              '::placeholder': { color: 'rgba(255,255,255,0.3)' },
            }}
          />

          <button style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer' }}>
            <ImageIcon size={18} color="rgba(255,255,255,0.4)" />
          </button>
          <button style={{ background: 'none', border: 'none', flexShrink: 0, cursor: 'pointer' }}>
            <Mic size={18} color="rgba(255,255,255,0.4)" />
          </button>

          <button
            onClick={send}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(45,212,191,0.4)',
            }}
          >
            <Send size={15} color="#fff" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
