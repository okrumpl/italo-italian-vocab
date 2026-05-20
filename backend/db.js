import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getExpandedVocabulary } from './vocabulary.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// V Dockeru budeme ukládat data do složky /app/data, lokálně do backend/data
const dbDir = process.env.DATABASE_DIR || path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'database.sqlite');

// Vytvoření složky pro databázi, pokud neexistuje
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

export async function initDatabase() {
  if (db) return db;
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Povolení cizích klíčů
  await db.run('PRAGMA foreign_keys = ON');

  // Vytvoření tabulek
  await db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      italian TEXT UNIQUE,
      czech TEXT,
      category TEXT,
      difficulty TEXT,
      pronunciation TEXT,
      example_it TEXT,
      example_cz TEXT
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      word_id INTEGER PRIMARY KEY,
      box INTEGER DEFAULT 1,
      next_review TEXT,
      attempts INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seeding slovíček (pokud přibudou nová, INSERT OR IGNORE je přidá)
  console.log('Seeding/Updating database with vocabulary...');
  const allWords = getExpandedVocabulary();
  try {
    const extraWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'extra_words.json'), 'utf8'));
    allWords.push(...extraWords);
  } catch(e) {
    console.log("No extra words found.");
  }
  
  try {
    const massiveWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'massive_words.json'), 'utf8'));
    allWords.push(...massiveWords);
  } catch(e) {
    console.log("No massive words found.");
  }
  
  try {
    const massiveWords2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'massive_words_2.json'), 'utf8'));
    allWords.push(...massiveWords2);
  } catch(e) {
    console.log("No massive words 2 found.");
  }
  
  try {
    const massiveWords3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'massive_words_3.json'), 'utf8'));
    allWords.push(...massiveWords3);
  } catch(e) {
    console.log("No massive words 3 found.");
  }

  try {
    const massiveWords4 = JSON.parse(fs.readFileSync(path.join(__dirname, 'massive_words_4.json'), 'utf8'));
    allWords.push(...massiveWords4);
  } catch(e) {
    console.log("No massive words 4 found.");
  }

    
    // Použijeme transakci pro extrémní rychlost importu
    await db.run('BEGIN TRANSACTION');
    try {
      const stmt = await db.prepare(`
        INSERT OR IGNORE INTO words (italian, czech, category, difficulty, pronunciation, example_it, example_cz)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const word of allWords) {
        await stmt.run(
          word.italian,
          word.czech,
          word.category,
          word.difficulty,
          word.pronunciation,
          word.example_it,
          word.example_cz
        );
      }
      await stmt.finalize();
      await db.run('COMMIT');
      console.log(`Successfully seeded ${allWords.length} words.`);
    } catch (err) {
      await db.run('ROLLBACK');
      console.error('Error seeding database:', err);
    }

  // Migrace: Sloučení duplicitních kategorií (po seedu, aby se sloučily i nově vložené)
  console.log('Running category migrations...');
  await db.run(`UPDATE words SET category = 'Zvířata' WHERE category = 'Příroda a zvířata'`);
  await db.run(`UPDATE words SET category = 'Škola a práce' WHERE category = 'Škola a vzdělávání'`);

  // Inicializace výchozích statistik
  const stats = [
    { key: 'xp', value: '0' },
    { key: 'streak', value: '0' },
    { key: 'last_active_date', value: '' },
    { key: 'level', value: '1' }
  ];

  for (const stat of stats) {
    await db.run('INSERT OR IGNORE INTO user_stats (key, value) VALUES (?, ?)', stat.key, stat.value);
  }

  return db;
}

// Pomocné funkce pro Leitnerův systém a statistiky

// Získání statistik
export async function getUserStats() {
  const rows = await db.all('SELECT * FROM user_stats');
  const stats = {};
  rows.forEach(r => {
    stats[r.key] = r.key === 'last_active_date' ? r.value : parseInt(r.value) || 0;
  });
  
  // Spočítáme počet naučených slov (Box 5) a rozpracovaných slov (Box 1-4)
  const learnedResult = await db.get('SELECT COUNT(*) as count FROM user_progress WHERE box = 5');
  const learningResult = await db.get('SELECT COUNT(*) as count FROM user_progress WHERE box < 5');
  const totalResult = await db.get('SELECT COUNT(*) as count FROM words');
  
  stats.words_total = totalResult.count;
  stats.words_mastered = learnedResult.count;
  stats.words_learning = learningResult.count;
  // Celková přesnost a statistika pokusů
  const accuracyResult = await db.get('SELECT SUM(correct_count) as total_correct, SUM(attempts) as total_attempts FROM user_progress');
  stats.total_correct = accuracyResult.total_correct || 0;
  stats.total_attempts = accuracyResult.total_attempts || 0;
  stats.accuracy = stats.total_attempts > 0 ? Math.round((stats.total_correct / stats.total_attempts) * 100) : 0;

  // Nejtěžší slova (kde je velká chybovost a alespoň 2 pokusy)
  const difficultWords = await db.all(`
    SELECT w.italian, w.czech, up.correct_count, up.attempts, (CAST(up.correct_count AS FLOAT) / up.attempts) as accuracy_ratio
    FROM words w
    JOIN user_progress up ON w.id = up.word_id
    WHERE up.attempts >= 2
    ORDER BY accuracy_ratio ASC
    LIMIT 5
  `);
  stats.difficult_words = difficultWords.map(w => ({
    italian: w.italian,
    czech: w.czech,
    accuracy: Math.round(w.accuracy_ratio * 100)
  }));
  
  return stats;
}

// Získání kategorií s pokrokem
export async function getCategories() {
  const query = `
    SELECT 
      w.category,
      COUNT(w.id) as total_words,
      COUNT(up.word_id) as started_words,
      SUM(CASE WHEN up.box = 5 THEN 1 ELSE 0 END) as mastered_words
    FROM words w
    LEFT JOIN user_progress up ON w.id = up.word_id
    GROUP BY w.category
    ORDER BY w.category ASC
  `;
  const rows = await db.all(query);
  return rows.map(r => ({
    category: r.category,
    totalWords: r.total_words,
    startedWords: r.started_words || 0,
    masteredWords: r.mastered_words || 0,
    progressPercent: r.total_words > 0 ? Math.round(((r.mastered_words || 0) / r.total_words) * 100) : 0
  }));
}

// Fisher-Yates shuffle — správná uniformní distribuce
function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generování slovíček pro lekci (kombinace nových slov a slov k zopakování)
export async function getWordsForLesson(category, limit = 10) {
  const now = new Date().toISOString();
  const seenIds = new Set();

  // 1. Priorita: slova k opakování (next_review <= teď) — max 50% lekce
  const reviewLimit = Math.ceil(limit * 0.5);
  const reviewWords = await db.all(`
    SELECT w.*, up.box, up.attempts, up.correct_count, 1 as is_review
    FROM words w
    JOIN user_progress up ON w.id = up.word_id
    WHERE w.category = ? AND up.next_review <= ?
    ORDER BY up.box ASC, up.next_review ASC
    LIMIT ?
  `, category, now, reviewLimit);
  reviewWords.forEach(w => seenIds.add(w.id));

  let lessonWords = [...reviewWords];

  // 2. Nová slova (žádný pokrok), max 40% lekce
  if (lessonWords.length < limit) {
    const newLimit = Math.ceil(limit * 0.4);
    const needed = Math.min(newLimit, limit - lessonWords.length);
    const newWords = await db.all(`
      SELECT w.*, 0 as box, 0 as attempts, 0 as correct_count, 0 as is_review
      FROM words w
      LEFT JOIN user_progress up ON w.id = up.word_id
      WHERE w.category = ? AND up.word_id IS NULL
      ORDER BY RANDOM()
      LIMIT ?
    `, category, needed);
    newWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  // 3. Doplnění ze špatně zvládnutých slov (box 1-2)
  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const idList = seenIds.size > 0 ? [...seenIds].join(',') : '-1';
    const weakWords = await db.all(`
      SELECT w.*, up.box, up.attempts, up.correct_count, 0 as is_review
      FROM words w
      JOIN user_progress up ON w.id = up.word_id
      WHERE w.category = ? AND up.box <= 2 AND w.id NOT IN (${idList})
      ORDER BY RANDOM()
      LIMIT ?
    `, category, needed);
    weakWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  // 4. Fallback: cokoliv z kategorie co jsme ještě neměli
  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const idList = seenIds.size > 0 ? [...seenIds].join(',') : '-1';
    const fallbackWords = await db.all(`
      SELECT w.*, COALESCE(up.box, 0) as box, COALESCE(up.attempts, 0) as attempts,
             COALESCE(up.correct_count, 0) as correct_count, 0 as is_review
      FROM words w
      LEFT JOIN user_progress up ON w.id = up.word_id
      WHERE w.category = ? AND w.id NOT IN (${idList})
      ORDER BY RANDOM()
      LIMIT ?
    `, category, needed);
    fallbackWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  return fisherYates(lessonWords);
}

// Generování celkového procvičování napříč kategoriemi (rychlé procvičení)
export async function getQuickReviewWords(limit = 10) {
  const now = new Date().toISOString();
  const seenIds = new Set();

  // 1. Priorita: slova k opakování (box 1-3, nejstarší review)
  const reviewWords = await db.all(`
    SELECT w.*, up.box, up.attempts, up.correct_count, 1 as is_review
    FROM words w
    JOIN user_progress up ON w.id = up.word_id
    WHERE up.next_review <= ? AND up.box <= 3
    ORDER BY up.next_review ASC
    LIMIT ?
  `, now, Math.ceil(limit * 0.6));
  reviewWords.forEach(w => seenIds.add(w.id));
  let lessonWords = [...reviewWords];

  // 2. Slova s pokusy (box 1-2, slabá)
  if (lessonWords.length < limit) {
    const idList = seenIds.size > 0 ? [...seenIds].join(',') : '-1';
    const needed = limit - lessonWords.length;
    const weakWords = await db.all(`
      SELECT w.*, up.box, up.attempts, up.correct_count, 0 as is_review
      FROM words w
      JOIN user_progress up ON w.id = up.word_id
      WHERE up.box <= 2 AND w.id NOT IN (${idList})
      ORDER BY RANDOM()
      LIMIT ?
    `, needed);
    weakWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  // 3. Fallback: náhodná slova z celé databáze
  if (lessonWords.length < limit) {
    const idList = seenIds.size > 0 ? [...seenIds].join(',') : '-1';
    const needed = limit - lessonWords.length;
    const randomWords = await db.all(`
      SELECT w.*, COALESCE(up.box, 0) as box, COALESCE(up.attempts, 0) as attempts,
             COALESCE(up.correct_count, 0) as correct_count, 0 as is_review
      FROM words w
      LEFT JOIN user_progress up ON w.id = up.word_id
      WHERE w.id NOT IN (${idList})
      ORDER BY RANDOM()
      LIMIT ?
    `, needed);
    randomWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  return fisherYates(lessonWords);
}

// Aktualizace postupu u jednoho slova (Leitnerův systém)
export async function updateWordProgress(wordId, isCorrect) {
  const now = new Date();
  
  // Zjistíme, zda už pro slovo existuje pokrok
  const progress = await db.get('SELECT * FROM user_progress WHERE word_id = ?', wordId);
  
  let newBox = 1;
  let attempts = 1;
  let correctCount = isCorrect ? 1 : 0;
  
  if (progress) {
    attempts = progress.attempts + 1;
    correctCount = progress.correct_count + (isCorrect ? 1 : 0);

    if (isCorrect) {
      // Posuneme do vyšší krabičky, max box 5
      newBox = Math.min(progress.box + 1, 5);
    } else {
      // Mírnější penalizace: box 4 → 2, box 5 → 3, ostatní → 1
      if (progress.box >= 5) {
        newBox = 3;
      } else if (progress.box >= 4) {
        newBox = 2;
      } else {
        newBox = 1;
      }
    }
  } else {
    // Nové slovo
    newBox = isCorrect ? 2 : 1;
  }
  
  // Spočítáme interval příštího opakování
  // Krabička 1: 1 den
  // Krabička 2: 2 dny
  // Krabička 3: 4 dny
  // Krabička 4: 7 dní
  // Krabička 5: 14 dní
  const intervalsInDays = {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 14
  };
  
  const daysToAdd = intervalsInDays[newBox] || 1;
  const nextReviewDate = new Date();
  nextReviewDate.setDate(now.getDate() + daysToAdd);
  const nextReviewStr = nextReviewDate.toISOString();
  
  await db.run(`
    INSERT INTO user_progress (word_id, box, next_review, attempts, correct_count)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(word_id) DO UPDATE SET
      box = excluded.box,
      next_review = excluded.next_review,
      attempts = excluded.attempts,
      correct_count = excluded.correct_count
  `, wordId, newBox, nextReviewStr, attempts, correctCount);
  
  return { wordId, newBox, nextReview: nextReviewStr };
}

// Zvýšení XP a přepočet Levelu
export async function addXP(amount) {
  const stats = await getUserStats();
  const newXP = stats.xp + amount;
  
  // Level výpočet: např. Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, atd.
  // Vzorec: Level = floor(1 + sqrt(XP / 100))
  const newLevel = Math.floor(1 + Math.sqrt(newXP / 100));
  
  await db.run('UPDATE user_stats SET value = ? WHERE key = "xp"', newXP.toString());
  
  if (newLevel > stats.level) {
    await db.run('UPDATE user_stats SET value = ? WHERE key = "level"', newLevel.toString());
  }
  
  return { xp: newXP, level: newLevel, leveledUp: newLevel > stats.level };
}

// Správa a aktualizace streaku
export async function updateStreak() {
  const stats = await getUserStats();
  const todayStr = new Date().toISOString().split('T')[0];
  const lastActiveStr = stats.last_active_date;
  
  let newStreak = stats.streak;
  
  if (!lastActiveStr) {
    // První aktivita vůbec
    newStreak = 1;
  } else {
    const today = new Date(todayStr);
    const lastActive = new Date(lastActiveStr);
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Aktivita včera -> prodloužení streaku
      newStreak += 1;
    } else if (diffDays > 1) {
      // Aktivita před více než 1 dnem -> ztráta streaku
      newStreak = 1;
    }
    // Pokud diffDays === 0, uživatel už dnes byl aktivní, streak se nemění
  }
  
  await db.run('UPDATE user_stats SET value = ? WHERE key = "last_active_date"', todayStr);
  await db.run('UPDATE user_stats SET value = ? WHERE key = "streak"', newStreak.toString());
  
  return { streak: newStreak, lastActiveDate: todayStr };
}

// Získání kompletního slovníku s vyhledáváním
export async function getDictionaryWords() {
  const query = `
    SELECT w.*, COALESCE(up.box, 0) as box, COALESCE(up.attempts, 0) as attempts, COALESCE(up.correct_count, 0) as correct_count
    FROM words w
    LEFT JOIN user_progress up ON w.id = up.word_id
    ORDER BY w.italian ASC
  `;
  return await db.all(query);
}
