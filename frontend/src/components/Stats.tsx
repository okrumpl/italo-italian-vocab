import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Flame, Star, Layers, Target, AlertTriangle, Lock, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { Mascot } from './Mascot';
import { speakItalian } from '../utils/audio';

interface UserStats {
  xp: number;
  streak: number;
  level: number;
  words_mastered: number;
  words_learning: number;
  words_total: number;
  accuracy?: number;
  difficult_words?: Array<{ italian: string; czech: string; accuracy: number }>;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

interface HeatmapDay {
  date: string;
  words: number;
  lessons: number;
}

interface DailyGoal {
  goal: number;
  practiced: number;
  percent: number;
  done: boolean;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
}> = ({ icon, iconBg, label, value }) => (
  <div style={{
    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '16px 14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</span>
  </div>
);

// Heatmapa aktivity — 5 řádků × 7 sloupců
const ActivityHeatmap: React.FC<{ days: HeatmapDay[] }> = ({ days }) => {
  const getColor = (words: number) => {
    if (words === 0) return 'var(--border)';
    if (words < 5)  return '#bbf7d0';
    if (words < 10) return '#4ade80';
    if (words < 20) return '#22c55e';
    return '#15803d';
  };

  const dayLabels = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  // Rozřadíme do 5 týdnů po 7 dnech
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      {/* Popisky dnů */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {dayLabels.map(d => (
          <div key={d} style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      {/* Týdny */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.words} slov, ${day.lessons} lekcí`}
              style={{
                height: 16, borderRadius: 4,
                backgroundColor: getColor(day.words),
                transition: 'transform 0.1s',
                cursor: day.words > 0 ? 'pointer' : 'default',
              }}
              onMouseEnter={e => { if (day.words > 0) e.currentTarget.style.transform = 'scale(1.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      ))}
      {/* Legenda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)' }}>Méně</span>
        {['var(--border)', '#bbf7d0', '#4ade80', '#22c55e', '#15803d'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--text-3)' }}>Více</span>
      </div>
    </div>
  );
};

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/achievements').then(r => r.json()),
      fetch('/api/heatmap').then(r => r.json()),
      fetch('/api/daily-goal').then(r => r.json()),
    ]).then(([s, a, h, g]) => {
      setStats(s);
      setAchievements(a);
      setHeatmap(h);
      setDailyGoal(g);
      setGoalInput(String(g.goal));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSaveGoal = async () => {
    const n = parseInt(goalInput);
    if (isNaN(n) || n < 5 || n > 50) return;
    const res = await fetch('/api/daily-goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: n }),
    });
    const data = await res.json();
    setDailyGoal(prev => prev ? { ...prev, goal: data.goal } : prev);
    setGoalEditing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--green-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>Načítám profil…</p>
      </div>
    );
  }

  const currentLvl = stats?.level ?? 1;
  const nextLvlXP = Math.pow(currentLvl, 2) * 100;
  const currentLvlXP = Math.pow(currentLvl - 1, 2) * 100;
  const xpInLevel = (stats?.xp ?? 0) - currentLvlXP;
  const xpNeeded = nextLvlXP - currentLvlXP;
  const lvlProgress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="screen-container">
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Můj profil
        </h1>
      </header>

      <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile hero */}
        <div style={{
          background: 'linear-gradient(135deg, var(--green-50), var(--indigo-50))',
          border: '1px solid var(--green-100)',
          borderRadius: 20, padding: '20px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Mascot state="happy" size={80} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="section-label" style={{ color: 'var(--green-600)', marginBottom: 4 }}>
              Úroveň {currentLvl} · Marco
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.2px' }}>
              Italský student
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {unlockedCount}/{achievements.length} odznaků odemčeno
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard icon={<Flame size={22} style={{ color: 'var(--orange)', fill: 'var(--orange)' }} />} iconBg="var(--orange-50)" label="Série dní" value={stats?.streak ?? 0} />
          <StatCard icon={<Zap size={22} style={{ color: 'var(--sky)', fill: 'var(--sky)' }} />} iconBg="var(--sky-50)" label="XP celkem" value={stats?.xp ?? 0} />
          <StatCard icon={<Trophy size={22} style={{ color: 'var(--yellow)', fill: 'var(--yellow)' }} />} iconBg="var(--yellow-50)" label="Level" value={stats?.level ?? 1} />
          <StatCard icon={<Star size={22} style={{ color: 'var(--green-500)', fill: 'var(--green-500)' }} />} iconBg="var(--green-50)" label="Naučeno" value={stats?.words_mastered ?? 0} />
        </div>

        {/* Level progress */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Pokrok k úrovni {currentLvl + 1}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-500)' }}>{stats?.xp} / {nextLvlXP} XP</span>
          </div>
          <div className="progress-bar-container" style={{ height: 10, marginBottom: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${lvlProgress}%` }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
            Chybí {nextLvlXP - (stats?.xp ?? 0)} XP do dalšího levelu
          </p>
        </div>

        {/* Denní cíl */}
        {dailyGoal && (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} style={{ color: 'var(--text-2)' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Denní cíl</h3>
              </div>
              <button
                onClick={() => setGoalEditing(!goalEditing)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}
              >
                <SlidersHorizontal size={11} /> Upravit
              </button>
            </div>

            {goalEditing ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[5, 10, 15, 20, 30].map(n => (
                  <button
                    key={n}
                    onClick={() => { setGoalInput(String(n)); }}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${goalInput === String(n) ? 'var(--green-500)' : 'var(--border)'}`,
                      backgroundColor: goalInput === String(n) ? 'var(--green-50)' : 'var(--surface)',
                      color: goalInput === String(n) ? 'var(--green-600)' : 'var(--text-2)',
                      fontSize: 12, fontWeight: 700,
                    }}
                  >{n}</button>
                ))}
                <button onClick={handleSaveGoal} className="btn btn-primary" style={{ fontSize: 12, padding: '8px 14px', flex: 'none', width: 'auto' }}>
                  Uložit
                </button>
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* SVG progress ring */}
              <svg width="60" height="60" viewBox="0 0 60 60" style={{ flexShrink: 0 }}>
                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle
                  cx="30" cy="30" r="24" fill="none"
                  stroke={dailyGoal.done ? '#f59e0b' : 'var(--green-500)'}
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - dailyGoal.percent / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="800" fill={dailyGoal.done ? '#f59e0b' : 'var(--text)'}>
                  {dailyGoal.percent}%
                </text>
              </svg>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  {dailyGoal.done ? '🎉 Cíl splněn!' : `${dailyGoal.practiced} / ${dailyGoal.goal} slov`}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {dailyGoal.done ? 'Skvělá práce! Pokračuj dál.' : `Ještě ${dailyGoal.goal - dailyGoal.practiced} slov do cíle`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity heatmap */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Aktivita (35 dní)</h3>
          </div>
          {heatmap.length > 0 ? (
            <ActivityHeatmap days={heatmap} />
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Zatím žádná aktivita. Začni první lekci!</p>
          )}
        </div>

        {/* Achievements */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} style={{ color: 'var(--yellow)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Odznaky</h3>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-500)' }}>
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {achievements.map(a => (
              <div
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12,
                  backgroundColor: a.unlocked ? 'var(--green-50)' : 'var(--surface-2)',
                  border: `1px solid ${a.unlocked ? 'var(--green-100)' : 'var(--border)'}`,
                  opacity: a.unlocked ? 1 : 0.55,
                }}
              >
                <span style={{ fontSize: 22, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{a.title}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.3, marginTop: 1 }}>{a.desc}</p>
                </div>
                {a.unlocked ? (
                  <CheckCircle2 size={14} style={{ color: 'var(--green-500)', flexShrink: 0, marginLeft: 'auto' }} />
                ) : (
                  <Lock size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginLeft: 'auto' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vocabulary state */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Layers size={18} style={{ color: 'var(--text-2)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Stav slovní zásoby</h3>
          </div>
          {[
            { label: 'Zvládnutá', count: stats?.words_mastered ?? 0, total: stats?.words_total ?? 1, color: 'var(--green-500)' },
            { label: 'Učím se', count: stats?.words_learning ?? 0, total: stats?.words_total ?? 1, color: 'var(--sky)' },
            { label: 'Nezapočatá', count: (stats?.words_total ?? 0) - (stats?.words_mastered ?? 0) - (stats?.words_learning ?? 0), total: stats?.words_total ?? 1, color: 'var(--border-2)' },
          ].map(({ label, count, total, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{count} / {total}</span>
              </div>
              <div className="progress-bar-container" style={{ height: 7 }}>
                <div className="progress-bar-fill" style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`, background: color }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 4, padding: '10px 14px', backgroundColor: 'var(--surface-2)', borderRadius: 10, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Leitnerův systém: čím více správných odpovědí, tím výše se slovo posouvá. Box 5 = zvládnuto.
          </div>
        </div>

        {/* Difficult words */}
        {stats?.difficult_words && stats.difficult_words.length > 0 && (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ color: 'var(--orange)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Nejtěžší slovíčka</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.difficult_words.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--wrong-bg)', borderRadius: 10, border: '1px solid var(--wrong-border)' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{w.italian}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.czech}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => speakItalian(w.italian)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'var(--sky-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
                    >🔊</button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--wrong-fg)', backgroundColor: 'var(--wrong-bg)', padding: '3px 8px', borderRadius: 8, border: '1px solid var(--wrong-border)' }}>
                      {w.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
