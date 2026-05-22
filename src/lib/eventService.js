// Multi-event localStorage service.
// Storage keys:
//   rba_app_data   → { events: { [id]: EventBundle } }
//   rba_active_id  → string  (active event id)
//   rba_demo_user  → object  (demo auth identity)
// On first load, migrates legacy rba_trip_data if present.

const APP_KEY    = 'rba_app_data'
const ACTIVE_KEY = 'rba_active_id'
const USER_KEY   = 'rba_demo_user'

function uid(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9)
}
function tok6() {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

// ── Persistence ───────────────────────────────────────────────────────────────

function loadApp() {
  try {
    const raw = localStorage.getItem(APP_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { events: {} }
}

function saveApp(data) {
  localStorage.setItem(APP_KEY, JSON.stringify(data))
}

function loadBundle(eventId) {
  return loadApp().events?.[eventId] || null
}

function saveBundle(eventId, bundle) {
  const app = loadApp()
  if (!app.events) app.events = {}
  app.events[eventId] = bundle
  saveApp(app)
}

// ── Migration from legacy rba_trip_data ───────────────────────────────────────

export function migrateLegacyData() {
  try {
    const legacy = localStorage.getItem('rba_trip_data')
    if (!legacy) return
    const old = JSON.parse(legacy)
    if (!old?.trip?.id) return
    const app = loadApp()
    if (!app.events) app.events = {}
    if (!app.events[old.trip.id]) {
      app.events[old.trip.id] = old
      saveApp(app)
      if (!localStorage.getItem(ACTIVE_KEY)) {
        localStorage.setItem(ACTIVE_KEY, old.trip.id)
      }
    }
    localStorage.removeItem('rba_trip_data')
  } catch { /* ignore */ }
}

// ── Active event ──────────────────────────────────────────────────────────────

export function getActiveEventId() {
  return localStorage.getItem(ACTIVE_KEY) || null
}

export function setActiveEventId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

// ── Demo user ─────────────────────────────────────────────────────────────────

export function loadDemoUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}
export function saveDemoUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function clearDemoUser() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ACTIVE_KEY)
}

// ── Event CRUD ────────────────────────────────────────────────────────────────

export function createEvent(ownerId, {
  brideName, eventName, destination, startDate, endDate, coverImageUrl, themeStyle, estimatedGuests,
}) {
  const eventId = uid('event_')
  const now = new Date().toISOString()
  const event = {
    id: eventId,
    name: eventName || `מסיבת הרווקות של ${brideName}`,
    bride_name: brideName,
    destination: destination || '',
    start_date: startDate || '',
    end_date: endDate || '',
    cover_image_url: coverImageUrl || null,
    theme_style: themeStyle || null,
    created_by: ownerId,
    estimated_guests: estimatedGuests || null,
    created_at: now,
    updated_at: now,
  }
  const member = {
    id: uid('member_'),
    event_id: eventId,
    user_id: ownerId,
    role: 'owner',
    display_name: brideName,
    avatar_url: null,
    phone: null,
    email: null,
    joined_at: now,
  }
  const bundle = {
    trip: event,   // kept as 'trip' internally for backward compat with schedule service
    event,
    members: [member],
    invites: [],
    groupMessages: [],
    privateChats: {},
    scheduleItemsV2: [],
    scheduleDays: [],
    scheduleAttendance: [],
    savedPlaces: [],
    albums: [],
    photos: [],
  }
  saveBundle(eventId, bundle)
  setActiveEventId(eventId)
  return { event, member }
}

export function getEventById(eventId) {
  return loadBundle(eventId)?.event || null
}

export function updateEvent(eventId, updates) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  bundle.event = { ...bundle.event, ...updates, updated_at: new Date().toISOString() }
  bundle.trip  = bundle.event
  saveBundle(eventId, bundle)
  return bundle.event
}

// ── Memberships ───────────────────────────────────────────────────────────────

export function getAllEventsForUser(userId) {
  const app = loadApp()
  const results = []
  for (const [, bundle] of Object.entries(app.events || {})) {
    const member = bundle.members?.find(m => m.user_id === userId)
    if (member) {
      results.push({ event: bundle.event, member })
    }
  }
  return results
}

export function getActiveBundleForUser(userId) {
  const activeId = getActiveEventId()
  if (activeId) {
    const bundle = loadBundle(activeId)
    if (bundle) {
      const member = bundle.members?.find(m => m.user_id === userId)
      if (member) {
        return { event: bundle.event, trip: bundle.event, members: bundle.members, member }
      }
    }
  }
  // Fall back: find any membership
  const memberships = getAllEventsForUser(userId)
  if (memberships.length === 1) {
    const { event, member } = memberships[0]
    const bundle = loadBundle(event.id)
    setActiveEventId(event.id)
    return { event, trip: event, members: bundle.members, member }
  }
  return null
}

export function getMembers(eventId) {
  return loadBundle(eventId)?.members || []
}

export function updateMember(eventId, userId, updates) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  bundle.members = bundle.members.map(m => m.user_id === userId ? { ...m, ...updates } : m)
  saveBundle(eventId, bundle)
  return bundle.members.find(m => m.user_id === userId)
}

export function setMemberRole(eventId, targetUserId, newRole) {
  // owner role cannot be granted to a guest by non-owner logic — callers must validate
  if (!['admin', 'guest'].includes(newRole)) return null
  return updateMember(eventId, targetUserId, { role: newRole })
}

// ── Invites ───────────────────────────────────────────────────────────────────

export function generateInvite(eventId, createdBy) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  const invite = {
    id: uid('invite_'),
    event_id: eventId,
    trip_id: eventId,
    token: tok6(),
    created_by: createdBy,
    expires_at: null,
    max_uses: null,
    current_uses: 0,
    created_at: new Date().toISOString(),
  }
  bundle.invites = [...(bundle.invites || []), invite]
  saveBundle(eventId, bundle)
  return invite
}

export function getInviteByToken(token) {
  const app = loadApp()
  for (const [, bundle] of Object.entries(app.events || {})) {
    const invite = bundle.invites?.find(i => i.token === token)
    if (invite) {
      const bride = bundle.members?.find(m => m.role === 'owner')
      return { invite, event: bundle.event, trip: bundle.event, bride }
    }
  }
  return null
}

export function acceptInvite(token, { userId, displayName, email, phone, avatarUrl }) {
  const app = loadApp()
  for (const [eventId, bundle] of Object.entries(app.events || {})) {
    const invite = bundle.invites?.find(i => i.token === token)
    if (!invite) continue
    const existing = bundle.members?.find(m => m.user_id === userId)
    if (existing) {
      setActiveEventId(eventId)
      return { member: existing, alreadyMember: true }
    }
    const member = {
      id: uid('member_'),
      event_id: eventId,
      trip_id: eventId,
      user_id: userId,
      role: 'guest',
      display_name: displayName,
      avatar_url: avatarUrl || null,
      phone: phone || null,
      email: email || null,
      joined_at: new Date().toISOString(),
    }
    bundle.members = [...(bundle.members || []), member]
    invite.current_uses = (invite.current_uses || 0) + 1
    saveBundle(eventId, bundle)
    setActiveEventId(eventId)
    return { member }
  }
  return { error: 'invalid_token' }
}

// ── Permissions helper ────────────────────────────────────────────────────────

export function getEventPermissions(role) {
  const isOwner = role === 'owner'
  const isAdmin = role === 'admin'
  return {
    canManageEvent:     isOwner,
    canManageSchedule:  isOwner || isAdmin,
    canInviteFriends:   isOwner,
    canManageMembers:   isOwner,
    canGrantAdmin:      isOwner,
    canSendMessages:    true,
    canUploadPhotos:    true,
    canAddPlaces:       true,
    canEditOwnProfile:  true,
    // legacy aliases used by existing pages
    canEditSchedule:    isOwner || isAdmin,
    canModerateContent: isOwner,
    canOpenPrivateChatWithBride: role === 'guest',
  }
}

// ── Group chat ────────────────────────────────────────────────────────────────

export function getGroupMessages(eventId) {
  return loadBundle(eventId)?.groupMessages || []
}

export function sendGroupMessage(eventId, msg) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  const message = { id: uid('msg_'), created_at: new Date().toISOString(), ...msg }
  bundle.groupMessages = [...(bundle.groupMessages || []), message]
  saveBundle(eventId, bundle)
  return message
}

// ── Private chats ─────────────────────────────────────────────────────────────

export function getOrCreatePrivateChat(eventId, userAId, userBId) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  const chatId = [userAId, userBId].sort().join('__')
  if (!bundle.privateChats) bundle.privateChats = {}
  if (!bundle.privateChats[chatId]) {
    bundle.privateChats[chatId] = { id: chatId, participants: [userAId, userBId], messages: [] }
  }
  saveBundle(eventId, bundle)
  return bundle.privateChats[chatId]
}

export function sendPrivateMessage(eventId, chatId, msg) {
  const bundle = loadBundle(eventId)
  if (!bundle?.privateChats?.[chatId]) return null
  const message = { id: uid('pmsg_'), created_at: new Date().toISOString(), ...msg }
  bundle.privateChats[chatId].messages.push(message)
  saveBundle(eventId, bundle)
  return message
}

export function getPrivateChat(eventId, chatId) {
  return loadBundle(eventId)?.privateChats?.[chatId] || null
}

// ── Schedule Days ─────────────────────────────────────────────────────────────

function buildDefaultDays(event) {
  if (!event?.start_date || !event?.end_date) return []
  const start = new Date(event.start_date)
  const end   = new Date(event.end_date)
  const days  = []
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const dayKeys  = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  let cur = new Date(start)
  let i = 0
  while (cur <= end && i < 10) {
    const dow = cur.getDay()
    days.push({
      id: `day_${dayKeys[dow]}_${i}`,
      event_id: event.id,
      trip_id:  event.id,
      day_key:  dayKeys[dow],
      label:    dayNames[dow],
      date:     cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      iso_date: cur.toISOString().split('T')[0],
      sort_order: i,
    })
    cur.setDate(cur.getDate() + 1)
    i++
  }
  return days
}

export function getScheduleDays(eventId) {
  const bundle = loadBundle(eventId)
  if (!bundle) return []
  if (bundle.scheduleDays?.length) {
    return [...bundle.scheduleDays].sort((a, b) => a.sort_order - b.sort_order)
  }
  return buildDefaultDays(bundle.event)
}

export function createScheduleDay(eventId, dayData) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  if (!bundle.scheduleDays) bundle.scheduleDays = []
  const day = { id: uid('day_'), event_id: eventId, trip_id: eventId, created_at: new Date().toISOString(), ...dayData }
  bundle.scheduleDays.push(day)
  saveBundle(eventId, bundle)
  return day
}

export function updateScheduleDay(eventId, dayId, updates) {
  const bundle = loadBundle(eventId)
  if (!bundle?.scheduleDays) return null
  bundle.scheduleDays = bundle.scheduleDays.map(d =>
    d.id === dayId ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
  )
  saveBundle(eventId, bundle)
  return bundle.scheduleDays.find(d => d.id === dayId)
}

export function deleteScheduleDay(eventId, dayId) {
  const bundle = loadBundle(eventId)
  if (!bundle) return
  bundle.scheduleDays = (bundle.scheduleDays || []).filter(d => d.id !== dayId)
  bundle.scheduleItemsV2 = (bundle.scheduleItemsV2 || []).filter(i => i.day_id !== dayId)
  saveBundle(eventId, bundle)
}

// ── Schedule Items ────────────────────────────────────────────────────────────

function ensureItemsV2(bundle) {
  if (!bundle.scheduleItemsV2 || bundle.scheduleItemsV2.length === 0) {
    bundle.scheduleItemsV2 = _buildDemoItems(bundle.event?.id)
  }
}

function _buildDemoItems(eventId) {
  const now = new Date().toISOString()
  const mk = o => ({ id: uid('sched_'), event_id: eventId, trip_id: eventId, image_url: null, reminder_enabled: false, reminder_minutes_before: 60, created_by: 'demo', updated_by: 'demo', created_at: now, updated_at: now, ...o })
  const days = getScheduleDays(eventId)
  const fridayDay = days.find(d => d.day_key === 'fri') || days[1] || days[0]
  if (!fridayDay) return []
  return [
    mk({ day_id: fridayDay.id, day_key: fridayDay.day_key, sort_order: 1, title: 'בוקר ספא 🕊️', description: 'טיפולים מפנקים ורגיעה', place_name: 'Esperos Spa & Wellness', category: 'spa', icon: 'leaf', starts_at: `${fridayDay.iso_date}T09:00:00`, reminder_enabled: true, reminder_minutes_before: 60, distance_km_from_hotel: 9.4, drive_time_minutes_from_hotel: 18 }),
    mk({ day_id: fridayDay.id, day_key: fridayDay.day_key, sort_order: 2, title: 'בראנץ׳ חוף ☀️',  description: 'בוקר רגוע מול הים', place_name: 'Beach Café', category: 'food', icon: 'sun', starts_at: `${fridayDay.iso_date}T10:00:00`, reminder_enabled: true, reminder_minutes_before: 60, distance_km_from_hotel: 4.2, drive_time_minutes_from_hotel: 12 }),
    mk({ day_id: fridayDay.id, day_key: fridayDay.day_key, sort_order: 3, title: 'שייט יאכטה 🌊', description: 'שייט פרטי מסביב לאי', place_name: 'Marina', category: 'sea', icon: 'ship', starts_at: `${fridayDay.iso_date}T13:30:00`, distance_km_from_hotel: 2.8, drive_time_minutes_from_hotel: 9 }),
    mk({ day_id: fridayDay.id, day_key: fridayDay.day_key, sort_order: 4, title: 'ארוחת שקיעה 🍷',  description: 'ארוחה רומנטית', place_name: 'Rooftop Restaurant', category: 'food', icon: 'wine', starts_at: `${fridayDay.iso_date}T18:30:00`, distance_km_from_hotel: 48, drive_time_minutes_from_hotel: 54 }),
    mk({ day_id: fridayDay.id, day_key: fridayDay.day_key, sort_order: 5, title: 'מסיבת לילה ✨',   description: 'מסיבה מושלמת', place_name: 'Skybar', category: 'party', icon: 'sparkles', starts_at: `${fridayDay.iso_date}T21:30:00`, distance_km_from_hotel: 1.6, drive_time_minutes_from_hotel: 6 }),
  ]
}

export function getScheduleItemsByDay(eventId, dayId) {
  const bundle = loadBundle(eventId)
  if (!bundle) return []
  ensureItemsV2(bundle)
  saveBundle(eventId, bundle)
  return (bundle.scheduleItemsV2 || [])
    .filter(i => i.day_id === dayId)
    .sort((a, b) => {
      if (a.starts_at && b.starts_at) return new Date(a.starts_at) - new Date(b.starts_at)
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
}

export function createScheduleItem(eventId, itemData) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  ensureItemsV2(bundle)
  const item = { id: uid('sched_'), event_id: eventId, trip_id: eventId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...itemData }
  bundle.scheduleItemsV2.push(item)
  saveBundle(eventId, bundle)
  return item
}

export function updateScheduleItem(eventId, id, updates) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  ensureItemsV2(bundle)
  bundle.scheduleItemsV2 = bundle.scheduleItemsV2.map(i =>
    i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
  )
  saveBundle(eventId, bundle)
  return bundle.scheduleItemsV2.find(i => i.id === id)
}

export function removeScheduleItem(eventId, id) {
  const bundle = loadBundle(eventId)
  if (!bundle) return
  bundle.scheduleItemsV2 = (bundle.scheduleItemsV2 || []).filter(i => i.id !== id)
  saveBundle(eventId, bundle)
}

export function duplicateScheduleItem(eventId, id) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  ensureItemsV2(bundle)
  const orig = bundle.scheduleItemsV2.find(i => i.id === id)
  if (!orig) return null
  const copy = { ...orig, id: uid('sched_'), title: `עותק של ${orig.title}`, sort_order: (orig.sort_order || 0) + 0.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  bundle.scheduleItemsV2.push(copy)
  saveBundle(eventId, bundle)
  return copy
}

// ── Schedule Attendance ───────────────────────────────────────────────────────

export function setScheduleAttendance(eventId, scheduleItemId, userId, response) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  if (!bundle.scheduleAttendance) bundle.scheduleAttendance = []
  const now = new Date().toISOString()
  const idx = bundle.scheduleAttendance.findIndex(a => a.schedule_item_id === scheduleItemId && a.user_id === userId)
  if (idx >= 0) {
    bundle.scheduleAttendance[idx] = { ...bundle.scheduleAttendance[idx], response, updated_at: now }
  } else {
    bundle.scheduleAttendance.push({ id: uid('att_'), schedule_item_id: scheduleItemId, event_id: eventId, user_id: userId, response, created_at: now, updated_at: now })
  }
  saveBundle(eventId, bundle)
  return response
}

export function getScheduleAttendance(eventId, scheduleItemId) {
  return (loadBundle(eventId)?.scheduleAttendance || []).filter(a => a.schedule_item_id === scheduleItemId)
}

// ── Schedule system chat messages ─────────────────────────────────────────────

export function createScheduleChangeChatMessage(eventId, { action, title, details }) {
  const texts = {
    created:       `✨ נוספה פעילות חדשה ללו״ז: ${title}`,
    deleted:       `🗑️ הפעילות '${title}' הוסרה מהלו״ז`,
    updated_title: `✨ עדכון בלו״ז: שם הפעילות עודכן ל־'${title}'`,
    updated_time:  `⏰ עדכון בלו״ז: השעה של '${title}' עודכנה ל־${details || ''}`,
    updated_place: `📍 עדכון מיקום: '${title}' תתקיים ב־${details || ''}`,
  }
  return sendGroupMessage(eventId, {
    sender_user_id: 'system',
    sender_display_name: 'לו״ז',
    body: texts[action] || `✨ עדכון בלו״ז: ${title}`,
    type: 'system',
    metadata: { source: 'schedule', action },
  })
}

// ── Places ────────────────────────────────────────────────────────────────────

export function getSavedPlaces(eventId) {
  return loadBundle(eventId)?.savedPlaces || []
}

export function addSavedPlace(eventId, place) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  const item = { id: uid('place_'), created_at: new Date().toISOString(), ...place }
  bundle.savedPlaces = [...(bundle.savedPlaces || []), item]
  saveBundle(eventId, bundle)
  return item
}

// ── Albums + Photos ───────────────────────────────────────────────────────────

export function getAlbums(eventId) {
  return loadBundle(eventId)?.albums || []
}

export function createAlbum(eventId, album) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  const item = { id: uid('album_'), created_at: new Date().toISOString(), ...album }
  bundle.albums = [...(bundle.albums || []), item]
  saveBundle(eventId, bundle)
  return item
}

export function getPhotos(eventId, albumId = null) {
  const photos = loadBundle(eventId)?.photos || []
  return albumId ? photos.filter(p => p.album_id === albumId) : photos
}

export function addPhoto(eventId, photo) {
  const bundle = loadBundle(eventId)
  if (!bundle) return null
  const item = { id: uid('photo_'), created_at: new Date().toISOString(), ...photo }
  bundle.photos = [...(bundle.photos || []), item]
  saveBundle(eventId, bundle)
  return item
}
