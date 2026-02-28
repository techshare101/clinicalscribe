import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Map language codes to full names for reliable GPT translation
const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", so: "Somali", hmn: "Hmong", sw: "Swahili",
  fr: "French", ar: "Arabic", zh: "Chinese (Mandarin)", vi: "Vietnamese",
  tl: "Tagalog", pt: "Portuguese", hi: "Hindi", ru: "Russian", am: "Amharic",
  ko: "Korean", ja: "Japanese", de: "German", it: "Italian", tr: "Turkish",
  nl: "Dutch", pl: "Polish", sv: "Swedish", th: "Thai", fa: "Persian",
  uk: "Ukrainian", ro: "Romanian", cs: "Czech", hu: "Hungarian", el: "Greek",
  he: "Hebrew", bn: "Bengali",
  yo: "Yoruba", tw: "Twi", ha: "Hausa", zu: "Zulu", xh: "Xhosa",
};

export function getLanguageName(code: string): string {
  return LANG_NAMES[code] || code;
}

export async function translateText(text: string, targetLang: string) {
  const targetName = getLanguageName(targetLang);
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are a clinical translator. Always preserve medical context and terminology accurately. Return ONLY the translated text, no explanations.` },
        { role: "user", content: `Translate the following medical text into ${targetName}:\n\n${text}` }
      ]
    });

    return res.choices[0].message.content?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}
