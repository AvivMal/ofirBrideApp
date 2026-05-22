// All trip data operations — localStorage in demo/mock mode.
// Replace each function body with the Supabase equivalent for production.

const TRIP_KEY = 'rba_trip_data'
const USER_KEY = 'rba_demo_user'

function uid(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9)
}

function tok6() {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

function load() {
  try { return JSON.parse(localStorage.getItem(TRIP_KEY)) } catch { return null }
}

function save(data) {
  localStorage.setItem(TRIP_KEY, JSON.stringify(data))
}

// ── Demo user ────────────────────────────────────────────────────────────────

export function loadDemoUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export function saveDemoUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearDemoUser() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TRIP_KEY)
}

// ── Trip ─────────────────────────────────────────────────────────────────────

export function createTrip(ownerId, { brideName, name, destination, startDate, endDate, estimatedGuests }) {
  const tripId = uid('trip_')
  const trip = {
    id: tripId,
    name: name || 'Rhodes Bachelorette',
    bride_name: brideName,
    destination: destination || 'Rhodes, Greece',
    start_date: startDate || '2026-06-06',
    end_date: endDate || '2026-06-09',
    owner_id: ownerId,
    cover_image_url: null,
    estimated_guests: estimatedGuests || null,
    created_at: new Date().toISOString(),
  }
  const member = {
    id: uid('member_'),
    trip_id: tripId,
    user_id: ownerId,
    role: 'owner',
    display_name: brideName,
    avatar_url: null,
    phone: null,
    email: null,
    joined_at: new Date().toISOString(),
  }
  save({
    trip,
    members: [member],
    invites: [],
    groupMessages: [],
    privateChats: {},
    scheduleItems: { thu: [], fri: [], sat: [], sun: [] },
    savedPlaces: [],
    albums: [],
    photos: [],
  })
  return { trip, member }
}

export function getActiveTripForUser(userId) {
  const data = load()
  if (!data) return null
  const member = data.members?.find(m => m.user_id === userId)
  if (!member) return null
  return { trip: data.trip, members: data.members, member }
}

// ── Invites ──────────────────────────────────────────────────────────────────

export function generateInvite(tripId, createdBy) {
  const data = load()
  if (!data) return null
  const invite = {
    id: uid('invite_'),
    trip_id: tripId,
    token: tok6(),
    created_by: createdBy,
    expires_at: null,
    max_uses: null,
    current_uses: 0,
    created_at: new Date().toISOString(),
  }
  data.invites = [...(data.invites || []), invite]
  save(data)
  return invite
}

export function getInviteByToken(token) {
  const data = load()
  if (!data) return null
  const invite = data.invites?.find(i => i.token === token)
  if (!invite) return null
  const bride = data.members?.find(m => m.role === 'owner')
  return { invite, trip: data.trip, bride }
}

export function acceptInvite(token, { userId, displayName, email, phone, avatarUrl }) {
  const data = load()
  if (!data) return { error: 'no_data' }
  const invite = data.invites?.find(i => i.token === token)
  if (!invite) return { error: 'invalid_token' }
  const existing = data.members?.find(m => m.user_id === userId)
  if (existing) return { member: existing, alreadyMember: true }
  const member = {
    id: uid('member_'),
    trip_id: data.trip.id,
    user_id: userId,
    role: 'guest',
    display_name: displayName,
    avatar_url: avatarUrl || null,
    phone: phone || null,
    email: email || null,
    joined_at: new Date().toISOString(),
  }
  data.members = [...(data.members || []), member]
  invite.current_uses = (invite.current_uses || 0) + 1
  save(data)
  return { member }
}

// ── Members ──────────────────────────────────────────────────────────────────

export function getMembers() {
  return load()?.members || []
}

export function updateMember(userId, updates) {
  const data = load()
  if (!data) return null
  data.members = data.members.map(m => m.user_id === userId ? { ...m, ...updates } : m)
  save(data)
  return data.members.find(m => m.user_id === userId)
}

// ── Group chat ───────────────────────────────────────────────────────────────

export function getGroupMessages() {
  return load()?.groupMessages || []
}

export function sendGroupMessage(msg) {
  const data = load()
  if (!data) return null
  const message = { id: uid('msg_'), created_at: new Date().toISOString(), ...msg }
  data.groupMessages = [...(data.groupMessages || []), message]
  save(data)
  return message
}

// ── Private chats ────────────────────────────────────────────────────────────

export function getOrCreatePrivateChat(userAId, userBId) {
  const data = load()
  if (!data) return null
  const chatId = [userAId, userBId].sort().join('__')
  if (!data.privateChats) data.privateChats = {}
  if (!data.privateChats[chatId]) {
    data.privateChats[chatId] = { id: chatId, participants: [userAId, userBId], messages: [] }
  }
  save(data)
  return data.privateChats[chatId]
}

export function sendPrivateMessage(chatId, msg) {
  const data = load()
  if (!data?.privateChats?.[chatId]) return null
  const message = { id: uid('pmsg_'), created_at: new Date().toISOString(), ...msg }
  data.privateChats[chatId].messages.push(message)
  save(data)
  return message
}

export function getPrivateChat(chatId) {
  return load()?.privateChats?.[chatId] || null
}

// ── Schedule ─────────────────────────────────────────────────────────────────

export function getScheduleItems() {
  return load()?.scheduleItems || { thu: [], fri: [], sat: [], sun: [] }
}

export function addScheduleItem(day, item) {
  const data = load()
  if (!data) return null
  if (!data.scheduleItems) data.scheduleItems = { thu: [], fri: [], sat: [], sun: [] }
  const newItem = { id: uid('item_'), ...item }
  data.scheduleItems[day] = [...(data.scheduleItems[day] || []), newItem]
  save(data)
  return newItem
}

export function deleteScheduleItem(day, itemId) {
  const data = load()
  if (!data) return
  data.scheduleItems[day] = (data.scheduleItems[day] || []).filter(i => i.id !== itemId)
  save(data)
}

// ── Schedule Days (V2) ───────────────────────────────────────────────────────
// Future Supabase table: schedule_days
// Columns: id uuid, trip_id uuid, day_key text, label text, date text, iso_date date, sort_order int, created_at, updated_at

const DEFAULT_SCHEDULE_DAYS = [
  { id: 'day_thu', day_key: 'thu', label: 'חמישי', date: 'Jun 6', iso_date: '2026-06-06', sort_order: 0 },
  { id: 'day_fri', day_key: 'fri', label: 'שישי',  date: 'Jun 7', iso_date: '2026-06-07', sort_order: 1 },
  { id: 'day_sat', day_key: 'sat', label: 'שבת',   date: 'Jun 8', iso_date: '2026-06-08', sort_order: 2 },
  { id: 'day_sun', day_key: 'sun', label: 'ראשון', date: 'Jun 9', iso_date: '2026-06-09', sort_order: 3 },
]

export function getScheduleDays() {
  const data = load()
  if (!data) return DEFAULT_SCHEDULE_DAYS
  if (!data.scheduleDays?.length) {
    return DEFAULT_SCHEDULE_DAYS.map(d => ({ ...d, trip_id: data.trip?.id }))
  }
  return [...data.scheduleDays].sort((a, b) => a.sort_order - b.sort_order)
}

export function createScheduleDay(dayData) {
  const data = load()
  if (!data) return null
  if (!data.scheduleDays) data.scheduleDays = []
  const day = { id: uid('day_'), trip_id: data.trip?.id, created_at: new Date().toISOString(), ...dayData }
  data.scheduleDays.push(day)
  save(data)
  return day
}

export function updateScheduleDay(dayId, updates) {
  const data = load()
  if (!data?.scheduleDays) return null
  data.scheduleDays = data.scheduleDays.map(d =>
    d.id === dayId ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
  )
  save(data)
  return data.scheduleDays.find(d => d.id === dayId)
}

export function deleteScheduleDay(dayId) {
  const data = load()
  if (!data) return
  data.scheduleDays = (data.scheduleDays || []).filter(d => d.id !== dayId)
  data.scheduleItemsV2 = (data.scheduleItemsV2 || []).filter(i => i.day_id !== dayId)
  save(data)
}

// ── Schedule Items (V2) ───────────────────────────────────────────────────────
// Future Supabase table: schedule_items
// Columns: id, trip_id, day_id, day_key, title, description, place_name, google_maps_url,
//   category, icon, image_url, starts_at timestamptz, reminder_enabled bool,
//   reminder_minutes_before int, distance_km_from_hotel numeric,
//   drive_time_minutes_from_hotel int, created_by, updated_by, sort_order, created_at, updated_at

// calculateDistanceFromHotel: placeholder for Google Maps Distance Matrix API / Routes API
// TODO: connect via https://developers.google.com/maps/documentation/distance-matrix
// eslint-disable-next-line no-unused-vars
export function calculateDistanceFromHotel(_activityPlace, _hotelPlace) {
  return null
}

function _buildDemoItems(tripId) {
  const now = new Date().toISOString()
  const mk = o => ({ id: uid('sched_'), trip_id: tripId, image_url: null, reminder_enabled: false, reminder_minutes_before: 60, created_by: 'demo', updated_by: 'demo', created_at: now, updated_at: now, ...o })
  return [
    mk({ day_id: 'day_fri', day_key: 'fri', sort_order: 1, title: 'בוקר ספא 🕊️', description: 'טיפולים מפנקים ורגיעה', place_name: 'Esperos Spa & Wellness', google_maps_url: 'https://maps.google.com/?q=Esperos+Palace+Hotel+Rhodes', category: 'spa', icon: 'leaf', starts_at: '2026-06-07T09:00:00', reminder_enabled: true, reminder_minutes_before: 60, distance_km_from_hotel: 9.4, drive_time_minutes_from_hotel: 18 }),
    mk({ day_id: 'day_fri', day_key: 'fri', sort_order: 2, title: 'בראנץ׳ חוף ☀️', description: 'בוקר רגוע מול הים', place_name: 'Kallithea Springs Beach', google_maps_url: 'https://maps.google.com/?q=Kallithea+Springs+Beach+Rhodes', category: 'food', icon: 'sun', starts_at: '2026-06-07T10:00:00', reminder_enabled: true, reminder_minutes_before: 60, distance_km_from_hotel: 4.2, drive_time_minutes_from_hotel: 12 }),
    mk({ day_id: 'day_fri', day_key: 'fri', sort_order: 3, title: 'שייט יאכטה 🌊', description: 'שייט פרטי מסביב לאי', place_name: 'Rhodes Marina', google_maps_url: 'https://maps.google.com/?q=Rhodes+Marina+Greece', category: 'sea', icon: 'ship', starts_at: '2026-06-07T13:30:00', distance_km_from_hotel: 2.8, drive_time_minutes_from_hotel: 9 }),
    mk({ day_id: 'day_fri', day_key: 'fri', sort_order: 4, title: 'ארוחת שקיעה 🍷', description: 'ארוחה רומנטית על צוקי לינדוס', place_name: 'Lindos Cliffside', google_maps_url: 'https://maps.google.com/?q=Lindos+Rhodes+Greece', category: 'food', icon: 'wine', starts_at: '2026-06-07T18:30:00', distance_km_from_hotel: 48, drive_time_minutes_from_hotel: 54 }),
    mk({ day_id: 'day_fri', day_key: 'fri', sort_order: 5, title: 'מסיבת רופטופ ✨', description: 'מסיבת לילה על הגג עם נוף עוצר נשימה', place_name: 'Skybar Rhodes', google_maps_url: 'https://maps.google.com/?q=Skybar+Rhodes+Greece', category: 'party', icon: 'sparkles', starts_at: '2026-06-07T21:30:00', distance_km_from_hotel: 1.6, drive_time_minutes_from_hotel: 6 }),
  ]
}

function ensureItemsV2(data) {
  if (!data.scheduleItemsV2) {
    data.scheduleItemsV2 = _buildDemoItems(data.trip?.id)
    save(data)
  }
}

export function getScheduleItemsByDay(dayId) {
  const data = load()
  if (!data) return []
  ensureItemsV2(data)
  return (data.scheduleItemsV2 || [])
    .filter(i => i.day_id === dayId)
    .sort((a, b) => {
      if (a.starts_at && b.starts_at) return new Date(a.starts_at) - new Date(b.starts_at)
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
}

export function createScheduleItem(itemData) {
  const data = load()
  if (!data) return null
  ensureItemsV2(data)
  const item = { id: uid('sched_'), trip_id: data.trip?.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...itemData }
  data.scheduleItemsV2.push(item)
  save(data)
  return item
}

export function updateScheduleItem(id, updates) {
  const data = load()
  if (!data) return null
  ensureItemsV2(data)
  data.scheduleItemsV2 = data.scheduleItemsV2.map(i =>
    i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
  )
  save(data)
  return data.scheduleItemsV2.find(i => i.id === id)
}

export function removeScheduleItem(id) {
  const data = load()
  if (!data) return
  data.scheduleItemsV2 = (data.scheduleItemsV2 || []).filter(i => i.id !== id)
  save(data)
}

export function duplicateScheduleItem(id) {
  const data = load()
  if (!data) return null
  ensureItemsV2(data)
  const orig = data.scheduleItemsV2.find(i => i.id === id)
  if (!orig) return null
  const copy = { ...orig, id: uid('sched_'), title: `עותק של ${orig.title}`, sort_order: (orig.sort_order || 0) + 0.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  data.scheduleItemsV2.push(copy)
  save(data)
  return copy
}

// ── Schedule Attendance ───────────────────────────────────────────────────────
// Future Supabase table: schedule_attendance
// Columns: id, trip_id, schedule_item_id, user_id, response ('coming'|'not_coming'), created_at, updated_at
// RLS: all members can read; members can only write their own row

export function setScheduleAttendance(scheduleItemId, userId, response) {
  const data = load()
  if (!data) return null
  if (!data.scheduleAttendance) data.scheduleAttendance = []
  const now = new Date().toISOString()
  const idx = data.scheduleAttendance.findIndex(a => a.schedule_item_id === scheduleItemId && a.user_id === userId)
  if (idx >= 0) {
    data.scheduleAttendance[idx] = { ...data.scheduleAttendance[idx], response, updated_at: now }
  } else {
    data.scheduleAttendance.push({ id: uid('att_'), schedule_item_id: scheduleItemId, trip_id: data.trip?.id, user_id: userId, response, created_at: now, updated_at: now })
  }
  save(data)
  return response
}

export function getScheduleAttendance(scheduleItemId) {
  return (load()?.scheduleAttendance || []).filter(a => a.schedule_item_id === scheduleItemId)
}

// ── Schedule System Chat Messages ─────────────────────────────────────────────

export function createScheduleChangeChatMessage({ action, title, details }) {
  const texts = {
    created:       `✨ נוספה פעילות חדשה ללו״ז: ${title}`,
    deleted:       `🗑️ הפעילות '${title}' הוסרה מהלו״ז`,
    updated_title: `✨ עדכון בלו״ז: שם הפעילות עודכן ל־'${title}'`,
    updated_time:  `⏰ עדכון בלו״ז: השעה של '${title}' עודכנה ל־${details || ''}`,
    updated_place: `📍 עדכון מיקום: '${title}' תתקיים ב־${details || ''}`,
  }
  return sendGroupMessage({
    sender_user_id: 'system',
    sender_display_name: 'לו״ז',
    body: texts[action] || `✨ עדכון בלו״ז: ${title}`,
    type: 'system',
    metadata: { source: 'schedule', action },
  })
}

// ── Places ───────────────────────────────────────────────────────────────────

export function getSavedPlaces() {
  return load()?.savedPlaces || []
}

export function addSavedPlace(place) {
  const data = load()
  if (!data) return null
  const item = { id: uid('place_'), created_at: new Date().toISOString(), ...place }
  data.savedPlaces = [...(data.savedPlaces || []), item]
  save(data)
  return item
}

// ── Albums + Photos ──────────────────────────────────────────────────────────

export function getAlbums() {
  return load()?.albums || []
}

export function createAlbum(album) {
  const data = load()
  if (!data) return null
  const item = { id: uid('album_'), created_at: new Date().toISOString(), ...album }
  data.albums = [...(data.albums || []), item]
  save(data)
  return item
}

export function getPhotos(albumId = null) {
  const photos = load()?.photos || []
  return albumId ? photos.filter(p => p.album_id === albumId) : photos
}

export function addPhoto(photo) {
  const data = load()
  if (!data) return null
  const item = { id: uid('photo_'), created_at: new Date().toISOString(), ...photo }
  data.photos = [...(data.photos || []), item]
  save(data)
  return item
}
