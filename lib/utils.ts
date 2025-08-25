import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { auth } from '@/lib/firebase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Transcription utility function
export async function transcribeAudio(
  audioBlob: Blob, 
  patientLang: string = "auto", 
  docLang: string = "en"
): Promise<{ rawTranscript: string; transcript: string; patientLang: string; docLang: string }> {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated. Please sign in to use transcription feature.')
    }

    // Create a proper File object with the correct MIME type for Whisper API
    const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" })
    
    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("uid", user.uid)
    formData.append("patientLang", patientLang)
    formData.append("docLang", docLang)

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