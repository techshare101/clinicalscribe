#!/usr/bin/env node

// ES Module compatible Firebase rules deployment script
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function deployRules() {
  try {
    console.log('🚀 Deploying Firestore rules...');
    
    // Execute Firebase deployment command
    const { stdout, stderr } = await execPromise('npx firebase deploy --only firestore:rules');
    
    if (stderr) {
      console.error('❌ Deployment stderr:', stderr);
    }
    
    console.log('✅ Deployment stdout:', stdout);
    console.log('🎉 Firestore rules deployed successfully!');
  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployRules();
}

export default deployRules;