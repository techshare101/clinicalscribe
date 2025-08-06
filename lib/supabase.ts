// Mock Supabase client for development
// Replace with actual @supabase/supabase-js when ready

interface MockSupabaseClient {
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: Blob, options?: any) => Promise<{ data?: any; error?: any }>
      getPublicUrl: (path: string) => { data: { publicUrl: string } }
    }
  }
}

const createMockClient = (): MockSupabaseClient => ({
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: Blob, options?: any) => {
        // Mock successful upload
        console.log(`Mock upload to ${bucket}/${path}`, { file, options })
        return { 
          data: { path }, 
          error: null 
        }
      },
      getPublicUrl: (path: string) => ({
        data: { 
          publicUrl: `https://mock-supabase.co/storage/v1/object/public/${path}` 
        }
      })
    })
  }
})

export const supabase = createMockClient()

// Types for our storage operations
export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Helper function to upload PDF to Supabase Storage
export async function uploadPDFToStorage(
  pdfBlob: Blob,
  filename: string,
  bucket: string = 'reports'
): Promise<UploadResult> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(`signed/${filename}`, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const urlData = supabase.storage
      .from(bucket)
      .getPublicUrl(`signed/${filename}`).data

    return { 
      success: true, 
      url: urlData.publicUrl 
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}