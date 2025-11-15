'use client'

import { useState } from 'react'
import type { SiteSettings } from '@/lib/settings'

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
    </section>
  )
}
