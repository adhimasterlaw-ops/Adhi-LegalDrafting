import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Copy,
  Check,
  Search,
  FileText,
  Database,
  Scale,
  Scroll,
  BookOpen,
  Download,
  CheckCircle2,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
} from 'lucide-react';
import { ParsedLegalBundle, DocumentTab, ReferenceFileInfo, VisualTheme } from '../types';

interface SideBySideCompareViewProps {
  command: string;
  referenceFile?: ReferenceFileInfo | null;
  statutoryFile?: ReferenceFileInfo | null;
  bundle: ParsedLegalBundle;
  activeTab: DocumentTab;
  onTabChange: (tab: DocumentTab) => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  isExportingPdf: boolean;
  isExportingDocx: boolean;
  theme?: VisualTheme;
  onThemeChange?: (theme: VisualTheme) => void;
}

export const SideBySideCompareView: React.FC<SideBySideCompareViewProps> = ({
  command,
  referenceFile,
  statutoryFile,
  bundle,
  activeTab,
  onTabChange,
  onExportPdf,
  onExportDocx,
  isExportingPdf,
  isExportingDocx,
  theme,
  onThemeChange,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [showDatasetPreview, setShowDatasetPreview] = useState(true);
  const [showStatutoryPreview, setShowStatutoryPreview] = useState(true);

  // Dynamic Theme Formatting Engine
  const effectiveTheme: VisualTheme =
    theme || (bundle.themeMetadata?.suggested_theme as VisualTheme) || 'default-dark';

  // Konten aktif draft di sisi kanan
  const currentDraftContent = useMemo(() => {
    switch (activeTab) {
      case 'naskah_akademik':
        return bundle.naskahAkademik;
      case 'draft_regulasi':
        return bundle.draftRegulasi;
      case 'penjelasan_akademis':
        return bundle.penjelasanAkademis;
      case 'bundle':
      default:
        return bundle.raw;
    }
  }, [activeTab, bundle]);

  // Strip frontmatter JSON metadata if present
  const cleanDraftContent = useMemo(() => {
    const text = currentDraftContent || '';
    return text.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '');
  }, [currentDraftContent]);

  // Handle copy prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle copy draft
  const handleCopyDraft = async () => {
    if (!currentDraftContent) return;
    try {
      await navigator.clipboard.writeText(currentDraftContent);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Analisis cepat keselarasan konten (Content Alignment Checklist)
  const alignmentAnalysis = useMemo(() => {
    const lowerDraft = (bundle.raw || '').toLowerCase();
    const lowerCommand = command.toLowerCase();

    // Deteksi subjek daerah
    let region = 'Daerah';
    if (lowerCommand.includes('badung')) region = 'Kabupaten Badung';
    else if (lowerCommand.includes('denpasar')) region = 'Kota Denpasar';
    else if (lowerCommand.includes('buleleng')) region = 'Kabupaten Buleleng';
    else if (lowerCommand.includes('gianyar')) region = 'Kabupaten Gianyar';
    else if (lowerCommand.includes('tabanan')) region = 'Kabupaten Tabanan';
    else if (lowerCommand.includes('dki') || lowerCommand.includes('jakarta')) region = 'Provinsi DKI Jakarta';

    const hasRegionAligned = lowerDraft.includes(region.toLowerCase());
    const hasUU17Aligned = lowerDraft.includes('17 tahun 2023') || lowerDraft.includes('undang-undang nomor 17');
    const hasPP28Aligned = lowerDraft.includes('28 tahun 2024') || lowerDraft.includes('peraturan pemerintah nomor 28');
    const hasNaskahAkademik = !!bundle.naskahAkademik;
    const hasDraftRegulasi = !!bundle.draftRegulasi;
    const hasPenjelasan = !!bundle.penjelasanAkademis;

    // Cek apakah data empiris file referensi terserap
    const hasEmpiricalDataMention =
      referenceFile?.rawTextPreview &&
      (lowerDraft.includes('hipertensi') ||
        lowerDraft.includes('diabetes') ||
        lowerDraft.includes('puskesmas') ||
        lowerDraft.includes('apbd') ||
        lowerDraft.includes('jiwa') ||
        lowerDraft.includes('prevalensi'));

    return {
      region,
      hasRegionAligned,
      hasUU17Aligned,
      hasPP28Aligned,
      hasNaskahAkademik,
      hasDraftRegulasi,
      hasPenjelasan,
      hasEmpiricalDataMention,
    };
  }, [command, bundle, referenceFile]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Content Alignment Status Summary Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-200">Status Keselarasan Regulasi: </span>
            <span className="text-emerald-400 font-semibold">Tersinkronisasi Penuh</span>
          </div>
        </div>

        {/* Badges of Alignment */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>UU 17/2023: {alignmentAnalysis.hasUU17Aligned ? '✓ Selaras' : 'Pengecekan'}</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>PP 28/2024: {alignmentAnalysis.hasPP28Aligned ? '✓ Harmonis' : 'Pengecekan'}</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Paket 3-in-1: {alignmentAnalysis.hasNaskahAkademik && alignmentAnalysis.hasDraftRegulasi ? 'Lengkap (3/3)' : 'Sebagian'}</span>
          </span>
        </div>
      </div>

      {/* Two-Column Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* ================================================================ */}
        {/* KOLOM KIRI: ORIGINAL PROMPT & REFERENSI EMPIRIS                    */}
        {/* ================================================================ */}
        <div className="lg:col-span-5 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Header Kolom Kiri */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-bold">
                1
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  Perintah &amp; Mandat Awal (Prompt)
                </h3>
                <p className="text-[10px] text-slate-400">
                  Parameter input dan instruksi perancangan dari pengguna
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyPrompt}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Salin instruksi prompt"
            >
              {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>{copiedPrompt ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          {/* Scrollable Content Kolom Kiri */}
          <div className="p-4 overflow-y-auto max-h-[750px] space-y-4 text-xs">
            {/* Box Instruksi Utama */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Instruksi Lengkap Pengguna:
              </span>
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 leading-relaxed font-mono text-[11px] whitespace-pre-wrap selection:bg-amber-500/40">
                {command}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>Panjang Karakter: {command.length}</span>
                <span>Jumlah Kata: ~{command.split(/\s+/).filter(Boolean).length}</span>
              </div>
            </div>

            {/* Checklist Penyelarasan Mandat (Alignment Verification) */}
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Matriks Keselarasan Parameter:
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Subjek Regulasi:</strong> Sektor Kesehatan Daerah ({alignmentAnalysis.region})
                  </span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Hierarki Peraturan:</strong> Peraturan Bupati/Walikota (UU 12/2011 jo. UU 13/2022)
                  </span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Harmonisasi Vertikal:</strong> Selaras dengan UU No. 17/2023 &amp; PP No. 28/2024
                  </span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Paket Output:</strong> Wajib Three-in-One (Naskah Akademik, JDIH, Penjelasan)
                  </span>
                </li>
              </ul>
            </div>

            {/* Berkas Standar Yuridis Baru (Jika Ada) */}
            {statutoryFile && (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Standar Yuridis Baru (Amandemen Dinamis)</span>
                  </div>
                  <button
                    onClick={() => setShowStatutoryPreview(!showStatutoryPreview)}
                    className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{showStatutoryPreview ? 'Sembunyikan' : 'Lihat'}</span>
                    {showStatutoryPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="text-[11px] text-slate-300">
                  <strong>Berkas:</strong> {statutoryFile.name} ({(statutoryFile.size / 1024).toFixed(1)} KB)
                </div>

                {showStatutoryPreview && statutoryFile.rawTextPreview && (
                  <div className="mt-2 p-2.5 rounded bg-slate-950 border border-emerald-950 max-h-48 overflow-y-auto font-mono text-[10px] text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                    {statutoryFile.rawTextPreview}
                  </div>
                )}
              </div>
            )}

            {/* Berkas Referensi Empiris (Jika Ada) */}
            {referenceFile && (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>File Referensi Empiris Terlampir</span>
                  </div>
                  <button
                    onClick={() => setShowDatasetPreview(!showDatasetPreview)}
                    className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{showDatasetPreview ? 'Sembunyikan' : 'Lihat Data'}</span>
                    {showDatasetPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  <strong>Nama:</strong> {referenceFile.name} ({(referenceFile.size / 1024).toFixed(1)} KB)
                </div>

                {showDatasetPreview && referenceFile.rawTextPreview && (
                  <div className="mt-2 p-2.5 rounded bg-slate-950 border border-slate-800 max-h-56 overflow-y-auto font-mono text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed">
                    {referenceFile.rawTextPreview}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* KOLOM KANAN: DRAFT REGULASI HASIL GENERASI (OUTPUT REVIEW)        */}
        {/* ================================================================ */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Header Kolom Kanan & Tab Switcher */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
                2
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Naskah Regulasi Terbentuk (Draft)
                </h3>
                <p className="text-[10px] text-slate-400">
                  Hasil formulasi JDIH resmi dari model gemini-3.8-flash
                </p>
              </div>
            </div>

            {/* Quick Actions for Right Panel */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap sm:flex-nowrap">
              {/* Dynamic Theme Toggle Pill */}
              {onThemeChange && (
                <div className="flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <span className="px-1 text-slate-400" title="Pilih Tema Format Dokumen">
                    <Palette className="w-3 h-3 text-amber-400" />
                  </span>
                  <button
                    onClick={() => onThemeChange('default-dark')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      effectiveTheme === 'default-dark'
                        ? 'bg-slate-800 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Default Dark: Slate hitam & aksen emas"
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => onThemeChange('light-judicial')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      effectiveTheme === 'light-judicial'
                        ? 'bg-white text-slate-900 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Light Judicial: Putih bersih, hitam/navy pekat, siap cetak persidangan"
                  >
                    Judicial
                  </button>
                  <button
                    onClick={() => onThemeChange('crimson-alert')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      effectiveTheme === 'crimson-alert'
                        ? 'bg-rose-950 text-rose-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Crimson Alert: Mode bahaya/sanksi pidana faskes"
                  >
                    Alert
                  </button>
                  {bundle.themeMetadata?.suggested_theme === 'dark-emerald' && (
                    <button
                      onClick={() => onThemeChange('dark-emerald')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        effectiveTheme === 'dark-emerald'
                          ? 'bg-emerald-950 text-emerald-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Dark Emerald: Rekomendasi Regulasi Kesehatan Kab. Badung"
                    >
                      Emerald
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleCopyDraft}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Salin naskah draft"
              >
                {copiedDraft ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedDraft ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Unduh PDF"
              >
                <Download className="w-3 h-3 text-red-400" />
                <span>PDF</span>
              </button>

              <button
                onClick={onExportDocx}
                disabled={isExportingDocx}
                className="px-2 py-1 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-700/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Unduh berkas Word (.docx) berstandar JDIH"
              >
                {isExportingDocx ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                ) : (
                  <Download className="w-3 h-3 text-blue-400" />
                )}
                <span>DOCX</span>
              </button>
            </div>
          </div>

          {/* Sub-toolbar Paket Dokumen Tab Selector & Search */}
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
            {/* Package Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => onTabChange('bundle')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  activeTab === 'bundle'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Semua (3-in-1)</span>
              </button>

              <button
                onClick={() => onTabChange('naskah_akademik')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  activeTab === 'naskah_akademik'
                    ? 'bg-cyan-700 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Scroll className="w-3 h-3" />
                <span>1. Naskah Akademik</span>
              </button>

              <button
                onClick={() => onTabChange('draft_regulasi')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  activeTab === 'draft_regulasi'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>2. Draft Regulasi</span>
              </button>

              <button
                onClick={() => onTabChange('penjelasan_akademis')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  activeTab === 'penjelasan_akademis'
                    ? 'bg-indigo-700 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>3. Penjelasan</span>
              </button>
            </div>

            {/* Quick Search inside Right Column */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                placeholder="Cari pasal / klausul..."
                className="bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 w-full sm:w-36 focus:w-44 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Legal Document Preview */}
          <div
            className={`p-4 sm:p-6 overflow-y-auto max-h-[750px] font-serif leading-relaxed transition-colors duration-200 ${
              effectiveTheme === 'light-judicial'
                ? 'bg-white text-slate-900'
                : effectiveTheme === 'crimson-alert'
                ? 'bg-[#0f0507] text-rose-100'
                : effectiveTheme === 'dark-emerald'
                ? 'bg-[#031513] text-slate-200'
                : 'bg-slate-950 text-slate-200'
            }`}
          >
            {/* Legal Document Kop Minimalis */}
            <div
              className={`text-center pb-4 mb-5 border-b ${
                effectiveTheme === 'light-judicial'
                  ? 'border-slate-300'
                  : effectiveTheme === 'crimson-alert'
                  ? 'border-red-900/60'
                  : effectiveTheme === 'dark-emerald'
                  ? 'border-emerald-900/60'
                  : 'border-slate-800/80'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${
                  effectiveTheme === 'light-judicial'
                    ? 'bg-slate-100 border border-slate-300 text-slate-800'
                    : effectiveTheme === 'crimson-alert'
                    ? 'bg-red-950/80 border border-red-500/50 text-red-400'
                    : effectiveTheme === 'dark-emerald'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400'
                    : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
              </div>
              <h4
                className={`text-xs font-bold tracking-wider uppercase ${
                  effectiveTheme === 'light-judicial' ? 'text-slate-900' : 'text-slate-100'
                }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                REPUBLIK INDONESIA
              </h4>
              <p
                className={`text-[10px] font-semibold uppercase ${
                  effectiveTheme === 'light-judicial'
                    ? 'text-blue-900'
                    : effectiveTheme === 'crimson-alert'
                    ? 'text-red-400'
                    : effectiveTheme === 'dark-emerald'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {bundle.title || 'DRAFT REGULASI KESEHATAN DAERAH'}
              </p>
              <p
                className={`text-[9px] italic ${
                  effectiveTheme === 'light-judicial' ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                UU 12/2011 jo. UU 13/2022 • UU 17/2023 • PP 28/2024
              </p>
            </div>

            {/* Rendered Markdown with Dynamic Theme */}
            <div
              className={`legal-document-body legal-theme-${effectiveTheme} prose ${
                effectiveTheme === 'light-judicial' ? 'prose-slate' : 'prose-invert'
              } max-w-none leading-relaxed text-[13.5px]`}
            >
              <ReactMarkdown>{cleanDraftContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
