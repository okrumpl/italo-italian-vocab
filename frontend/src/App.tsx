import { useState } from 'react';
import { BookOpen, Search, BarChart2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Dictionary } from './components/Dictionary';
import { Stats } from './components/Stats';
import { Lesson } from './components/Lesson';
import { ProfilePicker } from './components/ProfilePicker';

type ScreenState = 'dashboard' | 'dictionary' | 'stats' | 'lesson';

const NAV_ITEMS = [
  { id: 'dashboard' as ScreenState, label: 'Učení', icon: BookOpen },
  { id: 'dictionary' as ScreenState, label: 'Slovník', icon: Search },
  { id: 'stats' as ScreenState, label: 'Profil', icon: BarChart2 },
];

export default function App() {
  const [userId, setUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem('userId');
    return saved ? parseInt(saved) : null;
  });
  
  const [activeScreen, setActiveScreen] = useState<ScreenState>('dashboard');
  const [statsTargetSection, setStatsTargetSection] = useState<string | null>(null);
  const [lessonCategory, setLessonCategory] = useState<string | null>(null);
  const [lessonSize, setLessonSize] = useState<number>(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectUser = (id: number) => {
    localStorage.setItem('userId', id.toString());
    setUserId(id);
    setActiveScreen('dashboard');
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId(null);
  };

  const handleCloseLesson = () => {
    setActiveScreen('dashboard');
    setLessonCategory(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleStartLesson = (category: string, size = 10) => {
    setLessonCategory(category);
    setLessonSize(size);
    setActiveScreen('lesson');
  };

  const handleStartQuickReview = () => {
    setLessonCategory(null);
    setActiveScreen('lesson');
  };

  const handleNavigateToProfile = (section?: string) => {
    setStatsTargetSection(section || null);
    setActiveScreen('stats');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard 
          onStartLesson={handleStartLesson} 
          onStartQuickReview={handleStartQuickReview} 
          onNavigateToProfile={handleNavigateToProfile}
          refreshKey={refreshKey} 
        />;
      case 'dictionary':
        return <Dictionary />;
      case 'stats':
        return <Stats onLogout={handleLogout} targetSection={statsTargetSection} />;
      case 'lesson':
        return <Lesson category={lessonCategory} lessonSize={lessonSize} onClose={handleCloseLesson} />;
      default:
        return <Dashboard 
          onStartLesson={handleStartLesson} 
          onStartQuickReview={handleStartQuickReview} 
          onNavigateToProfile={handleNavigateToProfile}
          refreshKey={refreshKey} 
        />;
    }
  };

  if (!userId) {
    return <ProfilePicker onSelect={handleSelectUser} />;
  }

  return (
    <div className="w-full flex-1 flex flex-col relative" style={{ height: '100dvh', maxWidth: '100vw', overflowX: 'hidden', overflowY: 'hidden' }}>

      {/* Hlavní obsah */}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {/* Tab bar — skrytý během lekce */}
      {activeScreen !== 'lesson' && (
        <nav
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '72px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 8px',
            zIndex: 40,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setStatsTargetSection(null);
                  setActiveScreen(item.id);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  flex: 1,
                  height: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 4px',
                  borderRadius: '12px',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? 'var(--green-500)' : 'var(--text-3)', transition: 'color 0.2s' }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.1px',
                    color: isActive ? 'var(--green-600)' : 'var(--text-3)', transition: 'color 0.2s'
                  }}
                >
                  {item.label}
                </span>
                {/* Active dot indicator */}
                {isActive && (
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '99px',
                      backgroundColor: 'var(--green-500)',
                      position: 'absolute',
                      bottom: '10px',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
