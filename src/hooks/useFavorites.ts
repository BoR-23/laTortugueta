'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'lt_catalog_favorites'

type Listener = (favorites: string[]) => void

const listeners = new Set<Listener>()

const notifyListeners = (favorites: string[]) => {
  listeners.forEach(listener => listener(favorites))
}

const safeParse = (value: string | null): string[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getStoredFavorites = (): string[] => {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

const persistFavorites = (favorites: string[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setFavorites(getStoredFavorites())

    const listener: Listener = next => setFavorites(next)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const syncFavorites = useCallback((next: string[]) => {
    persistFavorites(next)
    setFavorites(next)
    notifyListeners(next)
  }, [])

  const toggleFavorite = useCallback(
    (id: string) => {
      syncFavorites(
        favorites.includes(id)
          ? favorites.filter(entry => entry !== id)
          : [...favorites, id]
      )
    },
    [favorites, syncFavorites]
  )

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const clearFavorites = useCallback(() => {
    syncFavorites([])
  }, [syncFavorites])

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  return {
    favorites,
    favoriteSet,
    toggleFavorite,
    isFavorite,
    clearFavorites
  }
}
