import React, { useEffect, useState } from 'react';
import { Search, Volume2, X, Star, HelpCircle } from 'lucide-react';
import { speakItalian } from '../utils/audio';

interface Word {
  id: number;
  italian: string;
  czech: string;
  category: string;
  difficulty: string;
  pronunciation: string;
  example_it: string;
  example_cz: string;
  box: number;
  attempts: number;
  correct_count: number;
}

const BoxBadge: React.FC<{ box: number }> = ({ box }) => {
  if (box === 5) return (
    <span className="badge badge-green">
      <Star size={10} style={{ fill: 'currentColor' }} /> Zvládnuto
    </span>
  );
  if (box === 0) return (
    <span className="badge badge-neutral">Nezapočato</span>
  );
  return (
    <span className="badge badge-sky">Box {box}</span>
  );
};

export const Dictionary: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unstarted' | 'learning' | 'mastered'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWordDetail, setSelectedWordDetail] = useState<Word | null>(null);

  useEffect(() => {
    fetch('/api/dictionary')
      .then(r => r.json())
      .then(setWords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categoriesList = ['all', ...Array.from(new Set(words.map(w => w.category))).sort()];

  const filteredWords = words.filter(word => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      word.italian.toLowerCase().includes(q) ||
      word.czech.toLowerCase().includes(q) ||
      word.pronunciation.toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'all' || word.category === selectedCategory;
    const matchesStatus =
      selectedFilter === 'all' ? true :
      selectedFilter === 'unstarted' ? word.box === 0 :
      selectedFilter === 'learning'  ? word.box > 0 && word.box < 5 :
      word.box === 5;
    return matchesSearch && matchesCat && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--green-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>Načítám slovník…</p>
      </div>
    );
  }

  const FILTERS = [
    { id: 'all',       label: 'Vše' },
    { id: 'unstarted', label: 'Nová' },
    { id: 'learning',  label: 'Učím se' },
    { id: 'mastered',  label: 'Zvládnutá' },
  ] as const;

  return (
    <div className="screen-container" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sticky search + filters ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px 10px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Hledat italsky nebo česky…"
            className="input"
            style={{ paddingLeft: 40, fontSize: 14 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                border: 'none',
                fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: selectedFilter === f.id ? 'var(--green-500)' : 'var(--surface-2)',
                color: selectedFilter === f.id ? '#fff' : 'var(--text-2)',
                fontFamily: 'var(--font)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: 99,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--text)' : 'var(--border)',
                fontSize: 11, fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: selectedCategory === cat ? 'var(--text)' : 'var(--surface)',
                color: selectedCategory === cat ? 'var(--surface)' : 'var(--text-2)',
                fontFamily: 'var(--font)',
              }}
            >
              {cat === 'all' ? 'Vše' : cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
          {filteredWords.length} výsledků
        </p>
      </div>

      {/* ── Word list ── */}
      <div style={{ flex: 1, padding: '12px 16px 96px', overflowY: 'auto' }}>
        {filteredWords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <HelpCircle size={44} style={{ color: 'var(--border-2)', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>Nic nenalezeno</h4>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Zkuste jiný výraz nebo filtr.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredWords.map(word => (
              <div
                key={word.id}
                onClick={() => setSelectedWordDetail(word)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '13px 16px',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  boxShadow: 'var(--shadow-sm)',
                  gap: 12,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Word info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {word.italian}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
                      [{word.difficulty}]
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {word.czech}
                  </p>
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <BoxBadge box={word.box} />
                  <button
                    onClick={e => { e.stopPropagation(); speakItalian(word.italian); }}
                    style={{
                      width: 34, height: 34, borderRadius: 10,
                      backgroundColor: 'var(--sky-50)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--sky)', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Word detail modal ── */}
      {selectedWordDetail && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'flex-end',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSelectedWordDetail(null)}
        >
          <div
            className="animate-pop"
            style={{
              width: '100%',
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '8px 24px 36px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 99, backgroundColor: 'var(--border-2)', margin: '12px auto 20px' }} />

            {/* Close */}
            <button
              onClick={() => setSelectedWordDetail(null)}
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

            {/* Italian word + speak */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                {selectedWordDetail.italian}
              </h3>
              <button
                onClick={() => speakItalian(selectedWordDetail.italian)}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: 'var(--sky-50)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--sky)', transition: 'all 0.12s',
                }}
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Pronunciation + category */}
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
              [{selectedWordDetail.pronunciation}]
            </p>
            <div style={{ marginBottom: 20 }}>
              <BoxBadge box={selectedWordDetail.box} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>
                {selectedWordDetail.category}
              </span>
            </div>

            {/* Translation */}
            <div style={{
              backgroundColor: 'var(--surface-2)', borderRadius: 14,
              padding: '14px 16px', marginBottom: 12,
            }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Překlad</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                {selectedWordDetail.czech}
              </p>
            </div>

            {/* Example */}
            <div style={{
              backgroundColor: 'var(--sky-50)', borderRadius: 14,
              padding: '14px 16px', marginBottom: 20,
              border: '1px solid rgba(14,165,233,0.15)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div className="section-label" style={{ color: 'var(--sky)', marginBottom: 6 }}>Příklad</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {selectedWordDetail.example_it}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>
                  {selectedWordDetail.example_cz}
                </p>
              </div>
              <button
                onClick={() => speakItalian(selectedWordDetail.example_it)}
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  backgroundColor: 'rgba(14,165,233,0.12)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--sky)',
                }}
              >
                <Volume2 size={16} />
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Zobrazení', value: `${selectedWordDetail.attempts}×` },
                { label: 'Úspěšnost', value: selectedWordDetail.attempts > 0 ? `${Math.round((selectedWordDetail.correct_count / selectedWordDetail.attempts) * 100)}%` : '0%' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  backgroundColor: 'var(--surface-2)', borderRadius: 12, padding: '12px',
                  textAlign: 'center',
                }}>
                  <div className="section-label" style={{ marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-outline"
              onClick={() => setSelectedWordDetail(null)}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
