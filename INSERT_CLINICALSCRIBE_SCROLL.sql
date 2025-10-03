-- NOTE: This file is for reference only as ClinicalScribe uses Firebase, not SQL/Supabase for storage.
-- For Qoder agents using Firebase, scrolls would typically be stored in a Firestore collection.

-- Example Firebase Firestore structure for storing scrolls:
-- Collection: scrolls
-- Document ID: clinicalscribe-agents
-- Fields:
--   title: "ClinicalScribe + Qoder Agents"
--   content: "# ClinicalScribe + Qoder Agents\n\n## Project Context\n..."
--   created_at: Timestamp
--   updated_at: Timestamp

-- To store this scroll in Firebase Firestore, you would typically use code like this in a Next.js API route:

/*
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function storeScroll() {
  try {
    await setDoc(doc(db, 'scrolls', 'clinicalscribe-agents'), {
      title: 'ClinicalScribe + Qoder Agents',
      content: `# ClinicalScribe + Qoder Agents

## Project Context
This repository is part of **Qoder (AgentForge)**.  
It powers **ClinicalScribe**, an ambient medical documentation system designed for clinicians.  
Qoder orchestrates multiple agents that work together to process, guide, and structure information.

## Agents in Qoder
- **ContentForge** → Generates structured medical documentation and transforms scrolls into usable formats.
- **QuizMaster** → Creates adaptive tests and assessments for learning from medical cases.
- **AdaptiveGuide** → Provides contextual explanations, adapting to the user's knowledge and role (clinician, patient, admin).
- **AgentOrchestra** → The conductor: coordinates agent workflows, routes tasks, and manages execution order.

## Goals
- Provide **real-time transcription** and **SOAP note generation** for clinicians.
- Integrate **Firebase** (Auth + Firestore + Storage) for authentication and data persistence.
- Use **Firebase** for folders, reports, and analytics.
- Generate **PDFs** with Puppeteer for exporting notes and reports.
- Manage billing and plans via **Stripe**.

## Known Issues
- **Firebase**: Service service account permission errors and auth sync issues.
- **PDF Rendering**: Puppeteer inconsistencies (local dev vs Vercel serverless).
- **Session Management**: Dashboard sessions not always syncing between Firebase services.
- **Storage Costs**: Decision to prioritize PDFs over audio storage.

## Tech Stack
- **Framework**: Next.js 15
- **Auth & DB**: Firebase Auth + Firestore + Firebase Storage
- **Storage**: Firebase Storage buckets (reports, recordings, folders)
- **Payments**: Stripe subscriptions
- **PDF Engine**: Puppeteer with serverless Chromium
- **Hosting**: Vercel

## Guidance for Qoder Agents
When assisting:
- Prioritize **agent collaboration logic** (how they share tasks).
- Suggest improvements for **auth/session sync**.
- Optimize **Firebase queries** for reports/folders.
- Help debug **PDF generation issues** in \`api/pdf/render/route.ts\`.
- Provide ideas for **agentic orchestration**, especially around ClinicalScribe's workflows.`,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('Scroll stored successfully in Firebase Firestore');
  } catch (error) {
    console.error('Error storing scroll in Firebase Firestore:', error);
  }
}
*/

-- For Qoder agents that need to retrieve this scroll information, they would query the Firestore collection:
/*
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getScroll(scrollId) {
  try {
    const docRef = doc(db, 'scrolls', scrollId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No such scroll document!');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving scroll from Firebase Firestore:', error);
    return null;
  }
}
*/