export async function setSession(idToken: string) {
  console.log('📝 Client: Setting session with token length:', idToken?.length || 0);
  
  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    
    console.log('📝 Client: Session API response status:', res.status);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Client: Session API failed:', {
        status: res.status,
        error: errorData.error,
        statusText: res.statusText
      });
      throw new Error(errorData.error || `Failed to set session (${res.status})`);
    }
    
    const data = await res.json();
    console.log('✅ Client: Session set successfully for user:', data.userId);
  } catch (error: any) {
    console.error('❌ Client: Session error:', error);
    throw new Error(error.message || 'Failed to set session');
  }
}

export async function clearSession() {
  const res = await fetch('/api/session', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear session')
}
