import { getAudioUrl } from '../lib/getAudioUrl';

// Mock the Firebase auth module
jest.mock('../lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-id-token')
    }
  }
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('getAudioUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a signed URL when given a storage path', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        url: 'https://mock-signed-url.com/audio.webm'
      })
    });

    const storagePath = 'audio/user123/session456/123456789.webm';
    const result = await getAudioUrl(storagePath);

    expect(result).toBe('https://mock-signed-url.com/audio.webm');
    expect(global.fetch).toHaveBeenCalledWith('/api/storage/audio-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-id-token'
      },
      body: JSON.stringify({
        path: storagePath
      })
    });
  });

  it('should throw an error when the user is not authenticated', async () => {
    // Mock unauthenticated user
    jest.spyOn(require('../lib/firebase'), 'auth', 'get').mockReturnValue({
      currentUser: null
    });

    const storagePath = 'audio/user123/session456/123456789.webm';
    
    await expect(getAudioUrl(storagePath)).rejects.toThrow('User not authenticated');
  });

  it('should throw an error when the API returns an error', async () => {
    // Mock the fetch response with an error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const storagePath = 'audio/user123/session456/123456789.webm';
    
    await expect(getAudioUrl(storagePath)).rejects.toThrow('Failed to get signed URL');
  });
});