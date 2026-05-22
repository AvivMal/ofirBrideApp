// Static reference data (non-trip-specific).
// Live trip data (members, messages, schedule, places, photos) is managed by
// src/lib/tripService.js and persisted in localStorage.

export const scheduleDays = [
  { id: 'd1', label: 'חמישי', date: 'יוני 6',  value: 'thu' },
  { id: 'd2', label: 'שישי',  date: 'יוני 7',  value: 'fri' },
  { id: 'd3', label: 'שבת',   date: 'יוני 8',  value: 'sat' },
  { id: 'd4', label: 'ראשון', date: 'יוני 9',  value: 'sun' },
]

// Kept for backwards compat; real data comes from tripService.getScheduleItems()
export const scheduleItems = { thu: [], fri: [], sat: [], sun: [] }

// Kept for backwards compat; real data comes from tripService.getMembers()
export const participants = []

export const chatMessages = []
export const savedPlaces  = []
export const memories     = []

// ── Memory albums — seeded automatically by memoriesService on first visit ────
export const memoryAlbums = [
  { title: 'לילה ראשון ✨',      icon: 'sparkles', description: 'הלילה שפתח את הסופ״ש',  gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { title: 'יום יאכטה 🌊',       icon: 'waves',    description: 'שייט מסביב לאי',          gradient: 'linear-gradient(135deg,#2dd4bf,#0ea5e9)' },
  { title: 'ארוחת שקיעה 🍷',     icon: 'wine',     description: 'ארוחה רומנטית',            gradient: 'linear-gradient(135deg,#f97316,#ec4899)' },
  { title: 'רופטופ 💃',           icon: 'music',    description: 'מסיבת לילה על הגג',        gradient: 'linear-gradient(135deg,#a855f7,#ec4899)' },
  { title: 'מאחורי הקלעים 🤍',   icon: 'camera',   description: 'הרגעים הכי אמיתיים',      gradient: 'linear-gradient(135deg,#6b7280,#9ca3af)' },
]

// ── Data shape reference ───────────────────────────────────────────────────────
// event:  { id, name, bride_name, destination, start_date, end_date, created_by, cover_image_url, estimated_guests, created_at }
// member: { id, event_id, user_id, role:'owner'|'admin'|'guest', display_name, avatar_url, phone, email, joined_at }
// invite: { id, event_id, token, created_by, expires_at, max_uses, current_uses, created_at }
// message: { id, event_id, sender_user_id, sender_display_name, body, type:'text'|'system'|'voice'|'photos', metadata?, created_at }
// place: { id, event_id, title, description, category, location_name, map_url, added_by, added_by_name, created_at }
// memory_album: { id, event_id, title, description, icon, gradient, cover_photo_url, created_by, created_by_display_name, created_at }
// memory_photo: { id, event_id, album_id, image_url, thumbnail_url, gradient, emoji, caption, uploaded_by, uploaded_by_display_name, is_bride_pick, favorite_count, created_at }
// photo_favorite: { id, event_id, photo_id, user_id, created_at }
// photo_reaction: { id, event_id, photo_id, user_id, reaction_text, created_at }
