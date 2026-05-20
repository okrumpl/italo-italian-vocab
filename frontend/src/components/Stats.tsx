import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Flame, Star, Layers, Target, AlertTriangle, BellRing } from 'lucide-react';
import { Mascot } from './Mascot';

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
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {label}
    </span>
    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
      {value}
    </span>
  </div>
);

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--green-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>Načítám statistiky…</p>
      </div>
    );
  }

  const currentLvl = stats?.level ?? 1;
  const nextLvlXP = Math.pow(currentLvl, 2) * 100;
  const currentLvlXP = Math.pow(currentLvl - 1, 2) * 100;
  const xpInLevel = (stats?.xp ?? 0) - currentLvlXP;
  const xpNeeded = nextLvlXP - currentLvlXP;
  const lvlProgress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  const getEncouragement = () => {
    const s = stats?.streak ?? 0;
    if (s === 0) return 'Začni první lekci a nastartuj plamen vědomostí!';
    if (s < 3)  return 'Skvělý začátek! Udržuj plamen i zítra.';
    if (s < 7)  return 'Skvělá série! Italština se každým dnem zlepšuje.';
    return 'Fantazie! Jsi nezastavitelný italský mistr!';
  };

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
              Úroveň {currentLvl}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.2px' }}>
              Italský student
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {getEncouragement()}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard
            icon={<Flame size={22} style={{ color: 'var(--orange)', fill: 'var(--orange)' }} />}
            iconBg="var(--orange-50)"
            label="Série dní"
            value={stats?.streak ?? 0}
          />
          <StatCard
            icon={<Zap size={22} style={{ color: 'var(--sky)', fill: 'var(--sky)' }} />}
            iconBg="var(--sky-50)"
            label="XP celkem"
            value={stats?.xp ?? 0}
          />
          <StatCard
            icon={<Trophy size={22} style={{ color: 'var(--yellow)', fill: 'var(--yellow)' }} />}
            iconBg="var(--yellow-50)"
            label="Level"
            value={stats?.level ?? 1}
          />
          <StatCard
            icon={<Star size={22} style={{ color: 'var(--green-500)', fill: 'var(--green-500)' }} />}
            iconBg="var(--green-50)"
            label="Naučeno slov"
            value={stats?.words_mastered ?? 0}
          />
        </div>

        {/* Level progress */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              Pokrok k úrovni {currentLvl + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-500)' }}>
              {stats?.xp} / {nextLvlXP} XP
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: 10, marginBottom: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${lvlProgress}%` }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
            Chybí ti {nextLvlXP - (stats?.xp ?? 0)} XP do dalšího levelu
          </p>
        </div>

        {/* Vocabulary state */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Layers size={18} style={{ color: 'var(--text-2)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Stav slovní zásoby</h3>
          </div>

          {[
            {
              label: 'Zvládnutá',
              count: stats?.words_mastered ?? 0,
              total: stats?.words_total ?? 1,
              color: 'var(--green-500)',
            },
            {
              label: 'Učím se',
              count: stats?.words_learning ?? 0,
              total: stats?.words_total ?? 1,
              color: 'var(--sky)',
            },
            {
              label: 'Nezapočatá',
              count: (stats?.words_total ?? 0) - (stats?.words_mastered ?? 0) - (stats?.words_learning ?? 0),
              total: stats?.words_total ?? 1,
              color: 'var(--border-2)',
            },
          ].map(({ label, count, total, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {count} / {total}
                </span>
              </div>
              <div className="progress-bar-container" style={{ height: 7 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`, background: color }}
                />
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 4, padding: '10px 14px',
            backgroundColor: 'var(--surface-2)', borderRadius: 10,
            fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6,
          }}>
            Leitnerův systém: čím více správných odpovědí, tím výše se slovo posouvá. Box 5 = zvládnuto, opakování za 14 dní.
          </div>
        </div>

        {/* Accuracy */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Target size={18} style={{ color: 'var(--text-2)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Analytika</h3>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            backgroundColor: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px',
            marginBottom: 16,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--indigo-50), var(--green-50))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--indigo-600)' }}>
                {stats?.accuracy ?? 0}%
              </span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Průměrná přesnost</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Celková úspěšnost napříč všemi slovy
              </p>
            </div>
          </div>

          {stats?.difficult_words && stats.difficult_words.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AlertTriangle size={14} style={{ color: 'var(--orange)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Nejtěžší slovíčka</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.difficult_words.map((w, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: 'var(--wrong-bg)',
                    borderRadius: 10, border: '1px solid var(--wrong-border)',
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{w.italian}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.czech}</p>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: 'var(--wrong-fg)',
                      backgroundColor: 'var(--wrong-bg)',
                      padding: '3px 8px', borderRadius: 8,
                      border: '1px solid var(--wrong-border)',
                    }}>
                      {w.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.05 }}>
            <BellRing size={72} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <BellRing size={18} style={{ color: 'var(--text-2)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Připomínky</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
            Přidej aplikaci na plochu telefonu jako PWA a povol notifikace pro denní připomínky.
          </p>
          <button
            className="btn btn-primary"
            style={{ fontSize: 14 }}
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then(perm => {
                  if (perm === 'granted') alert('Super! Na iOS notifikace vyžadují přidání na plochu (Sdílet → Přidat na plochu).');
                });
              } else {
                alert('Tvůj prohlížeč nepodporuje notifikace.');
              }
            }}
          >
            <BellRing size={16} /> Povolit upozornění
          </button>
        </div>

      </div>
    </div>
  );
};
