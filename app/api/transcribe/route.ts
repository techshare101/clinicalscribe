import { NextResponse } from "next/server";
import OpenAI from "openai";
import { translateText } from "@/lib/translate";
import { initializeApp } from 'firebase/app';
import { adminDb } from '@/lib/firebaseAdmin'; // Import Firebase Admin for Firestore

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Firebase Admin SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

initializeApp(firebaseConfig);

// Use Node.js runtime for large files + Buffer
export const runtime = 'nodejs';

// Add configuration for larger payload size
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export async function POST(req: Request) {
  try {
    console.log("Transcribe API called");
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const index = parseInt(formData.get("index") as string) || 0;   // 🆕 capture chunk index as number
    const uid = formData.get("uid") as string;
    const patientLang = formData.get("patientLang") as string || "auto";
    const docLang = formData.get("docLang") as string || "en";

    // Debug logging
    console.log("Received file:", file?.name, file?.type, file?.size);
    console.log("Received index:", index);
    console.log("Received uid:", uid);
    console.log("Patient language:", patientLang);
    console.log("Documentation language:", docLang);

    if (!file) {
      console.error("No audio file uploaded");
      return NextResponse.json({ error: "No audio file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      console.error("Invalid file type:", file.type);
      return NextResponse.json({ error: "Invalid file type. Please upload an audio file." }, { status: 400 });
    }

    // Validate file size (max 25MB for Whisper API)
    if (file.size > 25 * 1024 * 1024) {
      console.log("File larger than 25MB, will chunk automatically");
      // For files larger than 25MB, we'll handle chunking
    }

    // Handle large files by chunking them
    let fullText = "";
    let fullRawText = "";
    
    if (file.size > 25 * 1024 * 1024) {
      // For large files, we need to chunk them
      console.log("Processing large file by chunking");
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Split into chunks of 20MB to leave room for overhead
      const chunkSize = 20 * 1024 * 1024;
      const chunks: Buffer[] = [];
      
      for (let i = 0; i < buffer.length; i += chunkSize) {
        chunks.push(buffer.slice(i, Math.min(i + chunkSize, buffer.length)));
      }
      
      console.log(`Split file into ${chunks.length} chunks`);
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        
        // Create a new File object for this chunk
        const chunkBlob = new Blob([chunks[i]], { type: file.type });
        const chunkFile = new File([chunkBlob], `chunk-${i}-${file.name}`, { type: file.type });
        
        try {
          // Transcribe this chunk
          const chunkTranscription = await openai.audio.transcriptions.create({
            file: chunkFile,
            model: "whisper-1",
            language: patientLang === "auto" ? undefined : patientLang,
          });
          
          fullRawText += chunkTranscription.text + " ";
          
          // Translate if needed
          let chunkTranslatedText = chunkTranscription.text;
          if (patientLang !== "auto" && patientLang !== docLang) {
            try {
              chunkTranslatedText = await translateText(chunkTranscription.text, docLang);
            } catch (translationError) {
              console.error("Translation failed for chunk:", translationError);
            }
          }
          
          fullText += chunkTranslatedText + " ";
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          // Continue with other chunks even if one fails
        }
      }
    } else {
      // For smaller files, process normally
      console.log("Processing file normally (under 25MB)");
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: patientLang === "auto" ? undefined : patientLang,
      });
      console.log("Transcription completed:", transcription.text);

      fullRawText = transcription.text;
      fullText = transcription.text;

      // Translate to documentation language if needed
      if (patientLang !== "auto" && patientLang !== docLang) {
        console.log(`Translating from ${patientLang} to ${docLang}`);
        try {
          fullText = await translateText(transcription.text, docLang);
          console.log("Translation completed:", fullText);
        } catch (translationError) {
          console.error("Translation failed:", translationError);
        }
      }
    }

    // Save transcription result to Firestore if uid is provided
    if (uid) {
      try {
        const transcriptionRef = adminDb.collection('transcriptions').doc(uid);
        const sessionChunksRef = transcriptionRef.collection('chunks');
        
        await sessionChunksRef.doc(`chunk-${index}`).set({
          index,
          rawTranscript: fullRawText.trim(),
          transcript: fullText.trim(),
          patientLang,
          docLang,
          createdAt: new Date(),
          status: 'completed'
        });
        
        console.log(`Saved chunk ${index} to Firestore for user ${uid}`);
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        // Don't fail the transcription if Firestore save fails
      }
    }

    return NextResponse.json({
      index,                                           // 🆕 return index for stitching
      rawTranscript: fullRawText.trim(),
      transcript: fullText.trim(),
      patientLang: patientLang,
      docLang: docLang
    });
  } catch (error: any) {
    console.error("Transcription API error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to transcribe";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code) {
      errorMessage = `OpenAI API error: ${error.code}`;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}