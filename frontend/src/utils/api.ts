// Wrapper kolem fetch, který automaticky přidává hlavičku X-User-Id
// Předpokládá, že je userId uloženo v localStorage (spravováno v ProfilePicker.tsx)

import { Capacitor } from '@capacitor/core';
import * as localDb from '../services/db';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const userIdStr = localStorage.getItem('userId');
  
  const headers = new Headers(options.headers || {});
  
  // Pokud je uživatel vybrán, pošli jeho ID. 
  // Pokud ne, backend si defaultně vezme userId = 1.
  if (userIdStr) {
    headers.set('X-User-Id', userIdStr);
  }
  
  // Pokud odesíláme JSON tělo a není nastaven Content-Type, přidáme ho
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers
  };

  if (Capacitor.isNativePlatform()) {
    return await handleLocalRoute(url, options, userIdStr);
  }

  // Jinak fallback na standardní fetch (web)
  const BASE_URL = ''; // V produkci např. http://192.168.1.100:3000
  const finalUrl = url.startsWith('/api') ? `${BASE_URL}${url}` : url;
  
  const res = await fetch(finalUrl, finalOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return await res.json();
}

// ==========================================
// OFFLINE ROUTING PRO NATIVE IOS (CAPACITOR)
// ==========================================
async function handleLocalRoute(url: string, options: RequestInit, userIdStr: string | null) {
  const method = options.method || 'GET';
  const userId = userIdStr ? parseInt(userIdStr) : 1;
  const body = options.body ? JSON.parse(options.body as string) : null;

  try {
    // ---- USERS ----
    if (url === '/api/users' && method === 'GET') return await localDb.getUsers();
    if (url === '/api/users' && method === 'POST') return await localDb.createUser(body.name, body.avatar, body.pin);
    if (url.match(/^\/api\/users\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/')[3]);
      await localDb.deleteUser(id);
      return { success: true };
    }
    if (url.match(/^\/api\/users\/\d+\/verify-pin$/) && method === 'POST') {
      const id = parseInt(url.split('/')[3]);
      const ok = await localDb.verifyUserPin(id, body.pin);
      if (!ok) throw new Error('Neplatný PIN');
      return { success: true };
    }

    // ---- DASHBOARD & STATS ----
    if (url === '/api/categories') return await localDb.getCategories(userId);
    if (url === '/api/stats') return await localDb.getUserStats(userId);
    if (url === '/api/heatmap') return await localDb.getActivityHeatmap(userId);
    if (url === '/api/achievements') return await localDb.getAchievements(userId);
    if (url === '/api/daily-goal') {
      if (method === 'GET') return await localDb.getDailyGoalStatus(userId);
      if (method === 'PUT') {
        await localDb.setDailyGoal(body.goal, userId);
        return { success: true, goal: body.goal };
      }
    }

    // ---- DICTIONARY ----
    if (url === '/api/dictionary') return await localDb.getDictionaryWords(userId);

    // ---- LESSONS ----
    if (url === '/api/lesson-quick') return await localDb.getQuickReviewWords(10, userId);
    if (url.startsWith('/api/lesson/') && method === 'GET') {
      const urlObj = new URL('http://localhost' + url);
      const category = decodeURIComponent(url.split('/')[3].split('?')[0]);
      const size = parseInt(urlObj.searchParams.get('size') || '10');
      return await localDb.getWordsForLesson(category, size, userId);
    }
    if (url === '/api/lesson/complete' && method === 'POST') {
      const { category, answers } = body;
      let correctCount = 0;
      for (const ans of answers) {
        await localDb.updateWordProgress(ans.wordId, ans.isCorrect, userId);
        if (ans.isCorrect) correctCount++;
      }
      
      const xp = correctCount * 10;
      await localDb.addXP(xp, userId);
      await localDb.recordSession(category, answers.length, correctCount, xp, userId);
      const streakRes = await localDb.updateStreak(userId);
      
      let perfect = false;
      if (correctCount === answers.length && answers.length >= 5) {
        await localDb.incrementStat('perfect_lessons', userId);
        perfect = true;
      }
      if (!category) {
        await localDb.incrementStat('quiz_count', userId);
      }

      const stats = await localDb.getUserStats(userId);
      const goalStat = await localDb.getDailyGoalStatus(userId);

      return {
        xpGained: xp,
        totalXp: stats.xp,
        streak: streakRes.streak,
        wordsPracticed: answers.length,
        perfect,
        dailyGoal: goalStat
      };
    }

    throw new Error(`Neimplementovaná offline routa: ${method} ${url}`);
  } catch (e: any) {
    console.error('[OFFLINE API ERROR]', e);
    throw e;
  }
}
