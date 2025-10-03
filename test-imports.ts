// Test file to verify imports work correctly
import { getScroll } from './lib/utils';
import { getScroll as getScrollServer, getAllScrolls } from './lib/serverUtils';

console.log('Client-side getScroll imported:', typeof getScroll === 'function');
console.log('Server-side getScroll imported:', typeof getScrollServer === 'function');
console.log('getAllScrolls imported:', typeof getAllScrolls === 'function');

console.log('All imports successful!');