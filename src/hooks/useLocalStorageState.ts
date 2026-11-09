import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * `useState` persistido em localStorage. Enquanto não houver backend, mantém
 * progresso de aula, anotações e preferências entre recarregamentos.
 */
export function useLocalStorageState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // ignora leitura inválida e usa o valor inicial
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // armazenamento indisponível (modo privado/cota); segue só em memória
    }
  }, [key, value])

  return [value, setValue]
}
