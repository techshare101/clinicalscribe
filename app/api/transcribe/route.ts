import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { translateText } from "@/lib/translate";
import { initializeApp } from 'firebase/app';

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
const db = getFirestore();

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    console.log("Transcribe API called");
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uid = formData.get("uid") as string;
    const patientLang = formData.get("patientLang") as string || "auto";
    const docLang = formData.get("docLang") as string || "en";

    // Debug logging
    console.log("Received file:", file?.name, file?.type, file?.size);
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
      console.error("File too large:", file.size);
      return NextResponse.json({ error: "File too large. Maximum size is 25MB." }, { status: 400 });
    }

    // Step 1: Transcribe using Whisper (auto-detects source language)
    console.log("Starting transcription with Whisper API");
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      // If patientLang is "auto", let Whisper auto-detect the language
      // Otherwise, force Whisper to transcribe in the specified language
      language: patientLang === "auto" ? undefined : patientLang,
    });
    console.log("Transcription completed:", transcription.text);

    // Step 2: Translate to documentation language if needed
    let translatedText = transcription.text;
    // Always translate when patient language differs from documentation language
    // Only skip translation if both languages are the same
    if (patientLang !== "auto" && patientLang !== docLang) {
      console.log(`Translating from ${patientLang} to ${docLang}`);
      try {
        translatedText = await translateText(transcription.text, docLang);
        console.log("Translation completed:", translatedText);
      } catch (translationError) {
        console.error("Translation failed:", translationError);
        // If translation fails, we'll use the original text
      }
    }

    return NextResponse.json({
      rawTranscript: transcription.text,    // Patient's original language
      transcript: translatedText,           // Translated to documentation language
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