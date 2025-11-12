'use client'

import { useMemo } from 'react'

export type ChecklistItem = {
  id: string
  label: string
  description?: string
}

const defaultItems: ChecklistItem[] = [
  {
    id: 'tags',
    label: 'Tags revisados',
    description: 'Confirma que las etiquetas describen bien el diseño.'
  },
  {
    id: 'sizes',
    label: 'Tallas verificadas',
    description: 'Comprueba que las tallas disponibles coinciden con el stock.'
  },
  {
    id: 'colors',
    label: 'Colores / categoría confirmados',
    description: 'Asegúrate de que el tipo y la categoría son correctos.'
  },
  {
    id: 'gallery',
    label: 'Galería actualizada',
    description: 'Haz un repaso rápido a las fotos y su orden.'
  }
]

interface PublicationChecklistProps {
  value: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
  items?: ChecklistItem[]
  disabled?: boolean
}

export const defaultChecklistState = () =>
  defaultItems.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.id] = false
    return acc
  }, {})

export function PublicationChecklist({
  value,
  onChange,
  items = defaultItems,
  disabled
}: PublicationChecklistProps) {
  const complete = useMemo(
    () => items.every(item => value[item.id]),
    [items, value]
  )

  const toggle = (id: string) => {
    const next = { ...value, [id]: !value[id] }
    onChange(next)
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
      <div className="flex items-center justify-between pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Checklist antes de publicar
        </p>
        <span
          className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
            complete
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {complete ? 'Listo' : 'Pendiente'}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              checked={Boolean(value[item.id])}
              disabled={disabled}
              onChange={() => toggle(item.id)}
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">{item.label}</p>
              {item.description && (
                <p className="text-xs text-neutral-500">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
