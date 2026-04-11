import React from 'react';

interface BrokenCar404Props {
  dark?: boolean;
}

export function BrokenCar404({ dark = false }: BrokenCar404Props) {
  const roadColor = dark ? '#334155' : '#CBD5E1';
  const bodyTop = '#EF4444';
  const bodyBottom = '#B91C1C';
  const shadowColor = dark ? '#020617' : '#0F172A';
  const strokeColor = dark ? '#E2E8F0' : '#7F1D1D';
  const windowColor = dark ? '#BFDBFE' : '#DBEAFE';
  const smokeBase = dark ? '#CBD5E1' : '#94A3B8';
  const smokeLight = dark ? '#E2E8F0' : '#CBD5E1';

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <svg viewBox="0 0 360 260" className="h-auto w-full overflow-visible" role="img" aria-label="Cute broken car illustration">
        <defs>
          <linearGradient id="notfound-car-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bodyTop} />
            <stop offset="100%" stopColor={bodyBottom} />
          </linearGradient>
          <filter id="notfound-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={shadowColor} floodOpacity="0.16" />
          </filter>
          <filter id="notfound-smoke-blur">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        <ellipse cx="180" cy="222" rx="112" ry="13" fill={roadColor} opacity="0.9" />

        <g className="notfound-warning">
          <path d="M58 206l18-31 18 31H58z" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
          <rect x="73" y="186" width="5" height="12" rx="2.5" fill="#78350F" />
          <circle cx="75.5" cy="202" r="2.6" fill="#78350F" />
        </g>

        <g className="notfound-smoke" filter="url(#notfound-smoke-blur)">
          <circle cx="255" cy="72" r="11" fill={smokeBase} opacity="0.45" />
          <circle cx="274" cy="56" r="15" fill={smokeBase} opacity="0.32" />
          <circle cx="296" cy="36" r="18" fill={smokeBase} opacity="0.22" />
          <circle cx="319" cy="22" r="14" fill={smokeLight} opacity="0.2" />
        </g>

        <g className="notfound-car" filter="url(#notfound-shadow)">
          <path d="M90 173l-16 10 14 6 10-8z" fill="#7F1D1D" />

          <path
            d="M120 166h138c13 0 22-8 27-20l13-31c4-9-2-18-12-18H204c-10 0-18 3-25 11l-23 22h-26c-13 0-23 10-23 22v4c0 6 5 10 13 10z"
            fill="url(#notfound-car-body)"
          />

          <path
            d="M258 166c13 0 22-8 27-20l13-31c4-9-2-18-12-18h-29l-12 29 6 11-13 12z"
            fill="#991B1B"
          />

          <path d="M247 120l-16 15 12 6-19 15" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />
          <path d="M181 109l17 11-10 14" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />

          <path
            d="M188 106h79c8 0 12 6 10 12l-5 18h-113l13-18c3-8 8-12 16-12z"
            fill={windowColor}
          />
          <path d="M220 106v30" stroke="#94A3B8" strokeWidth="3" />

          <path d="M217 136v30" stroke={strokeColor} strokeWidth="3" opacity="0.8" />
          <path d="M164 136h109" stroke={strokeColor} strokeWidth="3" opacity="0.35" />

          <path d="M284 140l14-6-3 14-14 3z" fill="#FDE68A" />
          <path d="M284 140l14-6" stroke="#7C2D12" strokeWidth="2" />
          <rect x="109" y="143" width="11" height="16" rx="3" fill="#FCA5A5" />

          <circle cx="159" cy="170" r="24" fill="#1E293B" />
          <circle cx="159" cy="170" r="12" fill="#94A3B8" />
          <circle cx="159" cy="170" r="5" fill="#E2E8F0" />

          <circle cx="278" cy="170" r="24" fill="#1E293B" />
          <circle cx="278" cy="170" r="12" fill="#94A3B8" />
          <circle cx="278" cy="170" r="5" fill="#E2E8F0" />

          <g className="notfound-wheel-left">
            <path d="M159 154v32M143 170h32M147 158l24 24M171 158l-24 24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="notfound-wheel-right">
            <path d="M278 154v32M262 170h32M266 158l24 24M290 158l-24 24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          </g>

          <path d="M282 168l37 13" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
          <path d="M289 169l8 6 9-4" stroke="#E2E8F0" strokeWidth="2.4" strokeLinecap="round" />

          <path d="M251 98c8-11 22-15 35-10" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

          <g className="notfound-fallen-wheel">
            <circle cx="322" cy="192" r="18" fill="#1E293B" />
            <circle cx="322" cy="192" r="9" fill="#94A3B8" />
            <circle cx="322" cy="192" r="4" fill="#E2E8F0" />
            <path d="M322 181v22M311 192h22M314 184l16 16M330 184l-16 16" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          <g transform="translate(206 205) rotate(14)">
            <path d="M0 0c4-4 10-4 14 0l-4 5 4 4c-4 4-10 4-14 0-3-3-4-7 0-9z" fill="#94A3B8" />
            <rect x="9" y="4" width="26" height="6" rx="3" fill="#64748B" />
            <circle cx="34" cy="7" r="4" fill="#CBD5E1" />
          </g>
        </g>

        <circle cx="42" cy="76" r="3" fill={roadColor} opacity="0.55" />
        <circle cx="311" cy="120" r="4" fill={roadColor} opacity="0.36" />
        <circle cx="333" cy="92" r="2.5" fill={smokeBase} opacity="0.35" />
      </svg>
    </div>
  );
}
