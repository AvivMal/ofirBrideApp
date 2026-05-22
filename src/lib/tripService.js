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
