import React, { useEffect, useState } from 'react';

export type MascotState = 'idle' | 'happy' | 'sad' | 'excited';

interface MascotProps {
  state?: MascotState;
  size?: number;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({ state = 'idle', size = 160, className = '' }) => {
  const [blink, setBlink] = useState(false);

  // Blikání očí každých pár sekund, pokud je maskot v nečinnosti (idle)
  useEffect(() => {
    if (state !== 'idle') return;
    
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, [state]);

  // Vyhodnocení třídy pro animace (např. poskočení při radosti, otřes při smutku)
  const getAnimationClass = () => {
    switch (state) {
      case 'happy':
        return 'animate-bounce';
      case 'sad':
        return 'animate-shake';
      case 'excited':
        return 'animate-bounce';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center transition-all duration-300 ${getAnimationClass()} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Stíny a přechody pro prémiový vzhled */}
          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          
          <linearGradient id="owlBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78e11a" /> {/* Světlá Duo zelená */}
            <stop offset="100%" stopColor="#58cc02" /> {/* Tmavá Duo zelená */}
          </linearGradient>

          <linearGradient id="owlBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f3f3" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Stín pod sovou */}
        <ellipse cx="100" cy="185" rx="60" ry="10" fill="url(#shadow)" />

        {/* Křídlo levé (pozadí) */}
        {state === 'sad' && (
          <path d="M 45,115 C 30,120 25,145 40,155 C 50,160 55,140 45,115 Z" fill="#46a302" />
        )}
        {state !== 'sad' && state !== 'excited' && (
          <path d="M 40,105 C 20,110 20,140 35,150 C 45,155 45,130 40,105 Z" fill="#46a302" />
        )}
        {state === 'excited' && (
          <path d="M 40,110 C 15,90 20,65 35,75 C 45,85 45,100 40,110 Z" fill="#46a302" />
        )}

        {/* Hlavní tělo (Kulatá sova) */}
        <rect x="40" y="45" width="120" height="130" rx="60" fill="url(#owlBody)" />

        {/* Uši / Růžky */}
        <polygon points="40,55 30,30 65,48" fill="#46a302" />
        <polygon points="160,55 170,30 135,48" fill="#46a302" />

        {/* Bříško (bílé) */}
        <path d="M 65,115 C 65,95 135,95 135,115 C 135,145 65,145 65,115 Z" fill="url(#owlBelly)" />
        
        {/* Pírka na bříšku (šipky) */}
        <path d="M 90,112 L 100,118 L 110,112" fill="none" stroke="#e3e3e3" strokeWidth="3" strokeLinecap="round" />
        <path d="M 80,125 L 90,131 L 100,125" fill="none" stroke="#e3e3e3" strokeWidth="3" strokeLinecap="round" />
        <path d="M 100,125 L 110,131 L 120,125" fill="none" stroke="#e3e3e3" strokeWidth="3" strokeLinecap="round" />

        {/* Velké bílé oční kruhy */}
        <circle cx="72" cy="85" r="28" fill="white" />
        <circle cx="128" cy="85" r="28" fill="white" />

        {/* Zornice / oči podle stavu */}
        {state === 'idle' && (
          <>
            {blink ? (
              // Zavřené oči (mrknutí)
              <>
                <path d="M 54,85 Q 72,90 90,85" stroke="#4a4a4a" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M 110,85 Q 128,90 146,85" stroke="#4a4a4a" strokeWidth="5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              // Normální zornice s odleskem
              <>
                <circle cx="76" cy="85" r="14" fill="#1e293b" />
                <circle cx="79" cy="81" r="5" fill="white" />
                
                <circle cx="124" cy="85" r="14" fill="#1e293b" />
                <circle cx="121" cy="81" r="5" fill="white" />
              </>
            )}
          </>
        )}

        {state === 'happy' && (
          // Šťastné obloučky ^ ^
          <>
            <path d="M 52,88 C 60,74 80,74 88,88" stroke="#1e293b" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 112,88 C 120,74 140,74 148,88" stroke="#1e293b" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        )}

        {state === 'sad' && (
          // Smutné / ustarané oči \ /
          <>
            <path d="M 88,80 C 80,94 60,94 52,80" stroke="#475569" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 148,80 C 140,94 120,94 112,80" stroke="#475569" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Obočí vyjadřující starost */}
            <path d="M 50,56 L 75,68" stroke="#46a302" strokeWidth="5" strokeLinecap="round" />
            <path d="M 150,56 L 125,68" stroke="#46a302" strokeWidth="5" strokeLinecap="round" />
          </>
        )}

        {state === 'excited' && (
          // Hvězdičky v očích
          <>
            {/* Hvězda levá */}
            <path d="M 72,70 L 76,80 L 87,80 L 79,87 L 82,97 L 72,90 L 62,97 L 65,87 L 57,80 L 68,80 Z" fill="#ff9600" />
            {/* Hvězda pravá */}
            <path d="M 128,70 L 132,80 L 143,80 L 135,87 L 138,97 L 128,90 L 118,97 L 121,87 L 113,80 L 124,80 Z" fill="#ff9600" />
          </>
        )}

        {/* Oranžový zobáček */}
        {state === 'happy' || state === 'excited' ? (
          // Otevřený radostný zobáček
          <path d="M 92,94 C 92,94 100,112 108,94 L 100,90 Z" fill="#ff9600" stroke="#d97706" strokeWidth="1" />
        ) : (
          // Zavřený zobáček
          <polygon points="100,104 90,92 110,92" fill="#ff9600" />
        )}

        {/* Růžová líčka (ruměnec při radosti) */}
        {(state === 'happy' || state === 'excited') && (
          <>
            <ellipse cx="48" cy="98" rx="8" ry="4" fill="#ffaec9" opacity="0.8" />
            <ellipse cx="152" cy="98" rx="8" ry="4" fill="#ffaec9" opacity="0.8" />
          </>
        )}

        {/* Nohy (oranžové drápky) */}
        <circle cx="80" cy="178" r="8" fill="#ff9600" />
        <circle cx="70" cy="176" r="8" fill="#ff9600" />
        <circle cx="120" cy="178" r="8" fill="#ff9600" />
        <circle cx="130" cy="176" r="8" fill="#ff9600" />

        {/* ITALSKÁ ŠÁLA (Zelená-Bílá-Červená) */}
        <g id="scarf">
          {/* Uzlík šály */}
          <rect x="75" y="145" width="50" height="12" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          {/* Zelený levý konec */}
          <rect x="75" y="145" width="16" height="12" rx="4" fill="#008c45" />
          {/* Červený pravý konec */}
          <rect x="109" y="145" width="16" height="12" rx="4" fill="#cd212a" />
          
          {/* Visící cípy šály */}
          {state === 'excited' ? (
            // Rozvlátá šála při radosti
            <path d="M 85,152 C 75,170 50,170 45,160 C 40,150 70,150 85,152 Z" fill="#cd212a" />
          ) : (
            // Normálně visící šála
            <>
              {/* První cíp (zeleno-bílo-červený) */}
              <path d="M 82,154 L 75,182 L 90,182 L 92,154 Z" fill="white" />
              <path d="M 82,154 L 75,182 L 80,182 L 85,154 Z" fill="#008c45" />
              <path d="M 88,154 L 86,182 L 90,182 L 92,154 Z" fill="#cd212a" />
            </>
          )}
        </g>

        {/* Křídlo pravé (popředí) */}
        {state === 'sad' && (
          <path d="M 155,115 C 170,120 175,145 160,155 C 150,160 145,140 155,115 Z" fill="#46a302" />
        )}
        {state !== 'sad' && state !== 'excited' && (
          <path d="M 160,105 C 180,110 180,140 165,150 C 155,155 155,130 160,105 Z" fill="#46a302" />
        )}
        {state === 'excited' && (
          <path d="M 160,110 C 185,90 180,65 165,75 C 155,85 155,100 160,110 Z" fill="#46a302" />
        )}
      </svg>
    </div>
  );
};
