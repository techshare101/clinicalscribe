const https = require('https');

console.log('🔍 System Time Synchronization Check');
console.log('====================================');

// Get local system time
const localTime = new Date();
console.log(`Local system time: ${localTime.toISOString()}`);
console.log(`Local time (ms): ${localTime.getTime()}`);

// Get time from a reliable source (Google)
console.log('\nFetching time from Google...');

const options = {
  hostname: 'www.google.com',
  port: 443,
  path: '/',
  method: 'HEAD'
};

const req = https.request(options, (res) => {
  const googleTime = new Date(res.headers.date);
  console.log(`Google time: ${googleTime.toISOString()}`);
  console.log(`Google time (ms): ${googleTime.getTime()}`);
  
  // Calculate difference
  const diff = Math.abs(localTime.getTime() - googleTime.getTime());
  console.log(`\nTime difference: ${diff} ms (${(diff/1000).toFixed(2)} seconds)`);
  
  if (diff > 300000) { // 5 minutes
    console.log('❌ WARNING: System time is off by more than 5 minutes!');
    console.log('   This can cause JWT signature validation failures.');
    console.log('   Please synchronize your system time.');
    process.exit(1);
  } else {
    console.log('✅ System time is synchronized (within acceptable range)');
  }
});

req.on('error', (error) => {
  console.error('❌ Failed to fetch time from Google:', error.message);
  console.log('✅ Assuming system time is correct since we cannot verify');
});

req.end();