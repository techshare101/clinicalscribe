// Language flag mapping
export const languageFlags: Record<string, string> = {
  auto: "🌐",
  fr: "🇫🇷", // French
  en: "🇺🇸", // English
  us: "🇺🇸", // US English
  es: "🇪🇸", // Spanish
  so: "🇸🇴", // Somali
  hmn: "🇱🇦", // Hmong
  sw: "🇰🇪", // Swahili
  ar: "🇸🇦", // Arabic
  zh: "🇨🇳", // Chinese
  vi: "🇻🇳", // Vietnamese
  tl: "🇵🇭", // Tagalog
  pt: "🇵🇹", // Portuguese
  hi: "🇮🇳", // Hindi
  ru: "🇷🇺", // Russian
  am: "🇪🇹", // Amharic
  ko: "🇰🇷", // Korean
  cs: "🇨🇿", // Czech
  hu: "🇭🇺", // Hungarian
  el: "🇬🇷", // Greek
  he: "🇮🇱", // Hebrew
};

// Language display names
export const languageNames: Record<string, string> = {
  auto: "Auto Detect",
  fr: "French",
  en: "English",
  us: "English",
  es: "Spanish",
  so: "Somali",
  hmn: "Hmong",
  sw: "Swahili",
  ar: "Arabic",
  zh: "Chinese (Mandarin)",
  vi: "Vietnamese",
  tl: "Tagalog",
  pt: "Portuguese",
  hi: "Hindi",
  ru: "Russian",
  am: "Amharic",
  ko: "Korean",
  cs: "Czech",
  hu: "Hungarian",
  el: "Greek",
  he: "Hebrew",
};

// Get display name with flag for a language code
export function getLanguageDisplayName(langCode: string): string {
  // Handle the 'us' language code specifically
  if (langCode === 'us') {
    return '🇺🇸 English';
  }
  
  const flag = languageFlags[langCode] || "🌐";
  const name = languageNames[langCode] || langCode.toUpperCase();
  return `${flag} ${name}`;
}

// Get language badge variant based on language
export function getLanguageBadgeVariant(langCode: string): string {
  const variants: Record<string, string> = {
    fr: "bg-blue-100 text-blue-800",
    en: "bg-green-100 text-green-800",
    es: "bg-red-100 text-red-800",
    so: "bg-purple-100 text-purple-800",
    hmn: "bg-orange-100 text-orange-800",
    sw: "bg-teal-100 text-teal-800",
    ar: "bg-amber-100 text-amber-800",
    zh: "bg-red-100 text-red-800",
    vi: "bg-emerald-100 text-emerald-800",
    tl: "bg-indigo-100 text-indigo-800",
    pt: "bg-yellow-100 text-yellow-800",
    hi: "bg-rose-100 text-rose-800",
    ru: "bg-cyan-100 text-cyan-800",
    am: "bg-lime-100 text-lime-800",
    ko: "bg-pink-100 text-pink-800",
  };
  
  return variants[langCode] || "bg-gray-100 text-gray-800";
}