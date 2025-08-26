import { adminDb, adminFirestore } from '../lib/firebaseAdmin';

// Mock the Firebase adminDb and adminFirestore
jest.mock('../lib/firebaseAdmin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
  adminFirestore: {
    FieldValue: {
      increment: jest.fn(val => ({ _increment: val })),
    }
  }
}));

// Mock fetch
global.fetch = jest.fn();

// Import the route handler (mocked)
import { POST } from '../app/api/session/recording/route';

describe('Session Recording API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should trigger auto-combine when total duration exceeds 120 minutes', async () => {
    // Mock session document data
    const mockSessionData = {
      totalDuration: 7100, // Just under 120 minutes
      recordings: [],
    };
    
    // Mock get() to return session data
    const mockDocGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => mockSessionData,
    });
    
    // Setup mocks for the chain
    (adminDb.collection as jest.Mock).mockReturnThis();
    (adminDb.doc as jest.Mock).mockReturnThis();
    (adminDb.get as jest.Mock).mockImplementation(mockDocGet);
    
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    
    // Create a mock request with a recording that pushes over the threshold
    const mockRequest = new Request('http://localhost:3000/api/session/recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-id',
        recording: {
          id: 'rec123',
          transcript: 'Test transcript',
          timestamp: new Date(),
          duration: 200, // This will push total over 7200 seconds (120 minutes)
        },
      }),
    });
    
    // Call the API
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(adminDb.update).toHaveBeenCalled();
    expect(responseData).toEqual(expect.objectContaining({
      success: true,
      autoCombineTriggered: true,
    }));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/soap/combine'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test-session-id' }),
      })
    );
  });
  
  it('should not trigger auto-combine when total duration is under threshold', async () => {
    // Mock session document data
    const mockSessionData = {
      totalDuration: 3600, // 60 minutes
      recordings: [],
    };
    
    // Setup mocks
    const mockDocGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => mockSessionData,
    });
    
    (adminDb.collection as jest.Mock).mockReturnThis();
    (adminDb.doc as jest.Mock).mockReturnThis();
    (adminDb.get as jest.Mock).mockImplementation(mockDocGet);
    
    // Create a mock request
    const mockRequest = new Request('http://localhost:3000/api/session/recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-id',
        recording: {
          id: 'rec123',
          transcript: 'Test transcript',
          timestamp: new Date(),
          duration: 100, // Not enough to cross threshold
        },
      }),
    });
    
    // Call the API
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(adminDb.update).toHaveBeenCalled();
    expect(responseData).toEqual(expect.objectContaining({
      success: true,
      autoCombineTriggered: false,
    }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  it('should not trigger auto-combine when finalSoap already exists', async () => {
    // Mock session document data with finalSoap already present
    const mockSessionData = {
      totalDuration: 7100,
      recordings: [],
      finalSoap: { subjective: 'test', objective: 'test', assessment: 'test', plan: 'test' }
    };
    
    // Setup mocks
    const mockDocGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => mockSessionData,
    });
    
    (adminDb.collection as jest.Mock).mockReturnThis();
    (adminDb.doc as jest.Mock).mockReturnThis();
    (adminDb.get as jest.Mock).mockImplementation(mockDocGet);
    
    // Create a mock request
    const mockRequest = new Request('http://localhost:3000/api/session/recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-id',
        recording: {
          id: 'rec123',
          transcript: 'Test transcript',
          timestamp: new Date(),
          duration: 200, // Enough to cross threshold, but finalSoap exists
        },
      }),
    });
    
    // Call the API
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    // Assertions
    expect(adminDb.update).toHaveBeenCalled();
    expect(responseData).toEqual(expect.objectContaining({
      success: true,
      autoCombineTriggered: false,
    }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});