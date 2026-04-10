import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const PHASES = ['术前', '术后1周', '术后1月', '术后3月']
const PHASE_KEY = { '术前': 'before', '术后1周': 'after-1w', '术后1月': 'after-1m', '术后3月': 'after-3m' }

export default function PhotoUploadModal({ treatment, treatments, onSave, onClose }) {
  const { user } = useAuth()

  // If no specific treatment is passed, show a selector (mobile FAB mode)
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(treatment?.id ?? '')
  const [phase,       setPhase]     = useState('术前')
  const [file,        setFile]      = useState(null)
  const [preview,     setPreview]   = useState(null)
  const [uploading,   setUploading] = useState(false)
  const [progress,    setProgress]  = useState(0)
  const [error,       setError]     = useState('')

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  async function handleUpload() {
    const tid = treatment?.id ?? selectedTreatmentId
    if (!tid) { setError('请选择项目'); return }
    if (!file) { setError('请选择照片'); return }
    setUploading(true)
    setError('')
    setProgress(10)
    try {
      // Compress
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      setProgress(40)

      // Build storage path（用英文 key 避免中文路径问题）
      const ext     = file.name.split('.').pop().toLowerCase() || 'jpg'
      const phaseKey = PHASE_KEY[phase] || 'before'
      const path    = `${user.id}/${tid}/${phaseKey}_${Date.now()}.${ext}`

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('treatment-photos')
        .upload(path, compressed, { contentType: compressed.type || 'image/jpeg' })
      if (uploadErr) throw uploadErr
      setProgress(80)

      // Insert DB record
      const { data, error: dbErr } = await supabase
        .from('treatment_photos')
        .insert({ user_id: user.id, treatment_id: tid, storage_path: path, phase })
        .select()
        .single()
      if (dbErr) throw dbErr
      setProgress(100)
      onSave(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-t-[24px] md:rounded-[24px] w-full md:max-w-[440px] md:mx-4 slide-up md:slide-none shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-7 pb-4">
            <h2 className="text-[18px] text-ink" style={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 300 }}>
              上传对比照片
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream text-ink-muted text-[22px] leading-none">×</button>
          </div>

          <div className="px-7 pb-7 space-y-5">

            {/* Treatment selector (mobile FAB mode — no specific treatment) */}
            {!treatment && treatments && (
              <div>
                <label className="form-label">选择项目</label>
                <select className="input-field" value={selectedTreatmentId}
                  onChange={e => setSelectedTreatmentId(e.target.value)}>
                  <option value="">请选择…</option>
                  {treatments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Phase selector */}
            <div>
              <label className="form-label">拍摄阶段</label>
              <div className="grid grid-cols-4 gap-2">
                {PHASES.map(p => (
                  <button key={p} type="button"
                    onClick={() => setPhase(p)}
                    className={`py-2 rounded-[10px] text-[11px] font-sans transition-colors ${
                      phase === p ? 'bg-ink text-cream' : 'bg-cream-deep text-ink-soft hover:bg-sand'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* File input */}
            <div>
              <label className="form-label">选择照片</label>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" capture="environment"
                  className="sr-only" onChange={handleFileChange} />
                {preview ? (
                  <div className="relative rounded-[14px] overflow-hidden aspect-square max-h-56 flex items-center justify-center bg-cream-deep">
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-[12px] font-sans">点击更换</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[14px] border-2 border-dashed border-sand bg-cream-deep flex flex-col items-center justify-center py-10 hover:border-blush transition-colors">
                    <span className="text-[28px] mb-2">📷</span>
                    <span className="text-[12px] text-ink-muted font-sans">点击选择或拍照</span>
                    <span className="text-[10px] text-ink-muted/60 font-sans mt-1">支持 JPG / PNG，自动压缩至 500KB</span>
                  </div>
                )}
              </label>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="h-1 bg-cream-deep rounded-full overflow-hidden">
                <div className="h-full bg-blush rounded-full transition-all duration-300"
                     style={{ width: `${progress}%` }} />
              </div>
            )}

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-sand rounded-full text-[13px] text-ink-muted hover:border-ink-muted transition-colors font-sans">
                取消
              </button>
              <button type="button" onClick={handleUpload} disabled={uploading || !file}
                className="flex-1 btn-primary">
                {uploading ? `上传中 ${progress}%` : '上 传'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
