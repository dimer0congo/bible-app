import * as SQLite from 'expo-sqlite';

const KJV_DATA = require('../assets/data/en_kjv.json');
const FR_DATA = require('../assets/data/fr_apee.json');

let db: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = async () => {
    if (db) {
        return db;
    }
    db = await SQLite.openDatabaseAsync('bible.db');
    return db;
};

export const createTables = async () => {
    const db = await getDBConnection();

    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        text TEXT,
        version TEXT DEFAULT 'KJV'
    );
    CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const insertBibleVersion = async (db: SQLite.SQLiteDatabase, data: any[], version: string) => {
    console.log(`Seeding version: ${version}`);
    for (const book of data) {
        // Use the book name from the JSON
        const bookName = book.name;
        for (let i = 0; i < book.chapters.length; i++) {
            const chapterNum = i + 1;
            const verses = book.chapters[i];

            // Batch insert for the chapter is efficient enough and avoids parameter limits
            const placeholders = verses.map(() => '(?, ?, ?, ?, ?)').join(',');
            const values: any[] = [];
            verses.forEach((text: string, index: number) => {
                values.push(bookName, chapterNum, index + 1, text, version);
            });

            if (values.length > 0) {
                await db.runAsync(
                    `INSERT INTO verses (book, chapter, verse, text, version) VALUES ${placeholders}`,
                    values
                );
            }
        }
    }
    console.log(`Finished seeding version: ${version}`);
}

export const seedDatabase = async () => {
    const db = await getDBConnection();

    // Check for 'seeded_full' to distinguish from previous partial seed
    // AND check if we actually have French data (for users upgrading)
    const result = await db.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key = "seeded_full"');

    let needsReSeed = !result;

    if (!needsReSeed) {
        // Integrity check: If marked as seeded but Genesis 1 is ampty, force re-seed
        const check = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM verses WHERE book = "Genesis" AND chapter = 1 AND version = "KJV"');
        if (check && check.count === 0) {
            console.log("Integrity check failed: Genesis 1 missing. Forcing re-seed.");
            needsReSeed = true;
        }

        // Secondary check: Do we have French data?
        const checkFr = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM verses WHERE version = "FR_APEE"');
        if (checkFr && checkFr.count === 0) {
            console.log("Integrity check failed: French data missing. Forcing re-seed.");
            needsReSeed = true;
        }
    }

    if (needsReSeed) {
        console.log("Seeding full database...");

        // Clear existing verses to avoid duplicates/conflicts from prior partial seeds
        try {
            await db.execAsync('DELETE FROM verses');
            await db.execAsync('DELETE FROM metadata WHERE key = "seeded_full"');
        } catch (e) {
            console.warn("Error clearing tables:", e);
        }

        try {
            await db.execAsync('BEGIN TRANSACTION');

            try {
                await insertBibleVersion(db, KJV_DATA, 'KJV');
                await insertBibleVersion(db, FR_DATA, 'FR_APEE');
                await db.runAsync('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', 'seeded_full', 'true');
                await db.execAsync('COMMIT');
                console.log("Database seeded successfully.");
            } catch (innerError) {
                console.error("Error during seeding transaction, rolling back:", innerError);
                try {
                    await db.execAsync('ROLLBACK');
                } catch (rollbackError) {
                    console.error("Rollback failed:", rollbackError);
                }
                throw innerError;
            }
        } catch (e) {
            console.error("Seeding failed:", e);
        }
    }
};

export const forceResetDatabase = async () => {
    const db = await getDBConnection();
    await db.execAsync('DROP TABLE IF EXISTS verses');
    await db.execAsync('DROP TABLE IF EXISTS metadata');
    await createTables();
    await seedDatabase();
};

export const getVerses = async (book: string, chapter: number, version: string = 'KJV') => {
    const db = await getDBConnection();
    return await db.getAllAsync('SELECT * FROM verses WHERE book = ? AND chapter = ? AND version = ? ORDER BY verse ASC', [book, chapter, version]);
};

export const searchVerses = async (query: string, version: string = 'KJV') => {
    const db = await getDBConnection();
    return await db.getAllAsync('SELECT * FROM verses WHERE text LIKE ? AND version = ?', [`%${query}%`, version]);
};
