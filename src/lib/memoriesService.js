// Memories service — albums, photos, favorites, reactions.
// Demo/localStorage mode. Replace internals with Supabase calls for production.
//
// Supabase Storage future path:
//   events/{event_id}/memories/{album_id}/{photo_id}.jpg
// Supabase tables: memory_albums, memory_photos, photo_favorites, photo_reactions

const APP_KEY = 'rba_app_data'

function uid(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9)
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadApp() {
  try { return JSON.parse(localStorage.getItem(APP_KEY)) || { events: {} } } catch { return { events: {} } }
}

function saveApp(data) {
  try { localStorage.setItem(APP_KEY, JSON.stringify(data)) } catch (e) {
    // localStorage quota exceeded — happens with large base64 images
    console.warn('localStorage quota exceeded — uploaded photos may not persist after refresh')
  }
}

const EMPTY_MEMORIES = () => ({ albums: [], photos: [], favorites: [], reactions: [] })

function loadMemories(eventId) {
  const app = loadApp()
  if (!app.events?.[eventId]) return null
  if (!app.events[eventId].memories) {
    app.events[eventId].memories = EMPTY_MEMORIES()
    saveApp(app)
  }
  const mem = app.events[eventId].memories
  // Migration: wipe auto-seeded demo content from older builds
  if (mem.photos?.some(p => p.is_demo)) {
    app.events[eventId].memories = EMPTY_MEMORIES()
    saveApp(app)
    return app.events[eventId].memories
  }
  return mem
}

function saveMemories(eventId, memories) {
  const app = loadApp()
  if (!app.events?.[eventId]) return
  app.events[eventId].memories = memories
  saveApp(app)
}

// ── Gradient / emoji fallbacks for real uploads that fail to read ─────────────

const DEMO_PHOTO_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#2dd4bf,#06b6d4)',
  'linear-gradient(135deg,#f97316,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#a855f7,#6366f1)',
  'linear-gradient(135deg,#10b981,#2dd4bf)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
]
const DEMO_PHOTO_EMOJIS = ['🌊','✨','🥂','💃','🌅','🛥️','🍷','💫','🌺','💅','👑','🎊']
// ── Albums ────────────────────────────────────────────────────────────────────

export function getAlbums(eventId) {
  const mem = loadMemories(eventId)
  if (!mem) return []
  return [...mem.albums].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  // Supabase: await supabase.from('memory_albums').select('*').eq('event_id', eventId).order('created_at')
}

export function createAlbum(eventId, { title, description, icon, gradient, coverPhotoUrl, createdBy, createdByDisplayName }) {
  const mem = loadMemories(eventId)
  if (!mem) return null
  const album = {
    id: uid('album_'),
    event_id: eventId,
    title,
    description: description || '',
    icon: icon || 'camera',
    gradient: gradient || 'linear-gradient(135deg,#2dd4bf,#0ea5e9)',
    cover_photo_url: coverPhotoUrl || null,
    created_by: createdBy,
    created_by_display_name: createdByDisplayName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mem.albums.push(album)
  saveMemories(eventId, mem)
  return album
  // Supabase: await supabase.from('memory_albums').insert(album).select().single()
}

export function updateAlbum(eventId, albumId, updates) {
  const mem = loadMemories(eventId)
  if (!mem) return null
  mem.albums = mem.albums.map(a => a.id === albumId ? { ...a, ...updates, updated_at: new Date().toISOString() } : a)
  saveMemories(eventId, mem)
  return mem.albums.find(a => a.id === albumId)
}

export function deleteAlbum(eventId, albumId) {
  const mem = loadMemories(eventId)
  if (!mem) return
  mem.albums = mem.albums.filter(a => a.id !== albumId)
  mem.photos = mem.photos.filter(p => p.album_id !== albumId)
  saveMemories(eventId, mem)
}

// ── Photos ────────────────────────────────────────────────────────────────────

export function getPhotos(eventId, { albumId, onlyFavorited, onlyBridePick, onlyMine, userId } = {}) {
  const mem = loadMemories(eventId)
  if (!mem) return []
  let photos = [...mem.photos]
  if (albumId) photos = photos.filter(p => p.album_id === albumId)
  if (onlyFavorited && userId) {
    const favPhotoIds = new Set(mem.favorites.filter(f => f.user_id === userId).map(f => f.photo_id))
    photos = photos.filter(p => favPhotoIds.has(p.id))
  }
  if (onlyBridePick) photos = photos.filter(p => p.is_bride_pick)
  if (onlyMine && userId) photos = photos.filter(p => p.uploaded_by === userId)
  return photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

// uploadPhotos: converts File objects to base64 data URLs for localStorage demo.
// Production: upload to Supabase Storage at events/{eventId}/memories/{albumId}/{photoId}
export async function uploadPhotos(eventId, { albumId, files, caption, uploadedBy, uploaderDisplayName, uploaderAvatarUrl }) {
  const mem = loadMemories(eventId)
  if (!mem) return []

  const GRADIENTS = DEMO_PHOTO_GRADIENTS
  const EMOJIS = DEMO_PHOTO_EMOJIS
  const results = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const photoId = uid('photo_')
    let imageUrl = null

    if (file instanceof File) {
      try {
        imageUrl = await readFileAsDataUrl(file)
        // Supabase Storage: const { data } = await supabase.storage
        //   .from('event-memories')
        //   .upload(`events/${eventId}/memories/${albumId}/${photoId}`, file)
        // imageUrl = supabase.storage.from('event-memories').getPublicUrl(data.path).data.publicUrl
      } catch {
        // Fallback gradient
        imageUrl = null
      }
    } else if (typeof file === 'string') {
      imageUrl = file
    }

    const photo = {
      id: photoId,
      event_id: eventId,
      album_id: albumId,
      image_url: imageUrl,
      thumbnail_url: imageUrl,
      gradient: imageUrl ? null : GRADIENTS[i % GRADIENTS.length],
      emoji: imageUrl ? null : EMOJIS[i % EMOJIS.length],
      caption: caption || '',
      uploaded_by: uploadedBy,
      uploaded_by_display_name: uploaderDisplayName,
      uploaded_by_avatar_url: uploaderAvatarUrl || null,
      is_bride_pick: false,
      favorite_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mem.photos.push(photo)
    results.push(photo)
  }

  saveMemories(eventId, mem)
  return results
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function deletePhoto(eventId, photoId) {
  const mem = loadMemories(eventId)
  if (!mem) return
  mem.photos = mem.photos.filter(p => p.id !== photoId)
  mem.favorites = mem.favorites.filter(f => f.photo_id !== photoId)
  mem.reactions = mem.reactions.filter(r => r.photo_id !== photoId)
  saveMemories(eventId, mem)
  // Supabase: await supabase.from('memory_photos').delete().eq('id', photoId)
}

export function markBridePick(eventId, photoId, value) {
  const mem = loadMemories(eventId)
  if (!mem) return
  mem.photos = mem.photos.map(p => p.id === photoId ? { ...p, is_bride_pick: value } : p)
  saveMemories(eventId, mem)
}

export function updatePhotoCover(eventId, albumId, photoId) {
  const mem = loadMemories(eventId)
  if (!mem) return
  const photo = mem.photos.find(p => p.id === photoId)
  if (!photo) return
  mem.albums = mem.albums.map(a =>
    a.id === albumId
      ? { ...a, cover_photo_url: photo.image_url, cover_gradient: photo.gradient, cover_emoji: photo.emoji, updated_at: new Date().toISOString() }
      : a
  )
  saveMemories(eventId, mem)
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export function toggleFavorite(eventId, photoId, userId) {
  const mem = loadMemories(eventId)
  if (!mem) return false
  const existingIdx = mem.favorites.findIndex(f => f.photo_id === photoId && f.user_id === userId)
  let isFav = false
  if (existingIdx >= 0) {
    mem.favorites.splice(existingIdx, 1)
    mem.photos = mem.photos.map(p => p.id === photoId ? { ...p, favorite_count: Math.max(0, (p.favorite_count || 0) - 1) } : p)
    isFav = false
  } else {
    mem.favorites.push({ id: uid('fav_'), event_id: eventId, photo_id: photoId, user_id: userId, created_at: new Date().toISOString() })
    mem.photos = mem.photos.map(p => p.id === photoId ? { ...p, favorite_count: (p.favorite_count || 0) + 1 } : p)
    isFav = true
  }
  saveMemories(eventId, mem)
  return isFav
  // Supabase: upsert/delete photo_favorites
}

export function getUserFavorites(eventId, userId) {
  const mem = loadMemories(eventId)
  if (!mem) return new Set()
  return new Set(mem.favorites.filter(f => f.user_id === userId).map(f => f.photo_id))
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export function addReaction(eventId, photoId, userId, reactionText) {
  const mem = loadMemories(eventId)
  if (!mem) return
  // Remove existing reaction from this user on this photo
  mem.reactions = mem.reactions.filter(r => !(r.photo_id === photoId && r.user_id === userId))
  mem.reactions.push({ id: uid('rx_'), event_id: eventId, photo_id: photoId, user_id: userId, reaction_text: reactionText, created_at: new Date().toISOString() })
  saveMemories(eventId, mem)
}

export function getPhotoReactions(eventId, photoId) {
  return (loadMemories(eventId)?.reactions || []).filter(r => r.photo_id === photoId)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getMemoryStats(eventId) {
  const mem = loadMemories(eventId)
  if (!mem) return { albumCount: 0, photoCount: 0, favoriteCount: 0, uploaderCount: 0 }
  const uploaders = new Set(mem.photos.map(p => p.uploaded_by))
  const totalFavorites = mem.photos.reduce((s, p) => s + (p.favorite_count || 0), 0)
  return {
    albumCount:    mem.albums.length,
    photoCount:    mem.photos.length,
    favoriteCount: totalFavorites,
    uploaderCount: uploaders.size,
  }
}

// ── Download (prepared for JSZip integration) ─────────────────────────────────

export async function downloadSelectedPhotos(photos) {
  // If photos have real URLs (not base64), attempt single-file downloads
  const downloadable = photos.filter(p => p.image_url)
  if (downloadable.length === 0) return { success: false, reason: 'no_urls' }

  if (downloadable.length === 1) {
    triggerDownload(downloadable[0].image_url, `photo_${downloadable[0].id}.jpg`)
    return { success: true, count: 1 }
  }

  // Multiple photos — future JSZip implementation:
  // import JSZip from 'jszip'
  // const zip = new JSZip()
  // for (const photo of downloadable) {
  //   const res = await fetch(photo.image_url)
  //   const blob = await res.blob()
  //   zip.file(`photo_${photo.id}.jpg`, blob)
  // }
  // const content = await zip.generateAsync({ type: 'blob' })
  // triggerDownload(URL.createObjectURL(content), 'memories.zip')

  return { success: false, reason: 'zip_not_implemented', count: downloadable.length }
}

function triggerDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
