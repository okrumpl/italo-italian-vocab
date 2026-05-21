import React, { useEffect, useState } from 'react';

export type MascotState = 'idle' | 'happy' | 'sad' | 'excited';

interface MascotProps {
  state?: MascotState;
  size?: number;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({ state = 'idle', size = 160, className = '' }) => {
  const [blink, setBlink] = useState(false);
  const [wave, setWave] = useState(false);

  useEffect(() => {
    if (state !== 'idle') return;
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3500);
    // Občasné zamávání
    const waveInterval = setInterval(() => {
      setWave(true);
      setTimeout(() => setWave(false), 700);
    }, 6000);
    return () => { clearInterval(blinkInterval); clearInterval(waveInterval); };
  }, [state]);

  const getAnimationClass = () => {
    switch (state) {
      case 'happy':    return 'animate-bounce';
      case 'sad':      return 'animate-shake';
      case 'excited':  return 'animate-bounce';
      default:         return '';
    }
  };

  // Ruka — rotace dle stavu
  const rightArmRotation = state === 'excited' ? -40 : state === 'happy' ? -20 : wave ? -30 : 0;
  const leftArmRotation  = state === 'excited' ? 40  : state === 'sad'   ? 15  : 0;

  return (
    <div
      className={`${getAnimationClass()} ${className}`}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="mSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcd5b0" />
            <stop offset="100%" stopColor="#f5b98e" />
          </linearGradient>
          <linearGradient id="mHat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f0f0" />
          </linearGradient>
          <linearGradient id="mApron" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8f8f8" />
          </linearGradient>
          <filter id="mDrop" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.15)" />
          </filter>
        </defs>

        {/* Stín */}
        <ellipse cx="100" cy="215" rx="55" ry="8" fill="url(#mShadow)" />

        {/* ── TĚLO / ZÁSTĚRA ── */}
        <ellipse cx="100" cy="175" rx="46" ry="40" fill="url(#mApron)" filter="url(#mDrop)" />
        {/* Italské pruhy na zástěře */}
        <ellipse cx="82" cy="175" rx="10" ry="40" fill="#008c45" opacity="0.25" />
        <ellipse cx="118" cy="175" rx="10" ry="40" fill="#cd212a" opacity="0.25" />
        {/* Kravata/šátek */}
        <path d="M 91,147 L 100,158 L 109,147 L 105,140 L 95,140 Z" fill="#cd212a" />
        <path d="M 95,140 L 105,140 L 103,133 L 97,133 Z" fill="#9b1a23" />

        {/* ── LEVÁ RUKA ── */}
        <g transform={`rotate(${leftArmRotation}, 60, 160)`}>
          <ellipse cx="58" cy="162" rx="14" ry="22" fill="url(#mSkin)" transform="rotate(-15, 58, 162)" />
          {/* Ruka/dlaň */}
          <circle cx="50" cy="176" r="10" fill="url(#mSkin)" />
        </g>

        {/* ── PRAVÁ RUKA ── */}
        <g transform={`rotate(${rightArmRotation}, 140, 155)`}>
          <ellipse cx="142" cy="160" rx="14" ry="22" fill="url(#mSkin)" transform="rotate(15, 142, 160)" />
          {/* Ruka/dlaň — při excited drží vařečku */}
          {state === 'excited' ? (
            <>
              <circle cx="150" cy="174" r="10" fill="url(#mSkin)" />
              {/* Vařečka */}
              <line x1="154" y1="168" x2="172" y2="148" stroke="#b87333" strokeWidth="4" strokeLinecap="round" />
              <ellipse cx="173" cy="146" rx="7" ry="5" fill="#d4956a" />
            </>
          ) : (
            <circle cx="150" cy="174" r="10" fill="url(#mSkin)" />
          )}
        </g>

        {/* ── HLAVA ── */}
        <circle cx="100" cy="108" r="58" fill="url(#mSkin)" filter="url(#mDrop)" />

        {/* Uši */}
        <circle cx="46" cy="108" r="14" fill="#f5b98e" />
        <circle cx="154" cy="108" r="14" fill="#f5b98e" />
        <circle cx="46" cy="108" r="8" fill="#e8a07a" />
        <circle cx="154" cy="108" r="8" fill="#e8a07a" />

        {/* ── KUCHAŘSKÁ ČEPICE ── */}
        {/* Tělo čepice */}
        <rect x="62" y="28" width="76" height="52" rx="12" fill="url(#mHat)" filter="url(#mDrop)" />
        {/* Pom-pom nahoře */}
        <circle cx="100" cy="28" r="18" fill="url(#mHat)" filter="url(#mDrop)" />
        <circle cx="100" cy="22" r="12" fill="white" />
        {/* Italský proužek na čepici — trikolóra */}
        <rect x="62" y="74" width="76" height="10" rx="2" fill="white" />
        <rect x="62" y="74" width="25" height="10" rx="2" fill="#008c45" />
        <rect x="113" y="74" width="25" height="10" rx="2" fill="#cd212a" />
        {/* Spodní lem čepice */}
        <rect x="58" y="80" width="84" height="14" rx="7" fill="url(#mHat)" filter="url(#mDrop)" />

        {/* ── OČI ── */}
        {/* Bílé oční kruhy */}
        <circle cx="80" cy="108" r="20" fill="white" />
        <circle cx="120" cy="108" r="20" fill="white" />

        {state === 'idle' && (
          <>
            {blink ? (
              // Mrknutí
              <>
                <path d="M 63,108 Q 80,115 97,108" stroke="#3d2b1f" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M 103,108 Q 120,115 137,108" stroke="#3d2b1f" strokeWidth="5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              // Klidné oči
              <>
                <circle cx="83" cy="108" r="12" fill="#3d2b1f" />
                <circle cx="86" cy="104" r="4" fill="white" />
                <circle cx="123" cy="108" r="12" fill="#3d2b1f" />
                <circle cx="126" cy="104" r="4" fill="white" />
              </>
            )}
          </>
        )}

        {state === 'happy' && (
          // Šťastné obloučky — ^_^
          <>
            <path d="M 63,112 C 68,96 92,96 97,112" stroke="#3d2b1f" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 103,112 C 108,96 132,96 137,112" stroke="#3d2b1f" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Ruměnce */}
            <ellipse cx="60" cy="120" rx="9" ry="5" fill="#ffb3c6" opacity="0.7" />
            <ellipse cx="140" cy="120" rx="9" ry="5" fill="#ffb3c6" opacity="0.7" />
          </>
        )}

        {state === 'sad' && (
          // Smutné dolů zahnuté oči
          <>
            <path d="M 97,104 C 92,118 68,118 63,104" stroke="#64748b" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 137,104 C 132,118 108,118 103,104" stroke="#64748b" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Svislé obočí */}
            <path d="M 64,90 L 80,100" stroke="#8d6e5a" strokeWidth="5" strokeLinecap="round" />
            <path d="M 136,90 L 120,100" stroke="#8d6e5a" strokeWidth="5" strokeLinecap="round" />
            {/* Slza */}
            <ellipse cx="70" cy="126" rx="3" ry="5" fill="#93c5fd" opacity="0.8" />
          </>
        )}

        {state === 'excited' && (
          // Hvězdičky v očích
          <>
            {/* Hvězda levá */}
            <path d="M80,97 L83,106 L93,106 L86,112 L88,121 L80,115 L72,121 L74,112 L67,106 L77,106 Z" fill="#f59e0b" />
            {/* Hvězda pravá */}
            <path d="M120,97 L123,106 L133,106 L126,112 L128,121 L120,115 L112,121 L114,112 L107,106 L117,106 Z" fill="#f59e0b" />
            {/* Ruměnce */}
            <ellipse cx="58" cy="122" rx="10" ry="6" fill="#ffb3c6" opacity="0.8" />
            <ellipse cx="142" cy="122" rx="10" ry="6" fill="#ffb3c6" opacity="0.8" />
          </>
        )}

        {/* ── NOS ── */}
        <ellipse cx="100" cy="120" rx="9" ry="7" fill="#e8a07a" />

        {/* ── KNÍR — ikonický italský knír ── */}
        <path
          d="M 72,133 C 78,128 88,130 100,134 C 112,130 122,128 128,133 C 122,137 112,136 100,134 C 88,136 78,137 72,133 Z"
          fill="#2d1a0e"
        />
        {/* Kudrlinky kníru */}
        <path d="M 72,133 C 66,130 63,127 66,125 C 69,123 72,128 72,133" fill="#2d1a0e" />
        <path d="M 128,133 C 134,130 137,127 134,125 C 131,123 128,128 128,133" fill="#2d1a0e" />

        {/* ── ÚSTA ── */}
        {(state === 'happy' || state === 'excited') && (
          // Velký otevřený úsměv
          <path d="M 83,140 C 88,152 112,152 117,140 C 112,148 88,148 83,140 Z" fill="#7c2d12" />
        )}
        {state === 'idle' && (
          // Spokojený úsměv
          <path d="M 88,140 C 93,147 107,147 112,140" stroke="#7c2d12" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {state === 'sad' && (
          // Smutný oblouk dolů
          <path d="M 112,145 C 107,138 93,138 88,145" stroke="#7c2d12" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}

        {/* Zuby při radosti */}
        {(state === 'happy' || state === 'excited') && (
          <rect x="88" y="140" width="24" height="8" rx="3" fill="white" />
        )}
      </svg>
    </div>
  );
};
