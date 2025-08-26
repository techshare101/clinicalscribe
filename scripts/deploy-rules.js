// Script to deploy Firestore rules
// Run with: node scripts/deploy-rules.js

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function deployRules() {
  try {
    console.log('🚀 Deploying Firestore rules...');
    
    // Deploy Firestore rules
    const { stdout, stderr } = await execAsync('firebase deploy --only firestore:rules');
    
    if (stderr) {
      console.error('❌ Error deploying rules:', stderr);
      return;
    }
    
    console.log('✅ Firestore rules deployed successfully!');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Failed to deploy Firestore rules:', error.message);
  }
}

// Run the deployment
if (require.main === module) {
  deployRules();
}

module.exports = deployRules;