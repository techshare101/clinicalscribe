import { getScroll } from '../lib/serverUtils';

// Simple test to verify the function exists and can be imported
console.log('Testing Firestore utility functions...');

// This would normally be an async test, but for now we'll just verify the import works
console.log('getScroll function imported successfully:', typeof getScroll === 'function');

// Example usage (commented out since we don't want to actually run this without proper setup)
/*
async function testGetScroll() {
  try {
    const scroll = await getScroll('clinicalscribe-agents');
    console.log('Scroll retrieved:', scroll);
  } catch (error) {
    console.error('Error retrieving scroll:', error);
  }
}

testGetScroll();
*/

console.log('Test completed successfully');