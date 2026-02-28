import { NextResponse } from "next/server";
import OpenAI from "openai";
import { translateText } from "@/lib/translate";
import { adminDb } from '@/lib/firebase-admin'; // Import Firebase Admin for Firestore

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use Node.js runtime for large files + Buffer
export const runtime = 'nodejs';

// Increase max duration for long transcriptions (Vercel limit)
export const maxDuration = 60; // 60 seconds for Pro plan, 10 for Hobby

// Note: Vercel has a 4.5MB request limit by default.
// For larger files, ensure client-side chunking before upload.

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
        const chunkBlob = new Blob([new Uint8Array(chunks[i])], { type: file.type });
        const chunkFile = new File([chunkBlob], `chunk-${i}-${file.name}`, { type: file.type });
        
        try {
          // Transcribe this chunk
          const chunkTranscription = await openai.audio.transcriptions.create({
            file: chunkFile,
            model: "whisper-1",
            language: patientLang === "auto" ? undefined : patientLang,
          });
          
          fullRawText += chunkTranscription.text + " ";
          
          // Translate if doc language differs from transcribed language
          let chunkTranslatedText = chunkTranscription.text;
          if (docLang !== "en" || (patientLang !== "auto" && patientLang !== "en" && patientLang !== docLang)) {
            try {
              chunkTranslatedText = await translateText(chunkTranscription.text, docLang);
            } catch (translationError) {
              console.error("Translation failed for chunk:", translationError);
            }
          } else if (patientLang !== "auto" && patientLang !== "en" && docLang === "en") {
            // Patient speaks non-English, doc is English — translate to English
            try {
              chunkTranslatedText = await translateText(chunkTranscription.text, "en");
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
      // Case 1: docLang is not English — always translate (Whisper outputs in detected lang)
      // Case 2: patient explicitly non-English, doc is English — translate to English
      const needsTranslation = docLang !== "en" || (patientLang !== "auto" && patientLang !== "en");
      if (needsTranslation) {
        console.log(`Translating to ${docLang} (patientLang=${patientLang})`);
        try {
          fullText = await translateText(transcription.text, docLang);
          console.log("Translation completed:", fullText.substring(0, 100) + "...");
        } catch (translationError) {
          console.error("Translation failed:", translationError);
        }
      }
    }

    // Save transcription result to Firestore if uid is provided
    if (uid) {
      try {
        // Create a reference to the user's transcript chunks collection
        const userTranscriptsRef = adminDb.collection('transcriptions').doc(uid);
        const sessionChunksRef = userTranscriptsRef.collection('chunks');
        
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
    console.error("Error type:", error.constructor.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Check for specific OpenAI errors
    let errorMessage = "Failed to transcribe";
    let statusCode = 500;
    
    if (error.code === 'invalid_api_key') {
      errorMessage = "Invalid OpenAI API key. Please check your API key configuration.";
      statusCode = 401;
    } else if (error.code === 'insufficient_quota') {
      errorMessage = "OpenAI API quota exceeded. Please check your OpenAI account billing.";
      statusCode = 429;
    } else if (error.code === 'model_not_found') {
      errorMessage = "OpenAI model not found. The Whisper model may not be available.";
      statusCode = 404;
    } else if (error.message) {
      errorMessage = `OpenAI API error: ${error.message}`;
    } else if (error.code) {
      errorMessage = `OpenAI API error code: ${error.code}`;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: error.code || 'unknown',
      type: error.constructor.name || 'unknown'
    }, { status: statusCode });
  }
}
