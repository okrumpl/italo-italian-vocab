import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getAllWords } from '../assets/words';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

// HASH pinu
export const hashPin = async (pin: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export async function initDatabase() {
  if (db) return db;

  if (Capacitor.getPlatform() === 'web') {
    // Pro testování na webu, v produkci použijeme standardní apiFetch přes backend
    // Webová SQLite vyžaduje jeep-sqlite
    const jeepEl = document.createElement("jeep-sqlite");
    document.body.appendChild(jeepEl);
    await customElements.whenDefined('jeep-sqlite');
    await sqlite.initWebStore();
  }

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection("italodb", false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection("italodb", false);
  } else {
    db = await sqlite.createConnection("italodb", false, "no-encryption", 1, false);
  }

  await db.open();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '👤',
      pin_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_active TEXT
    );
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      word_id INTEGER NOT NULL,
      box INTEGER DEFAULT 1,
      next_review TEXT,
      attempts INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      UNIQUE(user_id, word_id)
    );
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(user_id, key)
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

  // Indexy
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
    CREATE INDEX IF NOT EXISTS idx_progress_review ON user_progress(next_review);
    CREATE INDEX IF NOT EXISTS idx_progress_box ON user_progress(box);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date);
  `);

  // Default User
  const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
  if (usersCount.values?.[0]?.count === 0) {
    await db.run("INSERT INTO users(id, name, avatar) VALUES(1, 'Hráč 1', '👤')");
  }

  // Seed Words if empty
  const wordCount = await db.query('SELECT COUNT(*) as count FROM words');
  if (wordCount.values?.[0]?.count === 0) {
    const allWords = getAllWords();
    const batch = [];
    for (const w of allWords) {
      batch.push(`INSERT OR IGNORE INTO words (italian, czech, category, difficulty, pronunciation, example_it, example_cz) VALUES ('${w.italian.replace(/'/g, "''")}', '${w.czech.replace(/'/g, "''")}', '${w.category}', '${w.difficulty}', '${w.pronunciation.replace(/'/g, "''")}', '${w.example_it.replace(/'/g, "''")}', '${w.example_cz.replace(/'/g, "''")}');`);
    }
    // Capacitor execute accepts multiple statements
    await db.execute(batch.join('\n'));
    
    await db.execute(`UPDATE words SET category = 'Zvířata' WHERE category = 'Příroda a zvířata'`);
    await db.execute(`UPDATE words SET category = 'Škola a práce' WHERE category = 'Škola a vzdělávání'`);
  }

  return db;
}

async function seedUserStats(userId: number) {
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
    await db?.run('INSERT OR IGNORE INTO user_stats(user_id, key, value) VALUES(?, ?, ?)', [userId, s.key, s.value]);
  }
}

// =================== DB API FUNCTIONS ===================

export async function getUsers() {
  const res = await db?.query('SELECT id, name, avatar, pin_hash IS NOT NULL as has_pin, last_active FROM users ORDER BY id ASC');
  return res?.values || [];
}

export async function createUser(name: string, avatar = '👤', pin: string | null = null) {
  const pinHash = pin ? await hashPin(pin) : null;
  const res = await db?.run('INSERT INTO users(name, avatar, pin_hash) VALUES(?, ?, ?)', [name, avatar, pinHash]);
  const userId = res?.changes?.lastId || 1;
  await seedUserStats(userId);
  const userRow = await db?.query('SELECT id, name, avatar, pin_hash IS NOT NULL as has_pin FROM users WHERE id = ?', [userId]);
  return userRow?.values?.[0];
}

export async function deleteUser(userId: number) {
  await db?.run('DELETE FROM user_stats WHERE user_id = ?', [userId]);
  await db?.run('DELETE FROM user_progress WHERE user_id = ?', [userId]);
  await db?.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  await db?.run('DELETE FROM users WHERE id = ?', [userId]);
}

export async function verifyUserPin(userId: number, pin: string) {
  const res = await db?.query('SELECT pin_hash FROM users WHERE id = ?', [userId]);
  const user = res?.values?.[0];
  if (!user) return false;
  if (!user.pin_hash) return true;
  return user.pin_hash === await hashPin(pin);
}

export async function updateUserLastActive(userId: number) {
  await db?.run('UPDATE users SET last_active = datetime("now") WHERE id = ?', [userId]);
}

export async function getUserStats(userId = 1) {
  await seedUserStats(userId);
  const rows = await db?.query('SELECT key, value FROM user_stats WHERE user_id = ?', [userId]);
  const stats: any = {};
  rows?.values?.forEach(r => {
    stats[r.key] = r.key === 'last_active_date' ? r.value : parseInt(r.value) || 0;
  });

  const learnedResult = await db?.query('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND box = 5', [userId]);
  const learningResult = await db?.query('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND box < 5', [userId]);
  const totalResult = await db?.query('SELECT COUNT(*) as count FROM words');

  stats.words_total = totalResult?.values?.[0]?.count || 0;
  stats.words_mastered = learnedResult?.values?.[0]?.count || 0;
  stats.words_learning = learningResult?.values?.[0]?.count || 0;

  const accuracyResult = await db?.query(
    'SELECT SUM(correct_count) as total_correct, SUM(attempts) as total_attempts FROM user_progress WHERE user_id = ?', [userId]
  );
  stats.total_correct = accuracyResult?.values?.[0]?.total_correct || 0;
  stats.total_attempts = accuracyResult?.values?.[0]?.total_attempts || 0;
  stats.accuracy = stats.total_attempts > 0 ? Math.round((stats.total_correct / stats.total_attempts) * 100) : 0;

  const difficultWords = await db?.query(`
    SELECT w.italian, w.czech, up.correct_count, up.attempts,
           (CAST(up.correct_count AS FLOAT) / up.attempts) as accuracy_ratio
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE up.user_id = ? AND up.attempts >= 2
    ORDER BY accuracy_ratio ASC LIMIT 5
  `, [userId]);
  stats.difficult_words = difficultWords?.values?.map(w => ({
    italian: w.italian, czech: w.czech, accuracy: Math.round(w.accuracy_ratio * 100)
  })) || [];

  return stats;
}

export async function getCategories(userId = 1) {
  const rows = await db?.query(`
    SELECT
      w.category,
      COUNT(w.id) as total_words,
      COUNT(up.word_id) as started_words,
      SUM(CASE WHEN up.box = 5 THEN 1 ELSE 0 END) as mastered_words
    FROM words w
    LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
    GROUP BY w.category ORDER BY w.category ASC
  `, [userId]);
  return rows?.values?.map(r => ({
    category: r.category,
    totalWords: r.total_words,
    startedWords: r.started_words || 0,
    masteredWords: r.mastered_words || 0,
    progressPercent: r.total_words > 0 ? Math.round(((r.mastered_words || 0) / r.total_words) * 100) : 0
  })) || [];
}

function fisherYates(arr: any[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getWordsForLesson(category: string, limit = 10, userId = 1) {
  const now = new Date().toISOString();
  const seenIds = new Set();

  const reviewWords = await db?.query(`
    SELECT w.*, up.box, up.attempts, up.correct_count, 1 as is_review
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE w.category = ? AND up.user_id = ? AND up.next_review <= ?
    ORDER BY up.box ASC, up.next_review ASC LIMIT ?
  `, [category, userId, now, Math.ceil(limit * 0.5)]);
  
  reviewWords?.values?.forEach(w => seenIds.add(w.id));
  const lessonWords = [...(reviewWords?.values || [])];

  if (lessonWords.length < limit) {
    const needed = Math.min(Math.ceil(limit * 0.4), limit - lessonWords.length);
    const newWords = await db?.query(`
      SELECT w.*, 0 as box, 0 as attempts, 0 as correct_count, 0 as is_review
      FROM words w
      LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
      WHERE w.category = ? AND up.word_id IS NULL
      ORDER BY RANDOM() LIMIT ?
    `, [userId, category, needed]);
    newWords?.values?.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const weakWords = await db?.query(`
      SELECT w.*, up.box, up.attempts, up.correct_count, 0 as is_review
      FROM words w JOIN user_progress up ON w.id = up.word_id
      WHERE w.category = ? AND up.user_id = ? AND up.box <= 2 AND w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, [category, userId, ...exc, needed]);
    weakWords?.values?.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const fallback = await db?.query(`
      SELECT w.*, COALESCE(up.box,0) as box, COALESCE(up.attempts,0) as attempts,
             COALESCE(up.correct_count,0) as correct_count, 0 as is_review
      FROM words w LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
      WHERE w.category = ? AND w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, [userId, category, ...exc, needed]);
    fallback?.values?.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  return fisherYates(lessonWords);
}

export async function getQuickReviewWords(limit = 10, userId = 1) {
  const now = new Date().toISOString();
  const seenIds = new Set();

  const reviewWords = await db?.query(`
    SELECT w.*, up.box, up.attempts, up.correct_count, 1 as is_review
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE up.user_id = ? AND up.next_review <= ? AND up.box <= 3
    ORDER BY up.next_review ASC LIMIT ?
  `, [userId, now, Math.ceil(limit * 0.6)]);
  reviewWords?.values?.forEach(w => seenIds.add(w.id));
  const lessonWords = [...(reviewWords?.values || [])];

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const weakWords = await db?.query(`
      SELECT w.*, up.box, up.attempts, up.correct_count, 0 as is_review
      FROM words w JOIN user_progress up ON w.id = up.word_id
      WHERE up.user_id = ? AND up.box <= 2 AND w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, [userId, ...exc, needed]);
    weakWords?.values?.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  if (lessonWords.length < limit) {
    const needed = limit - lessonWords.length;
    const exc = seenIds.size > 0 ? [...seenIds] : [-1];
    const ph = exc.map(() => '?').join(',');
    const randomWords = await db?.query(`
      SELECT w.*, COALESCE(up.box,0) as box, COALESCE(up.attempts,0) as attempts,
             COALESCE(up.correct_count,0) as correct_count, 0 as is_review
      FROM words w LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
      WHERE w.id NOT IN (${ph})
      ORDER BY RANDOM() LIMIT ?
    `, [userId, ...exc, needed]);
    randomWords?.values?.forEach(w => { if (!seenIds.has(w.id)) { seenIds.add(w.id); lessonWords.push(w); } });
  }

  return fisherYates(lessonWords);
}

export async function updateWordProgress(wordId: number, isCorrect: boolean, userId = 1) {
  const now = new Date();
  const res = await db?.query('SELECT * FROM user_progress WHERE user_id = ? AND word_id = ?', [userId, wordId]);
  const progress = res?.values?.[0];

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

  const intervals: any = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
  const nextReviewDate = new Date();
  nextReviewDate.setDate(now.getDate() + (intervals[newBox] || 1));
  const nextReviewStr = nextReviewDate.toISOString();

  await db?.run(`
    INSERT INTO user_progress (user_id, word_id, box, next_review, attempts, correct_count)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word_id) DO UPDATE SET
      box = excluded.box, next_review = excluded.next_review,
      attempts = excluded.attempts, correct_count = excluded.correct_count
  `, [userId, wordId, newBox, nextReviewStr, attempts, correctCount]);

  return { wordId, newBox, nextReview: nextReviewStr };
}

export async function addXP(amount: number, userId = 1) {
  const stats = await getUserStats(userId);
  const newXP = stats.xp + amount;
  const newLevel = Math.floor(1 + Math.sqrt(newXP / 100));

  await db?.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "xp"', [newXP.toString(), userId]);
  if (newLevel > stats.level) {
    await db?.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "level"', [newLevel.toString(), userId]);
  }
  return { xp: newXP, level: newLevel, leveledUp: newLevel > stats.level };
}

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

  await db?.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "last_active_date"', [todayStr, userId]);
  await db?.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "streak"', [newStreak.toString(), userId]);
  await updateUserLastActive(userId);
  return { streak: newStreak, lastActiveDate: todayStr };
}

export async function getDictionaryWords(userId = 1) {
  const res = await db?.query(`
    SELECT w.*, COALESCE(up.box, 0) as box, COALESCE(up.attempts, 0) as attempts,
           COALESCE(up.correct_count, 0) as correct_count
    FROM words w
    LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
    ORDER BY w.italian ASC
  `, [userId]);
  return res?.values || [];
}

export async function recordSession(category: string | null, wordsPracticed: number, wordsCorrect: number, xpEarned: number, userId = 1) {
  const todayStr = new Date().toISOString().split('T')[0];
  await db?.run(`
    INSERT INTO sessions (user_id, date, category, words_practiced, words_correct, xp_earned)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, todayStr, category || 'Quick Review', wordsPracticed, wordsCorrect, xpEarned]);
}

export async function getActivityHeatmap(userId = 1) {
  const res = await db?.query(`
    SELECT date, SUM(words_practiced) as total_words, COUNT(*) as lessons
    FROM sessions WHERE user_id = ? AND date >= date('now', '-34 days')
    GROUP BY date ORDER BY date ASC
  `, [userId]);
  const map: any = {};
  res?.values?.forEach(r => { map[r.date] = { words: r.total_words, lessons: r.lessons }; });
  const days = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, words: map[dateStr]?.words || 0, lessons: map[dateStr]?.lessons || 0 });
  }
  return days;
}

export async function getDailyGoalStatus(userId = 1) {
  const stats = await getUserStats(userId);
  const goal = parseInt(stats.daily_goal) || 10;
  const todayStr = new Date().toISOString().split('T')[0];
  const res = await db?.query('SELECT COALESCE(SUM(words_practiced),0) as practiced FROM sessions WHERE user_id = ? AND date = ?', [userId, todayStr]);
  const practiced = res?.values?.[0]?.practiced || 0;
  return { goal, practiced, percent: Math.min(Math.round((practiced / goal) * 100), 100), done: practiced >= goal };
}

export async function setDailyGoal(goal: number, userId = 1) {
  const val = Math.min(Math.max(goal || 10, 5), 50);
  await db?.run('UPDATE user_stats SET value = ? WHERE user_id = ? AND key = "daily_goal"', [val.toString(), userId]);
  return val;
}

export async function incrementStat(key: string, userId = 1) {
  await db?.run(
    `UPDATE user_stats SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE user_id = ? AND key = ?`,
    [userId, key]
  );
}

export async function getAchievements(userId = 1) {
  const stats = await getUserStats(userId);
  const quizCount = parseInt(stats.quiz_count) || 0;
  const perfectLessons = parseInt(stats.perfect_lessons) || 0;
  const res = await db?.query(`
    SELECT COUNT(DISTINCT w.category) as count
    FROM words w JOIN user_progress up ON w.id = up.word_id
    WHERE up.user_id = ?
  `, [userId]);
  const startedCats = res?.values?.[0]?.count || 0;

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
    { id: 'all_cats',  title: 'Italofil',     desc: 'Rozjet všechny kategorie', icon: '🇮🇹', unlocked: startedCats >= 20 },
    { id: 'level_5',   title: 'Veterán',      desc: 'Dosáhni levelu 5', icon: '⭐', unlocked: stats.level >= 5 },
    { id: 'xp_1000',   title: 'XP Mistr',     desc: 'Získej 1000 XP',  icon: '💎', unlocked: stats.xp >= 1000 },
  ];
}
