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

// ── Data shape reference (used by tripService internally) ────────────────────

// trip: { id, name, bride_name, destination, start_date, end_date, owner_id, cover_image_url, estimated_guests, created_at }
// member: { id, trip_id, user_id, role:'owner'|'guest', display_name, avatar_url, phone, email, joined_at }
// invite: { id, trip_id, token, created_by, expires_at, max_uses, current_uses, created_at }
// message: { id, trip_id, chat_id?, sender_user_id, sender_display_name, sender_avatar_url, body, type:'text'|'system'|'voice'|'location'|'photos', metadata?, created_at }
// place: { id, trip_id, title, description, category, location_name, map_url, added_by, added_by_name, created_at }
// album: { id, trip_id, title, cover_photo_url, created_by, created_by_name, created_at }
// photo: { id, trip_id, album_id, image_url, caption, uploaded_by, uploader_name, created_at }
