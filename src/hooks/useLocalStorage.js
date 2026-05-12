import { useState } from 'react'

/**
 * Like useState, but persists the value to localStorage under the given key.
 * Falls back to initialValue if nothing is stored yet or if JSON.parse fails.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) {
      console.warn('useLocalStorage: could not write to localStorage', err)
    }
  }

  const clearValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (err) {
      console.warn('useLocalStorage: could not clear localStorage', err)
    }
  }

  return [storedValue, setValue, clearValue]
}
