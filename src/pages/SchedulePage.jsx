import React, { useState, useEffect, useRef } from 'react'
import { Bell, MapPin, Plus, X, Trash2, Edit3, Copy, Navigation, Clock } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useTrip } from '../context/TripContext'
import * as svc from '../lib/tripService'
import bgImg from '../assets/background.png'

// ── Constants ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  sun: '☀️', ship: '⛵', wine: '🍷', sparkles: '✨',
  leaf: '🕊️', hotel: '🏨', plane: '✈️', utensils: '🍋',
  sunset: '🌅', star: '👗', coffee: '🥐', beach: '🏖️',
  cocktail: '🍹', dance: '💃',
}
const ICON_OPTIONS = Object.entries(ICON_MAP).map(([key, emoji]) => ({ key, emoji }))

const CATEGORIES = [
  { key: 'food',      label: 'אוכל',      emoji: '🍽️' },
  { key: 'sea',       label: 'ים',        emoji: '🌊' },
  { key: 'party',     label: 'מסיבה',     emoji: '🎉' },
  { key: 'spa',       label: 'ספא',       emoji: '🌿' },
  { key: 'shopping',  label: 'קניות',     emoji: '🛍️' },
  { key: 'travel',    label: 'נסיעה',     emoji: '✈️' },
  { key: 'surprise',  label: 'הפתעה',     emoji: '🎁' },
  { key: 'free_time', label: 'זמן חופשי', emoji: '🌅' },
  { key: 'other',     label: 'אחר',       emoji: '✨' },
]

const REMINDER_OPTS = [15, 30, 60, 120]

const M_COLORS = ['#2dd4bf','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa','#fbbf24','#f87171']
function mColor(uid = '') {
  let h = 0; for (const c of uid) h = (h * 31 + c.charCodeAt(0)) % M_COLORS.length; return M_COLORS[h]
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function parseTime(starts_at) {
  if (!starts_at) return { hour: '--', min: '00', ampm: '', display: '00:00' }
  const d = new Date(starts_at)
  const h = d.getHours(), m = d.getMinutes()
  return {
    hour:    String(h % 12 || 12),
    min:     String(m).padStart(2, '0'),
    ampm:    h >= 12 ? 'PM' : 'AM',
    display: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  }
}

function buildStartsAt(isoDate, timeStr) {
  return isoDate && timeStr ? `${isoDate}T${timeStr}:00` : new Date().toISOString()
}

function buildScheduleDaysForTrip(trip) {
  if (!trip?.start_date || !trip?.end_date) return null
  const start = new Date(trip.start_date)
  const end = new Date(trip.end_date)
  if (isNaN(start) || isNaN(end) || end < start) return null

  const days = []
  let current = new Date(start)
  let order = 0
  while (current <= end) {
    const dayKey = current.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().slice(0, 3)
    const label = current.toLocaleDateString('he-IL', { weekday: 'long' })
    const date = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    days.push({
      id: `day_${dayKey}`,
      day_key: dayKey,
      label,
      date,
      iso_date: current.toISOString().slice(0, 10),
      sort_order: order++,
    })

    current.setDate(current.getDate() + 1)
  }
  return days
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MemberAvatars({ members, max = 4 }) {
  const shown = (members || []).slice(0, max)
  const extra = Math.max(0, (members || []).length - max)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <div key={m.id} style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: m.role === 'owner' ? 'linear-gradient(135deg,#8EEBFF,#65DDF8)' : mColor(m.user_id || m.id),
          border: '2px solid rgba(255,255,255,0.5)',
          marginLeft: i === 0 ? 0 : '-7px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', color: '#fff', fontWeight: 700,
          zIndex: shown.length - i, flexShrink: 0,
        }}>
          {m.role === 'owner' ? '👑' : (m.display_name?.[0] || '?')}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)',
          marginLeft: '-7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', color: '#fff', fontWeight: 700,
        }}>+{extra}</div>
      )}
    </div>
  )
}

function GlassInput({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#8EEBFF', marginRight: '3px' }}>*</span>}
      </div>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: '14px', color: '#fff', fontSize: '14px', outline: 'none',
          direction: type === 'time' || type === 'number' ? 'ltr' : 'rtl',
          fontFamily: '"Assistant",sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s',
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(142,235,255,0.6)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.16)')}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { members, role, currentMember, activeTrip } = useTrip()
  const canManage = role === 'owner' || role === 'admin'

  const [days,        setDays]        = useState([])
  const [activeDayId, setActiveDayId] = useState('day_fri')
  const [items,       setItems]       = useState([])
  const [attendance,  setAttendance]  = useState({})

  const [selectedItem, setSelectedItem] = useState(null)
  const [addEditOpen,  setAddEditOpen]  = useState(false)
  const [editingItem,  setEditingItem]  = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast,        setToast]        = useState('')
  const toastTimer = useRef(null)

  const emptyForm = {
    title: '', starts_at_time: '10:00', day_id: activeDayId,
    place_name: '', google_maps_url: '', category: 'food', icon: 'sun',
    description: '', reminder_enabled: false, reminder_minutes_before: 60,
    distance_km_from_hotel: '', drive_time_minutes_from_hotel: '',
  }
  const [form, setForm] = useState(emptyForm)
  const setF = (key, val) => setForm(p => ({ ...p, [key]: val }))

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const tripDays = buildScheduleDaysForTrip(activeTrip)
    const d = tripDays || svc.getScheduleDays()
    setDays(d)
    if (d.length) setActiveDayId(d[0].id)
  }, [activeTrip?.id, activeTrip?.start_date, activeTrip?.end_date])

  useEffect(() => {
    if (!activeDayId) return
    const its = svc.getScheduleItemsByDay(activeDayId)
    setItems(its)
    if (currentMember?.user_id) {
      const att = {}
      its.forEach(it => {
        const mine = svc.getScheduleAttendance(it.id).find(r => r.user_id === currentMember.user_id)
        if (mine) att[it.id] = mine.response
      })
      setAttendance(att)
    }
  }, [activeDayId, activeTrip?.start_date, activeTrip?.end_date])

  function refresh() { setItems(svc.getScheduleItemsByDay(activeDayId)) }

  // ── Toast ───────────────────────────────────────────────────────────────────

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }

  // ── Add / Edit ──────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingItem(null)
    setForm({ ...emptyForm, day_id: activeDayId })
    setSelectedItem(null)
    setAddEditOpen(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      starts_at_time: parseTime(item.starts_at).display,
      day_id: item.day_id || activeDayId,
      place_name: item.place_name || '',
      google_maps_url: item.google_maps_url || '',
      category: item.category || 'food',
      icon: item.icon || 'sun',
      description: item.description || '',
      reminder_enabled: item.reminder_enabled || false,
      reminder_minutes_before: item.reminder_minutes_before || 60,
      distance_km_from_hotel: item.distance_km_from_hotel != null ? String(item.distance_km_from_hotel) : '',
      drive_time_minutes_from_hotel: item.drive_time_minutes_from_hotel != null ? String(item.drive_time_minutes_from_hotel) : '',
    })
    setSelectedItem(null)
    setAddEditOpen(true)
  }

  function handleSave() {
    if (!form.title.trim() || !form.place_name.trim() || !form.starts_at_time) {
      showToast('חסרים כמה פרטים כדי להוסיף את הפעילות ✨')
      return
    }
    const day = days.find(d => d.id === form.day_id) || days.find(d => d.id === activeDayId)
    const starts_at = buildStartsAt(day?.iso_date, form.starts_at_time)
    const itemData = {
      day_id: form.day_id || activeDayId,
      day_key: day?.day_key,
      title: form.title.trim(),
      place_name: form.place_name.trim(),
      google_maps_url: form.google_maps_url.trim(),
      category: form.category,
      icon: form.icon,
      description: form.description.trim(),
      starts_at,
      reminder_enabled: form.reminder_enabled,
      reminder_minutes_before: form.reminder_minutes_before,
      distance_km_from_hotel: form.distance_km_from_hotel ? parseFloat(form.distance_km_from_hotel) : null,
      drive_time_minutes_from_hotel: form.drive_time_minutes_from_hotel ? parseInt(form.drive_time_minutes_from_hotel) : null,
      updated_by: currentMember?.user_id,
    }

    if (editingItem) {
      const changedFields = []
      if (editingItem.title !== itemData.title) changedFields.push('title')
      if (editingItem.starts_at !== itemData.starts_at) changedFields.push('time')
      if (editingItem.place_name !== itemData.place_name) changedFields.push('place')
      svc.updateScheduleItem(editingItem.id, itemData)
      if (changedFields.includes('title'))
        svc.createScheduleChangeChatMessage({ action: 'updated_title', title: itemData.title })
      if (changedFields.includes('time'))
        svc.createScheduleChangeChatMessage({ action: 'updated_time', title: itemData.title, details: form.starts_at_time })
      if (changedFields.includes('place'))
        svc.createScheduleChangeChatMessage({ action: 'updated_place', title: itemData.title, details: itemData.place_name })
      showToast('הפעילות עודכנה ✨')
    } else {
      svc.createScheduleItem({ ...itemData, created_by: currentMember?.user_id })
      svc.createScheduleChangeChatMessage({ action: 'created', title: itemData.title })
      showToast('הפעילות נוספה ✨')
    }

    setAddEditOpen(false)
    setEditingItem(null)
    if (form.day_id === activeDayId || !form.day_id) refresh()
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!deleteTarget) return
    svc.removeScheduleItem(deleteTarget.id)
    svc.createScheduleChangeChatMessage({ action: 'deleted', title: deleteTarget.title })
    setDeleteTarget(null)
    refresh()
    showToast('הפעילות נמחקה')
  }

  // ── Duplicate ───────────────────────────────────────────────────────────────

  function handleDuplicate(item) {
    const copy = svc.duplicateScheduleItem(item.id)
    refresh()
    setSelectedItem(null)
    showToast(`'${item.title}' שוכפל ✨`)
    if (copy) setTimeout(() => openEdit(copy), 300)
  }

  // ── Attendance ──────────────────────────────────────────────────────────────

  function handleAttendance(itemId, response) {
    if (!currentMember?.user_id) return
    svc.setScheduleAttendance(itemId, currentMember.user_id, response)
    setAttendance(p => ({ ...p, [itemId]: response }))
    showToast(response === 'coming' ? 'מגיעה! 🎉' : 'לא מגיעה 😔')
  }

  // ── Map ──────────────────────────────────────────────────────────────────────

  function handleMap(item) {
    if (item?.google_maps_url) window.open(item.google_maps_url, '_blank')
    else if (item?.place_name) window.open(`https://maps.google.com/?q=${encodeURIComponent(item.place_name + ' Rhodes')}`, '_blank')
    else showToast('קישור המפה יתווסף בהמשך ✨')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg,rgba(0,15,45,0.58) 0%,rgba(0,8,25,0.74) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%,rgba(255,165,90,0.1) 0%,transparent 45%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '16px', paddingBottom: '100px', overflow: 'hidden' }}>

        {/* ── Header pill ── */}
        <div style={{
          margin: '0 18px 16px',
          background: 'linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.12))',
          backdropFilter: 'blur(30px) saturate(170%)', WebkitBackdropFilter: 'blur(30px) saturate(170%)',
          border: '1px solid rgba(255,255,255,0.24)', borderRadius: '28px',
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', direction: 'rtl',
          boxShadow: '0 10px 35px rgba(0,0,0,0.12),inset 0 1px 1px rgba(255,255,255,0.30)',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#8EEBFF,#65DDF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 0 20px rgba(142,235,255,0.45)',
            }}>
              {activeTrip?.bride_name?.[0] || '👰'}
            </div>
            <div style={{ position: 'absolute', top: '-6px', right: '-4px', fontSize: '14px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>👑</div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0, lineHeight: 1.3 }}>לו״ז סוף השבוע ברודוס</h2>
            <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '12px', margin: '2px 0 0' }}>3 ימים בלתי נשכחים יחד ✨</p>
          </div>
          <button
            onClick={() => showToast('עדכוני לו״ז יופיעו כאן ✨')}
            style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Bell size={16} color="rgba(255,255,255,0.72)" />
          </button>
        </div>

        {/* ── Day tabs ── */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 18px 16px', overflowX: 'auto', scrollbarWidth: 'none', direction: 'rtl', flexShrink: 0 }}>
          {days.map(day => {
            const active = day.id === activeDayId
            return (
              <button key={day.id} onClick={() => setActiveDayId(day.id)} style={{
                padding: '10px 0', borderRadius: '26px', flexShrink: 0,
                minWidth: '76px', width: '76px', textAlign: 'center', cursor: 'pointer',
                background: active
                  ? 'linear-gradient(180deg,rgba(141,239,255,0.72),rgba(91,214,232,0.48))'
                  : 'rgba(255,255,255,0.16)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: active ? '1px solid rgba(142,235,255,0.45)' : '1px solid rgba(255,255,255,0.18)',
                color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                boxShadow: active ? '0 0 28px rgba(105,235,255,0.45),inset 0 1px 1px rgba(255,255,255,0.35)' : 'none',
                transition: 'all 0.22s ease',
              }}>
                <div style={{ fontSize: '13px', fontWeight: active ? 700 : 500, lineHeight: 1.3 }}>{day.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{day.date}</div>
              </button>
            )
          })}
        </div>

        {/* ── Timeline ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 8px', scrollbarWidth: 'none' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '52px 20px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>🌊</div>
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>אין פעילויות ביום זה עדיין</div>
              {canManage && <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px' }}>לחצי על + כדי להוסיף פעילות ✨</div>}
            </div>
          ) : (
            <div style={{ position: 'relative', paddingBottom: '16px', direction: 'ltr' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute', left: '64px', top: '26px', bottom: '26px', width: '1px',
                background: 'linear-gradient(180deg,rgba(142,235,255,0.5) 0%,rgba(142,235,255,0.06) 100%)',
              }} />

              {items.map((item, i) => {
                const { hour, min, ampm } = parseTime(item.starts_at)
                const myAtt = attendance[item.id]
                return (
                  <div key={item.id} style={{ display: 'flex', marginBottom: '20px', animation: `fadeInUp 0.4s ease ${i * 0.07}s both` }}>
                    {/* Time column */}
                    <div style={{ width: '64px', flexShrink: 0, paddingTop: '14px', position: 'relative', textAlign: 'right', paddingRight: '12px' }}>
                      <div style={{ color: 'rgba(255,255,255,0.95)', fontSize: '18px', fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{hour}</div>
                      {min !== '00' && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginTop: '-1px' }}>:{min}</div>}
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.4px' }}>{ampm}</div>
                      {/* Dot */}
                      <div style={{
                        position: 'absolute', right: '-5px', top: '18px',
                        width: '11px', height: '11px', borderRadius: '50%',
                        background: 'radial-gradient(circle,#fff 20%,#8EEBFF 70%)',
                        boxShadow: '0 0 12px rgba(142,235,255,0.95),0 0 5px rgba(255,255,255,0.7)',
                        zIndex: 1,
                      }} />
                    </div>

                    {/* Activity card */}
                    <button
                      onClick={() => setSelectedItem(item)}
                      style={{
                        flex: 1, marginLeft: '14px',
                        background: 'linear-gradient(135deg,rgba(255,255,255,0.34),rgba(255,255,255,0.16))',
                        backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                        border: '1px solid rgba(255,255,255,0.26)', borderRadius: '28px',
                        padding: '16px 18px',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.13),inset 0 1px 1px rgba(255,255,255,0.32)',
                        cursor: 'pointer', transition: 'transform 0.15s ease', textAlign: 'right',
                        WebkitTapHighlightColor: 'transparent', width: '100%',
                      }}
                      onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                      onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', direction: 'rtl' }}>
                        {/* Icon */}
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '20px', flexShrink: 0,
                          background: 'rgba(255,255,255,0.48)',
                          border: '1px solid rgba(255,255,255,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '26px',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7)',
                        }}>
                          {ICON_MAP[item.icon] || '✨'}
                        </div>

                        {/* Text block */}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#0C2D40', fontSize: '18px', fontWeight: 700, lineHeight: 1.3, marginBottom: '4px' }}>
                            {item.title}
                          </div>
                          {item.place_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                              <span style={{ color: '#2a6b85', fontSize: '13px' }}>{item.place_name}</span>
                              <MapPin size={11} color="#4e9ab8" />
                            </div>
                          )}
                          {(item.distance_km_from_hotel || item.drive_time_minutes_from_hotel) && (
                            <div style={{ color: '#4a8aa8', fontSize: '12px' }}>
                              {item.distance_km_from_hotel ? `${item.distance_km_from_hotel} ק״מ` : ''}
                              {item.distance_km_from_hotel && item.drive_time_minutes_from_hotel ? ' • ' : ''}
                              {item.drive_time_minutes_from_hotel ? `${item.drive_time_minutes_from_hotel} דק׳ נסיעה` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card footer */}
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MemberAvatars members={members} max={3} />
                          {members.length > 0 && (
                            <span style={{ color: '#3d7a96', fontSize: '11px' }}>+{members.length}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'ltr' }}>
                          {myAtt && (
                            <span style={{
                              padding: '4px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                              background: myAtt === 'coming' ? 'rgba(45,212,191,0.18)' : 'rgba(239,68,68,0.12)',
                              color: myAtt === 'coming' ? '#2dd4bf' : '#f87171',
                              border: `1px solid ${myAtt === 'coming' ? 'rgba(45,212,191,0.3)' : 'rgba(239,68,68,0.22)'}`,
                            }}>
                              {myAtt === 'coming' ? '✓ מגיעה' : 'לא מגיעה'}
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleMap(item) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px',
                              background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.45)',
                              borderRadius: '20px', color: '#0C2D40', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            <Navigation size={11} color="#0C2D40" />
                            פתחי מפה
                          </button>
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FAB ── */}
      {canManage && (
        <button
          onClick={openAdd}
          style={{
            position: 'fixed', bottom: '106px', left: '24px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#8EEBFF,#4ECDE4)',
            border: 'none', cursor: 'pointer', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(142,235,255,0.55),0 4px 12px rgba(0,0,0,0.25)',
            transition: 'transform 0.18s ease',
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.91)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={26} color="#0A1A2E" strokeWidth={2.5} />
        </button>
      )}

      <BottomNav />

      {/* ── Activity Details Modal ── */}
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          members={members}
          canManage={canManage}
          myAttendance={attendance[selectedItem.id]}
          onClose={() => setSelectedItem(null)}
          onEdit={() => openEdit(selectedItem)}
          onDuplicate={() => handleDuplicate(selectedItem)}
          onDelete={() => { setDeleteTarget(selectedItem); setSelectedItem(null) }}
          onAttendance={r => handleAttendance(selectedItem.id, r)}
          onMap={() => handleMap(selectedItem)}
        />
      )}

      {/* ── Add/Edit Modal ── */}
      {addEditOpen && (
        <AddEditModal
          form={form} setF={setF}
          days={days}
          editingItem={editingItem}
          onClose={() => { setAddEditOpen(false); setEditingItem(null) }}
          onSave={handleSave}
        />
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,5,20,0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', animation: 'fadeIn 0.2s ease',
          }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
        >
          <div style={{
            background: 'rgba(8,18,44,0.97)', backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: '28px',
            padding: '28px 24px', width: '100%', maxWidth: '340px',
            display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '42px' }}>🗑️</div>
            <h3 style={{ color: '#fff', fontSize: '19px', fontWeight: 700, margin: 0 }}>למחוק את הפעילות?</h3>
            <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
              הפעולה תסיר את הפעילות מהלו״ז ותעדכן את הצ׳אט הקבוצתי.
            </p>
            <div style={{ display: 'flex', gap: '10px', direction: 'rtl' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1, padding: '13px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                }}
              >ביטול</button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: '13px',
                  background: 'linear-gradient(135deg,rgba(239,68,68,0.45),rgba(220,38,38,0.55))',
                  border: '1px solid rgba(239,68,68,0.45)', borderRadius: '16px',
                  color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.22)',
                }}
              >מחקי פעילות</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '108px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(8,22,50,0.94)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(142,235,255,0.3)', borderRadius: '999px',
          padding: '10px 22px', color: '#8EEBFF', fontSize: '14px', fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)', zIndex: 600, whiteSpace: 'nowrap',
          animation: 'fadeInUp 0.25s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Activity Details Modal ─────────────────────────────────────────────────────

function DetailsModal({ item, members, canManage, myAttendance, onClose, onEdit, onDuplicate, onDelete, onAttendance, onMap }) {
  const { hour, min, ampm } = parseTime(item.starts_at)
  const cat = CATEGORIES.find(c => c.key === item.category)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,5,20,0.78)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'linear-gradient(180deg,rgba(6,18,46,0.98),rgba(4,10,30,0.99))',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '32px 32px 24px 24px',
        width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', scrollbarWidth: 'none',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        paddingBottom: '32px',
      }}>
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px', margin: '14px auto 0' }} />

        <div style={{ padding: '20px 22px 0', direction: 'rtl' }}>
          {/* Hero row */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '24px', flexShrink: 0,
              background: 'rgba(142,235,255,0.1)', border: '1px solid rgba(142,235,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
              boxShadow: '0 0 20px rgba(142,235,255,0.12)',
            }}>
              {ICON_MAP[item.icon] || '✨'}
            </div>
            <div style={{ flex: 1 }}>
              {cat && (
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                  background: 'rgba(142,235,255,0.12)', color: '#8EEBFF', border: '1px solid rgba(142,235,255,0.22)',
                  marginBottom: '6px',
                }}>{cat.emoji} {cat.label}</span>
              )}
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{item.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>{hour}:{min} {ampm}</span>
                <Clock size={13} color="rgba(255,255,255,0.35)" />
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
              <X size={20} />
            </button>
          </div>

          {/* Place */}
          {item.place_name && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#8EEBFF" />
                <span style={{ color: '#fff', fontSize: '14px' }}>{item.place_name}</span>
              </div>
              <button
                onClick={onMap}
                style={{
                  padding: '7px 14px',
                  background: 'linear-gradient(135deg,rgba(142,235,255,0.22),rgba(78,205,228,0.18))',
                  border: '1px solid rgba(142,235,255,0.32)', borderRadius: '20px',
                  color: '#8EEBFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >פתחי מפה</button>
            </div>
          )}

          {/* Distance */}
          {(item.distance_km_from_hotel || item.drive_time_minutes_from_hotel) && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={13} color="rgba(255,255,255,0.35)" />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                {item.distance_km_from_hotel ? `${item.distance_km_from_hotel} ק״מ` : ''}
                {item.distance_km_from_hotel && item.drive_time_minutes_from_hotel ? ' • ' : ''}
                {item.drive_time_minutes_from_hotel ? `${item.drive_time_minutes_from_hotel} דק׳ נסיעה` : ''}
              </span>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div style={{ marginTop: '14px', color: 'rgba(255,255,255,0.58)', fontSize: '14px', lineHeight: 1.65 }}>
              {item.description}
            </div>
          )}

          {/* Participants */}
          {members.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px' }}>{members.length} משתתפות</div>
              <MemberAvatars members={members} max={6} />
            </div>
          )}

          {/* Attendance */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>את מגיעה?</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { val: 'coming', label: 'מגיעה 🎉', activeColor: '#2dd4bf', activeBg: 'rgba(45,212,191,0.22)', activeBorder: 'rgba(45,212,191,0.45)' },
                { val: 'not_coming', label: 'לא מגיעה 😔', activeColor: '#f87171', activeBg: 'rgba(239,68,68,0.18)', activeBorder: 'rgba(239,68,68,0.38)' },
              ].map(({ val, label, activeColor, activeBg, activeBorder }) => {
                const active = myAttendance === val
                return (
                  <button key={val} onClick={() => onAttendance(val)} style={{
                    flex: 1, padding: '13px', borderRadius: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                    background: active ? activeBg : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${active ? activeBorder : 'rgba(255,255,255,0.14)'}`,
                    color: active ? activeColor : 'rgba(255,255,255,0.65)',
                    boxShadow: active ? `0 4px 16px ${activeBg}` : 'none',
                    transition: 'all 0.2s',
                  }}>{label}</button>
                )
              })}
            </div>
          </div>

          {/* Management */}
          {canManage && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '2px' }}>ניהול</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onEdit} style={{
                  flex: 1, padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(142,235,255,0.1)', border: '1px solid rgba(142,235,255,0.22)', color: '#8EEBFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Edit3 size={14} /> עריכת פעילות
                </button>
                <button onClick={onDuplicate} style={{
                  flex: 1, padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Copy size={14} /> שכפול פעילות
                </button>
              </div>
              <button onClick={onDelete} style={{
                width: '100%', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Trash2 size={14} /> מחיקת פעילות
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────────

function AddEditModal({ form, setF, days, editingItem, onClose, onSave }) {
  const isEdit = !!editingItem
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,5,20,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'linear-gradient(180deg,rgba(6,18,46,0.98),rgba(4,10,30,0.99))',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '32px 32px 24px 24px',
        width: '100%', maxWidth: '480px', maxHeight: '92vh',
        overflowY: 'auto', scrollbarWidth: 'none',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        paddingBottom: '40px',
      }}>
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px', margin: '14px auto 0' }} />

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', direction: 'rtl' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
              {isEdit ? 'עריכת פעילות ✏️' : 'הוספת פעילות ✨'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', cursor: 'pointer', padding: '4px' }}>
              <X size={22} />
            </button>
          </div>

          <GlassInput label="שם הפעילות" placeholder='למשל: שייט יאכטה 🌊' value={form.title} onChange={v => setF('title', v)} required />

          {/* Day selector */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              יום <span style={{ color: '#8EEBFF' }}>*</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {days.map(day => {
                const active = form.day_id === day.id
                return (
                  <button key={day.id} onClick={() => setF('day_id', day.id)} style={{
                    padding: '7px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                    fontWeight: active ? 700 : 400,
                    background: active ? 'rgba(142,235,255,0.18)' : 'rgba(255,255,255,0.07)',
                    border: active ? '1px solid rgba(142,235,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
                    color: active ? '#8EEBFF' : 'rgba(255,255,255,0.58)',
                  }}>{day.label}</button>
                )
              })}
            </div>
          </div>

          <GlassInput label="שעת התחלה" type="time" value={form.starts_at_time} onChange={v => setF('starts_at_time', v)} required />
          <GlassInput label="שם המקום" placeholder="למשל: Rhodes Marina" value={form.place_name} onChange={v => setF('place_name', v)} required />
          <GlassInput label="קישור Google Maps" placeholder="https://maps.google.com/..." value={form.google_maps_url} onChange={v => setF('google_maps_url', v)} />

          {/* Category */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              קטגוריה <span style={{ color: '#8EEBFF' }}>*</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const active = form.category === cat.key
                return (
                  <button key={cat.key} onClick={() => setF('category', cat.key)} style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                    background: active ? 'rgba(142,235,255,0.18)' : 'rgba(255,255,255,0.07)',
                    border: active ? '1px solid rgba(142,235,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
                    color: active ? '#8EEBFF' : 'rgba(255,255,255,0.58)',
                  }}>{cat.emoji} {cat.label}</button>
                )
              })}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              אייקון <span style={{ color: '#8EEBFF' }}>*</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ICON_OPTIONS.map(({ key, emoji }) => {
                const active = form.icon === key
                return (
                  <button key={key} onClick={() => setF('icon', key)} style={{
                    width: '42px', height: '42px', borderRadius: '12px', fontSize: '20px', cursor: 'pointer',
                    background: active ? 'rgba(142,235,255,0.18)' : 'rgba(255,255,255,0.07)',
                    border: active ? '1px solid rgba(142,235,255,0.48)' : '1px solid rgba(255,255,255,0.12)',
                    transition: 'all 0.15s',
                  }}>{emoji}</button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>תיאור קצר (אופציונלי)</div>
            <textarea
              placeholder="תיאור קצר של הפעילות..."
              value={form.description}
              onChange={e => setF('description', e.target.value)}
              rows={2}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '14px', color: '#fff', fontSize: '14px',
                outline: 'none', direction: 'rtl', fontFamily: '"Assistant",sans-serif',
                boxSizing: 'border-box', resize: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(142,235,255,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.16)')}
            />
          </div>

          {/* Reminder */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.reminder_enabled ? '10px' : 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>תזכורת</div>
              <div
                onClick={() => setF('reminder_enabled', !form.reminder_enabled)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative',
                  background: form.reminder_enabled ? 'linear-gradient(135deg,#8EEBFF,#65DDF8)' : 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px', width: '18px', height: '18px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  left: form.reminder_enabled ? '22px' : '2px',
                }} />
              </div>
            </div>
            {form.reminder_enabled && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {REMINDER_OPTS.map(m => {
                  const active = form.reminder_minutes_before === m
                  return (
                    <button key={m} onClick={() => setF('reminder_minutes_before', m)} style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      fontWeight: active ? 600 : 400,
                      background: active ? 'rgba(142,235,255,0.18)' : 'rgba(255,255,255,0.07)',
                      border: active ? '1px solid rgba(142,235,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
                      color: active ? '#8EEBFF' : 'rgba(255,255,255,0.58)',
                    }}>{m < 60 ? `${m} דק׳` : `${m / 60} שעה`}</button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Distance */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <GlassInput label='מרחק מהמלון (ק״מ)' placeholder="4.2" value={form.distance_km_from_hotel} onChange={v => setF('distance_km_from_hotel', v)} type="number" />
            </div>
            <div style={{ flex: 1 }}>
              <GlassInput label="זמן נסיעה (דק׳)" placeholder="12" value={form.drive_time_minutes_from_hotel} onChange={v => setF('drive_time_minutes_from_hotel', v)} type="number" />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={onSave}
            style={{
              marginTop: '8px', padding: '16px',
              background: 'linear-gradient(135deg,rgba(142,235,255,0.42),rgba(14,165,233,0.48))',
              border: '1px solid rgba(142,235,255,0.38)', borderRadius: '18px',
              color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(142,235,255,0.22)', letterSpacing: '0.3px',
            }}
          >
            {isEdit ? 'שמרי שינויים ✨' : 'הוסיפי פעילות ✨'}
          </button>
        </div>
      </div>
    </div>
  )
}
