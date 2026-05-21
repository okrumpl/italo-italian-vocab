import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getExpandedVocabulary } from './vocabulary.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = process.env.DATABASE_DIR || path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'database.sqlite');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

// ─── Pomocná funkce: hash PINu ───────────────────────────────────────────────
export const hashPin = (pin) => createHash('sha256').update(String(pin)).digest('hex');

// ─── Databázová migrace ──────────────────────────────────────────────────────
async function runMigrations() {
  // 1. Přidání users tabulky
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '👤',
      pin_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_active TEXT
    );
  `);

  // 2. Migrace user_stats — přidání user_id
  const statsCols = await db.all("PRAGMA table_info(user_stats)");
  const statsHasUserId = statsCols.some(c => c.name === 'user_id');
  if (!statsHasUserId) {
    console.log('Migrating user_stats to multi-user format...');
    const existing = await db.all('SELECT key, value FROM user_stats');
    await db.run('DROP TABLE IF EXISTS user_stats');
    await db.exec(`
      CREATE TABLE user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        key TEXT NOT NULL,
        value TEXT,
        UNIQUE(user_id, key)
      );
    `);
    // Přenos dat na userId=1
    for (const row of existing) {
      await db.run('INSERT OR IGNORE INTO user_stats(user_id, key, value) VALUES(1, ?, ?)', row.key, row.value);
    }
  }

  // 3. Migrace user_progress — přidání user_id
  const progCols = await db.all("PRAGMA table_info(user_progress)");
  const progHasUserId = progCols.some(c => c.name === 'user_id');
  if (!progHasUserId) {
    console.log('Migrating user_progress to multi-user format...');
    // user_progress má PRIMARY KEY na word_id — musíme změnit na (user_id, word_id)
    const existing = await db.all('SELECT * FROM user_progress');
    await db.run('DROP TABLE IF EXISTS user_progress');
    await db.exec(`
      CREATE TABLE user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        word_id INTEGER NOT NULL,
        box INTEGER DEFAULT 1,
        next_review TEXT,
        attempts INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        UNIQUE(user_id, word_id),
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      );
    `);
    for (const row of existing) {
      await db.run(
        'INSERT OR IGNORE INTO user_progress(user_id, word_id, box, next_review, attempts, correct_count) VALUES(1,?,?,?,?,?)',
        row.word_id, row.box, row.next_review, row.attempts, row.correct_count
      );
    }
  }

  // 4. Migrace sessions — přidání user_id
  const sesCols = await db.all("PRAGMA table_info(sessions)");
  const sesHasUserId = sesCols.some(c => c.name === 'user_id');
  if (!sesHasUserId) {
    console.log('Migrating sessions to multi-user format...');
    try { await db.run('ALTER TABLE sessions ADD COLUMN user_id INTEGER DEFAULT 1'); } catch(e) {}
  }

  // 5. Seed výchozí uživatel pokud žádný neexistuje
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await db.run("INSERT INTO users(id, name, avatar) VALUES(1, 'Hráč 1', '👤')");
    console.log('Created default user "Hráč 1"');
  }

  console.log('Migrations complete.');
}

// ─── Inicializace databáze ───────────────────────────────────────────────────
export async function initDatabase() {
  if (db) return db;

  db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.run('PRAGMA foreign_keys = ON');

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

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      date TEXT NOT NULL,
      category TEXT,
      words_practiced INTEGER DEFAULT 0,
      words_correct INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      completed_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
  `);

  // Migrace (bezpečné spuštění)
  await runMigrations();

  // Indexy po migraci
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_progress_review ON user_progress(next_review);
    CREATE INDEX IF NOT EXISTS idx_progress_box ON user_progress(box);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date);
  `).catch(() => {});

  // Seeding slovíček
  console.log('Seeding/Updating database with vocabulary...');
  const allWords = getExpandedVocabulary();
  const wordFiles = ['extra_words', 'massive_words', 'massive_words_2', 'massive_words_3', 'massive_words_4'];
  for (const f of wordFiles) {
    try {
      const extra = JSON.parse(fs.readFileSync(path.join(__dirname, `${f}.json`), 'utf8'));
      allWords.push(...extra);
    } catch(e) { /* soubor neexistuje */ }
  }

  await db.run('BEGIN TRANSACTION');
  try {
    const stmt = await db.prepare(
      'INSERT OR IGNORE INTO words (italian, czech, category, difficulty, pronunciation, example_it, example_cz) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const word of allWords) {
      await stmt.run(word.italian, word.czech, word.category, word.difficulty, word.pronunciation, word.example_it, word.example_cz);
    }
    await stmt.finalize();
    await db.run('COMMIT');
    console.log(`Seeded ${allWords.length} words.`);
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('Seed error:', err);
  }

  // Migrace kategorií
  await db.run(`UPDATE words SET category = 'Zvířata' WHERE category = 'Příroda a zvířata'`);
  await db.run(`UPDATE words SET category = 'Škola a práce' WHERE category = 'Škola a vzdělávání'`);

  return db;
}

// ─── Seed výchozích stats pro nového uživatele ───────────────────────────────
async function seedUserStats(userId) {
  const defaults = [
    { key: 'xp', value: '0' },
    { key: 'streak', value: '0' },
    { key: 'last_active_date', value: '' },
    { key: 'level', value: '1' },
    { key: 'daily_goal', value: '10' },
    { key: 'quiz_count', value: '0' },
    { key: 'perfect_lessons', value: '0' },
  ];
  for (const s of defaults) {
    await db.run('INSERT OR IGNORE INTO user_stats(user_id, key, value) VALUES(?, ?, ?)', userId, s.key, s.value);
  }
}

// ─── USER CRUD ───────────────────────────────────────────────────────────────

export async function getUsers() {
  return await db.all('SELECT id, name, avatar, pin_hash IS NOT NULL as has_pin, last_active FROM users ORDER BY id ASC');
}

export async function createUser(name, avatar = '👤', pin = null) {
  const pinHash = pin ? hashPin(pin) : null;
  const result = await db.run(
    'INSERT INTO users(name, avatar, pin_hash) VALUES(?, ?, ?)',
    name, avatar, pinHash
  );
  const userId = result.lastID;
  await seedUserStats(userId);
  return await db.get('SELECT id, name, avatar, pin_hash IS NOT NULL as has_pin FROM users WHERE id = ?', userId);
}

export async function deleteUser(userId) {
  // Kaskádové smazání stats + progress + sessions
  await db.run('DELETE FROM user_stats WHERE user_id = ?', userId);
  await db.run('DELETE FROM user_progress WHERE user_id = ?', userId);
  await db.run('DELETE FROM sessions WHERE user_id = ?', userId);
  await db.run('DELETE FROM users WHERE id = ?', userId);
}

export async function verifyUserPin(userId, pin) {
  const user = await db.get('SELECT pin_hash FROM users WHERE id = ?', userId);
  if (!user) return false;
  if (!user.pin_hash) return true; // bez PINu — vždy přístup
  return user.pin_hash === hashPin(pin);
}

export async function updateUserLastActive(userId) {
  await db.run('UPDATE users SET last_active = datetime("now") WHERE id = ?', userId);
}

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────
function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Statistiky ──────────────────────────────────────────────────────────────
export async function getUserStats(userId = 1) {
  await seedUserStats(userId); // zajistí existenci stats pro tohoto uživatele
  const rows = await db.all('SELECT key, value FROM user_stats WHERE user_id = ?', userId);
  const stats = {};
  rows.forEach(r => {
    stats[r.key] = r.key === 'last_active_date' ? r.value : parseInt(r.value) || 0;
  });

  const learnedResult = await db.get('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND box = 5', userId);
  const learningResult = await db.get('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND box < 5', userId);
  const totalResult = await db.get('SELECT COUNT(*) as count FROM words');

  stats.words_total = totalResult.count;
  stats.words_mastered = learnedResult.count;
  stats.words_learning = learningResult.count;

  const accuracyResult = await db.get(
    'SELECT SUM(correct_count) as total_correct, SUM(attempts) as total_attempts FROM user_progress WHERE user_id = ?', userId
  );
  stats.total_correct = accuracyResult.total_correct || 0;
  stats.total_attempts = accuracyResult.total_attempts || 0;
  stats.accuracy = stats.total_attempts > 0 ? Math.round((stats.total_correct / stats.total_attempts) * 100) : 0;

  const difficultWords = await db.all(`
    SELECT w.italian, w.czech, up.correct_count, up.attempts,
           (CAST(up.correct_count AS FLOAT) / up.attempts) as accuracy_ratio
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE up.user_id = ? AND up.attempts >= 2
    ORDER BY accuracy_ratio ASC LIMIT 5
  `, userId);
  stats.difficult_words = difficultWords.map(w => ({
    italian: w.italian, czech: w.czech, accuracy: Math.round(w.accuracy_ratio * 100)
  }));

  return stats;
}

// ─── Kategorie ───────────────────────────────────────────────────────────────
export async function getCategories(userId = 1) {
  const rows = await db.all(`
    SELECT
      w.category,
      COUNT(w.id) as total_words,
      COUNT(up.word_id) as started_words,
      SUM(CASE WHEN up.box = 5 THEN 1 ELSE 0 END) as mastered_words
    FROM words w
    LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
    GROUP BY w.category ORDER BY w.category ASC
  `, userId);
  return rows.map(r => ({
    category: r.category,
    totalWords: r.total_words,
    startedWords: r.started_words || 0,
    masteredWords: r.mastered_words || 0,
    progressPercent: r.total_words > 0 ? Math.round(((r.mastered_words || 0) / r.total_words) * 100) : 0
  }));
}

// ─── Slova pro lekci ─────────────────────────────────────────────────────────
export async function getWordsForLesson(category, limit = 10, userId = 1) {
  const now = new Date().toISOString();
  const seenIds = new Set();

  const reviewWords = await db.all(`
    SELECT w.*, up.box, up.attempts, up.correct_count, 1 as is_review
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE w.category = ? AND up.user_id = ? AND up.next_review <= ?
    ORDER BY up.box ASC, up.next_review ASC LIMIT ?
  `, category, userId, now, Math.ceil(limit * 0.5));
  reviewWords.forEach(w => seenIds.add(w.id));
  let lessonWords = [...reviewWords];

  if (lessonWords.length < limit) {
    const needed = Math.min(Math.ceil(limit * 0.4), limit - lessonWords.length);
    const newWords = await db.all(`
      SELECT w.*, 0 as box, 0 as attempts, 0 as correct_count, 0 as is_review
      FROM words w
      LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
      WHERE w.category = ? AND up.word_id IS NULL
      ORDER BY RANDOM() LIMIT ?
    `, userId, category, needed);
    newWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const weakWords = await db.all(`
      SELECT w.*, up.box, up.attempts, up.correct_count, 0 as is_review
      FROM words w JOIN user_progress up ON w.id = up.word_id
      WHERE w.category = ? AND up.user_id = ? AND up.box <= 2 AND w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, category, userId, ...exc, needed);
    weakWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const fallback = await db.all(`
      SELECT w.*, COALESCE(up.box,0) as box, COALESCE(up.attempts,0) as attempts,
             COALESCE(up.correct_count,0) as correct_count, 0 as is_review
      FROM words w LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
      WHERE w.category = ? AND w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, userId, category, ...exc, needed);
    fallback.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  return fisherYates(lessonWords);
}

// ─── Quick review ─────────────────────────────────────────────────────────────
export async function getQuickReviewWords(limit = 10, userId = 1) {
  const now = new Date().toISOString();
  const seenIds = new Set();

  const reviewWords = await db.all(`
    SELECT w.*, up.box, up.attempts, up.correct_count, 1 as is_review
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE up.user_id = ? AND up.next_review <= ? AND up.box <= 3
    ORDER BY up.next_review ASC LIMIT ?
  `, userId, now, Math.ceil(limit * 0.6));
  reviewWords.forEach(w => seenIds.add(w.id));
  let lessonWords = [...reviewWords];

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const weakWords = await db.all(`
      SELECT w.*, up.box, up.attempts, up.correct_count, 0 as is_review
      FROM words w JOIN user_progress up ON w.id = up.word_id
      WHERE up.user_id = ? AND up.box <= 2 AND w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, userId, ...exc, needed);
    weakWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const randomWords = await db.all(`
      SELECT w.*, COALESCE(up.box,0) as box, COALESCE(up.attempts,0) as attempts,
             COALESCE(up.correct_count,0) as correct_count, 0 as is_review
      FROM words w LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
      WHERE w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, userId, ...exc, needed);
    randomWords.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  return fisherYates(lessonWords);
}

// ─── Leitnerův systém — aktualizace postupu ──────────────────────────────────
export async function updateWordProgress(wordId, isCorrect, userId = 1) {
  const now = new Date();
  const progress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND word_id = ?', userId, wordId);

  let newBox = 1;
  let attempts = 1;
  let correctCount = isCorrect ? 1 : 0;

  if (progress) {
    attempts = progress.attempts + 1;
    correctCount = progress.correct_count + (isCorrect ? 1 : 0);
    if (isCorrect) {
      newBox = Math.min(progress.box + 1, 5);
    } else {
      if (progress.box >= 5) newBox = 3;
      else if (progress.box >= 4) newBox = 2;
      else newBox = 1;
    }
  } else {
    newBox = isCorrect ? 2 : 1;
  }

  const intervals = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
  const nextReviewDate = new Date();
  nextReviewDate.setDate(now.getDate() + (intervals[newBox] || 1));
  const nextReviewStr = nextReviewDate.toISOString();

  await db.run(`
    INSERT INTO user_progress (user_id, word_id, box, next_review, attempts, correct_count)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word_id) DO UPDATE SET
      box = excluded.box, next_review = excluded.next_review,
      attempts = excluded.attempts, correct_count = excluded.correct_count
  `, userId, wordId, newBox, nextReviewStr, attempts, correctCount);

  return { wordId, newBox, nextReview: nextReviewStr };
}

// ─── XP a level ──────────────────────────────────────────────────────────────
export async function addXP(amount, userId = 1) {
  const stats = await getUserStats(userId);
  const newXP = stats.xp + amount;
  const newLevel = Math.floor(1 + Math.sqrt(newXP / 100));

  await db.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "xp"', newXP.toString(), userId);
  if (newLevel > stats.level) {
    await db.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "level"', newLevel.toString(), userId);
  }
  return { xp: newXP, level: newLevel, leveledUp: newLevel > stats.level };
}

// ─── Streak ───────────────────────────────────────────────────────────────────
export async function updateStreak(userId = 1) {
  const stats = await getUserStats(userId);
  const todayStr = new Date().toISOString().split('T')[0];
  const lastActiveStr = stats.last_active_date;
  let newStreak = stats.streak;

  if (!lastActiveStr) {
    newStreak = 1;
  } else {
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const [ly, lm, ld] = lastActiveStr.split('-').map(Number);
    const diffDays = Math.round((Date.UTC(ty, tm-1, td) - Date.UTC(ly, lm-1, ld)) / 86400000);
    if (diffDays === 1) newStreak += 1;
    else if (diffDays > 1) newStreak = 1;
  }

  await db.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "last_active_date"', todayStr, userId);
  await db.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "streak"', newStreak.toString(), userId);
  await updateUserLastActive(userId);
  return { streak: newStreak, lastActiveDate: todayStr };
}

// ─── Slovník ──────────────────────────────────────────────────────────────────
export async function getDictionaryWords(userId = 1) {
  return await db.all(`
    SELECT w.*, COALESCE(up.box, 0) as box, COALESCE(up.attempts, 0) as attempts,
           COALESCE(up.correct_count, 0) as correct_count
    FROM words w
    LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
    ORDER BY w.italian ASC
  `, userId);
}

// ─── Sessions a heatmapa ──────────────────────────────────────────────────────
export async function recordSession(category, wordsPracticed, wordsCorrect, xpEarned, userId = 1) {
  const todayStr = new Date().toISOString().split('T')[0];
  await db.run(`
    INSERT INTO sessions (user_id, date, category, words_practiced, words_correct, xp_earned)
    VALUES (?, ?, ?, ?, ?, ?)
  `, userId, todayStr, category || 'Quick Review', wordsPracticed, wordsCorrect, xpEarned);
}

export async function getActivityHeatmap(userId = 1) {
  const rows = await db.all(`
    SELECT date, SUM(words_practiced) as total_words, COUNT(*) as lessons
    FROM sessions WHERE user_id = ? AND date >= date('now', '-34 days')
    GROUP BY date ORDER BY date ASC
  `, userId);
  const map = {};
  rows.forEach(r => { map[r.date] = { words: r.total_words, lessons: r.lessons }; });
  const days = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, words: map[dateStr]?.words || 0, lessons: map[dateStr]?.lessons || 0 });
  }
  return days;
}

// ─── Denní cíl ───────────────────────────────────────────────────────────────
export async function getDailyGoalStatus(userId = 1) {
  const stats = await getUserStats(userId);
  const goal = parseInt(stats.daily_goal) || 10;
  const todayStr = new Date().toISOString().split('T')[0];
  const result = await db.get('SELECT COALESCE(SUM(words_practiced),0) as practiced FROM sessions WHERE user_id = ? AND date = ?', userId, todayStr);
  const practiced = result?.practiced || 0;
  return { goal, practiced, percent: Math.min(Math.round((practiced / goal) * 100), 100), done: practiced >= goal };
}

export async function setDailyGoal(goal, userId = 1) {
  const val = Math.min(Math.max(parseInt(goal) || 10, 5), 50);
  await db.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "daily_goal"', val.toString(), userId);
  return val;
}

// ─── Čítače ──────────────────────────────────────────────────────────────────
export async function incrementStat(key, userId = 1) {
  await db.run(
    `UPDATE user_stats SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE user_id = ? AND key = ?`,
    userId, key
  );
}

// ─── Achievements ─────────────────────────────────────────────────────────────
export async function getAchievements(userId = 1) {
  const stats = await getUserStats(userId);
  const quizCount = parseInt(stats.quiz_count) || 0;
  const perfectLessons = parseInt(stats.perfect_lessons) || 0;
  const startedCats = await db.get(`
    SELECT COUNT(DISTINCT w.category) as count
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE up.user_id = ?
  `, userId);

  return [
    { id: 'first_lesson', title: 'První krok', desc: 'Dokonči svoji první lekci', icon: '🎓', unlocked: stats.total_attempts > 0 },
    { id: 'streak_3',  title: 'Rozehřátý',    desc: '3 dny v řadě',   icon: '🔥', unlocked: stats.streak >= 3 },
    { id: 'streak_7',  title: 'Týdenní hrdina',desc: '7 dní v řadě',  icon: '🏆', unlocked: stats.streak >= 7 },
    { id: 'streak_30', title: 'Italský mistr', desc: '30 dní v řadě', icon: '👑', unlocked: stats.streak >= 30 },
    { id: 'words_50',  title: 'Začátečník',   desc: '50 slov naučeno',  icon: '📖', unlocked: stats.words_mastered >= 50 },
    { id: 'words_100', title: 'Lexikograf',   desc: '100 slov naučeno', icon: '📚', unlocked: stats.words_mastered >= 100 },
    { id: 'words_500', title: 'Polyglot',     desc: '500 slov naučeno', icon: '🌍', unlocked: stats.words_mastered >= 500 },
    { id: 'quiz_10',   title: 'Blesk',        desc: '10× bleskový kvíz',icon: '⚡', unlocked: quizCount >= 10 },
    { id: 'perfect_3', title: 'Perfekcionista',desc: '3× 100% přesnost',icon: '🎯', unlocked: perfectLessons >= 3 },
    { id: 'all_cats',  title: 'Italofil',     desc: 'Rozjet všechny kategorie', icon: '🇮🇹', unlocked: (startedCats?.count || 0) >= 20 },
    { id: 'level_5',   title: 'Veterán',      desc: 'Dosáhni levelu 5', icon: '⭐', unlocked: stats.level >= 5 },
    { id: 'xp_1000',   title: 'XP Mistr',     desc: 'Získej 1000 XP',  icon: '💎', unlocked: stats.xp >= 1000 },
  ];
}
