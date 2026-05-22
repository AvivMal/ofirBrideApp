// Legacy shim — delegates every call to eventService using the currently active event ID.
// Existing pages import this file and call functions without an eventId; this wrapper injects it.
import * as es from './eventService'

function activeId() {
  return es.getActiveEventId()
}

// ── Demo user ─────────────────────────────────────────────────────────────────
export const loadDemoUser  = es.loadDemoUser
export const saveDemoUser  = es.saveDemoUser
export const clearDemoUser = es.clearDemoUser

// ── Trip / event ──────────────────────────────────────────────────────────────
export function createTrip(ownerId, data)         { return es.createEvent(ownerId, data) }
export function getActiveTripForUser(userId)       { return es.getActiveBundleForUser(userId) }

// ── Members ───────────────────────────────────────────────────────────────────
export function getMembers()                       { return es.getMembers(activeId()) }
export function updateMember(userId, updates)      { return es.updateMember(activeId(), userId, updates) }

// ── Invites ───────────────────────────────────────────────────────────────────
export function generateInvite(tripId, createdBy)  { return es.generateInvite(tripId, createdBy) }
export function getInviteByToken(token)             { return es.getInviteByToken(token) }
export function acceptInvite(token, profile)        { return es.acceptInvite(token, profile) }

// ── Group chat ────────────────────────────────────────────────────────────────
export function getGroupMessages()                 { return es.getGroupMessages(activeId()) }
export function sendGroupMessage(msg)              { return es.sendGroupMessage(activeId(), msg) }

// ── Private chats ─────────────────────────────────────────────────────────────
export function getOrCreatePrivateChat(aId, bId)   { return es.getOrCreatePrivateChat(activeId(), aId, bId) }
export function sendPrivateMessage(chatId, msg)    { return es.sendPrivateMessage(activeId(), chatId, msg) }
export function getPrivateChat(chatId)             { return es.getPrivateChat(activeId(), chatId) }

// ── Schedule Days ─────────────────────────────────────────────────────────────
export function getScheduleDays()                  { return es.getScheduleDays(activeId()) }
export function createScheduleDay(d)               { return es.createScheduleDay(activeId(), d) }
export function updateScheduleDay(id, u)           { return es.updateScheduleDay(activeId(), id, u) }
export function deleteScheduleDay(id)              { return es.deleteScheduleDay(activeId(), id) }

// ── Schedule Items ────────────────────────────────────────────────────────────
export function getScheduleItemsByDay(dayId)       { return es.getScheduleItemsByDay(activeId(), dayId) }
export function createScheduleItem(data)           { return es.createScheduleItem(activeId(), data) }
export function updateScheduleItem(id, updates)    { return es.updateScheduleItem(activeId(), id, updates) }
export function removeScheduleItem(id)             { return es.removeScheduleItem(activeId(), id) }
export function duplicateScheduleItem(id)          { return es.duplicateScheduleItem(activeId(), id) }

// ── Attendance ────────────────────────────────────────────────────────────────
export function setScheduleAttendance(itemId, userId, response) {
  return es.setScheduleAttendance(activeId(), itemId, userId, response)
}
export function getScheduleAttendance(itemId)      { return es.getScheduleAttendance(activeId(), itemId) }

// ── System chat ───────────────────────────────────────────────────────────────
export function createScheduleChangeChatMessage(opts) {
  return es.createScheduleChangeChatMessage(activeId(), opts)
}

// ── Places ────────────────────────────────────────────────────────────────────
export function getSavedPlaces()                   { return es.getSavedPlaces(activeId()) }
export function addSavedPlace(place)               { return es.addSavedPlace(activeId(), place) }

// ── Albums + Photos ───────────────────────────────────────────────────────────
export function getAlbums()                        { return es.getAlbums(activeId()) }
export function createAlbum(album)                 { return es.createAlbum(activeId(), album) }
export function getPhotos(albumId)                 { return es.getPhotos(activeId(), albumId) }
export function addPhoto(photo)                    { return es.addPhoto(activeId(), photo) }

// ── Misc ──────────────────────────────────────────────────────────────────────
export function calculateDistanceFromHotel() { return null }
