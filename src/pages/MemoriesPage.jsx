import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, Image, Heart, Download, Plus, Crown, Sparkles, Upload,
  FolderPlus, Check, X, Trash2, Edit3, MoreHorizontal, ChevronLeft,
  Star, Grid, LogOut,
} from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useEvent } from '../context/EventContext'
import * as mem from '../lib/memoriesService'
import bgImg from '../assets/background.png'

// ── Design tokens ─────────────────────────────────────────────────────────────

const glass = (extra = {}) => ({
  background: 'rgba(255,255,255,0.11)',
  backdropFilter: 'blur(28px) saturate(170%)',
  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
  border: '1px solid rgba(255,255,255,0.20)',
  borderRadius: '28px',
  boxShadow: '0 10px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.22)',
  ...extra,
})

const pill = (active, extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '7px 14px',
  background: active ? 'linear-gradient(135deg,rgba(45,212,191,0.45),rgba(14,165,233,0.5))' : 'rgba(255,255,255,0.10)',
  backdropFilter: 'blur(12px)',
  border: active ? '1px solid rgba(45,212,191,0.5)' : '1px solid rgba(255,255,255,0.18)',
  borderRadius: '999px',
  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
  fontSize: '12px', fontWeight: active ? 700 : 500,
  fontFamily: '"Assistant", sans-serif',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: active ? '0 4px 16px rgba(45,212,191,0.3)' : 'none',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  ...extra,
})

const ALBUM_ICON_EMOJI = {
  sparkles: '✨', waves: '🌊', wine: '🍷', music: '💃', camera: '📸',
  sun: '☀️', heart: '💛', crown: '👑', star: '⭐', beach: '🏖️',
  cocktail: '🍹', boat: '🛥️', flowers: '🌸', moon: '🌙', fire: '🔥',
}
const ALBUM_ICON_OPTIONS = Object.entries(ALBUM_ICON_EMOJI).map(([k, v]) => ({ key: k, emoji: v }))

const ALBUM_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#2dd4bf,#0ea5e9)',
  'linear-gradient(135deg,#f97316,#ec4899)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#6b7280,#9ca3af)',
  'linear-gradient(135deg,#10b981,#2dd4bf)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
]

const REACTIONS = ['וואו 😍', 'אייקוני 💅', 'זאת לפרופיל 📸', 'מלכות 👑', 'אמאלה 😂']

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: '108px', left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : '20px'})`,
      background: 'rgba(10,20,45,0.88)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px',
      padding: '10px 20px', color: '#fff', fontSize: '13px', fontFamily: '"Assistant", sans-serif',
      zIndex: 500, opacity: visible ? 1 : 0, transition: 'all 0.3s ease', whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MemoriesPage() {
  const { activeEvent, currentMember, role } = useEvent()
  const eventId = activeEvent?.id
  const userId  = currentMember?.user_id
  const isOwnerOrAdmin = role === 'owner' || role === 'admin'

  // Permissions
  const canModerate   = isOwnerOrAdmin
  const canMarkPick   = isOwnerOrAdmin
  const canEditAlbum  = isOwnerOrAdmin

  // State
  const [albums,       setAlbums]       = useState([])
  const [photos,       setPhotos]       = useState([])
  const [favorites,    setFavorites]    = useState(new Set())
  const [stats,        setStats]        = useState({ albumCount: 0, photoCount: 0, favoriteCount: 0, uploaderCount: 0 })
  const [activeFilter, setActiveFilter] = useState('all')  // 'all' | 'mine' | 'fav' | 'pick' | albumId
  const [selectionMode,  setSelectionMode]  = useState(false)
  const [selectedIds,    setSelectedIds]    = useState(new Set())
  const [viewingPhoto,   setViewingPhoto]   = useState(null)
  const [showCreateAlbum,  setShowCreateAlbum]  = useState(false)
  const [showUpload,       setShowUpload]       = useState(false)
  const [toastMsg,   setToastMsg]   = useState('')
  const [toastVis,   setToastVis]   = useState(false)

  const refresh = useCallback(() => {
    if (!eventId) return
    setAlbums(mem.getAlbums(eventId))
    setPhotos(mem.getPhotos(eventId))
    setFavorites(mem.getUserFavorites(eventId, userId))
    setStats(mem.getMemoryStats(eventId))
  }, [eventId, userId, currentMember])

  useEffect(() => { refresh() }, [refresh])

  function showToast(msg) {
    setToastMsg(msg)
    setToastVis(true)
    setTimeout(() => setToastVis(false), 2400)
  }

  // Filter photos based on active filter
  const filteredPhotos = (() => {
    if (activeFilter === 'all')  return photos
    if (activeFilter === 'mine') return photos.filter(p => p.uploaded_by === userId)
    if (activeFilter === 'fav')  return photos.filter(p => favorites.has(p.id))
    if (activeFilter === 'pick') return photos.filter(p => p.is_bride_pick)
    return photos.filter(p => p.album_id === activeFilter)
  })()

  function handleToggleFav(photoId, e) {
    e?.stopPropagation()
    const isFav = mem.toggleFavorite(eventId, photoId, userId)
    setFavorites(mem.getUserFavorites(eventId, userId))
    setPhotos(mem.getPhotos(eventId))
    setStats(mem.getMemoryStats(eventId))
    if (isFav) showToast('נוסף לאהובות ❤️')
  }

  function handleTogglePick(photoId, value) {
    mem.markBridePick(eventId, photoId, value)
    refresh()
    showToast(value ? 'נוסף לבחירת הכלה 👑' : 'הוסר מבחירת הכלה')
  }

  function handleDeletePhoto(photoId) {
    mem.deletePhoto(eventId, photoId)
    setViewingPhoto(null)
    refresh()
    showToast('התמונה נמחקה')
  }

  function handleDeleteAlbum(albumId) {
    mem.deleteAlbum(eventId, albumId)
    if (activeFilter === albumId) setActiveFilter('all')
    refresh()
    showToast('האלבום נמחק')
  }

  function toggleSelect(photoId, e) {
    e?.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(photoId) ? next.delete(photoId) : next.add(photoId)
      return next
    })
  }

  async function handleDownload() {
    if (selectedIds.size === 0) { showToast('בחרי לפחות תמונה אחת להורדה ✨'); return }
    const selectedPhotos = photos.filter(p => selectedIds.has(p.id))
    const result = await mem.downloadSelectedPhotos(selectedPhotos)
    if (!result.success) {
      if (result.reason === 'zip_not_implemented') showToast(`הורדת ZIP תחובר בהמשך ✨ (${result.count} תמונות נבחרו)`)
      else showToast('אין תמונות להורדה בסביבה זו ✨')
    }
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const featuredPhoto = photos.find(p => p.is_bride_pick) || photos[0] || null
  const featuredAlbum = featuredPhoto ? albums.find(a => a.id === featuredPhoto.album_id) : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: `url(${bgImg}) center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Overlays */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(0,15,40,0.45) 0%, rgba(0,8,25,0.68) 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 60% 20%, rgba(142,235,255,0.07) 0%, transparent 60%)' }} />

      {/* Scrollable content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', paddingBottom: '108px', scrollbarWidth: 'none' }}>

        {/* ── Header ── */}
        <MemoriesHeader event={activeEvent} onUpload={() => setShowUpload(true)} />

        {/* ── Stats ── */}
        <MemoryStats stats={stats} />

        {/* ── Featured Memory ── */}
        <FeaturedMemoryCard
          photo={featuredPhoto}
          album={featuredAlbum}
          isFav={featuredPhoto ? favorites.has(featuredPhoto.id) : false}
          onFav={() => featuredPhoto && handleToggleFav(featuredPhoto.id)}
          onView={() => featuredPhoto && setViewingPhoto(featuredPhoto)}
          onUpload={() => setShowUpload(true)}
        />

        {/* ── Albums ── */}
        <AlbumSection
          albums={albums}
          photos={photos}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          canEdit={canEditAlbum}
          onCreateAlbum={() => setShowCreateAlbum(true)}
          onDeleteAlbum={handleDeleteAlbum}
        />

        {/* ── Action buttons ── */}
        <MemoryActionsBar
          onNewAlbum={() => setShowCreateAlbum(true)}
          onUpload={() => setShowUpload(true)}
          onSelect={() => { setSelectionMode(s => !s); setSelectedIds(new Set()) }}
          selectionMode={selectionMode}
        />

        {/* ── Photo grid ── */}
        <PhotoGrid
          photos={filteredPhotos}
          favorites={favorites}
          selectedIds={selectedIds}
          selectionMode={selectionMode}
          canModerate={canModerate}
          currentUserId={userId}
          onView={p => { if (!selectionMode) setViewingPhoto(p) }}
          onToggleFav={handleToggleFav}
          onToggleSelect={toggleSelect}
          onUpload={() => setShowUpload(true)}
        />
      </div>

      {/* ── Selection bar ── */}
      {selectionMode && (
        <SelectionDownloadBar
          count={selectedIds.size}
          onDownload={handleDownload}
          onCancel={() => { setSelectionMode(false); setSelectedIds(new Set()) }}
        />
      )}

      <BottomNav />

      {/* ── Modals ── */}
      {showCreateAlbum && (
        <CreateAlbumModal
          eventId={eventId}
          userId={userId}
          displayName={currentMember?.display_name}
          onClose={() => setShowCreateAlbum(false)}
          onCreated={() => { refresh(); setShowCreateAlbum(false); showToast('האלבום נוצר ✨') }}
        />
      )}

      {showUpload && (
        <UploadPhotosModal
          eventId={eventId}
          albums={albums}
          userId={userId}
          currentMember={currentMember}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { refresh(); setShowUpload(false); showToast('התמונות הועלו ✨') }}
        />
      )}

      {viewingPhoto && (
        <PhotoViewerModal
          photo={viewingPhoto}
          album={albums.find(a => a.id === viewingPhoto.album_id)}
          isFav={favorites.has(viewingPhoto.id)}
          eventId={eventId}
          currentUserId={userId}
          canModerate={canModerate}
          canMarkPick={canMarkPick}
          onFav={() => handleToggleFav(viewingPhoto.id)}
          onMarkPick={val => handleTogglePick(viewingPhoto.id, val)}
          onDelete={() => handleDeletePhoto(viewingPhoto.id)}
          onClose={() => setViewingPhoto(null)}
          onReact={(rx) => { mem.addReaction(eventId, viewingPhoto.id, userId, rx); showToast(`${rx} 💫`) }}
        />
      )}

      <Toast message={toastMsg} visible={toastVis} />
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function MemoriesHeader({ event, onUpload }) {
  const dest = event?.destination?.split(',')[0]?.trim() || ''
  const subtitle = dest ? `${dest} • הזיכרונות שלכן` : 'כל הרגעים הכי יפים במקום אחד ✨'

  return (
    <div style={{
      margin: '16px 16px 0',
      ...glass({ borderRadius: '32px', padding: '18px 20px' }),
      background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #8EEBFF, #2dd4bf)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
        border: '2px solid rgba(255,255,255,0.3)',
        boxShadow: '0 0 18px rgba(142,235,255,0.4)',
      }}>📸</div>

      <div style={{ flex: 1, direction: 'rtl' }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0, fontFamily: '"Assistant", sans-serif' }}>
          זיכרונות מהאירוע
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '3px 0 0', fontFamily: '"Assistant", sans-serif' }}>
          {subtitle}
        </p>
      </div>

      <button onClick={onUpload} style={{
        width: '40px', height: '40px', borderRadius: '14px', flexShrink: 0,
        background: 'rgba(45,212,191,0.2)', border: '1px solid rgba(45,212,191,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <Upload size={17} color="#2dd4bf" />
      </button>
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function MemoryStats({ stats }) {
  const items = [
    { value: stats.albumCount, label: 'אלבומים' },
    { value: stats.photoCount, label: 'תמונות' },
    { value: stats.favoriteCount, label: 'אהובות' },
    { value: stats.uploaderCount, label: 'משתפות' },
  ]
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '12px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {items.map(({ value, label }) => (
        <div key={label} style={{
          ...glass({ borderRadius: '20px', padding: '8px 14px' }),
          display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#8EEBFF', fontWeight: 700, fontSize: '17px', fontFamily: '"Assistant", sans-serif' }}>{value}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: '"Assistant", sans-serif' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Featured Memory Card ──────────────────────────────────────────────────────

function FeaturedMemoryCard({ photo, album, isFav, onFav, onView, onUpload }) {
  return (
    <div style={{ margin: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', direction: 'rtl' }}>
        <Sparkles size={14} color="#8EEBFF" />
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, fontFamily: '"Assistant", sans-serif' }}>
          רגע היום ✨
        </span>
      </div>

      <div
        onClick={photo ? onView : undefined}
        style={{
          ...glass({ borderRadius: '32px', overflow: 'hidden', cursor: photo ? 'pointer' : 'default' }),
          aspectRatio: '16/9', position: 'relative',
          background: photo?.image_url
            ? `url(${photo.image_url}) center/cover`
            : photo?.gradient || 'linear-gradient(135deg,#667eea44,#764ba244)',
          minHeight: '180px',
        }}
      >
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,5,20,0.75) 0%, transparent 55%)' }} />

        {photo ? (
          <>
            {/* Emoji if no image */}
            {!photo.image_url && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>
                {photo.emoji || '✨'}
              </div>
            )}
            {/* Info overlay */}
            <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', direction: 'rtl' }}>
              <div>
                {album && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontFamily: '"Assistant", sans-serif', marginBottom: '2px' }}>{album.title}</div>}
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: '"Assistant", sans-serif' }}>
                  {photo.uploaded_by_display_name || 'אנונימי'}
                </div>
                {photo.is_bride_pick && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <Crown size={12} color="#fbbf24" />
                    <span style={{ color: '#fbbf24', fontSize: '11px', fontFamily: '"Assistant", sans-serif' }}>בחירת הכלה</span>
                  </div>
                )}
              </div>
              <button onClick={e => { e.stopPropagation(); onFav() }} style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: isFav ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.15)',
                border: `1px solid ${isFav ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Heart size={16} color={isFav ? '#ec4899' : '#fff'} fill={isFav ? '#ec4899' : 'none'} />
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>🌸</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: '15px', fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>
              הרגעים הכי יפים עוד רגע מתחילים
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>
              העלי את התמונה הראשונה מהסופ״ש ✨
            </div>
            <button onClick={onUpload} style={{
              marginTop: '8px', padding: '10px 22px',
              background: 'linear-gradient(135deg,rgba(45,212,191,0.45),rgba(14,165,233,0.5))',
              border: '1px solid rgba(45,212,191,0.5)', borderRadius: '999px',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              fontFamily: '"Assistant", sans-serif', cursor: 'pointer',
            }}>
              העלי תמונה
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Albums section ────────────────────────────────────────────────────────────

function AlbumSection({ albums, photos, activeFilter, setActiveFilter, canEdit, onCreateAlbum, onDeleteAlbum }) {
  const FILTER_CHIPS = [
    { key: 'all',  label: 'הכל' },
    { key: 'fav',  label: 'אהובות ❤️' },
    { key: 'pick', label: 'בחירת הכלה 👑' },
    { key: 'mine', label: 'שלי' },
  ]

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '12px' }}>
        <button onClick={onCreateAlbum} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '999px', padding: '7px 14px',
          color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600,
          fontFamily: '"Assistant", sans-serif', cursor: 'pointer',
        }}>
          <Plus size={13} />
          אלבום חדש
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'rtl' }}>
          <Image size={15} color="rgba(255,255,255,0.6)" />
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 600, fontFamily: '"Assistant", sans-serif' }}>אלבומים</span>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none', flexDirection: 'row-reverse' }}>
        {FILTER_CHIPS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveFilter(key)} style={pill(activeFilter === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Album carousel */}
      {albums.length === 0 ? (
        <div style={{ padding: '0 16px', textAlign: 'center' }}>
          <div style={{
            ...glass({ borderRadius: '28px', padding: '28px 20px' }),
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ fontSize: '38px' }}>📂</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>עוד אין אלבומים</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: '"Assistant", sans-serif', direction: 'rtl', textAlign: 'center' }}>
              צרו אלבום ראשון ותתחילו לאסוף את הרגעים הכי יפים ✨
            </div>
            <button onClick={onCreateAlbum} style={{
              marginTop: '4px', padding: '11px 24px',
              background: 'linear-gradient(135deg,rgba(45,212,191,0.45),rgba(14,165,233,0.5))',
              border: '1px solid rgba(45,212,191,0.5)', borderRadius: '999px',
              color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: '"Assistant", sans-serif', cursor: 'pointer',
            }}>אלבום חדש ✨</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none', flexDirection: 'row-reverse' }}>
          {albums.map((album, idx) => {
            const albumPhotos = photos.filter(p => p.album_id === album.id)
            return (
              <AlbumCard
                key={album.id}
                album={album}
                photoCount={albumPhotos.length}
                active={activeFilter === album.id}
                canEdit={canEdit}
                onSelect={() => setActiveFilter(activeFilter === album.id ? 'all' : album.id)}
                onDelete={() => onDeleteAlbum(album.id)}
                coverPhoto={albumPhotos[0]}
                idx={idx}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function AlbumCard({ album, photoCount, active, canEdit, onSelect, onDelete, coverPhoto, idx }) {
  const [showMenu, setShowMenu] = useState(false)
  const iconEmoji = ALBUM_ICON_EMOJI[album.icon] || '📸'
  const gradient = album.gradient || ALBUM_GRADIENTS[idx % ALBUM_GRADIENTS.length]
  const coverBg = coverPhoto?.image_url
    ? `url(${coverPhoto.image_url}) center/cover`
    : coverPhoto?.gradient || gradient

  return (
    <div style={{
      width: '148px', flexShrink: 0,
      animation: `fadeInUp 0.5s ease ${idx * 0.07}s both`,
    }}>
      <div
        onClick={onSelect}
        style={{
          ...glass({
            borderRadius: '28px', overflow: 'hidden', cursor: 'pointer',
            boxShadow: active
              ? '0 0 0 2px rgba(45,212,191,0.8), 0 12px 32px rgba(45,212,191,0.3)'
              : '0 8px 24px rgba(0,0,0,0.2)',
          }),
          width: '148px', height: '178px',
          position: 'relative', transition: 'box-shadow 0.2s ease',
        }}
      >
        {/* Cover / gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: coverBg,
        }}>
          {!coverPhoto?.image_url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', opacity: 0.5 }}>
              {iconEmoji}
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,5,20,0.82) 0%, rgba(0,5,20,0.2) 55%, transparent 100%)' }} />

        {/* Active glow */}
        {active && <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,212,191,0.08)', borderRadius: 'inherit' }} />}

        {/* Bottom info */}
        <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', direction: 'rtl' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '12px', fontFamily: '"Assistant", sans-serif', lineHeight: 1.3 }}>
            {album.title}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontFamily: '"Assistant", sans-serif', marginTop: '2px' }}>
            {photoCount} תמונות
          </div>
        </div>

        {/* Kebab menu for owner/admin */}
        {canEdit && (
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(s => !s) }}
            style={{
              position: 'absolute', top: '8px', left: '8px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={14} color="rgba(255,255,255,0.8)" />
          </button>
        )}

        {showMenu && (
          <div style={{
            position: 'absolute', top: '36px', left: '8px', zIndex: 10,
            background: 'rgba(10,20,45,0.92)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px',
            padding: '6px', minWidth: '120px',
          }}>
            <button onClick={() => { setShowMenu(false); onDelete() }} style={{
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '8px 10px',
              background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer',
              color: '#f87171', fontSize: '12px', fontFamily: '"Assistant", sans-serif', direction: 'rtl',
            }}>
              <Trash2 size={12} /> מחיקת אלבום
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Action bar ────────────────────────────────────────────────────────────────

function MemoryActionsBar({ onNewAlbum, onUpload, onSelect, selectionMode }) {
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '16px 16px 0', direction: 'rtl' }}>
      <button onClick={onUpload} style={{
        flex: 1, padding: '13px',
        background: 'linear-gradient(135deg,rgba(45,212,191,0.45),rgba(14,165,233,0.5))',
        backdropFilter: 'blur(12px)', border: '1px solid rgba(45,212,191,0.45)',
        borderRadius: '18px', color: '#fff', fontSize: '13px', fontWeight: 700,
        fontFamily: '"Assistant", sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        cursor: 'pointer', boxShadow: '0 6px 20px rgba(45,212,191,0.3)',
      }}>
        <Upload size={15} /> העלאת תמונות
      </button>
      <button onClick={onSelect} style={{
        padding: '13px 16px',
        background: selectionMode ? 'rgba(45,212,191,0.2)' : 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)', border: selectionMode ? '1px solid rgba(45,212,191,0.4)' : '1px solid rgba(255,255,255,0.18)',
        borderRadius: '18px', color: selectionMode ? '#2dd4bf' : 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 700,
        fontFamily: '"Assistant", sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        cursor: 'pointer',
      }}>
        <Check size={15} /> {selectionMode ? 'ביטול' : 'בחירה'}
      </button>
    </div>
  )
}

// ── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGrid({ photos, favorites, selectedIds, selectionMode, canModerate, currentUserId, onView, onToggleFav, onToggleSelect, onUpload }) {
  if (photos.length === 0) {
    return (
      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{
          ...glass({ borderRadius: '28px', padding: '36px 20px' }),
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ fontSize: '44px' }}>🌸</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', fontFamily: '"Assistant", sans-serif', direction: 'rtl' }}>
            אין עדיין תמונות
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontFamily: '"Assistant", sans-serif', direction: 'rtl', textAlign: 'center', lineHeight: 1.6 }}>
            העלי את הרגע הראשון לאלבום הזה ✨
          </div>
          <button onClick={onUpload} style={{
            marginTop: '8px', padding: '12px 28px',
            background: 'linear-gradient(135deg,rgba(45,212,191,0.45),rgba(14,165,233,0.5))',
            border: '1px solid rgba(45,212,191,0.5)', borderRadius: '999px',
            color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: '"Assistant", sans-serif', cursor: 'pointer',
          }}>העלאת תמונות</button>
        </div>
      </div>
    )
  }

  // Split into 2 columns (masonry-style)
  const col1 = photos.filter((_, i) => i % 2 === 0)
  const col2 = photos.filter((_, i) => i % 2 === 1)

  return (
    <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {[col1, col2].map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {col.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isFav={favorites.has(photo.id)}
              isSelected={selectedIds.has(photo.id)}
              selectionMode={selectionMode}
              idx={ci * 100 + i}
              onView={() => onView(photo)}
              onFav={e => onToggleFav(photo.id, e)}
              onSelect={e => onToggleSelect(photo.id, e)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function PhotoCard({ photo, isFav, isSelected, selectionMode, idx, onView, onFav, onSelect }) {
  const aspectRatio = idx % 3 === 0 ? '3/4' : idx % 3 === 1 ? '4/5' : '1/1'
  const bg = photo.image_url
    ? `url(${photo.image_url}) center/cover`
    : photo.gradient || 'linear-gradient(135deg,#2dd4bf,#0ea5e9)'

  return (
    <div
      onClick={selectionMode ? onSelect : onView}
      style={{
        aspectRatio,
        background: bg,
        borderRadius: '22px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        border: isSelected ? '2px solid rgba(45,212,191,0.9)' : '1px solid rgba(255,255,255,0.10)',
        boxShadow: isSelected ? '0 0 0 2px rgba(45,212,191,0.6)' : '0 6px 18px rgba(0,0,0,0.2)',
        animation: `fadeInUp 0.5s ease ${idx * 0.04}s both`,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Emoji placeholder */}
      {!photo.image_url && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', opacity: 0.65 }}>
          {photo.emoji || '✨'}
        </div>
      )}

      {/* Bottom overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,5,20,0.6) 0%, transparent 50%)' }} />

      {/* Bride pick badge */}
      {photo.is_bride_pick && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(251,191,36,0.25)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(251,191,36,0.5)', borderRadius: '50%',
          width: '26px', height: '26px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Crown size={13} color="#fbbf24" />
        </div>
      )}

      {/* Selection indicator */}
      {selectionMode && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px',
          width: '24px', height: '24px', borderRadius: '50%',
          background: isSelected ? '#2dd4bf' : 'rgba(255,255,255,0.2)',
          border: `2px solid ${isSelected ? '#2dd4bf' : 'rgba(255,255,255,0.5)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}>
          {isSelected && <Check size={13} color="#fff" />}
        </div>
      )}

      {/* Fav button */}
      {!selectionMode && (
        <button
          onClick={onFav}
          style={{
            position: 'absolute', bottom: '8px', left: '8px',
            width: '30px', height: '30px', borderRadius: '50%',
            background: isFav ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.15)',
            border: `1px solid ${isFav ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Heart size={13} color={isFav ? '#ec4899' : '#fff'} fill={isFav ? '#ec4899' : 'none'} />
        </button>
      )}

      {/* Fav count */}
      {!selectionMode && photo.favorite_count > 0 && (
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px',
          color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontFamily: '"Assistant", sans-serif',
        }}>
          {photo.favorite_count} ❤️
        </div>
      )}
    </div>
  )
}

// ── Selection download bar ────────────────────────────────────────────────────

function SelectionDownloadBar({ count, onDownload, onCancel }) {
  return (
    <div style={{
      position: 'fixed', bottom: '108px', left: '50%', transform: 'translateX(-50%)',
      width: '91%', maxWidth: '420px', zIndex: 150,
      ...glass({ borderRadius: '999px', padding: '12px 20px' }),
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(10,20,45,0.88)',
      animation: 'fadeInUp 0.25s ease forwards',
    }}>
      <button onClick={onCancel} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
        fontSize: '13px', fontFamily: '"Assistant", sans-serif',
      }}>ביטול</button>
      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: '"Assistant", sans-serif' }}>
        נבחרו {count} תמונות
      </span>
      <button onClick={onDownload} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg,rgba(45,212,191,0.5),rgba(14,165,233,0.55))',
        border: '1px solid rgba(45,212,191,0.5)', borderRadius: '999px',
        padding: '8px 16px', color: '#fff', fontSize: '13px', fontWeight: 700,
        fontFamily: '"Assistant", sans-serif', cursor: 'pointer',
      }}>
        <Download size={14} /> הורדה
      </button>
    </div>
  )
}

// ── Photo Viewer Modal ────────────────────────────────────────────────────────

function PhotoViewerModal({ photo, album, isFav, eventId, currentUserId, canModerate, canMarkPick, onFav, onMarkPick, onDelete, onClose, onReact }) {
  const [showReactions, setShowReactions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const canDelete = canModerate || photo.uploaded_by === currentUserId
  const bg = photo.image_url ? `url(${photo.image_url}) center/cover` : photo.gradient || 'linear-gradient(135deg,#667eea,#764ba2)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,5,20,0.88)', backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'fadeInUp 0.2s ease forwards',
    }}>
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '20px', right: '20px', zIndex: 10,
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <X size={18} color="#fff" />
      </button>

      {/* Image */}
      <div style={{
        width: '100%', maxWidth: '380px',
        aspectRatio: '3/4',
        background: bg,
        borderRadius: '28px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}>
        {!photo.image_url && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
            {photo.emoji || '✨'}
          </div>
        )}
        {photo.is_bride_pick && (
          <div style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(251,191,36,0.25)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(251,191,36,0.5)', borderRadius: '999px',
            padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <Crown size={13} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontSize: '11px', fontFamily: '"Assistant", sans-serif' }}>בחירת הכלה</span>
          </div>
        )}
      </div>

      {/* Info + actions */}
      <div style={{
        width: '100%', maxWidth: '380px', marginTop: '14px',
        ...glass({ borderRadius: '24px', padding: '16px 18px' }),
      }}>
        <div style={{ direction: 'rtl', marginBottom: '12px' }}>
          {album && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontFamily: '"Assistant", sans-serif', marginBottom: '3px' }}>{album.title}</div>}
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: '"Assistant", sans-serif' }}>
            {photo.uploaded_by_display_name || 'אנונימי'}
          </div>
          {photo.caption && (
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', marginTop: '4px', fontFamily: '"Assistant", sans-serif', lineHeight: 1.4 }}>
              {photo.caption}
            </div>
          )}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Fav */}
          <ActionBtn icon={<Heart size={16} color={isFav ? '#ec4899' : '#fff'} fill={isFav ? '#ec4899' : 'none'} />} label={`${photo.favorite_count || 0}`} onClick={onFav} active={isFav} accentColor="rgba(236,72,153,0.3)" />
          {/* Reactions */}
          <ActionBtn icon={<Sparkles size={16} color="#8EEBFF" />} label="תגובה" onClick={() => setShowReactions(s => !s)} active={showReactions} accentColor="rgba(142,235,255,0.2)" />
          {/* Download */}
          {photo.image_url && (
            <ActionBtn icon={<Download size={16} color="#fff" />} label="הורדה" onClick={() => mem.downloadSelectedPhotos([photo])} />
          )}
          {/* Bride pick */}
          {canMarkPick && (
            <ActionBtn icon={<Crown size={16} color={photo.is_bride_pick ? '#fbbf24' : '#fff'} />} label={photo.is_bride_pick ? 'בחירה' : 'הוסף'} onClick={() => onMarkPick(!photo.is_bride_pick)} active={photo.is_bride_pick} accentColor="rgba(251,191,36,0.2)" />
          )}
          {/* Delete */}
          {canDelete && (
            <ActionBtn icon={<Trash2 size={16} color="#f87171" />} label="מחיקה" onClick={() => setShowDeleteConfirm(true)} accentColor="rgba(239,68,68,0.15)" />
          )}
        </div>

        {/* Reactions panel */}
        {showReactions && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '7px', direction: 'rtl' }}>
            {REACTIONS.map(rx => (
              <button key={rx} onClick={() => { onReact(rx); setShowReactions(false) }} style={{
                padding: '7px 13px', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)', borderRadius: '999px',
                color: '#fff', fontSize: '12px', fontFamily: '"Assistant", sans-serif', cursor: 'pointer',
              }}>{rx}</button>
            ))}
          </div>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div style={{ marginTop: '12px', direction: 'rtl', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: '"Assistant", sans-serif', marginBottom: '10px' }}>
              למחוק את התמונה לצמיתות?
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ ...pill(false), padding: '9px 18px' }}>ביטול</button>
              <button onClick={onDelete} style={{ ...pill(true), padding: '9px 18px', background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>מחיקה</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, active, accentColor }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      background: active && accentColor ? accentColor : 'rgba(255,255,255,0.07)',
      border: `1px solid ${active && accentColor ? accentColor.replace('0.2', '0.4').replace('0.3', '0.5') : 'rgba(255,255,255,0.12)'}`,
      borderRadius: '16px', padding: '9px 12px', cursor: 'pointer',
      transition: 'background 0.2s ease', flex: 1,
    }}>
      {icon}
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontFamily: '"Assistant", sans-serif', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}

// ── Create Album Modal ────────────────────────────────────────────────────────

function CreateAlbumModal({ eventId, userId, displayName, onClose, onCreated }) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [icon,        setIcon]        = useState('sparkles')
  const [gradientIdx, setGradientIdx] = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleCreate() {
    if (!title.trim() || !icon) { setError('חסרים שם ואייקון לאלבום ✨'); return }
    setLoading(true)
    mem.createAlbum(eventId, {
      title: title.trim(), description: description.trim(), icon,
      gradient: ALBUM_GRADIENTS[gradientIdx],
      createdBy: userId, createdByDisplayName: displayName || 'משתמשת',
    })
    setLoading(false)
    onCreated()
  }

  return (
    <BottomSheet onClose={onClose} title="אלבום חדש ✨">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', direction: 'rtl' }}>

        {/* Title */}
        <div>
          <ModalLabel>שם האלבום *</ModalLabel>
          <ModalInput placeholder="לדוגמה: יום יאכטה 🌊" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <ModalLabel>תיאור קצר (אופציונלי)</ModalLabel>
          <ModalInput placeholder="ספרי על האלבום..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Icon picker */}
        <div>
          <ModalLabel>אייקון *</ModalLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ALBUM_ICON_OPTIONS.map(({ key, emoji }) => (
              <button key={key} onClick={() => setIcon(key)} style={{
                width: '42px', height: '42px', borderRadius: '14px', fontSize: '22px',
                background: icon === key ? 'rgba(45,212,191,0.25)' : 'rgba(255,255,255,0.07)',
                border: icon === key ? '2px solid rgba(45,212,191,0.6)' : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
              }}>{emoji}</button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <ModalLabel>צבע</ModalLabel>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ALBUM_GRADIENTS.map((g, i) => (
              <button key={i} onClick={() => setGradientIdx(i)} style={{
                width: '36px', height: '36px', borderRadius: '50%', background: g,
                border: gradientIdx === i ? '3px solid #2dd4bf' : '2px solid transparent',
                cursor: 'pointer', flexShrink: 0, outline: 'none',
              }} />
            ))}
          </div>
        </div>

        {error && <div style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

        <button
          onClick={handleCreate}
          disabled={loading || !title.trim()}
          style={{
            padding: '16px',
            background: title.trim() ? 'linear-gradient(135deg,rgba(45,212,191,0.5),rgba(14,165,233,0.6))' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: '999px',
            color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: '"Assistant", sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: title.trim() ? 'pointer' : 'default',
            boxShadow: title.trim() ? '0 10px 28px rgba(45,212,191,0.3)' : 'none',
          }}
        >
          <FolderPlus size={17} />
          {loading ? 'יוצרת...' : 'יצירת אלבום'}
        </button>
      </div>
    </BottomSheet>
  )
}

// ── Upload Photos Modal ───────────────────────────────────────────────────────

function UploadPhotosModal({ eventId, albums, userId, currentMember, onClose, onUploaded }) {
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id || '')
  const [previews,   setPreviews]   = useState([])  // [{ file, url, name }]
  const [caption,    setCaption]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const fileInputRef = useRef()

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    const newPreviews = files.map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name }))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  function removePreview(idx) {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleUpload() {
    if (!selectedAlbumId) { setError('בחרי אלבום'); return }
    if (previews.length === 0) { setError('לא נבחרו תמונות'); return }
    setLoading(true)
    setError('')
    try {
      await mem.uploadPhotos(eventId, {
        albumId: selectedAlbumId,
        files: previews.map(p => p.file),
        caption: caption.trim(),
        uploadedBy: userId,
        uploaderDisplayName: currentMember?.display_name || 'משתמשת',
        uploaderAvatarUrl: currentMember?.avatar_url || null,
      })
      previews.forEach(p => URL.revokeObjectURL(p.url))
      onUploaded()
    } catch (e) {
      setError('שגיאה בהעלאה. נסי שוב.')
    }
    setLoading(false)
  }

  return (
    <BottomSheet onClose={onClose} title="העלאת תמונות 📸">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', direction: 'rtl' }}>

        {/* Album select */}
        <div>
          <ModalLabel>אלבום</ModalLabel>
          {albums.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontFamily: '"Assistant", sans-serif' }}>
              אין אלבומים עדיין. צרי אלבום תחילה.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {albums.map(a => (
                <button key={a.id} onClick={() => setSelectedAlbumId(a.id)} style={pill(selectedAlbumId === a.id)}>
                  {ALBUM_ICON_EMOJI[a.icon] || '📸'} {a.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File picker */}
        <div>
          <ModalLabel>תמונות</ModalLabel>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={{
            width: '100%', padding: '20px',
            background: 'rgba(45,212,191,0.08)', border: '2px dashed rgba(45,212,191,0.35)',
            borderRadius: '18px', color: '#2dd4bf', fontSize: '14px', fontWeight: 600,
            fontFamily: '"Assistant", sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            cursor: 'pointer',
          }}>
            <Camera size={24} />
            לחצי לבחירת תמונות
          </button>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={p.url} alt={p.name} style={{ width: '76px', height: '76px', borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
                <button onClick={() => removePreview(i)} style={{
                  position: 'absolute', top: '3px', right: '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(0,5,20,0.7)', border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <X size={10} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caption */}
        <div>
          <ModalLabel>כיתוב (אופציונלי)</ModalLabel>
          <ModalInput placeholder="ספרי על הרגע הזה..." value={caption} onChange={e => setCaption(e.target.value)} />
        </div>

        {error && <div style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

        <button
          onClick={handleUpload}
          disabled={loading || previews.length === 0 || !selectedAlbumId}
          style={{
            padding: '16px',
            background: (previews.length > 0 && selectedAlbumId) ? 'linear-gradient(135deg,rgba(45,212,191,0.5),rgba(14,165,233,0.6))' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: '999px',
            color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: '"Assistant", sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: (previews.length > 0 && selectedAlbumId) ? 'pointer' : 'default',
            boxShadow: (previews.length > 0 && selectedAlbumId) ? '0 10px 28px rgba(45,212,191,0.3)' : 'none',
          }}
        >
          <Upload size={17} />
          {loading ? 'מעלה...' : `העלאת ${previews.length || ''} תמונות`}
        </button>
      </div>
    </BottomSheet>
  )
}

// ── Shared modal components ───────────────────────────────────────────────────

function BottomSheet({ children, title, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,5,20,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 20px', animation: 'fadeInUp 0.25s ease forwards' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'rgba(6,14,35,0.94)', backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.16)', borderRadius: '32px 32px 24px 24px',
        padding: '24px 20px 28px', width: '100%', maxWidth: '460px',
        maxHeight: '85dvh', overflowY: 'auto', scrollbarWidth: 'none',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        {/* Handle + header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="rgba(255,255,255,0.5)" />
          </button>
          <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, fontFamily: '"Assistant", sans-serif', direction: 'rtl', margin: 0 }}>
            {title}
          </h3>
          <div style={{ width: '28px' }} />
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalLabel({ children }) {
  return <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 600, fontFamily: '"Assistant", sans-serif', marginBottom: '8px', letterSpacing: '0.5px' }}>{children}</div>
}

function ModalInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', padding: '13px 16px',
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '14px', color: '#fff', fontSize: '15px', outline: 'none',
        direction: 'rtl', fontFamily: '"Assistant", sans-serif', boxSizing: 'border-box',
      }}
    />
  )
}
