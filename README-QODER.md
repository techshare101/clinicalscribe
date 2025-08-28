# Qoder Agents Integration

This document explains how Qoder agents can access information stored in Firestore.

## Firestore Utility Functions

We've created utility functions to make it easy for Qoder agents to fetch scroll documents from Firestore:

### Client-side Usage

For client-side Qoder agents (running in the browser):

```typescript
import { getScroll } from '@/lib/utils';

// Fetch a specific scroll by ID
const scroll = await getScroll('clinicalscribe-agents');
console.log(scroll.title);
console.log(scroll.content);
```

### Server-side Usage

For server-side Qoder agents (running in Node.js backend):

```typescript
import { getScroll, getAllScrolls } from '@/lib/serverUtils';

// Fetch a specific scroll by ID
const scroll = await getScroll('clinicalscribe-agents');
console.log(scroll.title);
console.log(scroll.content);

// Fetch all scrolls
const allScrolls = await getAllScrolls();
console.log(allScrolls);
```

## Scroll Data Structure

Scrolls are stored in the `scrolls` collection in Firestore with the following structure:

```javascript
{
  title: string,
  content: string,  // Markdown content
  created_at: timestamp,
  updated_at: timestamp
}
```

## Seeding Scroll Data

To seed the initial scroll data, run:

```bash
npm run seed-scroll
```

This will create or update the `clinicalscribe-agents` document in the `scrolls` collection with the content from `GEMINI.md`.

## Example Document

The `clinicalscribe-agents` document contains information about ClinicalScribe and Qoder agents in Markdown format, which can be used by Qoder agents for context when processing requests.