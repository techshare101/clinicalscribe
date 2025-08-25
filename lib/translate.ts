import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateText(text: string, targetLang: string) {
  // Always perform translation regardless of target language
  // The previous logic that skipped English translation was causing issues
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are a clinical translator. Always preserve medical context and terminology accurately.` },
        { role: "user", content: `Translate this medical text into ${targetLang}: ${text}` }
      ]
    });

    return res.choices[0].message.content?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}