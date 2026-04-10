import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/Navbar'
import PhotoUploadModal from '../components/PhotoUploadModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const PHASE_ORDER = { '术前': 0, '术后1周': 1, '术后1月': 2, '术后3月': 3 }

// ── Lightbox ──────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onNavigate }) {
  const current = photos[index]
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowLeft') onNavigate(-1)
      if (e.key === 'ArrowRight') onNavigate(1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onNavigate])

  if (!current) return null
  return (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
         onClick={onClose}>
      {/* Close */}
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[20px] hover:bg-white/20 z-10"
              onClick={onClose}>×</button>

      {/* Left arrow */}
      {index > 0 && (
        <button className="absolute left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
                onClick={e => { e.stopPropagation(); onNavigate(-1) }}>‹</button>
      )}

      {/* Image */}
      <img src={current.url} alt={current.phase}
           className="max-w-[90vw] max-h-[90vh] object-contain rounded-[8px]"
           onClick={e => e.stopPropagation()} />

      {/* Right arrow */}
      {index < photos.length - 1 && (
        <button className="absolute right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
                onClick={e => { e.stopPropagation(); onNavigate(1) }}>›</button>
      )}

      {/* Phase label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-1.5 rounded-full">
        <span className="text-white text-[12px] font-sans">{current.phase}</span>
        <span className="text-white/50 text-[11px] font-sans ml-2">{index + 1} / {photos.length}</span>
      </div>
    </div>
  )
}

// ── Photo card ────────────────────────────────────────────────────────────
function PhotoCard({ photo, onClick, onDelete }) {
  const longPressTimer = useRef(null)
  const [showDelete, setShowDelete] = useState(false)

  function startLongPress() {
    longPressTimer.current = setTimeout(() => setShowDelete(true), 600)
  }
  function cancelLongPress() {
    clearTimeout(longPressTimer.current)
  }

  return (
    <div className="relative shrink-0 group"
         onTouchStart={startLongPress}
         onTouchEnd={cancelLongPress}
         onTouchMove={cancelLongPress}
         onContextMenu={e => { e.preventDefault(); setShowDelete(true) }}>
      <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-[14px] overflow-hidden cursor-pointer"
           onClick={() => { if (!showDelete) onClick() }}>
        {photo.url ? (
          <img src={photo.url} alt={photo.phase} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-cream-deep flex items-center justify-center">
            <span className="text-[24px]">🖼️</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-[14px] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[11px] font-sans">查看大图</span>
        </div>
      </div>

      {/* Phase label */}
      <p className="text-[10px] font-sans text-ink-muted text-center mt-1.5">{photo.phase}</p>

      {/* Delete overlay */}
      {showDelete && (
        <div className="absolute inset-0 rounded-[14px] bg-black/60 flex flex-col items-center justify-center gap-2 z-10"
             onClick={e => e.stopPropagation()}>
          <button onClick={() => { setShowDelete(false); onDelete(photo) }}
            className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-[16px]">
            🗑
          </button>
          <button onClick={() => setShowDelete(false)}
            className="text-white/70 text-[11px] font-sans">取消</button>
        </div>
      )}
    </div>
  )
}

// ── Treatment photo section ───────────────────────────────────────────────
function TreatmentSection({ treatment, photos, onUpload, onPhotoClick, onDelete }) {
  const sorted = [...photos].sort((a, b) =>
    (PHASE_ORDER[a.phase] ?? 99) - (PHASE_ORDER[b.phase] ?? 99)
  )

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[15px] text-ink"
             style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            {treatment.name}
          </p>
          <p className="text-[11px] text-ink-muted font-sans">
            {new Date(treatment.treatment_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {/* Desktop upload button */}
        <button onClick={() => onUpload(treatment)}
          className="hidden md:flex items-center gap-1 px-4 py-2 bg-cream-deep text-ink-soft rounded-full text-[12px] font-sans hover:bg-sand transition-colors">
          + 上传照片
        </button>
      </div>

      {/* Mobile upload button (inline) */}
      <button onClick={() => onUpload(treatment)}
        className="md:hidden mb-4 flex items-center gap-1 px-3 py-1.5 bg-cream-deep text-ink-soft rounded-full text-[11px] font-sans">
        + 上传照片
      </button>

      {/* Photo row */}
      {sorted.length === 0 ? (
        <div className="h-20 flex items-center justify-center rounded-[12px] border border-dashed border-sand">
          <p className="text-[12px] text-ink-muted font-sans">还没有照片，上传第一张</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar
                        md:grid md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:overflow-visible">
          {sorted.map((photo, idx) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => onPhotoClick(treatment.id, idx, sorted)}
              onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function PhotosPage() {
  const { user } = useAuth()

  const [treatments, setTreatments]   = useState([])
  const [photoMap,   setPhotoMap]     = useState({})  // treatment_id → photos[]
  const [loading,    setLoading]      = useState(true)
  const [uploadTarget, setUploadTarget] = useState(null)  // treatment | 'fab'
  const [lightbox,   setLightbox]     = useState(null)    // { photos, index }

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [treatRes, photoRes] = await Promise.all([
      supabase.from('treatments')
        .select('id, name, treatment_date')
        .eq('user_id', user.id)
        .order('treatment_date', { ascending: false }),
      supabase.from('treatment_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at'),
    ])

    const treats = treatRes.data ?? []
    const photos = photoRes.data ?? []
    setTreatments(treats)

    // Generate signed URLs in batch
    if (photos.length > 0) {
      const { data: signed } = await supabase.storage
        .from('treatment-photos')
        .createSignedUrls(photos.map(p => p.storage_path), 3600)

      const urlMap = {}
      signed?.forEach(s => { urlMap[s.path] = s.signedUrl })
      const photosWithUrls = photos.map(p => ({ ...p, url: urlMap[p.storage_path] ?? null }))

      // Group by treatment_id
      const map = {}
      photosWithUrls.forEach(p => {
        if (!map[p.treatment_id]) map[p.treatment_id] = []
        map[p.treatment_id].push(p)
      })
      setPhotoMap(map)
    }
    setLoading(false)
  }

  async function handleDelete(photo) {
    await supabase.storage.from('treatment-photos').remove([photo.storage_path])
    await supabase.from('treatment_photos').delete().eq('id', photo.id)
    fetchAll()
  }

  function openLightbox(treatmentId, idx, photos) {
    setLightbox({ photos, index: idx })
  }

  const navigateLightbox = useCallback((dir) => {
    setLightbox(lb => {
      if (!lb) return lb
      const next = lb.index + dir
      if (next < 0 || next >= lb.photos.length) return lb
      return { ...lb, index: next }
    })
  }, [])

  // Treatments that have photos OR all treatments
  const treatmentsWithSections = treatments

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="pt-16 px-4 md:px-8 max-w-4xl mx-auto pb-24">

        <div className="pt-10 pb-8">
          <h1 className="text-[22px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
            对比相册
          </h1>
          <p className="text-[12px] text-ink-muted font-sans mt-1">记录每个阶段的变化</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="bg-white rounded-[20px] h-44 animate-pulse" />)}
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full border border-sand flex items-center justify-center mx-auto mb-4">
              <span className="text-[24px]">📷</span>
            </div>
            <p className="text-[13px] text-ink-muted">先去记录项目，再来上传对比照片</p>
          </div>
        ) : (
          <div className="space-y-4">
            {treatmentsWithSections.map(t => (
              <TreatmentSection
                key={t.id}
                treatment={t}
                photos={photoMap[t.id] ?? []}
                onUpload={t => setUploadTarget(t)}
                onPhotoClick={(tid, idx, photos) => openLightbox(tid, idx, photos)}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      {treatments.length > 0 && (
        <button
          onClick={() => setUploadTarget('fab')}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-ink text-cream rounded-full
                     flex items-center justify-center text-[24px] z-30 transition-transform hover:scale-105"
          style={{ boxShadow: '0 8px 24px rgba(28,25,23,0.3)' }}>
          📷
        </button>
      )}

      {/* Upload modal */}
      {uploadTarget && (
        <PhotoUploadModal
          treatment={uploadTarget === 'fab' ? null : uploadTarget}
          treatments={uploadTarget === 'fab' ? treatments : null}
          onSave={() => { setUploadTarget(null); fetchAll() }}
          onClose={() => setUploadTarget(null)} />
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={navigateLightbox} />
      )}
    </div>
  )
}
