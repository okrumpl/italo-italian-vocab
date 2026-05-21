import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getUserStats,
  getCategories,
  getWordsForLesson,
  getQuickReviewWords,
  updateWordProgress,
  addXP,
  updateStreak,
  getDictionaryWords,
  recordSession,
  getActivityHeatmap,
  getDailyGoalStatus,
  setDailyGoal,
  incrementStat,
  getAchievements,
  getUsers,
  createUser,
  deleteUser,
  verifyUserPin,
  updateUserLastActive
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servírování statických souborů z React frontendu
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Middleware pro získání userId z hlaviček (výchozí 1)
const getUserId = (req) => {
  const headerId = req.headers['x-user-id'];
  const parsed = parseInt(headerId);
  return !isNaN(parsed) && parsed > 0 ? parsed : 1;
};

// ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání profilů.' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, avatar, pin } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Jméno je povinné.' });
    }
    const user = await createUser(name.trim(), avatar || '👤', pin || null);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při vytváření profilu.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await deleteUser(userId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při mazání profilu.' });
  }
});

app.post('/api/users/:id/verify-pin', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { pin } = req.body;
    const isValid = await verifyUserPin(userId, pin);
    if (isValid) {
      await updateUserLastActive(userId);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Nesprávný PIN.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při ověřování PINu.' });
  }
});


// ─── API ENDPOINTS (předáváme userId) ───────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const userId = getUserId(req);
    const stats = await getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání statistik.' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const userId = getUserId(req);
    const categories = await getCategories(userId);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání kategorií.' });
  }
});

app.get('/api/lesson/:category', async (req, res) => {
  try {
    const userId = getUserId(req);
    const category = req.params.category;
    const size = Math.min(Math.max(parseInt(req.query.size) || 10, 5), 20);
    const words = await getWordsForLesson(category, size, userId);
    res.json(words);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při generování lekce.' });
  }
});

app.get('/api/lesson-quick', async (req, res) => {
  try {
    const userId = getUserId(req);
    const words = await getQuickReviewWords(10, userId);
    res.json(words);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při generování procvičování.' });
  }
});

app.post('/api/lesson/complete', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Neplatná data lekce.' });
    }

    let xpEarned = 0;
    const results = [];

    for (const answer of answers) {
      const { wordId, isCorrect } = answer;

      if (!Number.isInteger(wordId) || wordId <= 0) {
        return res.status(400).json({ error: `Neplatné wordId: ${wordId}` });
      }

      const progress = await updateWordProgress(wordId, isCorrect, userId);
      results.push(progress);

      if (isCorrect) {
        const box = progress.newBox || 1;
        if (box <= 1) xpEarned += 12;
        else if (box <= 3) xpEarned += 10;
        else xpEarned += 6;
      }
    }

    xpEarned += 15; // Bonus za dokončení

    const xpStatus = await addXP(xpEarned, userId);
    const streakStatus = await updateStreak(userId);

    const wordsCorrect = answers.filter(a => a.isCorrect).length;
    await recordSession(category, answers.length, wordsCorrect, xpEarned, userId);

    if (!category) await incrementStat('quiz_count', userId);

    if (category && wordsCorrect === answers.length && answers.length >= 5) {
      await incrementStat('perfect_lessons', userId);
    }

    const newStats = await getUserStats(userId);

    res.json({
      xpEarned,
      leveledUp: xpStatus.leveledUp,
      newLevel: xpStatus.level,
      newStreak: streakStatus.streak,
      newStats,
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při ukládání výsledků lekce.' });
  }
});

app.get('/api/achievements', async (req, res) => {
  try {
    const userId = getUserId(req);
    const achievements = await getAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání achievementů.' });
  }
});

app.get('/api/heatmap', async (req, res) => {
  try {
    const userId = getUserId(req);
    const data = await getActivityHeatmap(userId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání heatmapy.' });
  }
});

app.get('/api/daily-goal', async (req, res) => {
  try {
    const userId = getUserId(req);
    const status = await getDailyGoalStatus(userId);
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání denního cíle.' });
  }
});

app.put('/api/daily-goal', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { goal } = req.body;
    const newGoal = await setDailyGoal(goal, userId);
    res.json({ goal: newGoal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při nastavení denního cíle.' });
  }
});

app.get('/api/dictionary', async (req, res) => {
  try {
    const userId = getUserId(req);
    const dictionary = await getDictionaryWords(userId);
    res.json(dictionary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání slovníku.' });
  }
});

// Fallback: Pokud cesta neodpovídá API, servíruje se React index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start serveru
async function start() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server běží na adrese http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Nepodařilo se spustit server:', error);
    process.exit(1);
  }
}

start();
