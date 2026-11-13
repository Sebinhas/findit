import { useCallback, useEffect, useState } from 'react'
import { supabase, ITEM_SELECT } from './supabase'
import type { Category, Location, Match } from './types'

export function useCatalogs() {
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('name').then(({ data }) => setCategories(data ?? []))
    supabase.from('locations').select('*').eq('is_active', true).order('name').then(({ data }) => setLocations(data ?? []))
  }, [])
  return { categories, locations }
}

export const MATCH_SELECT = `*, lost:items!lost_item_id(${ITEM_SELECT}), found:items!found_item_id(${ITEM_SELECT})`

/** Coincidencias activas visibles para el usuario (RLS ya filtra a las suyas). */
export function useMyMatches(userId: string | undefined, itemId?: string) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    let q = supabase.from('matches').select(MATCH_SELECT).eq('status', 'ACTIVE').order('score', { ascending: false })
    if (itemId) q = q.or(`lost_item_id.eq.${itemId},found_item_id.eq.${itemId}`)
    const { data } = await q
    const visible = ((data ?? []) as Match[]).filter((m) => {
      if (!m.lost || !m.found) return false
      const mineLost = m.lost.user_id === userId
      return mineLost ? !m.lost_owner_dismissed : !m.found_owner_dismissed
    })
    setMatches(visible)
    setLoading(false)
  }, [userId, itemId])

  useEffect(() => { load() }, [load])
  return { matches, loading, reload: load }
}
