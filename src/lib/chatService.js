// Chat service — group chat, private chats, pins, reactions, seen.
// Demo/localStorage mode. Replace internals with Supabase calls for production.
//
// Supabase tables: chats, chat_participants, chat_messages
// Realtime: supabase.channel('chat:'+chatId).on('postgres_changes', ...).subscribe()

const APP_KEY = 'rba_app_data'

function uid(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9)
}

function loadApp() {
  try { return JSON.parse(localStorage.getItem(APP_KEY)) || { events: {} } } catch { return { events: {} } }
}
function saveApp(data) {
  try { localStorage.setItem(APP_KEY, JSON.stringify(data)) } catch {
    console.warn('localStorage quota exceeded')
  }
}

function loadChat(eventId) {
  const app = loadApp()
  if (!app.events?.[eventId]) return null
  if (!app.events[eventId].chat) {
    app.events[eventId].chat = { messages: [], pins: [], reactions: {}, seen: {} }
    saveApp(app)
  }
  return app.events[eventId].chat
}
function saveChat(eventId, chat) {
  const app = loadApp()
  if (!app.events?.[eventId]) return
  app.events[eventId].chat = chat
  saveApp(app)
}

function loadPrivates(eventId) {
  const app = loadApp()
  if (!app.events?.[eventId]) return null
  if (!app.events[eventId].privateChats) {
    app.events[eventId].privateChats = {}
    saveApp(app)
  }
  return app.events[eventId].privateChats
}
function savePrivates(eventId, privates) {
  const app = loadApp()
  if (!app.events?.[eventId]) return
  app.events[eventId].privateChats = privates
  saveApp(app)
}

function privateChatKey(userA, userB) {
  return [userA, userB].sort().join('__')
}

// ── Seed demo group messages ──────────────────────────────────────────────────

function seedGroupChat(eventId, ownerName) {
  const now = Date.now()
  const name = ownerName || 'הכלה'
  return {
    messages: [
      _sysMsg(eventId, 'האירוע נוצר 🎉', now - 86400000 * 3),
      _textMsg(eventId, 'uid_owner', name, `היי חברות! כמה שאני מתרגשת 🥹`, now - 86400000 * 2),
      _textMsg(eventId, 'uid_g1', 'שירה', 'אנחנו איתך!! 💕', now - 86400000 * 2 + 60000),
      _textMsg(eventId, 'uid_g2', 'מיה', 'לא מאמינה שזה כבר מחר 🎊', now - 3600000),
      _textMsg(eventId, 'uid_owner', name, 'מחכה לכולן! תבואו עם אנרגיות 💃', now - 1800000),
    ],
    pins: [],
    reactions: {},
    seen: {},
  }
}

function _sysMsg(eventId, body, ts) {
  return { id: uid('msg_'), event_id: eventId, type: 'system', body, created_at: new Date(ts).toISOString() }
}
function _textMsg(eventId, senderId, senderName, body, ts) {
  return { id: uid('msg_'), event_id: eventId, type: 'text', sender_user_id: senderId, sender_display_name: senderName, sender_avatar_url: null, body, metadata: null, created_at: new Date(ts).toISOString() }
}

function ensureGroupSeeded(eventId, ownerName) {
  const app = loadApp()
  if (!app.events?.[eventId]) return
  if (!app.events[eventId].chat || app.events[eventId].chat.messages.length === 0) {
    app.events[eventId].chat = seedGroupChat(eventId, ownerName)
    saveApp(app)
  }
}

// ── Group chat ─────────────────────────────────────────────────────────────────

export function getGroupMessages(eventId, ownerName) {
  ensureGroupSeeded(eventId, ownerName)
  const chat = loadChat(eventId)
  if (!chat) return []
  return [...chat.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  // Supabase: await supabase.from('chat_messages').select('*').eq('trip_id', eventId).is('chat_id', null).order('created_at')
}

export function sendTextMessage(eventId, { senderId, senderName, senderAvatarUrl, body }) {
  const chat = loadChat(eventId)
  if (!chat) return null
  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'text',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body,
    metadata: null,
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export async function sendImageMessage(eventId, { senderId, senderName, senderAvatarUrl, files, caption }) {
  const chat = loadChat(eventId)
  if (!chat) return null

  const images = []
  for (const file of files) {
    if (file instanceof File) {
      try {
        const url = await readFileAsDataUrl(file)
        images.push({ url, name: file.name })
      } catch { images.push({ url: null, name: file.name }) }
    } else if (typeof file === 'string') {
      images.push({ url: file, name: 'image' })
    }
  }

  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'photos',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body: caption || '',
    metadata: { images },
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export function sendVoiceMessage(eventId, { senderId, senderName, senderAvatarUrl, audioDataUrl, durationSec }) {
  const chat = loadChat(eventId)
  if (!chat) return null
  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'voice',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body: '',
    metadata: { audioDataUrl, durationSec },
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export function sendLocationMessage(eventId, { senderId, senderName, senderAvatarUrl, locationName, address, mapUrl, lat, lng }) {
  const chat = loadChat(eventId)
  if (!chat) return null
  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'location',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body: locationName,
    metadata: { locationName, address, mapUrl, lat, lng },
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export function sendScheduleActivityMessage(eventId, { senderId, senderName, senderAvatarUrl, item }) {
  const chat = loadChat(eventId)
  if (!chat) return null
  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'event_card',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body: item.title,
    metadata: { item },
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export function sendEventReminderMessage(eventId, { senderId, senderName, senderAvatarUrl, title, subtitle, ctaLabel }) {
  const chat = loadChat(eventId)
  if (!chat) return null
  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'event_card',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body: title,
    metadata: { isReminder: true, title, subtitle, ctaLabel },
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export function sendSystemMessage(eventId, body) {
  const chat = loadChat(eventId)
  if (!chat) return null
  const msg = {
    id: uid('msg_'),
    event_id: eventId,
    type: 'system',
    body,
    metadata: null,
    created_at: new Date().toISOString(),
  }
  chat.messages.push(msg)
  saveChat(eventId, chat)
  return msg
}

export function deleteMessage(eventId, messageId) {
  const chat = loadChat(eventId)
  if (!chat) return
  chat.messages = chat.messages.filter(m => m.id !== messageId)
  chat.pins = chat.pins.filter(p => p !== messageId)
  delete chat.reactions[messageId]
  saveChat(eventId, chat)
}

// ── Pins ───────────────────────────────────────────────────────────────────────

export function getPinnedMessage(eventId) {
  const chat = loadChat(eventId)
  if (!chat || chat.pins.length === 0) return null
  const pinId = chat.pins[chat.pins.length - 1]
  return chat.messages.find(m => m.id === pinId) || null
}

export function pinMessage(eventId, messageId) {
  const chat = loadChat(eventId)
  if (!chat) return
  if (!chat.pins.includes(messageId)) chat.pins.push(messageId)
  saveChat(eventId, chat)
}

export function unpinMessage(eventId, messageId) {
  const chat = loadChat(eventId)
  if (!chat) return
  chat.pins = chat.pins.filter(p => p !== messageId)
  saveChat(eventId, chat)
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export function toggleMessageReaction(eventId, messageId, userId, emoji) {
  const chat = loadChat(eventId)
  if (!chat) return {}
  if (!chat.reactions[messageId]) chat.reactions[messageId] = {}
  const existing = chat.reactions[messageId][userId]
  if (existing === emoji) {
    delete chat.reactions[messageId][userId]
  } else {
    chat.reactions[messageId][userId] = emoji
  }
  saveChat(eventId, chat)
  return chat.reactions[messageId]
}

export function getMessageReactions(eventId, messageId) {
  const chat = loadChat(eventId)
  if (!chat) return {}
  return chat.reactions[messageId] || {}
}

// ── Seen ──────────────────────────────────────────────────────────────────────

export function markGroupSeen(eventId, userId, lastMessageId) {
  const chat = loadChat(eventId)
  if (!chat) return
  if (!chat.seen) chat.seen = {}
  chat.seen[userId] = lastMessageId
  saveChat(eventId, chat)
}

export function getUnseenCount(eventId, userId) {
  const chat = loadChat(eventId)
  if (!chat || !chat.messages.length) return 0
  const lastSeenId = chat.seen?.[userId]
  if (!lastSeenId) return chat.messages.filter(m => m.type !== 'system').length
  const idx = chat.messages.findIndex(m => m.id === lastSeenId)
  if (idx < 0) return 0
  return chat.messages.slice(idx + 1).filter(m => m.type !== 'system' && m.sender_user_id !== userId).length
}

// ── Private chats ─────────────────────────────────────────────────────────────

export function getOrCreatePrivateChat(eventId, userAId, userBId) {
  const privates = loadPrivates(eventId)
  if (!privates) return null
  const key = privateChatKey(userAId, userBId)
  if (!privates[key]) {
    privates[key] = { messages: [], reactions: {}, seen: {} }
    savePrivates(eventId, privates)
  }
  return privates[key]
}

export function getPrivateMessages(eventId, userAId, userBId) {
  const privates = loadPrivates(eventId)
  if (!privates) return []
  const key = privateChatKey(userAId, userBId)
  return [...(privates[key]?.messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export function sendPrivateTextMessage(eventId, userAId, userBId, { senderId, senderName, senderAvatarUrl, body }) {
  const privates = loadPrivates(eventId)
  if (!privates) return null
  const key = privateChatKey(userAId, userBId)
  if (!privates[key]) privates[key] = { messages: [], reactions: {}, seen: {} }
  const msg = {
    id: uid('pmsg_'),
    event_id: eventId,
    type: 'text',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body,
    metadata: null,
    created_at: new Date().toISOString(),
  }
  privates[key].messages.push(msg)
  savePrivates(eventId, privates)
  return msg
}

export async function sendPrivateImageMessage(eventId, userAId, userBId, { senderId, senderName, senderAvatarUrl, files, caption }) {
  const privates = loadPrivates(eventId)
  if (!privates) return null
  const key = privateChatKey(userAId, userBId)
  if (!privates[key]) privates[key] = { messages: [], reactions: {}, seen: {} }

  const images = []
  for (const file of files) {
    if (file instanceof File) {
      try { images.push({ url: await readFileAsDataUrl(file), name: file.name }) }
      catch { images.push({ url: null, name: file.name }) }
    } else if (typeof file === 'string') {
      images.push({ url: file, name: 'image' })
    }
  }

  const msg = {
    id: uid('pmsg_'),
    event_id: eventId,
    type: 'photos',
    sender_user_id: senderId,
    sender_display_name: senderName,
    sender_avatar_url: senderAvatarUrl || null,
    body: caption || '',
    metadata: { images },
    created_at: new Date().toISOString(),
  }
  privates[key].messages.push(msg)
  savePrivates(eventId, privates)
  return msg
}

export function deletePrivateMessage(eventId, userAId, userBId, messageId) {
  const privates = loadPrivates(eventId)
  if (!privates) return
  const key = privateChatKey(userAId, userBId)
  if (!privates[key]) return
  privates[key].messages = privates[key].messages.filter(m => m.id !== messageId)
  savePrivates(eventId, privates)
}

export function markPrivateSeen(eventId, userAId, userBId, userId, lastMessageId) {
  const privates = loadPrivates(eventId)
  if (!privates) return
  const key = privateChatKey(userAId, userBId)
  if (!privates[key]) return
  if (!privates[key].seen) privates[key].seen = {}
  privates[key].seen[userId] = lastMessageId
  savePrivates(eventId, privates)
}

export function getPrivateUnseenCount(eventId, userAId, userBId, forUserId) {
  const privates = loadPrivates(eventId)
  if (!privates) return 0
  const key = privateChatKey(userAId, userBId)
  const pc = privates[key]
  if (!pc || !pc.messages.length) return 0
  const lastSeenId = pc.seen?.[forUserId]
  if (!lastSeenId) return pc.messages.filter(m => m.sender_user_id !== forUserId).length
  const idx = pc.messages.findIndex(m => m.id === lastSeenId)
  if (idx < 0) return 0
  return pc.messages.slice(idx + 1).filter(m => m.sender_user_id !== forUserId).length
}

// ── File helper ───────────────────────────────────────────────────────────────

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
