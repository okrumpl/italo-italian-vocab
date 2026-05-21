import React, { useEffect, useState } from 'react';
import { X, Volume2, CheckCircle2, AlertCircle, Keyboard, Zap, Flame, Trophy, RotateCcw } from 'lucide-react';
import { Mascot, MascotState } from './Mascot';
import { playSound, speakItalian, shuffle } from '../utils/audio';
import { apiFetch } from '../utils/api';

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
  is_review: number;
}

interface LessonProps {
  category: string | null;
  lessonSize?: number;
  onClose: () => void;
}

type QuestionType = 'flashcard' | 'multiple-choice-it-to-cz' | 'multiple-choice-cz-to-it' | 'typing' | 'fill-in-the-blank' | 'matching';

interface Exercise {
  word: Word;
  type: QuestionType;
  options?: string[];
  targetSentence?: string;
  targetSentenceTranslation?: string;
  matchingItWords?: string[];   // pre-computed, stabilní — nesmí se re-generovat
  matchingCzWords?: string[];   // pre-computed, stabilní
  matchingPairs?: Array<{ italian: string; czech: string }>; // mapování pro vyhodnocení
}

interface ResultsData {
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  newStreak: number;
  newStats: Record<string, number>;
  results: Array<{ wordId: number; newBox: number }>;
}

export const Lesson: React.FC<LessonProps> = ({ category, lessonSize = 10, onClose }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');

  const [selectedItWord, setSelectedItWord] = useState<string | null>(null);
  const [selectedCzWord, setSelectedCzWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('idle');

  const [failedWordIds, setFailedWordIds] = useState<Set<number>>(new Set());
  const [scoreCorrect, setScoreCorrect] = useState(0);
  const [scoreWrong, setScoreWrong] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [completed, setCompleted] = useState(false);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; color: string; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const url = category
          ? `/api/lesson/${encodeURIComponent(category)}?size=${lessonSize}`
          : '/api/lesson-quick';
        const data = await apiFetch(url);
        if (!data) throw new Error('Nepodařilo se stáhnout slova lekce.');
        setWords(data);
        generateExercises(data);
      } catch (error) {
        console.error(error);
        setFetchError('Nepodařilo se načíst lekci. Zkontroluj připojení.');
      }
    };
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    fetchWords();
  }, [category]);

  const generateExercises = (loadedWords: Word[]) => {
    const generated: Exercise[] = [];
    const allItWords = loadedWords.map(w => w.italian);
    const allCzWords = loadedWords.map(w => w.czech);

    loadedWords.forEach(word => {
      // Flashcard jen pro nová slova v kategoriálních lekcích
      if (word.attempts === 0 && category) {
        generated.push({ word, type: 'flashcard' });
      }

      const rand = Math.random();
      const hasExample = word.example_it && word.example_it.trim().length > 3;
      // Fill-in-the-blank POUZE pro slova která uživatel už zná (box >= 2)
      const canFillBlank = hasExample && (word.box ?? 0) >= 2;

      if (rand < 0.3) {
        generated.push({ word, type: 'multiple-choice-it-to-cz', options: getRandomOptions(word.czech, allCzWords) });
      } else if (rand < 0.6) {
        generated.push({ word, type: 'multiple-choice-cz-to-it', options: getRandomOptions(word.italian, allItWords) });
      } else if (rand < 0.85 || !canFillBlank) {
        generated.push({ word, type: 'typing' });
      } else {
        const sentence = word.example_it;
        if (!sentence.toLowerCase().includes(word.italian.toLowerCase())) {
          generated.push({ word, type: 'typing' });
        } else {
          generated.push({
            word, type: 'fill-in-the-blank',
            options: getRandomOptions(word.italian, allItWords),
            targetSentence: sentence,
            targetSentenceTranslation: word.example_cz,
          });
        }
      }
    });

    // Matching cvičení — slova se vyberou JEDNOU při generování a uloží do exercise objektu
    // (nikdy ne při renderu, jinak by se přemíchávala při každém kliknutí)
    if (loadedWords.length >= 4) {
      const mid = Math.floor(generated.length / 2);
      const matchingWord = shuffle(loadedWords)[0];
      const limit = Math.min(loadedWords.length, 5);
      const picked = shuffle([...loadedWords]).slice(0, limit);
      const matchingItWords = [...picked].map(w => w.italian).sort();
      const matchingCzWords = [...picked].map(w => w.czech).sort();
      const matchingPairs = picked.map(w => ({ italian: w.italian, czech: w.czech }));
      generated.splice(mid, 0, {
        word: matchingWord,
        type: 'matching',
        matchingItWords,
        matchingCzWords,
        matchingPairs,
      });
    }

    setExercises(generated);
    if (generated.length > 0 && generated[0].type === 'flashcard') {
      setTimeout(() => speakItalian(generated[0].word.italian), 500);
    }
  };

  const getRandomOptions = (correctVal: string, allVals: string[]) => {
    const opts = shuffle(allVals.filter(v => v !== correctVal)).slice(0, 3);
    opts.push(correctVal);
    return shuffle(opts);
  };

  const currentExercise = exercises[currentIdx];

  const handleSpeak = () => {
    if (!currentExercise) return;
    speakItalian(currentExercise.type === 'fill-in-the-blank'
      ? currentExercise.targetSentence || ''
      : currentExercise.word.italian);
  };

  const handleInsertChar = (char: string) => setTypedAnswer(prev => prev + char);

  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')                   // odstraní diakritiku
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')               // odstraní apostrofy
      .replace(/[^a-zA-Z0-9 ]/g, '')      // odstraní interpunkci
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');              // vícenásobné mezery
  };

  const handleCheck = () => {
    if (checked) return;
    let correct = false;
    if (currentExercise.type === 'flashcard') {
      correct = true;
    } else if (currentExercise.type === 'multiple-choice-it-to-cz') {
      correct = selectedOption === currentExercise.word.czech;
    } else if (currentExercise.type === 'multiple-choice-cz-to-it') {
      correct = selectedOption === currentExercise.word.italian;
    } else if (currentExercise.type === 'typing') {
      correct = normalizeString(typedAnswer) === normalizeString(currentExercise.word.italian);
    } else if (currentExercise.type === 'fill-in-the-blank') {
      correct = selectedOption === currentExercise.word.italian;
    } else if (currentExercise.type === 'matching') {
      correct = matchedPairs.length === (currentExercise.matchingPairs?.length || 5);
    }

    setIsCorrect(correct);
    setChecked(true);
    if (correct) {
      setMascotState('happy');
      playSound('correct');
      if (currentExercise.type !== 'flashcard') setScoreCorrect(p => p + 1);
      // Haptic feedback — krátká vibrace
      if ('vibrate' in navigator) navigator.vibrate(40);
    } else {
      setMascotState('sad');
      playSound('incorrect');
      setScoreWrong(p => p + 1);
      setFailedWordIds(prev => { const n = new Set(prev); n.add(currentExercise.word.id); return n; });
      setWrongWords(prev => {
        if (prev.find(w => w.id === currentExercise.word.id)) return prev;
        return [...prev, currentExercise.word];
      });
      // Haptic feedback — dvojitá vibrace pro chybu
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    }
    if (currentExercise.type !== 'flashcard' && currentExercise.type !== 'matching') handleSpeak();
  };

  const handleMatchingClick = (val: string, lang: 'it' | 'cz') => {
    if (checked) return;
    if (lang === 'it') {
      setSelectedItWord(val);
      if (selectedCzWord) checkMatchingPair(val, selectedCzWord);
    } else {
      setSelectedCzWord(val);
      if (selectedItWord) checkMatchingPair(selectedItWord, val);
    }
  };

  const checkMatchingPair = (itVal: string, czVal: string) => {
    if (checked) return;
    const pairs = exercises[currentIdx]?.matchingPairs ?? [];
    const totalPairs = pairs.length || 5;
    const isPair = pairs.length > 0
      ? pairs.some(p => p.italian === itVal && p.czech === czVal)
      : words.some(w => w.italian === itVal && w.czech === czVal);
      
    if (isPair) {
      const newMatched = [...matchedPairs, itVal];
      setMatchedPairs(newMatched);
      setSelectedItWord(null); setSelectedCzWord(null);
      playSound('match-correct');
      if (newMatched.length === totalPairs) {
        setIsCorrect(true); setChecked(true); setMascotState('happy'); playSound('correct');
      }
    } else {
      playSound('match-incorrect');
      if ('vibrate' in navigator) navigator.vibrate(40);
      setTimeout(() => {
        setSelectedItWord(null); setSelectedCzWord(null);
      }, 500);
    }
  };

  const handleContinue = () => {
    if (!isCorrect && currentExercise.type !== 'flashcard') {
      setExercises(prev => [...prev, currentExercise]);
    }
    setSelectedOption(null);
    setTypedAnswer('');
    setSelectedItWord(null); setSelectedCzWord(null); setMatchedPairs([]);
    setChecked(false); setIsCorrect(false); setMascotState('idle');

    if (currentIdx + 1 < exercises.length) {
      setCurrentIdx(currentIdx + 1);
      const next = exercises[currentIdx + 1];
      if (next?.type === 'flashcard') setTimeout(() => speakItalian(next.word.italian), 300);
    } else {
      submitLessonResults();
    }
  };

  const submitLessonResults = async () => {
    setSaving(true);
    try {
      const answersToSubmit = words.map(w => ({ wordId: w.id, isCorrect: !failedWordIds.has(w.id) }));
      const data = await apiFetch('/api/lesson/complete', {
        method: 'POST',
        body: JSON.stringify({
          category,
          answers: answersToSubmit
        }),
      });
      setResultsData(data); setCompleted(true); setMascotState('excited');
      playSound('complete'); triggerConfetti();
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání výsledků.');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const triggerConfetti = () => {
    const colors = ['#22c55e', '#6366f1', '#f97316', '#ef4444', '#eab308', '#0ea5e9'];
    setConfetti(Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2.5}s`,
        width: `${Math.random() * 8 + 5}px`,
        height: `${Math.random() * 8 + 5}px`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      },
    })));
  };

  const progressPercent = exercises.length > 0 ? Math.round((currentIdx / exercises.length) * 100) : 0;

  const isAnswerEntered = () => {
    if (currentExercise.type === 'flashcard') return true;
    if (currentExercise.type === 'multiple-choice-it-to-cz' || currentExercise.type === 'multiple-choice-cz-to-it') return selectedOption !== null;
    if (currentExercise.type === 'typing') return typedAnswer.trim() !== '';
    if (currentExercise.type === 'fill-in-the-blank') return selectedOption !== null;
    if (currentExercise.type === 'matching') return matchedPairs.length === (currentExercise.matchingPairs?.length || 5);
    return false;
  };

  // ─── Exercise renderers ───────────────────────────────────────────────────

  const renderExerciseContent = () => {
    if (!currentExercise) return null;

    switch (currentExercise.type) {

      case 'flashcard':
        return (
          <div className="animate-pop" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'space-between', flex: 1, paddingTop: 8, paddingBottom: 8,
            minHeight: '56vh', textAlign: 'center',
          }}>
            {/* Top: word card */}
            <div style={{ width: '100%' }}>
              <p className="section-label" style={{ marginBottom: 14, color: 'var(--green-500)' }}>
                Nové slovíčko!
              </p>
              <div style={{
                backgroundColor: 'var(--surface-2)', borderRadius: 20,
                padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                border: '1px solid var(--border)',
              }}>
                <button
                  onClick={handleSpeak}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    backgroundColor: 'var(--sky-50)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--sky)', marginBottom: 16, transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Volume2 size={24} />
                </button>
                <h2 style={{ fontSize: 34, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  {currentExercise.word.italian}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                  [{currentExercise.word.pronunciation}]
                </p>
                <div style={{ width: 40, height: 2, backgroundColor: 'var(--border)', borderRadius: 99, marginBottom: 16 }} />
                <h3 style={{ fontSize: 26, fontWeight: 700, color: 'var(--green-500)' }}>
                  {currentExercise.word.czech}
                </h3>
              </div>
            </div>

            {/* Middle: mascot */}
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <Mascot state="happy" size={110} />
            </div>

            {/* Bottom: example */}
            <div style={{
              width: '100%', backgroundColor: 'var(--sky-50)',
              border: '1px solid rgba(14,165,233,0.15)',
              borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <p className="section-label" style={{ color: 'var(--sky)', marginBottom: 6 }}>Příklad</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {currentExercise.word.example_it}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>
                  {currentExercise.word.example_cz}
                </p>
              </div>
              <button
                onClick={() => speakItalian(currentExercise.word.example_it)}
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  backgroundColor: 'rgba(14,165,233,0.12)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sky)',
                }}
              >
                <Volume2 size={15} />
              </button>
            </div>
          </div>
        );

      case 'multiple-choice-it-to-cz':
        return (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button
                onClick={handleSpeak}
                style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  backgroundColor: 'var(--sky-50)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sky)',
                }}
              >
                <Volume2 size={22} />
              </button>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                Co znamená{' '}
                <span style={{ color: 'var(--sky)', fontWeight: 800 }}>
                  {currentExercise.word.italian}
                </span>?
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentExercise.options?.map(option => {
                const sel = selectedOption === option;
                let cls = 'card-option';
                if (checked) {
                  if (option === currentExercise.word.czech) cls += ' correct';
                  else if (sel) cls += ' incorrect';
                } else if (sel) cls += ' selected';
                return (
                  <button key={option} disabled={checked} onClick={() => setSelectedOption(option)} className={cls}>
                    <span style={{ flex: 1 }}>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'multiple-choice-cz-to-it':
        return (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 8 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Přelož do italštiny</p>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.3px' }}>
              „{currentExercise.word.czech}"
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentExercise.options?.map(option => {
                const sel = selectedOption === option;
                let cls = 'card-option';
                if (checked) {
                  if (option === currentExercise.word.italian) cls += ' correct';
                  else if (sel) cls += ' incorrect';
                } else if (sel) cls += ' selected';
                return (
                  <button key={option} disabled={checked} onClick={() => setSelectedOption(option)} className={cls}>
                    <span style={{ flex: 1 }}>{option}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>
                      [{currentExercise.word.category}]
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'typing':
        return (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 8 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Napiš italsky</p>
            <div style={{
              backgroundColor: 'var(--green-50)', border: '1px solid var(--green-100)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 20,
            }}>
              <p className="section-label" style={{ color: 'var(--green-600)', marginBottom: 4 }}>Česky</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {currentExercise.word.czech}
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                rows={2}
                disabled={checked}
                value={typedAnswer}
                onChange={e => setTypedAnswer(e.target.value)}
                placeholder="Napiš překlad sem…"
                className="input"
                style={{ fontSize: 22, fontWeight: 700, padding: '16px 48px 16px 16px', resize: 'none', lineHeight: 1.4 }}
              />
              <Keyboard style={{ position: 'absolute', right: 14, top: 16, color: 'var(--text-3)' }} size={20} />
            </div>
            {!checked && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                {['à', 'è', 'é', 'ì', 'ò', 'ù'].map(char => (
                  <button
                    key={char}
                    onClick={() => handleInsertChar(char)}
                    style={{
                      width: 42, height: 42, borderRadius: 10,
                      backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)',
                      fontSize: 16, fontWeight: 700, color: 'var(--text)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font)',
                    }}
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'fill-in-the-blank': {
        const sentence = currentExercise.targetSentence || '';
        const targetWord = currentExercise.word.italian;
        // Nahradíme cílové slovo (case-insensitive) za podtržítka
        const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
        const blankedSentence = sentence.replace(regex, '_________');

        return (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button
                onClick={handleSpeak}
                style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  backgroundColor: 'var(--sky-50)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sky)',
                }}
              >
                <Volume2 size={22} />
              </button>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
                Doplň slovo:
              </h3>
            </div>
            
            <div style={{
              backgroundColor: 'var(--surface-2)', padding: '20px 16px', borderRadius: 16,
              marginBottom: 12, border: '1px solid var(--border)', textAlign: 'center'
            }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4 }}>
                {blankedSentence}
              </p>
              <p style={{ fontSize: 15, color: 'var(--text-2)', fontStyle: 'italic' }}>
                „{currentExercise.targetSentenceTranslation}"
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              {currentExercise.options?.map(option => {
                const sel = selectedOption === option;
                let cls = 'card-option';
                if (checked) {
                  if (option === currentExercise.word.italian) cls += ' correct';
                  else if (sel) cls += ' incorrect';
                } else if (sel) cls += ' selected';

                return (
                  <button
                    key={`opt-${option}`}
                    disabled={checked}
                    onClick={() => setSelectedOption(option)}
                    className={cls}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'matching': {
        // Čte předpočítaná slova z exercise objektu — NE shuffle při renderu
        const itWords = currentExercise.matchingItWords ?? [];
        const czWords = currentExercise.matchingCzWords ?? [];
        // pairs: pro zjištění stavu "matched" v české kolumně
        const exPairs = currentExercise.matchingPairs ?? [];

        return (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Přiřaď dvojice</p>
            {/* Dvojsloupcová mřížka — vyplní celý dostupný prostor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
              {/* Italian column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {itWords.map(word => {
                  const matched = matchedPairs.includes(word);
                  const selected = selectedItWord === word;
                  return (
                    <button
                      key={`it-${word}`}
                      disabled={checked || matched}
                      onClick={() => handleMatchingClick(word, 'it')}
                      className={`card-option${matched ? ' correct' : selected ? ' selected' : ''}`}
                      style={{
                        flex: 1,
                        fontSize: 17, fontWeight: 700,
                        padding: '0 12px',
                        opacity: matched ? 0.3 : 1,
                        cursor: matched ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', lineHeight: 1.2,
                        minHeight: 64,
                        transition: 'all 0.15s',
                        transform: selected ? 'scale(0.96)' : 'scale(1)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
              {/* Czech column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {czWords.map(word => {
                  const itEquiv = exPairs.find(p => p.czech === word)?.italian ?? '';
                  const matched = itEquiv ? matchedPairs.includes(itEquiv) : false;
                  const selected = selectedCzWord === word;
                  return (
                    <button
                      key={`cz-${word}`}
                      disabled={checked || matched}
                      onClick={() => handleMatchingClick(word, 'cz')}
                      className={`card-option${matched ? ' correct' : selected ? ' selected' : ''}`}
                      style={{
                        flex: 1,
                        fontSize: 17, fontWeight: 700,
                        padding: '0 12px',
                        opacity: matched ? 0.3 : 1,
                        cursor: matched ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', lineHeight: 1.2,
                        minHeight: 64,
                        transition: 'all 0.15s',
                        transform: selected ? 'scale(0.96)' : 'scale(1)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ─── Completion screen ────────────────────────────────────────────────────

  if (completed && resultsData) {
    const accuracy = scoreCorrect + scoreWrong > 0
      ? Math.round((scoreCorrect / (scoreCorrect + scoreWrong)) * 100)
      : 100;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
        height: '100dvh', backgroundColor: 'var(--bg)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Confetti */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
          {confetti.map(c => <div key={c.id} className="confetti" style={c.style} />)}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', padding: '24px 24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
          <Mascot state="excited" size={130} />

          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginTop: 16, marginBottom: 6, letterSpacing: '-0.5px', textAlign: 'center' }}>
            {accuracy >= 80 ? 'Skvělá práce! 🎉' : accuracy >= 50 ? 'Dobrá práce!' : 'Pokračuj dál!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20, textAlign: 'center' }}>
            {category ? `Lekce „${category}"` : 'Bleskový kvíz'} dokončena.
          </p>

          {/* Score + XP + Streak */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%', maxWidth: 360, marginBottom: 14 }}>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Přesnost</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: accuracy >= 70 ? 'var(--green-500)' : 'var(--orange)' }}>{accuracy}%</span>
            </div>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'var(--sky-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} style={{ color: 'var(--sky)', fill: 'var(--sky)' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>XP</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>+{resultsData.xpEarned}</span>
            </div>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'var(--orange-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={18} style={{ color: 'var(--orange)', fill: 'var(--orange)' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Série</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{resultsData.newStreak}d</span>
            </div>
          </div>

          {resultsData.leveledUp && (
            <div style={{ width: '100%', maxWidth: 360, padding: '12px 16px', backgroundColor: 'var(--yellow-50)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', marginBottom: 14 }}>
              <Trophy size={26} style={{ color: 'var(--yellow)', fill: 'var(--yellow)', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Nový level {resultsData.newLevel}! 🎉</h4>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Gratulujeme k postupu!</p>
              </div>
            </div>
          )}

          {/* Přehled špatných slov */}
          {wrongWords.length > 0 && (
            <div style={{ width: '100%', maxWidth: 360, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={15} style={{ color: 'var(--orange)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chybná slova ({wrongWords.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {wrongWords.map(w => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--wrong-bg)', borderRadius: 10, border: '1px solid var(--wrong-border)' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{w.italian}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.czech}</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--wrong-fg)', fontWeight: 700 }}>❌</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Akční tlačítka */}
        <div style={{ width: '100%', padding: '12px 24px 36px', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 20, backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          {wrongWords.length > 0 && (
            <button
              className="btn btn-orange"
              style={{ fontSize: 14 }}
              onClick={() => {
                // Spustit mini lekci jen s chybovými slovy
                setWrongWords([]);
                setFailedWordIds(new Set());
                setScoreCorrect(0);
                setScoreWrong(0);
                setCompleted(false);
                setResultsData(null);
                setCurrentIdx(0);
                setChecked(false);
                setIsCorrect(false);
                setMascotState('idle');
                // Generujeme nová cvičení jen z chybných slov
                const errWords = words.filter(w => failedWordIds.has(w.id));
                if (errWords.length > 0) generateExercises(errWords);
              }}
            >
              <RotateCcw size={16} /> Opakovat chyby ({wrongWords.length})
            </button>
          )}
          <button className="btn btn-primary" style={{ fontSize: 15, zIndex: 20 }} onClick={onClose}>
            Hotovo
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
        <Mascot state="sad" size={110} />
        <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 700, color: 'var(--wrong-fg)' }}>Chyba načítání</h3>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>{fetchError}</p>
        <button onClick={onClose} className="btn btn-primary" style={{ maxWidth: 260 }}>
          Zpět na hlavní stránku
        </button>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '100dvh' }}>
        <Mascot state="idle" size={110} />
        <p style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: 'var(--text-3)' }}>
          Sestavuji lekci…
        </p>
      </div>
    );
  }

  // ─── Main lesson UI ───────────────────────────────────────────────────────

  const footerBg = checked
    ? isCorrect ? 'var(--correct-bg)' : 'var(--wrong-bg)'
    : 'var(--surface)';
  const footerBorder = checked
    ? isCorrect ? 'var(--correct-border)' : 'var(--wrong-border)'
    : 'var(--border)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      backgroundColor: 'var(--surface)', overflow: 'hidden',
    }}>

      {/* Header — s iOS safe area paddingem */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'max(16px, env(safe-area-inset-top)) 16px 10px',
        paddingRight: 16,
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* X tlačítko — větší touch target pro mobil */}
        <button
          onClick={() => {
            if (confirm('Opravdu chcete odejít? Ztratíte pokrok v této lekci.')) onClose();
          }}
          style={{
            width: 44, height: 44, borderRadius: 12, border: 'none',
            backgroundColor: 'var(--surface-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', flexShrink: 0, transition: 'background 0.1s',
            // Větší prostor pro prst
            touchAction: 'manipulation',
          }}
        >
          <X size={20} />
        </button>
        <div className="progress-bar-container" style={{ flex: 1, height: 8, minWidth: 0 }}>
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        {/* Score counter ✓/✗ + počítadlo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {scoreCorrect > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--correct-fg)' }}>✓{scoreCorrect}</span>
          )}
          {scoreWrong > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--wrong-fg)' }}>✗{scoreWrong}</span>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', minWidth: 36, textAlign: 'right' }}>
            {currentIdx + 1}/{exercises.length}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 8px', display: 'flex', flexDirection: 'column' }}>

        {/* Kompaktní instrukce — bez maskota, šetří místo */}
        {currentExercise.type !== 'matching' && currentExercise.type !== 'flashcard' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 14,
          }}>
            <Mascot state={mascotState} size={38} className="flex-shrink-0" />
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-3)',
              lineHeight: 1.3,
            }}>
              {currentExercise.type === 'typing' && 'Přelož toto české slovo do italštiny.'}
              {currentExercise.type === 'multiple-choice-it-to-cz' && 'Vyber správný český překlad.'}
              {currentExercise.type === 'multiple-choice-cz-to-it' && 'Vyber správný italský překlad.'}
              {currentExercise.type === 'fill-in-the-blank' && 'Doplň chybějící slovo.'}
            </span>
          </div>
        )}

        {renderExerciseContent()}
      </main>

      {/* Footer feedback + action button */}
      <footer style={{
        padding: '16px 20px 28px',
        borderTop: `1px solid ${footerBorder}`,
        backgroundColor: footerBg,
        transition: 'background-color 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Feedback message */}
          {checked && (
            <div className="animate-pop" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {isCorrect ? (
                <>
                  <CheckCircle2 size={24} style={{ color: 'var(--correct-fg)', fill: 'var(--correct-fg)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--correct-fg)' }}>
                      {currentExercise.type === 'flashcard' ? 'Nové slovíčko!' : 'Správně!'}
                    </p>
                    {currentExercise.type === 'flashcard' && (
                      <p style={{ fontSize: 12, color: 'var(--correct-fg)', opacity: 0.8, marginTop: 2 }}>
                        Slovo bylo přidáno do Leitnerova seznamu.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={24} style={{ color: 'var(--wrong-fg)', fill: 'var(--wrong-fg)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--wrong-fg)' }}>
                      Správná odpověď:
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--wrong-fg)', textDecoration: 'underline', marginTop: 2 }}>
                      {currentExercise.type === 'multiple-choice-it-to-cz'
                        ? currentExercise.word.czech
                        : currentExercise.word.italian}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            disabled={!isAnswerEntered() || saving}
            onClick={checked ? handleContinue : handleCheck}
            className={`btn btn-${checked && !isCorrect ? 'orange' : 'primary'}`}
            style={{ fontSize: 15 }}
          >
            {saving ? 'Ukládám…' : checked ? 'Pokračovat' : 'Zkontrolovat'}
          </button>
        </div>
      </footer>
    </div>
  );
};
