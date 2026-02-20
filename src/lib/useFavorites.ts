import { useState, useCallback } from 'react'

const LS_KEY = 'fish-fry-favorites'

function loadFavorites(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

function saveFavorites(favs: Set<number>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...favs]))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(loadFavorites)

  const toggle = useCallback((locationId: number) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(locationId)) next.delete(locationId)
      else next.add(locationId)
      saveFavorites(next)
      return next
    })
  }, [])

  return { favorites, toggle }
}
