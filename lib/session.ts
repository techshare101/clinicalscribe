export async function setSession(idToken: string) {
  console.log('📝 Client: Setting session with token length:', idToken?.length || 0);
  
  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    
    console.log('📝 Client: Session API response status:', res.status);
    
    // Log the response headers for debugging
    console.log('📝 Client: Response headers:', [...res.headers.entries()]);
    
    // Try to get the response text for better error debugging
    const responseText = await res.text();
    console.log('📝 Client: Raw response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    // Try to parse as JSON, but handle if it's not JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Client: Failed to parse response as JSON:', parseError);
      console.error('📝 Client: Response text that failed to parse:', responseText);
      throw new Error(`Failed to parse response as JSON. Status: ${res.status}, Response: ${responseText}`);
    }
    
    if (!res.ok) {
      console.error('❌ Client: Session API failed:', {
        status: res.status,
        error: responseData.error,
        statusText: res.statusText
      });
      throw new Error(responseData.error || `Failed to set session (${res.status})`);
    }
    
    console.log('✅ Client: Session set successfully for user:', responseData.userId);
  } catch (error: any) {
    console.error('❌ Client: Session error:', error);
    throw new Error(error.message || 'Failed to set session');
  }
}

export async function clearSession() {
  const res = await fetch('/api/session', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear session')
}
