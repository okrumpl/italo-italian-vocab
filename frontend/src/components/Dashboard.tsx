import React, { useEffect, useState, useMemo } from 'react';
import {
  Flame, Zap, Trophy, BookOpen, Coffee, Users, Plane, Palette,
  Heart, Home, Briefcase, Activity, MessageSquare, Shirt, Music,
  HelpCircle, Play, RotateCcw, Smile, CloudSun, Hash, Calendar,
  Building2, GraduationCap, BookA, Tag, ChevronRight, X, SlidersHorizontal
} from 'lucide-react';
import { Mascot } from './Mascot';
import { apiFetch } from '../utils/api';

interface CategoryData {
  category: string;
  totalWords: number;
  startedWords: number;
  masteredWords: number;
  progressPercent: number;
}

interface UserStats {
  xp: number;
  streak: number;
  level: number;
  words_mastered: number;
  words_learning: number;
  words_total: number;
}

interface DailyGoal {
  goal: number;
  practiced: number;
  percent: number;
  done: boolean;
}

interface DashboardProps {
  onStartLesson: (category: string, size: number) => void;
  onStartQuickReview: () => void;
  refreshKey?: number;
}

type SortMode = 'progress' | 'alpha';

// ── Dynamický pozdrav dle denní doby + série ─────────────────────────────────
function getGreeting(streak: number): { title: string; sub: string } {
  const h = new Date().getHours();
  if (streak >= 7) return { title: `🔥 ${streak} dní v řadě!`, sub: 'Jsi nezastavitelný. Pokračuj dnes.' };
  if (streak >= 3) return { title: `Skvělá série — ${streak} dní!`, sub: 'Udržuj tempo, italština tě odmění.' };
  if (h < 11)      return { title: 'Buongiorno! 🌅', sub: 'Skvělý ranní čas na italštinu.' };
  if (h < 14)      return { title: 'Ciao! Připraven?', sub: 'Procvičuj Leitnerovým systémem.' };
  if (h < 18)      return { title: 'Buon pomeriggio!', sub: 'Odpolední trénink = silná paměť.' };
  return { title: 'Buonasera! 🌙', sub: 'Večerní opakování je nejefektivnější.' };
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartLesson, onStartQuickReview, refreshKey }) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('progress');
  const [lessonSize, setLessonSize] = useState<5 | 10 | 20>(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catData, statsData, goalData] = await Promise.all([
        apiFetch('/api/categories'),
        apiFetch('/api/stats'),
        apiFetch('/api/daily-goal')
      ]);
      setCategories(catData);
      setStats(statsData);
      setDailyGoal(goalData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [refreshKey]);

  // ── Třídění kategorií ─────────────────────────────────────────────────────
  const sortedCategories = useMemo(() => {
    if (sortMode === 'alpha') return [...categories].sort((a, b) => a.category.localeCompare(b.category, 'cs'));
    // 'progress': rozkoukané nahoře, pak nové, pak hotové dole
    return [...categories].sort((a, b) => {
      const scoreA = a.masteredWords === a.totalWords && a.totalWords > 0 ? -1 : a.startedWords > 0 ? 1 : 0;
      const scoreB = b.masteredWords === b.totalWords && b.totalWords > 0 ? -1 : b.startedWords > 0 ? 1 : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.category.localeCompare(b.category, 'cs');
    });
  }, [categories, sortMode]);

  const getCategoryIcon = (category: string) => {
    const s = 20;
    const map: Record<string, React.ReactNode> = {
      'Základy':            <BookOpen size={s} />,
      'Jídlo a pití':       <Coffee size={s} />,
      'Rodina a vztahy':    <Users size={s} />,
      'Zvířata':            <span style={{ fontSize: 18 }}>🦁</span>,
      'Cestování':          <Plane size={s} />,
      'Barvy':              <Palette size={s} />,
      'Oblečení a móda':    <Shirt size={s} />,
      'Tělo a zdraví':      <Heart size={s} />,
      'Dům a domácnost':    <Home size={s} />,
      'Práce a povolání':   <Briefcase size={s} />,
      'Volný čas a sport':  <Music size={s} />,
      'Slovesa':            <Activity size={s} />,
      'Fráze':              <MessageSquare size={s} />,
      'Emoce a vlastnosti': <Smile size={s} />,
      'Počasí':             <CloudSun size={s} />,
      'Čísla':              <Hash size={s} />,
      'Čas a dny':          <Calendar size={s} />,
      'Město a doprava':    <Building2 size={s} />,
      'Škola a práce':      <GraduationCap size={s} />,
      'Gramatika':          <BookA size={s} />,
      'Přídavná jména':     <Tag size={s} />,
    };
    return map[category] ?? <HelpCircle size={s} />;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 32, minHeight: '80vh' }}>
        <Mascot state="idle" size={100} />
        <p style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: 'var(--text-3)' }}>
          Načítám tvůj italský svět…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 32, textAlign: 'center' }}>
        <Mascot state="sad" size={100} />
        <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 700, color: 'var(--wrong-fg)' }}>Chyba spojení</h3>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-2)' }}>{error}</p>
        <button onClick={fetchData} className="btn btn-primary" style={{ marginTop: 24, maxWidth: 260 }}>
          <RotateCcw size={16} /> Zkusit znovu
        </button>
      </div>
    );
  }

  const greeting = getGreeting(stats?.streak ?? 0);

  return (
    <div className="screen-container">

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--orange-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={18} style={{ color: 'var(--orange)', fill: 'var(--orange)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{stats?.streak ?? 0}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.4px' }}>SÉRIE</div>
          </div>
        </div>

        {/* App title */}
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          🇮🇹 Italo
        </span>

        {/* XP + Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--sky-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} style={{ color: 'var(--sky)', fill: 'var(--sky)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{stats?.xp ?? 0}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.4px' }}>XP</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--yellow-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={18} style={{ color: 'var(--yellow)', fill: 'var(--yellow)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{stats?.level ?? 1}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.4px' }}>LVL</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Obsah ── */}
      <div style={{ flex: 1, padding: '20px 20px 24px', overflowY: 'auto' }}>

        {/* Welcome card — dynamický pozdrav */}
        <div style={{
          background: 'linear-gradient(135deg, var(--green-50) 0%, var(--indigo-50) 100%)',
          border: '1px solid var(--green-100)',
          borderRadius: 20, padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 16,
        }}>
          <Mascot state={stats?.streak && stats.streak >= 3 ? 'excited' : 'idle'} size={72} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.2px' }}>
              {greeting.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {greeting.sub}
            </p>
          </div>
          {/* Denní cíl ring */}
          {dailyGoal && (
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke="var(--border)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="18" fill="none"
                  stroke={dailyGoal.done ? '#f59e0b' : 'var(--green-500)'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - dailyGoal.percent / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
                <text x="24" y="29" textAnchor="middle" fontSize="11" fontWeight="800"
                  fill={dailyGoal.done ? '#f59e0b' : 'var(--text)'}>
                  {dailyGoal.done ? '✓' : `${dailyGoal.percent}%`}
                </text>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {dailyGoal.done ? 'Hotovo!' : 'Cíl'}
              </span>
            </div>
          )}
        </div>

        {/* Quick review button */}
        <button
          onClick={onStartQuickReview}
          className="btn btn-orange"
          style={{ marginBottom: 24, fontSize: 15 }}
        >
          <Zap size={18} style={{ fill: 'currentColor' }} />
          Bleskový kvíz
        </button>

        {/* Section title + sort toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="section-label" style={{ paddingLeft: 2 }}>
            Témata &amp; kategorie
          </p>
          <button
            onClick={() => setSortMode(m => m === 'progress' ? 'alpha' : 'progress')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={12} />
            {sortMode === 'progress' ? 'Pokrok' : 'A–Z'}
          </button>
        </div>

        {/* ── Category card grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {sortedCategories.map((cat, idx) => {
            const mastered = cat.masteredWords === cat.totalWords && cat.totalWords > 0;
            const started = cat.startedWords > 0;
            const r = 18;
            const circ = 2 * Math.PI * r;
            const progressOffset = circ - (cat.progressPercent / 100) * circ;

            const accentColor = mastered ? '#f59e0b' : 'var(--green-500)';
            const iconBg = mastered
              ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
              : started
              ? 'linear-gradient(135deg,#4ade80,#22c55e)'
              : 'var(--surface-2)';
            const iconColor = mastered || started ? '#fff' : 'var(--text-3)';
            const borderColor = mastered ? '#fde68a' : started ? '#bbf7d0' : 'var(--border)';

            return (
              <button
                key={cat.category}
                className="animate-slide"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  animationDelay: `${idx * 20}ms`,
                  background: 'var(--surface)',
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 16,
                  padding: '14px 10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: started || mastered ? '0 2px 10px rgba(34,197,94,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = started || mastered ? '0 2px 10px rgba(34,197,94,0.08)' : '0 1px 3px rgba(0,0,0,0.04)';
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              >
                {/* Star badge for fully mastered */}
                {mastered && (
                  <span style={{ position: 'absolute', top: 7, right: 9, fontSize: 13 }}>⭐</span>
                )}

                {/* Icon with progress ring */}
                <div style={{ position: 'relative', width: 50, height: 50 }}>
                  <svg
                    width="50" height="50" viewBox="0 0 50 50"
                    style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
                  >
                    <circle cx="25" cy="25" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
                    {cat.progressPercent > 0 && (
                      <circle
                        cx="25" cy="25" r={r}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="3"
                        strokeDasharray={circ}
                        strokeDashoffset={progressOffset}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 5, borderRadius: '50%',
                    background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: iconColor,
                  }}>
                    {getCategoryIcon(cat.category)}
                  </div>
                </div>

                {/* Category name + word count */}
                <div style={{ width: '100%' }}>
                  <p style={{
                    fontSize: 11.5, fontWeight: 700,
                    color: 'var(--text)', lineHeight: 1.3,
                    marginBottom: 2,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {cat.category}
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>
                    {cat.masteredWords}/{cat.totalWords} slov
                  </p>
                </div>

                {/* Mini progress bar */}
                <div style={{ width: '100%', height: 3, borderRadius: 99, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${cat.progressPercent}%`,
                    borderRadius: 99,
                    background: mastered
                      ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                      : 'linear-gradient(90deg,#4ade80,#22c55e)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category detail modal ── */}
      {selectedCategory && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'flex-end',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="animate-pop"
            style={{
              width: '100%',
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '8px 24px 36px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 99, backgroundColor: 'var(--border-2)', margin: '12px auto 20px' }} />

            {/* Close button */}
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 32, height: 32, borderRadius: 99, border: 'none',
                backgroundColor: 'var(--surface-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)',
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>
              {selectedCategory.category}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Obtížnost A1–A2 · Spaced repetition
            </p>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Celkem', value: selectedCategory.totalWords, color: 'var(--text)' },
                { label: 'Učím se', value: selectedCategory.startedWords, color: 'var(--sky)' },
                { label: 'Zvládnuto', value: selectedCategory.masteredWords, color: 'var(--green-500)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ backgroundColor: 'var(--surface-2)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Pokrok</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-500)' }}>{selectedCategory.progressPercent}%</span>
              </div>
              <div className="progress-bar-container" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${selectedCategory.progressPercent}%` }} />
              </div>
            </div>

            {/* Výběr délky lekce */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Délka lekce
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {([5, 10, 20] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setLessonSize(n)}
                    style={{
                      flex: 1, padding: '10px 4px',
                      borderRadius: 10,
                      border: `1.5px solid ${lessonSize === n ? 'var(--green-500)' : 'var(--border)'}`,
                      backgroundColor: lessonSize === n ? 'var(--green-50)' : 'var(--surface)',
                      color: lessonSize === n ? 'var(--green-600)' : 'var(--text-2)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    {n} slov
                    <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>
                      {n === 5 ? '~3 min' : n === 10 ? '~5 min' : '~10 min'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ fontSize: 16 }}
              onClick={() => {
                onStartLesson(selectedCategory.category, lessonSize);
                setSelectedCategory(null);
              }}
            >
              <Play size={18} style={{ fill: 'currentColor' }} />
              Spustit lekci · {lessonSize} slov
              <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
