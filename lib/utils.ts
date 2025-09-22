import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { auth } from '@/lib/firebase'
import { doc, getDoc } from "firebase/firestore"
import { db } from '@/lib/firebase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Transcription utility function
export async function transcribeAudio(
  audioBlob: Blob, 
  patientLang: string = "auto", 
  docLang: string = "en",
  index?: number
): Promise<{ index?: number; rawTranscript: string; transcript: string; patientLang: string; docLang: string }> {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated. Please sign in to use transcription feature.')
    }

    // Create a proper File object with the correct MIME type for Whisper API
    const audioFile = new File([audioBlob], `recording-chunk-${index || 0}.webm`, { type: "audio/webm" })
    
    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("uid", user.uid)
    formData.append("patientLang", patientLang)
    formData.append("docLang", docLang)
    if (index !== undefined) {
      formData.append("index", index.toString())
    }

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    // Check if response is ok, if not throw detailed error
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`)
      }
      throw new Error(errorData.error || `Transcription failed with status ${response.status}`)
    }

    const data = await response.json()
    return {
      index: data.index,
      rawTranscript: data.rawTranscript || '[No raw transcription returned]',
      transcript: data.transcript || '[No transcription returned]',
      patientLang: data.patientLang || patientLang,
      docLang: data.docLang || docLang
    }
  } catch (error) {
    console.error('Transcription error:', error)
    // Re-throw the error so it can be handled by the calling function
    throw error
  }
}

// Firestore utility function to get scroll by ID
export async function getScroll(id: string): Promise<{ 
  id: string; 
  title: string; 
  content: string; 
  created_at: any; 
  updated_at: any 
} | null> {
  try {
    const scrollRef = doc(db, "scrolls", id)
    const scrollSnap = await getDoc(scrollRef)
    
    if (scrollSnap.exists()) {
      const data = scrollSnap.data()
      return {
        id: scrollSnap.id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at
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