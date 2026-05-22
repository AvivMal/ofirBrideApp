import React, { useState } from 'react'
import { Bell, MapPin, Plus, X, Trash2 } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useTrip } from '../context/TripContext'
import { scheduleDays } from '../data/mockData'
import * as svc from '../lib/tripService'
import bgImg from '../assets/background.png'

const ICON_MAP = {
  sun:      '☀️',  ship:  '⛵',  wine:   '🍷',  sparkles: '✨',
  leaf:     '🕊️',  hotel: '🏨',  plane:  '✈️',  utensils: '🍋',
  sunset:   '🌅',  star:  '👗',  coffee: '🥐',  beach:    '🏖️',
  cocktail: '🍹',  dance: '💃',
}

const ICON_OPTIONS = Object.entries(ICON_MAP).map(([k, v]) => ({ key: k, emoji: v }))

const COLORS = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa']
function colorFor(uid = '') {
  let h = 0
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}

function MemberDots({ members, max = 4 }) {
  const shown = (members || []).slice(0, max)
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((m, i) => (
        <div key={m.id} style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: m.role === 'owner' ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)' : colorFor(m.user_id),
          border: '2px solid rgba(255,255,255,0.3)',
          marginLeft: i === 0 ? 0 : '-6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', color: '#fff', fontWeight: 700,
          zIndex: shown.length - i, flexShrink: 0,
        }}>
          {m.role === 'owner' ? '👑' : (m.display_name?.[0] || '?')}
        </div>
      ))}
    </div>
  )
}

export default function SchedulePage() {
  const { members, isOwner, currentMember } = useTrip()
  const [activeDay,   setActiveDay]   = useState('fri')
  const [schedData,   setSchedData]   = useState(() => svc.getScheduleItems())
  const [addModal,    setAddModal]    = useState(false)

  // Add form state
  const [form, setForm] = useState({ title: '', time: '10:00', location: '', icon: 'sun' })
  const [saving, setSaving] = useState(false)

  const items = schedData[activeDay] || []

  function refresh() {
    setSchedData(svc.getScheduleItems())
  }

  function handleAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    svc.addScheduleItem(activeDay, {
      title:     form.title.trim(),
      time:      form.time,
      location:  form.location.trim(),
      icon:      form.icon,
      emoji:     ICON_MAP[form.icon] || '✨',
      created_by: currentMember?.user_id,
    })
    refresh()
    setAddModal(false)
    setForm({ title: '', time: '10:00', location: '', icon: 'sun' })
    setSaving(false)
  }

  function handleDelete(itemId) {
    svc.deleteScheduleItem(activeDay, itemId)
    refresh()
  }

  function openMaps(loc) {
    if (loc) window.open(`https://maps.google.com/?q=${encodeURIComponent(loc)}`, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.55) 0%, rgba(0,8,25,0.72) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,180,100,0.15) 0%, transparent 50%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '108px', overflow: 'hidden' }}>

        {/* Top header */}
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '22px',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 0 16px rgba(142,235,255,0.4)',
          }}>👑</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0, lineHeight: 1.3 }}>לו״ז סוף השבוע ברודוס</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>3 ימים בלתי נשכחים יחד ✨</p>
          </div>
          <button style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Bell size={16} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* Day tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {scheduleDays.map(day => (
            <button key={day.value} onClick={() => setActiveDay(day.value)} style={{
              padding: '10px 14px', borderRadius: '16px', border: 'none',
              background: activeDay === day.value ? 'linear-gradient(135deg, #8EEBFF, #65DDF8)' : 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              color: activeDay === day.value ? '#050d1e' : 'rgba(255,255,255,0.55)',
              fontWeight: activeDay === day.value ? 700 : 400, fontSize: '13px',
              cursor: 'pointer', flexShrink: 0, textAlign: 'center', minWidth: '70px',
              boxShadow: activeDay === day.value ? '0 4px 16px rgba(142,235,255,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>
              <div>{day.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{day.date}</div>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            {items.length > 0 && (
              <div style={{
                position: 'absolute', right: '58px', top: 0, bottom: 0, width: '2px',
                background: 'linear-gradient(180deg, rgba(142,235,255,0.6) 0%, rgba(142,235,255,0.1) 100%)',
              }} />
            )}

            {items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '12px', animation: `fadeInUp 0.5s ease ${i * 0.07}s both` }}>
                {/* Time */}
                <div style={{ width: '52px', flexShrink: 0, paddingTop: '14px', textAlign: 'center', position: 'relative' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, lineHeight: 1.2 }}>
                    {item.time?.split(':')[0]}
                    <br />
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{item.time?.split(':')[1]}</span>
                  </span>
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%) translateX(4px)',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#8EEBFF', boxShadow: '0 0 8px rgba(142,235,255,0.8)', marginTop: '6px',
                  }} />
                </div>

                {/* Card */}
                <div style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.18)', borderRadius: '18px', padding: '13px 14px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '44px', height: '44px', background: 'rgba(255,255,255,0.12)',
                    borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                    {ICON_MAP[item.icon] || item.emoji || '✨'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', lineHeight: 1.3 }}>{item.title}</div>
                    {item.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                        <MapPin size={11} color="rgba(255,255,255,0.45)" />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{item.location}</span>
                      </div>
                    )}
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <MemberDots members={members} max={4} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.location && (
                          <button onClick={() => openMaps(item.location)} style={{
                            padding: '4px 10px', background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px',
                            color: 'rgba(255,255,255,0.7)', fontSize: '10px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px', direction: 'ltr',
                          }}>
                            <MapPin size={9} />
                            <span>מפה</span>
                          </button>
                        )}
                        {isOwner && (
                          <button onClick={() => handleDelete(item.id)} style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          }}>
                            <Trash2 size={11} color="#f87171" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📅</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '6px' }}>
                  אין אירועים ביום זה עדיין
                </div>
                {isOwner && (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                    לחצי על + כדי להוסיף פעילות ✨
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Owner FAB */}
        {isOwner && (
          <button
            onClick={() => setAddModal(true)}
            style={{
              position: 'absolute', bottom: '120px', left: '20px',
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8EEBFF, #65DDF8)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(142,235,255,0.5)',
              zIndex: 50,
            }}
          >
            <Plus size={24} color="#050d1e" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Add activity modal */}
      {addModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,5,20,0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 20px',
          animation: 'fadeInUp 0.25s ease forwards',
        }} onClick={e => { if (e.target === e.currentTarget) setAddModal(false) }}>
          <div style={{
            background: 'rgba(10,20,45,0.92)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '28px 28px 20px 20px',
            padding: '24px 20px',
            width: '100%', maxWidth: '420px',
            display: 'flex', flexDirection: 'column', gap: '14px',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.4)',
          }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '-6px auto 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>הוספת פעילות</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <MField label="שם הפעילות" placeholder="למשל: יאכטה בים" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} />
            <MField label="שעה" type="time" value={form.time} onChange={v => setForm(p => ({ ...p, time: v }))} />
            <MField label="מיקום (אופציונלי)" placeholder="שם המקום" value={form.location} onChange={v => setForm(p => ({ ...p, location: v }))} />

            {/* Icon picker */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>אייקון</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ICON_OPTIONS.map(({ key, emoji }) => (
                  <button key={key} onClick={() => setForm(p => ({ ...p, icon: key }))} style={{
                    width: '38px', height: '38px', borderRadius: '10px', fontSize: '18px',
                    background: form.icon === key ? 'rgba(142,235,255,0.25)' : 'rgba(255,255,255,0.08)',
                    border: form.icon === key ? '1px solid rgba(142,235,255,0.5)' : '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} disabled={!form.title.trim() || saving} style={{
              padding: '15px',
              background: form.title.trim() ? 'linear-gradient(135deg, rgba(142,235,255,0.4) 0%, rgba(14,165,233,0.5) 100%)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: '16px',
              color: '#fff', fontSize: '15px', fontWeight: 700, cursor: form.title.trim() ? 'pointer' : 'default',
              boxShadow: form.title.trim() ? '0 6px 20px rgba(142,235,255,0.2)' : 'none',
            }}>
              הוסיפי פעילות ✨
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function MField({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>{label}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px', color: '#fff', fontSize: '14px',
          outline: 'none', direction: 'rtl',
          fontFamily: '"Assistant", sans-serif',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
