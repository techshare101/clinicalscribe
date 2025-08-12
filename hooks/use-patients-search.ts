import { useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, limit, orderBy, query, startAt, endAt } from 'firebase/firestore'

export type Patient = {
  id: string
  name: string
  name_lower?: string
  mrn?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other' | 'unknown'
}

export function usePatientsSearch(term: string) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Patient[]>([])
  const q = useMemo(() => (term || '').trim().toLowerCase(), [term])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (q.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        // Query by name_lower prefix. Requires documents to have name_lower stored.
        const patientsRef = collection(db, 'patients')
        const snap = await getDocs(
          query(
            patientsRef,
            orderBy('name_lower'),
            startAt(q),
            endAt(q + '\uf8ff'),
            limit(10)
          )
        )
        if (cancelled) return
        const list: Patient[] = []
        snap.forEach((doc) => {
          const d = doc.data() as any
          list.push({ id: doc.id, name: d.name || '', name_lower: d.name_lower, mrn: d.mrn, birthDate: d.birthDate, gender: d.gender })
        })
        setResults(list)
      } catch (e) {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [q])

  return { loading, results }
}
