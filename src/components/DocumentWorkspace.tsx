import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Download,
  FileText,
  Copy,
  Check,
  Search,
  BookOpen,
  Scale,
  Scroll,
  Printer,
  Maximize2,
  Minimize2,
  Columns,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Palette,
} from 'lucide-react';
import { DocumentTab, ParsedLegalBundle, ReferenceFileInfo, VisualTheme } from '../types';
import { exportToPdf, exportToDocx } from '../utils/documentExporter';
import { SideBySideCompareView } from './SideBySideCompareView';
import { ComplianceChecklist } from './ComplianceChecklist';

export type WorkspaceViewMode = 'document' | 'comparison';

interface DocumentWorkspaceProps {
  bundle: ParsedLegalBundle;
  isLoading: boolean;
  command: string;
  referenceFile?: ReferenceFileInfo | null;
  statutoryFile?: ReferenceFileInfo | null;
}

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
  bundle,
  isLoading,
  command,
  referenceFile,
  statutoryFile,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentTab>('bundle');
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('comparison');
  const [showComplianceChecklist, setShowComplianceChecklist] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Dynamic Theme Formatting Engine State
  const [activeTheme, setActiveTheme] = useState<VisualTheme>(() => {
    const suggested = bundle.themeMetadata?.suggested_theme;
    if (
      suggested === 'light-judicial' ||
      suggested === 'crimson-alert' ||
      suggested === 'dark-emerald'
    ) {
      return suggested as VisualTheme;
    }
    return 'default-dark';
  });

  // Sync with bundle theme metadata if suggested
  useEffect(() => {
    if (bundle.themeMetadata?.suggested_theme) {
      const suggested = bundle.themeMetadata.suggested_theme;
      if (
        suggested === 'light-judicial' ||
        suggested === 'crimson-alert' ||
        suggested === 'dark-emerald'
      ) {
        setActiveTheme(suggested as VisualTheme);
      } else if (suggested === 'default-dark') {
        setActiveTheme('default-dark');
      }
    }
  }, [bundle.themeMetadata]);

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close Export Menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Konten yang sedang aktif berdasarkan tab
  const currentContent = useMemo(() => {
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

  const isSKDocument = useMemo(() => {
    return !!(
      bundle.themeMetadata?.document_type?.toLowerCase().includes('sk') ||
      bundle.title?.toUpperCase().includes('KEPUTUSAN BUPATI') ||
      bundle.raw?.includes('KEPUTUSAN BUPATI') ||
      bundle.raw?.includes('MEMUTUSKAN:')
    );
  }, [bundle]);

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    if (!currentContent) return;
    try {
      await navigator.clipboard.writeText(currentContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  // Handle Export to PDF
  const handleExportPdf = async () => {
    if (!currentContent) return;
    setIsExportingPdf(true);
    try {
      const sanitizedTitle = (bundle.title || 'Legal_Draft_Kesehatan')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const tabSuffix = activeTab === 'bundle' ? 'Bundle_3in1' : activeTab;
      await exportToPdf(currentContent, `${sanitizedTitle}_${tabSuffix}.pdf`);
      setExportSuccessMsg('Dokumen berhasil diunduh sebagai berkas .pdf!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      alert('Terjadi kesalahan saat membuat file PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Export Draft to DOCX dengan pilihan kategori dokumen
  const handleExportDraftDocx = async (
    category: DocumentTab = 'draft_regulasi'
  ) => {
    setIsExportingDocx(true);
    setIsExportMenuOpen(false);
    try {
      let contentToExport = '';
      let categoryName = '';

      switch (category) {
        case 'draft_regulasi':
          contentToExport = bundle.draftRegulasi || bundle.raw || '';
          categoryName = 'Draft_Regulasi_Resmi';
          break;
        case 'naskah_akademik':
          contentToExport = bundle.naskahAkademik || bundle.raw || '';
          categoryName = 'Naskah_Akademik';
          break;
        case 'penjelasan_akademis':
          contentToExport = bundle.penjelasanAkademis || bundle.raw || '';
          categoryName = 'Penjelasan_Akademis';
          break;
        case 'bundle':
        default:
          contentToExport = bundle.raw || '';
          categoryName = 'Bundel_Lengkap_3in1';
          break;
      }

      if (!contentToExport.trim()) {
        alert('Konten naskah belum tersedia untuk diekspor.');
        return;
      }

      const sanitizedTitle = (bundle.title || 'Legal_Draft_Kesehatan')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);

      const filename = `${sanitizedTitle}_${categoryName}.docx`;

      await exportToDocx(contentToExport, {
        title: bundle.title,
        documentCategory: category,
        filename,
      });

      const displayLabel =
        category === 'draft_regulasi'
          ? 'Draft Regulasi JDIH'
          : category === 'naskah_akademik'
          ? 'Naskah Akademik'
          : category === 'penjelasan_akademis'
          ? 'Penjelasan Akademis'
          : 'Bundel Lengkap 3-in-1';

      setExportSuccessMsg(`${displayLabel} berhasil diunduh sebagai berkas .docx!`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Gagal mengekspor DOCX:', err);
      alert('Terjadi kesalahan saat membuat file Word (.docx).');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Quick export active tab to DOCX
  const handleExportDocx = () => {
    handleExportDraftDocx(activeTab);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Filter teks untuk pencarian pasal / kata kunci jika ada query
  const displayContent = useMemo(() => {
    if (!searchQuery.trim()) return currentContent;
    // Highlight or filter logic
    return currentContent;
  }, [currentContent, searchQuery]);

  // Strip frontmatter JSON metadata if present so markdown renders cleanly
  const cleanDisplayContent = useMemo(() => {
    const text = displayContent || '';
    return text.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '');
  }, [displayContent]);

  if (isLoading) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-12 text-center shadow-xl">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center mx-auto animate-pulse">
            <Scale className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-slate-100" style={{ fontFamily: "'Cinzel', serif" }}>
            MENGONSTRUKSI THREE-IN-ONE LEGAL BUNDLE
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menjalankan analisis yuridis normatif, mengekstrak data empiris referensi,
            dan memformulasi norma JDIH resmi sesuai UU No. 17/2023 & PP No. 28/2024.
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-cyan-500 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!bundle.raw) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-12 text-center shadow-xl">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Scroll className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            Workspace Legal Drafting Siap
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Masukkan instruksi rancangan regulasi (misal: Pemeriksaan Kesehatan Gratis di Kabupaten Badung)
            dan unggah file referensi empiris pada panel di atas, lalu klik <strong>Formulasikan Regulasi</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden' : ''
      }`}
    >
      {/* Workspace Header & Tab Selector */}
      <div className="border-b border-slate-800 p-3 sm:p-4 flex flex-col gap-3 bg-slate-950/60 rounded-t-2xl">
        {/* Top Bar: View Mode Switcher & Global Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'comparison'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Komparasi Berdampingan (Prompt vs Draft)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                Review
              </span>
            </button>

            <button
              onClick={() => setViewMode('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'document'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tampilan Naskah Penuh (Single View)</span>
            </button>

            <button
              id="toggle-compliance-checklist-btn"
              onClick={() => setShowComplianceChecklist(!showComplianceChecklist)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showComplianceChecklist
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Periksa Kepatuhan Regulasi terhadap Standar JDIH (UU 12/2011 jo UU 13/2022)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Checklist Kepatuhan JDIH</span>
            </button>
          </div>

          {/* Quick Actions (Export Draft Menu, Print, Fullscreen) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Export Draft Dropdown Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                id="export-draft-menu-btn"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={isExportingDocx}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white border border-blue-400/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-950/60 disabled:opacity-50 active:scale-95"
                title="Buka menu ekspor draft hukum resmi ke format Word (.docx)"
              >
                {isExportingDocx ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-200" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-200" />
                )}
                <span>{isExportingDocx ? 'Mengekspor...' : 'Export Draft'}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-950 text-blue-200 border border-blue-400/30 tracking-wider">
                  .DOCX
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-blue-200 transition-transform ${
                    isExportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Panel */}
              {isExportMenuOpen && (
                <div
                  id="export-draft-dropdown-menu"
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        <span>EKSPOR DRAF HUKUM RESMI</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Format Microsoft Word (.docx) Berstandar JDIH Nasional
                      </p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40">
                      UU 12/2011
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Primary Option: Draft Regulasi / Draft SK Bupati */}
                    <button
                      id="export-option-draft-regulasi"
                      onClick={() => handleExportDraftDocx('draft_regulasi')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/90 transition-all flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-blue-500/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Scroll className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                            {isSKDocument ? 'Draft SK Bupati Resmi (.docx)' : 'Draft Regulasi Resmi (.docx)'}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            Utama
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {isSKDocument
                            ? 'Surat Keputusan (Beschikking): Judul ALL CAPS, Konsiderans, Diktum Amar, & Penutup.'
                            : 'Batang tubuh naskah hukum: Konsiderans, Bab, Pasal, Sanksi, & Ketentuan Peralihan.'}
                        </p>
                      </div>
                    </button>

                    {/* Naskah Akademik / Telaahan Urgensi SK */}
                    <button
                      id="export-option-naskah-akademik"
                      onClick={() => handleExportDraftDocx('naskah_akademik')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/90 transition-all flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                          {isSKDocument ? 'Telaahan Urgensi & Yuridis (.docx)' : 'Naskah Akademik (.docx)'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {isSKDocument
                            ? 'Kajian urgensi penetapan SK, evaluasi empiris target faskes, dan atribusi kewenangan bupati.'
                            : 'Landasan filosofis, sosiologis, empiris fakta daerah, dan kajian yuridis normatif.'}
                        </p>
                      </div>
                    </button>

                    {/* Penjelasan Akademis / Lampiran Matriks Tim & Biaya */}
                    <button
                      id="export-option-penjelasan-akademis"
                      onClick={() => handleExportDraftDocx('penjelasan_akademis')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/90 transition-all flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {isSKDocument ? 'Lampiran Matriks Tim & Biaya (.docx)' : 'Penjelasan Pasal Demi Pasal (.docx)'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {isSKDocument
                            ? 'Lampiran I & II: Susunan personalia tim kerja, faskes pelaksana, dan alokasi anggaran APBD.'
                            : 'Tafsiran autentik umum dan penjelasan rinci setiap pasal regulasi.'}
                        </p>
                      </div>
                    </button>

                    {/* Bundel Lengkap 3-in-1 */}
                    <button
                      id="export-option-bundle"
                      onClick={() => handleExportDraftDocx('bundle')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/90 transition-all flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                          {isSKDocument ? 'Bundel Lengkap SK Bupati (3-in-1) (.docx)' : 'Bundel Lengkap Three-in-One (.docx)'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {isSKDocument
                            ? 'Seluruh berkas telaahan, draft keputusan bupati, dan lampiran matriks dalam satu dokumen.'
                            : 'Seluruh kompilasi instrumen regulasi terpadu dalam satu berkas Word.'}
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="my-1.5 border-t border-slate-800" />

                  {/* Alternative Format: PDF */}
                  <button
                    id="export-option-pdf"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportPdf();
                    }}
                    disabled={isExportingPdf}
                    className="w-full text-left p-2 rounded-xl hover:bg-red-950/40 transition-all flex items-center justify-between text-xs text-red-300 hover:text-red-200 cursor-pointer border border-transparent hover:border-red-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-red-400" />
                      <span className="font-semibold">Unduh Versi Cetak Resmi (.pdf)</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Kop & Halaman JDIH</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Theme Engine Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 pl-2 pr-1 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Tema:</span>
              </span>
              <button
                id="theme-btn-default-dark"
                onClick={() => setActiveTheme('default-dark')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTheme === 'default-dark'
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Default Dark: Header putih tajam, latar slate gelap, & legal anchor gold"
              >
                <span>🌙</span>
                <span className="hidden sm:inline">Dark</span>
              </button>

              <button
                id="theme-btn-light-judicial"
                onClick={() => setActiveTheme('light-judicial')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTheme === 'light-judicial'
                    ? 'bg-white text-slate-900 border border-slate-300 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Light Judicial: Format resmi persidangan, putih bersih, teks hitam/navy, siap cetak"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Judicial</span>
              </button>

              <button
                id="theme-btn-crimson-alert"
                onClick={() => setActiveTheme('crimson-alert')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTheme === 'crimson-alert'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Crimson Alert: Mode peringatan sanksi delik pidana & pelanggaran faskes"
              >
                <span>🚨</span>
                <span className="hidden sm:inline">Crimson</span>
              </button>

              {bundle.themeMetadata?.suggested_theme === 'dark-emerald' && (
                <button
                  id="theme-btn-dark-emerald"
                  onClick={() => setActiveTheme('dark-emerald')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    activeTheme === 'dark-emerald'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                  title="Dark Emerald: Rekomendasi AI Sektor Kesehatan Kab. Badung"
                >
                  <span>🌿</span>
                  <span className="hidden sm:inline">Badung Sehat</span>
                </button>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak Naskah"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Cetak</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title={isFullscreen ? 'Kecilkan' : 'Perbesar layar penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Export Success Notification Toast Banner */}
        {exportSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">{exportSuccessMsg}</span>
            </div>
            <button
              onClick={() => setExportSuccessMsg(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer font-bold px-1.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* In Single Document View: Document Package Tabs & Actions */}
        {viewMode === 'document' && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
            {/* Document Package Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('bundle')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bundle'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isSKDocument ? 'Berkas SK (3-in-1)' : 'Semua Paket (3-in-1)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('naskah_akademik')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'naskah_akademik'
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>{isSKDocument ? '1. Telaahan Urgensi SK' : '1. Naskah Akademik'}</span>
              </button>

              <button
                onClick={() => setActiveTab('draft_regulasi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'draft_regulasi'
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isSKDocument ? '2. Draft SK Bupati (Beschikking)' : '2. Draft Regulasi JDIH'}</span>
              </button>

              <button
                onClick={() => setActiveTab('penjelasan_akademis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'penjelasan_akademis'
                    ? 'bg-indigo-700 text-white shadow-md shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isSKDocument ? '3. Lampiran Matriks Tim & Biaya' : '3. Penjelasan Akademis'}</span>
              </button>
            </div>

            {/* Action Controls & Export Suite */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
              {/* Quick Search inside document */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pasal / norma..."
                  className="bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-full sm:w-36 focus:w-48 transition-all"
                />
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Salin Markdown naskah ke clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{isCopied ? 'Tersalin' : 'Salin'}</span>
              </button>

              {/* Export PDF Button */}
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 hover:text-white border border-red-700/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                title="Unduh berkas fisik format PDF resmi JDIH"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh .PDF'}</span>
              </button>

              {/* Export DOCX Button */}
              <button
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-200 hover:text-white border border-blue-700/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                title="Unduh berkas fisik format Microsoft Word (.docx)"
              >
                {isExportingDocx ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{isExportingDocx ? 'Membuat DOCX...' : 'Unduh .DOCX'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JDIH Compliance Checklist Inspector */}
      {showComplianceChecklist && (
        <div className="p-4 sm:p-6 pb-2">
          <ComplianceChecklist
            bundle={bundle}
            onSelectSearchClause={(query) => {
              setSearchQuery(query);
              if (viewMode !== 'document') {
                setViewMode('document');
              }
            }}
          />
        </div>
      )}

      {/* Main Content Area: Side-by-Side Comparison OR Single Document View */}
      {viewMode === 'comparison' ? (
        <div className={`p-4 sm:p-6 ${isFullscreen ? 'h-[calc(100vh-140px)] overflow-hidden' : ''}`}>
          <SideBySideCompareView
            command={command}
            referenceFile={referenceFile}
            statutoryFile={statutoryFile}
            bundle={bundle}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onExportPdf={handleExportPdf}
            onExportDocx={handleExportDocx}
            isExportingPdf={isExportingPdf}
            isExportingDocx={isExportingDocx}
            theme={activeTheme}
            onThemeChange={setActiveTheme}
          />
        </div>
      ) : (
        /* Official Legal Document Canvas (Single Column) */
        <div className={`overflow-y-auto p-6 sm:p-10 ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'max-h-[850px]'}`}>
          <div
            className={`max-w-4xl mx-auto rounded-xl p-8 sm:p-12 shadow-2xl transition-colors duration-200 ${
              activeTheme === 'light-judicial'
                ? 'bg-white border border-slate-300 text-slate-900 shadow-xl'
                : activeTheme === 'crimson-alert'
                ? 'bg-[#0f0507] border border-red-900/60 text-rose-100 shadow-2xl shadow-red-950/40'
                : activeTheme === 'dark-emerald'
                ? 'bg-[#031513] border border-emerald-900/60 text-slate-200 shadow-2xl shadow-emerald-950/40'
                : 'bg-slate-950 border border-slate-800/80 text-slate-200 shadow-2xl'
            }`}
          >
            {/* Formal JDIH Document Kop */}
            <div
              className={`text-center pb-6 mb-8 border-b ${
                activeTheme === 'light-judicial'
                  ? 'border-slate-300'
                  : activeTheme === 'crimson-alert'
                  ? 'border-red-900/60'
                  : activeTheme === 'dark-emerald'
                  ? 'border-emerald-900/60'
                  : 'border-slate-800'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5 ${
                  activeTheme === 'light-judicial'
                    ? 'bg-slate-100 border border-slate-400'
                    : activeTheme === 'crimson-alert'
                    ? 'bg-red-950/80 border border-red-500/50'
                    : activeTheme === 'dark-emerald'
                    ? 'bg-emerald-950/80 border border-emerald-500/50'
                    : 'bg-amber-950/60 border border-amber-500/40'
                }`}
              >
                <Scale
                  className={`w-5 h-5 ${
                    activeTheme === 'light-judicial'
                      ? 'text-slate-800'
                      : activeTheme === 'crimson-alert'
                      ? 'text-red-400'
                      : activeTheme === 'dark-emerald'
                      ? 'text-emerald-400'
                      : 'text-amber-300'
                  }`}
                />
              </div>
              <h2
                className={`text-base sm:text-lg font-bold tracking-widest uppercase ${
                  activeTheme === 'light-judicial' ? 'text-slate-900' : 'text-slate-100'
                }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                REPUBLIK INDONESIA
              </h2>
              <p
                className={`text-xs font-semibold tracking-wider uppercase mt-0.5 ${
                  activeTheme === 'light-judicial'
                    ? 'text-blue-900'
                    : activeTheme === 'crimson-alert'
                    ? 'text-red-400'
                    : activeTheme === 'dark-emerald'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                ADHI LEGAL DRAFTING SYSTEM - SEKTOR KESEHATAN DAERAH
              </p>
              <p
                className={`text-[11px] mt-1 italic font-serif ${
                  activeTheme === 'light-judicial' ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Format Standar Baku Pembentukan Peraturan Perundang-undangan (UU No. 12/2011 jo. UU No. 13/2022, UU No. 17/2023, PP No. 28/2024)
              </p>
            </div>

            {/* Markdown Content with Indonesian Legal Typography & Dynamic Theme Engine */}
            <div
              className={`legal-document-body legal-theme-${activeTheme} prose ${
                activeTheme === 'light-judicial' ? 'prose-slate' : 'prose-invert'
              } max-w-none leading-relaxed font-serif text-[15px]`}
            >
              <ReactMarkdown>{cleanDisplayContent}</ReactMarkdown>
            </div>

            {/* Footer of legal page */}
            <div
              className={`mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-[11px] font-sans gap-2 ${
                activeTheme === 'light-judicial'
                  ? 'border-slate-300 text-slate-600'
                  : activeTheme === 'crimson-alert'
                  ? 'border-red-950 text-red-400/80'
                  : 'border-slate-800/80 text-slate-500'
              }`}
            >
              <span>Dihasilkan secara otomatis oleh ADHI LEGAL DRAFTING SYSTEM ({bundle.modelUsed || 'gemini-3.8-flash'})</span>
              <span>Standar JDIH Terverifikasi • Bebas Ambiguitas Implementasi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
