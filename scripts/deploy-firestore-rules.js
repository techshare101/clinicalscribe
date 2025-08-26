// Script to deploy Firestore rules
// Run with: node scripts/deploy-firestore-rules.js

import { exec } from 'child_process';
import { config } from 'dotenv';
import { promisify } from 'util';

// Load environment variables
config();

const execPromise = promisify(exec);

async function deployRules() {
  try {
    console.log('Deploying Firestore rules...');
    
    // Get project ID from environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    
    // Construct deploy command
    let cmd = 'firebase deploy --only firestore:rules';
    if (projectId) {
      cmd += ` --project ${projectId}`;
    }
    
    console.log(`Executing command: ${cmd}`);
    
    const { stdout, stderr } = await execPromise(cmd);
    
    if (stderr) {
      console.error('Error deploying rules:', stderr);
      process.exit(1);
    }
    
    console.log('Firestore rules deployed successfully!');
    console.log(stdout);
  } catch (error) {
    console.error('Failed to deploy Firestore rules:', error);
    process.exit(1);
  }
}

// Run the deployment
deployRules();