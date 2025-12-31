// --- MAPPING TABLES (Legacy to Unicode) ---

// Tamil (Bamini/Tamil99 hybrid approximation for common typing)
const BAMINI_MAP = {
  // --- Vowels (Top Header Row) ---
  'm': 'அ',
  'M': 'ஆ',
  ',': 'இ',
  '<': 'ஈ',  // Shift + ,
  'c': 'உ',
  'C': 'ஊ',
  'v': 'எ',
  'V': 'ஏ',
  'I': 'ஐ',
  'x': 'ஒ',
  'X': 'ஓ',
  // Note: 'ஔ' (Au) is usually typed as 'x' + 's' (ஒ + ௌ) in this layout.

  // --- Consonants (Base Characters) ---
  'f': 'க',
  'q': 'ங',
  'r': 'ச',
  'Q': 'ஞ',
  'B': 'டி',
  'b':'ட',
  'L':'டூ',
  'l':'டு',
  'z': 'ண',
  'j': 'த',
  'e': 'ந',
  'g': 'ப',
  'k': 'ம',
  'a': 'ய',
  'u': 'ர',
  'y': 'ல',
  't': 'வ',
  'o': 'ழ',
  's': 'ள',
  'w': 'ற',
  'd': 'ன',

  // --- Signs / Modifiers ---
  ';': '்',  // Pulli (Virama)
  'h': 'ா',  // Kaal (Aa sound)
  'p': 'ி',  // Suzhi (i sound)
  'P': 'ீ',  // Suzhi (ii sound)
  'n': 'ெ',  // Kombu (e sound - types before letter)
  'N': 'ே',  // Rettai Kombu (ee sound - types before letter)
  'i': 'ை',  // Inai Kombu (ai sound - types before letter)
  '/': 'ஃ',  // Aytham

  // --- Combined Letters (Shift Keys found in grid) ---
  // These represent the 'u' (Short U) sound for specific consonants
  'F': 'கு',
  'R': 'சு',
  'Z': 'ணு',
  'J': 'து',
  'E': 'நு',
  'G': 'பு',
  'K': 'மு',
  'A': 'யு',
  'U': 'ரு',
  'Y': 'லு',
  'T': 'வு',
  'O': 'ழு',
  'S': 'ளு',
  'W': 'று',
  'D': 'னு',

  // --- Special 'Uu' (Long U) mappings with dedicated keys ---
  // Most 'Uu' sounds in Bamini are typed by adding 'h' (e.g. A+h = யூ), 
  // but these three have specific Shift-Number keys in your image:
  '$': 'கூ', // Shift + 4
  '#': 'சூ', // Shift + 3
  '^': 'டூ', // Shift + 6

  // --- Grantha Consonants (from Image 2) ---
  '[': 'ஜ',
  '\\': 'ஷ',
  ']': 'ஸ',
  '`': 'ஹ'
};

// Sinhala (Standard Wijesekara Layout)
const WIJESEKARA_MAP = {
  // --- Numbers Row (Base) ---
  '`': '්‍ර',  // Rakaaraanshaya (Backtick)
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '0': '0',
  '-': '-',
  '=': '=',
  // Note: The backslash '\' key in Wijesekara often maps to Hal Kirima '්', 
  // duplicate of 'a'. Your image confirms this in the top-right corner.
  '\\': '්', 

  // --- Numbers Row (Shifted Symbols) ---
  '~': '%',   // Shift + `
  '!': '!',   // Shift + 1
  '@': '@',   // Shift + 2
  '#': '#',   // Shift + 3
  '$': '$',   // Shift + 4
  '%': '%',   // Shift + 5
  '^': '^',   // Shift + 6
  '&': '&',   // Shift + 7
  '*': '*',   // Shift + 8
  '(': '(',   // Shift + 9
  ')': ')',   // Shift + 0
  '_': '_',   // Shift + -
  '+': '+',   // Shift + =

  // --- Row 2 (QWERTY) ---
  'q': 'ු',   'Q': 'ූ',  // Papilla (u), Shift: Papilla (uu)
  'w': 'අ',   'W': 'උ',
  'e': 'ැ',   'E': 'ෑ',  // Ae Pilla, Shift: Ae Pilla (long)
  'r': 'ර',   'R': 'ඍ',  // Ra, Shift: Irru
  't': 'එ',   'T': 'ඔ',
  'y': 'හ',   'Y': 'ශ',
  'u': 'ම',   'U': 'ඹ',
  'i': 'ස',   'I': 'ෂ',
  'o': 'ද',   'O': 'ධ',
  'p': 'ච',   'P': 'ඡ',
  '[': 'ඤ',   '{': 'ඥ',
  ']': ';',   '}': ':',

  // --- Row 3 (ASDFG) ---
  'a': '්',   'A': 'ෟ',  // Hal Kirima, Shift: Gayanukitta (long/alt)
  's': 'ි',   'S': 'ී',  // Ispilla (i), Shift: Ispilla (ii)
  'd': 'ා',   'D': 'ෘ',  // Ela Pilla (aa), Shift: Gayanukitta (ru)
  'f': 'ෙ',   'F': 'ෆ',  // Kombuva (e)
  'g': 'ට',   'G': 'ඨ',
  'h': 'ය',   'H': '්‍ය', // Ya, Shift: Yansaya
  'j': 'ව',   'J': 'ළු',
  'k': 'න',   'K': 'ණ',
  'l': 'ක',   'L': 'ඛ',
  ';': 'ත',   ':': 'ථ',
  '\'': '.',  '"': ',',  // Single quote maps to Dot, Shift maps to Comma

  // --- Row 4 (ZXCVB) ---
  'z': '\'',  'Z': '"',  // z maps to Single Quote, Shift to Double Quote
  'x': 'ං',   'X': 'ඃ',  // Bindu (ng), Shift: Visargaya (h)
  'c': 'ජ',   'C': 'ඣ',
  'v': 'ඩ',   'V': 'ඪ',
  'b': 'ඉ',   'B': 'ඊ',
  'n': 'බ',   'N': 'භ',
  'm': 'ප',   'M': 'ඵ',
  ',': 'ල',   '<': 'ළ',
  '.': 'ග',   '>': 'ඝ',
  '/': '/',   '?': '?'
};

// --- CONVERSION LOGIC ---
// You can expand this function to support more languages/formats
export const convertChar = (char, lang) => {
  if (lang === 'Tamil') return BAMINI_MAP[char] || char;
  if (lang === 'Sinhala') return WIJESEKARA_MAP[char] || char;
  return char;
};