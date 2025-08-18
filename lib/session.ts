export async function setSession(idToken: string) {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('Failed to set session')
}

export async function clearSession() {
  const res = await fetch('/api/session', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear session')
}
