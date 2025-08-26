import { useEffect, useState } from 'react'

export function useSmartStatus() {
  const [status, setStatus] = useState<{ 
    connected: boolean; 
    fhirBase?: string | null; 
    error?: string;
    loading: boolean;
    source?: string;
    refreshed?: boolean;
  }>({ 
    connected: false, 
    fhirBase: null,
    loading: true,
    source: undefined,
    refreshed: false
  })

  async function fetchStatus() {
    try {
      // Use a short timeout to prevent long waiting times if there are network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch('/api/smart/status', { 
        cache: 'no-store',
        signal: controller.signal,
        // Add headers to ensure we get a JSON response
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      
      // Don't throw on non-200 responses, just handle them gracefully
      let responseData;
      
      // Check if the response is HTML (error page) instead of JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML instead of JSON from API');
        throw new Error('Received HTML response instead of JSON');
      }
      
      try {
        responseData = await res.json();
      } catch (parseError) {
        console.error('Error parsing SMART status response:', parseError);
        // Try to get the text to see what's wrong
        const text = await res.text().catch(() => 'Could not read response body');
        console.error('Response text:', text.substring(0, 200)); // Log first 200 chars
        throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
      }
      
      // Always use the data from the response, even if it's an error response
      setStatus({
        ...responseData,
        loading: false,
        // If the API returned an error message, use it
        error: !res.ok ? responseData.error || `HTTP error ${res.status}` : undefined
      });
      
      // If the token was refreshed, show a notification
      if (responseData.refreshed) {
        console.log('✅ SMART token was automatically refreshed');
      }
    } catch (err: any) {
      console.error('Error fetching SMART status:', err);
      // Always return a valid status object with default values if fetch fails
      setStatus({ 
        connected: false, 
        fhirBase: null,
        error: err?.message || 'Failed to fetch SMART status',
        loading: false,
        source: undefined,
        refreshed: false
      });
    }
  }

  // Function to manually refresh the token
  async function refreshToken() {
    try {
      // This would be implemented if we needed to manually trigger a token refresh
      // For now, we'll just refetch the status which will trigger the refresh in the API
      await fetchStatus();
    } catch (err) {
      console.error('Error refreshing token:', err);
    }
  }

  useEffect(() => {
    fetchStatus();
    
    // Re-fetch when tab becomes visible
    const onVis = () => document.visibilityState === 'visible' && fetchStatus();
    document.addEventListener('visibilitychange', onVis);
    
    // Set up a refresh interval (every 30 seconds)
    const interval = setInterval(fetchStatus, 30000);
    
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(interval);
    };
  }, []);

  return { ...status, refreshToken };
}