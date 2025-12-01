'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import type { SiteSettings } from '@/lib/settings'
import { uploadProductImage } from '@/lib/client/uploadProductImage'
import { getProductImageVariant } from '@/lib/images'

interface SiteSettingsPanelProps {
  initialSettings: SiteSettings
  onChange?: (settings: SiteSettings) => void
}

const OPTIONS: Array<{ key: keyof SiteSettings; label: string; description: string }> = [
  {
    key: 'enableTopVisited',
    label: 'Top visitas',
    description: 'Muestra el bloque de productos más consultados en la home.'
  },
  {
    key: 'enableTestimonials',
    label: 'Testimonios',
    description: 'Activa la sección de testimonios curados.'
  },
  {
    key: 'enableStoryHighlights',
    label: 'Historias destacadas',
    description: 'Sección de contenido comercial en la home.'
  },
  {
    key: 'enableLocalSuggestions',
    label: 'Otros clientes visitan',
    description: 'Bloque auxiliar en la ficha con recomendaciones basadas en navegación local.'
  },
  {
    key: 'enableCatalogBadges',
    label: 'Badges de popularidad',
    description: 'Muestra el contador de visitas sobre las tarjetas del catálogo.'
  }
]

export function SiteSettingsPanel({ initialSettings, onChange }: SiteSettingsPanelProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [savingKey, setSavingKey] = useState<keyof SiteSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState<string>('/favicon.ico')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const res = await fetch('/api/favicons/list')
        if (res.ok) {
          const data = await res.json()
          if (data.files && data.files.length > 0) {
            // Buscamos preferiblemente el icono de 192px o usamos el primero que encuentre
            const bestIcon = data.files.find((f: any) => f.name.includes('192')) || data.files[0]
            if (bestIcon) setFaviconUrl(bestIcon.url)
          }
        }
      } catch (e) {
        console.error('No se pudo cargar el favicon para la previsualización', e)
      }
    }
    fetchFavicon()
  }, [])

  const handleTextChange = async (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleTextBlur = async (key: keyof SiteSettings, value: string) => {
    if (value === initialSettings[key]) return

    setSavingKey(key)
    setError(null)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })
      if (!response.ok) throw new Error('Error al guardar')
      const updated = await response.json()
      setSettings(updated)
      onChange?.(updated)
    } catch (err) {
      setError('No se pudo guardar el cambio.')
    } finally {
      setSavingKey(null)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      // We use a fixed ID 'site-settings' for global assets
      const result = await uploadProductImage('site-settings', file)

      // Save the new URL to settings
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo_og_image: result.path })
      })

      if (!response.ok) throw new Error('Error al guardar la imagen')

      const updated = await response.json()
      setSettings(updated)
      onChange?.(updated)
    } catch (err) {
      setError('Error al subir la imagen.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleToggle = async (key: keyof SiteSettings) => {
    const nextValue = !settings[key]
    setSavingKey(key)
    setError(null)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: nextValue })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'No se pudieron guardar los ajustes.')
      }
      const updated = await response.json()
      setSettings(updated)
      onChange?.(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">Ajustes del sitio</h2>
          <p className="text-xs text-neutral-500">Controla qué secciones están visibles para los visitantes.</p>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* SEO Section */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">SEO Global</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Título Global (Opcional)</label>
              <input
                type="text"
                value={settings.seo_title || ''}
                onChange={e => handleTextChange('seo_title', e.target.value)}
                onBlur={e => handleTextBlur('seo_title', e.target.value)}
                placeholder="Ej: La Tortugueta | Calcetines Artesanales"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                disabled={savingKey === 'seo_title'}
              />
              <p className="mt-1 text-[10px] text-neutral-400">Si se deja vacío, se usará el título por defecto.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Descripción Global (Opcional)</label>
              <textarea
                value={settings.seo_description || ''}
                onChange={e => handleTextChange('seo_description', e.target.value)}
                onBlur={e => handleTextBlur('seo_description', e.target.value)}
                placeholder="Descripción corta para Google..."
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                disabled={savingKey === 'seo_description'}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Imagen OpenGraph (Social)</label>
              <div className="flex items-start gap-4">
                <div className="relative h-32 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {settings.seo_og_image ? (
                    <Image
                      src={getProductImageVariant(settings.seo_og_image, 'medium')}
                      alt="OG Image"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo...' : 'Cambiar imagen'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-[10px] text-neutral-400 w-40">
                    Recomendado: 1200x630px. Se mostrará al compartir en redes sociales.
                  </p>
                </div>
              </div>
            </div>

            {/* Google Snippet Preview */}
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Vista Previa en Google</h4>
              <div className="max-w-[600px] font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 p-1">
                    {/* Use dynamic favicon from R2 */}
                    <img
                      src={faviconUrl}
                      alt="Favicon"
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-[#202124]">La Tortugueta</span>
                    <span className="text-xs text-[#5f6368]">https://www.latortugueta.com</span>
                  </div>
                </div>
                <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer truncate">
                  {settings.seo_title || 'La Tortugueta — Taller de calcetines a medida y bordados tradicionales'}
                </h3>
                <div className="mt-1 flex gap-2 text-sm text-[#4d5156]">
                  {settings.seo_og_image && (
                    <div className="relative h-[90px] w-[90px] flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100">
                      <Image
                        src={getProductImageVariant(settings.seo_og_image, 'thumb')}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="line-clamp-4">
                    {settings.seo_description || 'Taller familiar en Alcoi que reproduce calcetines tradicionales históricos y atiende encargos artesanales a medida. Más de 300 diseños documentados...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Secciones</h3>
        {OPTIONS.map(option => (
          <label
            key={option.key}
            className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700"
          >
            <div>
              <p className="font-semibold text-neutral-900">{option.label}</p>
              <p className="text-xs text-neutral-500">{option.description}</p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings[option.key])}
              onChange={() => handleToggle(option.key)}
              className="h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              disabled={savingKey === option.key}
            />
          </label>
        ))}
      </div>
    </section >
  )
}
