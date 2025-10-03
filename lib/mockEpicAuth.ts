// lib/mockEpicAuth.ts
/**
 * Mock implementation for Epic SMART on FHIR authentication
 * Used for testing when actual Epic connection is not available
 */

// Mock token response that mimics what Epic would return
export type MockEpicTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  patient?: string;
  encounter?: string;
  id_token?: string;
  refresh_token?: string;
}

/**
 * Creates a mock Epic token response for testing
 */
export function createMockEpicToken(): MockEpicTokenResponse {
  return {
    access_token: `mock-epic-token-${Date.now()}`,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'openid fhirUser offline_access patient/*.read patient/*.write DocumentReference.Create',
    refresh_token: `mock-refresh-token-${Date.now()}`
  };
}

/**
 * Mocks the Epic token exchange process for testing
 * This is useful when Epic connection is unavailable
 */
export async function mockExchangeEpicCodeForToken(
  code: string,
  options?: { mockFail?: boolean }
): Promise<MockEpicTokenResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Optionally simulate a failure
  if (options?.mockFail) {
    throw new Error('Mock Epic token exchange failed');
  }
  
  // Return a mock token response
  return createMockEpicToken();
}

/**
 * Mocks exchanging a refresh token for a new access token
 */
export async function mockExchangeRefreshTokenForAccessToken(
  refreshToken: string
): Promise<MockEpicTokenResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a new mock token response
  return createMockEpicToken();
}

/**
 * Mocks creating a DocumentReference in Epic
 */
export async function mockCreateDocumentReference(
  accessToken: string, 
  documentData: any
): Promise<{ id: string, status: number }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate Epic response with a generated ID
  return {
    id: `mock-epic-docref-${Date.now()}`,
    status: 201
  };
}

/**
 * Checks if we should use mock implementation based on environment or settings
 */
export function shouldUseMockEpic(): boolean {
  // Add logic here to determine if mock implementation should be used
  // e.g., check for environment variable, URL parameter, etc.
  return process.env.USE_MOCK_EPIC === 'true' || 
         typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('mock_epic');
}