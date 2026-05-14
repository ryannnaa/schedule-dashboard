import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook for managing saved column mappings via Supabase.
 * Falls back gracefully if Supabase is not configured.
 *
 * Returns:
 *   savedMappings  — array of { id, name, mapping, created_at }
 *   isLoading      — true while fetching
 *   error          — error message string or null
 *   saveMapping    — (name, mapping) => Promise<{ error }>
 *   deleteMapping  — (id) => Promise<{ error }>
 *   refresh        — () => void  re-fetch from Supabase
 */
export function useMappings() {
  const [savedMappings, setSavedMappings] = useState([])
  const [isLoading,     setIsLoading]     = useState(false)
  const [error,         setError]         = useState(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('mappings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedMappings(data ?? [])
    } catch (err) {
      setError(err.message ?? 'Failed to load saved mappings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const saveMapping = useCallback(async (name, mapping) => {
    setError(null)
    try {
      // Upsert by name — overwrite if a mapping with this name already exists
      const { error } = await supabase
        .from('mappings')
        .upsert({ name, mapping }, { onConflict: 'name' })

      if (error) throw error
      await fetch()
      return { error: null }
    } catch (err) {
      const msg = err.message ?? 'Failed to save mapping'
      setError(msg)
      return { error: msg }
    }
  }, [fetch])

  const deleteMapping = useCallback(async (id) => {
    setError(null)
    try {
      const { error } = await supabase
        .from('mappings')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetch()
      return { error: null }
    } catch (err) {
      const msg = err.message ?? 'Failed to delete mapping'
      setError(msg)
      return { error: msg }
    }
  }, [fetch])

  return {
    savedMappings,
    isLoading,
    error,
    saveMapping,
    deleteMapping,
    refresh: fetch,
  }
}
