import { adminDb } from '@/lib/firebaseAdmin'

/**
 * Server-side utility function to get scroll by ID from Firestore
 * Used by Qoder agents running on the backend
 * 
 * @param id - The ID of the scroll document to retrieve
 * @returns The scroll document data or null if not found
 */
export async function getScroll(id: string): Promise<{ 
  id: string; 
  title: string; 
  content: string; 
  created_at: any; 
  updated_at: any 
} | null> {
  try {
    const scrollDoc = await adminDb.collection("scrolls").doc(id).get()
    
    if (scrollDoc.exists) {
      const data = scrollDoc.data()
      return {
        id: scrollDoc.id,
        title: data?.title,
        content: data?.content,
        created_at: data?.created_at,
        updated_at: data?.updated_at
      }
    } else {
      console.log("No such scroll document!")
      return null
    }
  } catch (error) {
    console.error("Error getting scroll document:", error)
    throw error
  }
}

/**
 * Server-side utility function to get all scrolls from Firestore
 * Used by Qoder agents running on the backend
 * 
 * @returns Array of all scroll documents
 */
export async function getAllScrolls(): Promise<Array<{ 
  id: string; 
  title: string; 
  content: string; 
  created_at: any; 
  updated_at: any 
}>> {
  try {
    const scrollsSnapshot = await adminDb.collection("scrolls").get()
    const scrolls: Array<{ 
      id: string; 
      title: string; 
      content: string; 
      created_at: any; 
      updated_at: any 
    }> = []
    
    scrollsSnapshot.forEach((doc) => {
      const data = doc.data()
      scrolls.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at
      })
    })
    
    return scrolls
  } catch (error) {
    console.error("Error getting scrolls:", error)
    throw error
  }
}