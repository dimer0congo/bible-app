// English Books
export const BIBLE_BOOKS_EN = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel",
    "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

// French Books
export const BIBLE_BOOKS_FR = [
    "Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome", "Josué", "Juges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Rois", "2 Rois", "1 Chroniques", "2 Chroniques", "Esdras", "Néhémie", "Esther", "Job", "Psaumes", "Proverbes",
    "Ecclésiaste", "Cantique des Cantiques", "Ésaïe", "Jérémie", "Lamentations", "Ézéchiel", "Daniel", "Osée", "Joël",
    "Amos", "Abdias", "Jonas", "Michée", "Nahum", "Habakuk", "Sophonie", "Aggée", "Zacharie", "Malachie",
    "Matthieu", "Marc", "Luc", "Jean", "Actes", "Romains", "1 Corinthiens", "2 Corinthiens", "Galates", "Éphésiens",
    "Philippians", "Colossiens", "1 Thessaloniciens", "2 Thessaloniciens", "1 Timothée", "2 Timothée", "Tite", "Philémon",
    "Hébreux", "Jacques", "1 Pierre", "2 Pierre", "1 Jean", "2 Jean", "3 Jean", "Jude", "Apocalypse"
];

// Default export (can be switched or deprecated, keeping for compat)
export const BIBLE_BOOKS = BIBLE_BOOKS_EN;

// Map of max chapters per book (Standard KJV/Protestant canon)
const CHAPTER_COUNTS_EN: { [key: string]: number } = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10,
    "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
    "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52, "Lamentations": 5,
    "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3, "Amos": 9,
    "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
    "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28,
    "Romans": 16, "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
    "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3, "1 Timothy": 6,
    "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13, "James": 5,
    "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
    "Jude": 1, "Revelation": 22
};

// Generate French counts by mapping index
const CHAPTER_COUNTS_FR: { [key: string]: number } = {};
BIBLE_BOOKS_FR.forEach((book, index) => {
    // English book at same index
    const enBook = BIBLE_BOOKS_EN[index];
    if (CHAPTER_COUNTS_EN[enBook]) {
        CHAPTER_COUNTS_FR[book] = CHAPTER_COUNTS_EN[enBook];
    }
});

export const BOOK_CHAPTER_COUNTS = { ...CHAPTER_COUNTS_EN, ...CHAPTER_COUNTS_FR };

// Helper to get display name
export const getLocalizedBookName = (bookEn: string, version: string): string => {
    if (version === 'FR_APEE') {
        const index = BIBLE_BOOKS_EN.indexOf(bookEn);
        if (index !== -1) return BIBLE_BOOKS_FR[index];
    }
    return bookEn; // Fallback to English/Key
};

export const OT_BOOKS = BIBLE_BOOKS_EN.slice(0, 39);
export const NT_BOOKS = BIBLE_BOOKS_EN.slice(39);
