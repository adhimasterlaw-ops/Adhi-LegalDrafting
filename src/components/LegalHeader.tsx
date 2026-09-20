import React from 'react';
import { Scale, ShieldCheck, Cpu, BookOpen, Code2 } from 'lucide-react';

interface LegalHeaderProps {
  onOpenCodeManual: () => void;
}

export const LegalHeader: React.FC<LegalHeaderProps> = ({ onOpenCodeManual }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-500/30">
            <Scale className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                ADHI LEGAL DRAFTING SYSTEM
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                JDIH STANDAR
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Sektor Kesehatan Daerah: Harmonisasi UU No. 17/2023 & PP No. 28/2024
            </p>
          </div>
        </div>

        {/* Status & Action Hub */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-semibold text-cyan-300">gemini-3.8-flash</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-medium">3-in-1 Legal Bundle</span>
          </div>

          <button
            onClick={onOpenCodeManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-700/50 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            title="Lihat petunjuk teknis integrasi API Express & Gemini SDK"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manual Integrasi API</span>
          </button>
        </div>
      </div>
    </header>
  );
};
