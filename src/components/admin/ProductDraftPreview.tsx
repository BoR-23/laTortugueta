'use client'

import type { AdminProductFormValues } from '@/types/admin'

export type DraftDiffEntry = {
  field: string
  label: string
  currentValue: string
  draftValue: string
}

interface DraftPreviewProps {
  draft: {
    values: AdminProductFormValues
    updatedAt: string
    actor?: {
      name?: string | null
      email?: string | null
    }
  }
  diffEntries: DraftDiffEntry[]
  onApplyDraft: () => void
  onDiscardDraft: () => void
  discarding?: boolean
  error?: string | null
}

const formatDate = (value: string) => {
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  } catch {
    return value
  }
}

export function ProductDraftPreview({
  draft,
  diffEntries,
  onApplyDraft,
  onDiscardDraft,
  discarding,
  error
}: DraftPreviewProps) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
            Borrador pendiente
          </p>
          <p className="mt-1 text-sm">
            Última edición: {formatDate(draft.updatedAt)}
            {draft.actor?.name && (
              <>
                {' · '}
                <span className="font-semibold">{draft.actor.name}</span>
              </>
            )}
          </p>
        </div>

        {diffEntries.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-white/60 p-4 text-xs text-amber-900">
            <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-amber-600">
              Cambios detectados
            </p>
            <ul className="space-y-2">
              {diffEntries.map(entry => (
                <li key={entry.field} className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-amber-500">
                    {entry.label}
                  </span>
                  <span>
                    <span className="text-amber-700 line-through">{entry.currentValue || '—'}</span>
                    <span className="mx-2 text-amber-500">→</span>
                    <span className="font-semibold text-amber-900">{entry.draftValue || '—'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-white/60 px-4 py-3 text-xs text-amber-600">
            El borrador coincide con la versión publicada.
          </p>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApplyDraft}
            disabled={Boolean(discarding)}
            className="btn-primary px-4 py-2 disabled:opacity-40"
          >
            Aplicar borrador
          </button>
          <button
            type="button"
            onClick={onDiscardDraft}
            disabled={Boolean(discarding)}
            className="btn-secondary px-4 py-2 text-amber-800 disabled:opacity-40"
          >
            {discarding ? 'Eliminando…' : 'Descartar borrador'}
          </button>
        </div>
      </div>
    </div>
  )
}
