import { adminDb } from '../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

/**
 * Script to seed the ClinicalScribe agents scroll in Firestore
 * Run this once to create the scroll document that Qoder agents can access
 */
async function seedScroll() {
  try {
    // Read the GEMINI.md file content
    const fs = await import('fs');
    const path = await import('path');
    
    const geminiMdPath = path.join(process.cwd(), 'GEMINI.md');
    const geminiContent = fs.readFileSync(geminiMdPath, 'utf8');
    
    // Create/update the scroll document in Firestore
    await adminDb.collection('scrolls').doc('clinicalscribe-agents').set({
      title: 'ClinicalScribe + Qoder Agents',
      content: geminiContent,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ ClinicalScribe agents scroll stored in Firestore');
  } catch (error) {
    console.error('Error seeding scroll:', error);
  }
}

// Run the seed function
seedScroll();