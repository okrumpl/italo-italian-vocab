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
  getAchievements
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servírování statických souborů z React frontendu
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Endpointy API

// Získání statistik uživatele
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getUserStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání statistik.' });
  }
});

// Získání všech kategorií
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání kategorií.' });
  }
});

// Získání slovíček pro lekci v konkrétní kategorii
app.get('/api/lesson/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const size = Math.min(Math.max(parseInt(req.query.size) || 10, 5), 20);
    const words = await getWordsForLesson(category, size);
    res.json(words);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při generování lekce.' });
  }
});

// Získání slovíček pro rychlé procvičování (napříč kategoriemi)
app.get('/api/lesson-quick', async (req, res) => {
  try {
    const words = await getQuickReviewWords(10);
    res.json(words);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při generování procvičování.' });
  }
});

// Dokončení lekce - hromadné uložení výsledků
app.post('/api/lesson/complete', async (req, res) => {
  try {
    const { category, answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Neplatná data lekce.' });
    }

    let xpEarned = 0;
    const results = [];

    // 1. Zpracování každé odpovědi
    for (const answer of answers) {
      const { wordId, isCorrect } = answer;

      // Validace
      if (!Number.isInteger(wordId) || wordId <= 0) {
        return res.status(400).json({ error: `Neplatné wordId: ${wordId}` });
      }
      if (typeof isCorrect !== 'boolean') {
        return res.status(400).json({ error: `isCorrect musí být boolean.` });
      }

      const progress = await updateWordProgress(wordId, isCorrect);
      results.push(progress);

      if (isCorrect) {
        // Diferenciované XP dle boxu slova
        const box = progress.newBox || 1;
        if (box <= 1) {
          xpEarned += 12; // nové slovo
        } else if (box <= 3) {
          xpEarned += 10; // procvičování
        } else {
          xpEarned += 6;  // review pokročilého slova
        }
      }
    }

    // 2. Bonus za dokončení lekce
    xpEarned += 15;

    // 3. Uložení XP a aktualizace streaku
    const xpStatus = await addXP(xpEarned);
    const streakStatus = await updateStreak();

    // 4. Zaznamenání session pro heatmapu + denní cíl
    const wordsCorrect = answers.filter(a => a.isCorrect).length;
    await recordSession(category, answers.length, wordsCorrect, xpEarned);

    // 5. Quick quiz counter
    if (!category) await incrementStat('quiz_count');

    // 6. Perfect lesson counter (100% přesnost, ne quick review)
    if (category && wordsCorrect === answers.length && answers.length >= 5) {
      await incrementStat('perfect_lessons');
    }

    // 7. Získání nových statistik
    const newStats = await getUserStats();

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

// Achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const achievements = await getAchievements();
    res.json(achievements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání achievementů.' });
  }
});

// Activity heatmap (35 dní)
app.get('/api/heatmap', async (req, res) => {
  try {
    const data = await getActivityHeatmap();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání heatmapy.' });
  }
});

// Denní cíl — GET status + PUT nastavení
app.get('/api/daily-goal', async (req, res) => {
  try {
    const status = await getDailyGoalStatus();
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při načítání denního cíle.' });
  }
});

app.put('/api/daily-goal', async (req, res) => {
  try {
    const { goal } = req.body;
    const newGoal = await setDailyGoal(goal);
    res.json({ goal: newGoal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při nastavení denního cíle.' });
  }
});

// Získání kompletního slovníku pro vyhledávání
app.get('/api/dictionary', async (req, res) => {
  try {
    const dictionary = await getDictionaryWords();
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
