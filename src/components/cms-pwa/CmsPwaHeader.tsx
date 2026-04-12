import React from 'react';
import { Globe, LogOut } from 'lucide-react';
import type { CmsPwaCopy } from './copy';

interface CmsPwaHeaderProps {
  headerMinimized: boolean;
  onLogout: () => void;
  language: 'fi' | 'en';
  setLanguage: (language: 'fi' | 'en') => void;
  diagnosticsStatus: 'healthy' | 'attention';
  onOpenDiagnostics: () => void;
  copy: CmsPwaCopy;
  activeTitle: string;
}

export function CmsPwaHeader({
  headerMinimized,
  onLogout,
  language,
  setLanguage,
  diagnosticsStatus,
  onOpenDiagnostics,
  copy,
  activeTitle,
}: CmsPwaHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-20 -mx-4 border-b border-white/8 bg-[#0E1117]/92 px-4 backdrop-blur transition-all duration-200 ${
        headerMinimized ? 'pb-2 pt-0.5' : 'pb-4 pt-1'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`font-medium tracking-[0.04em] text-white/45 transition-all duration-200 ${headerMinimized ? 'text-[10px]' : 'text-[11px]'}`}>
            {copy.mobileOps}
          </p>
          <h1 className={`font-semibold tracking-tight transition-all duration-200 ${headerMinimized ? 'mt-0.5 text-lg' : 'mt-1 text-2xl'}`}>
            {activeTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className={`inline-flex items-center justify-center transition-all duration-200 ${
              diagnosticsStatus === 'healthy' ? 'text-emerald-300' : 'text-amber-300'
            } ${headerMinimized ? 'h-9 w-9' : 'h-10 w-10'}`}
            aria-label={copy.openDiagnostics}
          >
            <Globe className={`transition-all duration-200 ${headerMinimized ? 'h-4 w-4' : 'h-[18px] w-[18px]'}`} />
          </button>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(['fi', 'en'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLanguage(value)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase transition ${
                  language === value ? 'bg-[#FF6B35] text-[#11141A]' : 'text-white/60'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            onClick={onLogout}
            className={`inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 ${
              headerMinimized ? 'h-9 w-9' : 'h-10 w-10'
            }`}
            aria-label={copy.signOut}
          >
            <LogOut className={`transition-all duration-200 ${headerMinimized ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
