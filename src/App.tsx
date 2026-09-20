/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LegalHeader } from './components/LegalHeader';
import { PromptDraftingBox } from './components/PromptDraftingBox';
import { StatutoryUploadCard } from './components/StatutoryUploadCard';
import { DocumentWorkspace } from './components/DocumentWorkspace';
import { CodeManualModal } from './components/CodeManualModal';
import { ReferenceFileInfo, ParsedLegalBundle, DocumentTypeValue } from './types';
import { requestLegalDraft, parseLegalBundle } from './services/legalDraftService';
import { SAMPLE_LEGAL_PROMPTS } from './data/sampleLegalPrompts';
import { ShieldCheck, Info, Scale, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { BENCHMARK_BADUNG_LEGAL_BUNDLE } from './data/benchmarkLegalBundle';

export default function App() {
  const [command, setCommand] = useState<string>(SAMPLE_LEGAL_PROMPTS[0].prompt);
  const [documentType, setDocumentType] = useState<DocumentTypeValue>('Perbup');
  const [referenceFile, setReferenceFile] = useState<ReferenceFileInfo | null>(null);
  const [statutoryFile, setStatutoryFile] = useState<ReferenceFileInfo | null>(null);
  const [statutoryFileUrl, setStatutoryFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [legalBundle, setLegalBundle] = useState<ParsedLegalBundle>(() =>
    parseLegalBundle(BENCHMARK_BADUNG_LEGAL_BUNDLE, 'ADHI Legislative Engine (Standar Emas JDIH)')
  );
  const [isCodeManualOpen, setIsCodeManualOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('ADHI Legislative Engine (Standar Emas JDIH)');

  // Inisialisasi awal dengan data empiris Kabupaten Badung agar aplikasi langsung siap dicoba
  useEffect(() => {
    const initialSample = SAMPLE_LEGAL_PROMPTS[0];
    if (initialSample.sampleDatasetText) {
      const simulatedBlob = new Blob([initialSample.sampleDatasetText], { type: 'text/plain' });
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceFile({
          name: 'Profil_Kesehatan_Empiris_Kab_Badung_2024.txt',
          size: simulatedBlob.size,
          type: 'text/plain',
          base64: reader.result as string,
          rawTextPreview: initialSample.sampleDatasetText,
        });
      };
      reader.readAsDataURL(simulatedBlob);
    }
  }, []);

  // Handler eksekusi perancangan hukum
  const handleGenerateDraft = async () => {
    if (!command.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    
    const steps = [
      'Menyiapkan payload perintah & berkas referensi dual-track...',
      statutoryFileUrl
        ? 'Memvalidasi standar amandemen yuridis baru (override aktif)...'
        : 'Menyelaraskan vertikal dengan baseline UU No. 17/2023 & PP No. 28/2024...',
      'Mengekstrak data empiris & tabel statistik kesehatan daerah...',
      'Memformulasikan norma JDIH: Konsiderans, Dasar Hukum, Batang Tubuh...',
      'Menyusun Penjelasan Rigid Pasal Demi Pasal & Naskah Akademik...',
      'Memvalidasi kepatuhan standar JDIH RI & anti-ambiguitas medis...',
      'Merapikan berkas Three-in-One Legal Bundle...',
    ];
    let stepIndex = 0;
    setProgressStep(steps[0]);

    const intervalId = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setProgressStep(steps[stepIndex]);
    }, 2800);

    try {
      const empiricalUrl = referenceFile?.downloadUrl || referenceFile?.base64 || null;

      // Payload resmi yang mengirim kedua track berkas ke backend
      const response = await requestLegalDraft({
        command: command.trim(),
        documentType: documentType,
        statutoryFileUrl: statutoryFileUrl || null,
        empiricalFileUrl: empiricalUrl,
        // Properti tambahan untuk fallback ekstraksi biner & preview nama berkas
        statutoryFileName: statutoryFile?.name,
        statutoryBase64: statutoryFile?.base64,
        statutoryFileType: statutoryFile?.type,
        empiricalFileName: referenceFile?.name,
        fileUrl: referenceFile?.downloadUrl,
        fileBase64: referenceFile?.base64,
        fileName: referenceFile?.name,
        fileType: referenceFile?.type,
      });

      if (!response.success || !response.markdown) {
        throw new Error(response.message || 'Gagal menerima berkas legal drafting.');
      }

      if (response.model) {
        setCurrentModel(response.model);
      }
      const parsed = parseLegalBundle(response.markdown, response.model);
      setLegalBundle(parsed);

      // Scroll halus ke workspace dokumen
      setTimeout(() => {
        const workspaceEl = document.getElementById('legal-workspace-section');
        if (workspaceEl) {
          workspaceEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } catch (err: any) {
      console.error('Error saat proses legal drafting:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan atau server saat memproses perancangan hukum.');
    } finally {
      clearInterval(intervalId);
      setIsLoading(false);
      setProgressStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header Bar */}
      <LegalHeader onOpenCodeManual={() => setIsCodeManualOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Harmonization & Compliance Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  STANDAR YURIDIS TERBARU RI (POST-OMNIBUS HEALTH LAW)
                </h2>
                {statutoryFile && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Amandemen Baru Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Harmonisasi baku <strong>UU No. 17 Tahun 2023</strong> tentang Kesehatan &amp;{' '}
                <strong>PP No. 28 Tahun 2024</strong> (Peraturan Pelaksana UU Kesehatan) untuk kewenangan daerah.
              </p>
              <p className="text-[11px] text-amber-400 font-medium mt-1">
                Baseline: UU No. 17/2023 &amp; PP No. 28/2024. Upload a new PDF below to override with a newer law dynamically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <span>Model:</span>
            <span className="text-cyan-400 font-bold">{currentModel}</span>
          </div>
        </div>

        {/* Card FILE STANDAR YURIDIS BARU (PDF/TXT) - Posisi tepat di bawah banner Standar Yuridis */}
        <section id="statutory-override-section">
          <StatutoryUploadCard
            statutoryFile={statutoryFile}
            setStatutoryFile={setStatutoryFile}
            statutoryFileUrl={statutoryFileUrl}
            setStatutoryFileUrl={setStatutoryFileUrl}
          />
        </section>

        {/* Error Notification if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white font-bold underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Input & Control Panel (Tugas 1 Engine) */}
        <section>
          <PromptDraftingBox
            command={command}
            setCommand={setCommand}
            documentType={documentType}
            setDocumentType={setDocumentType}
            referenceFile={referenceFile}
            setReferenceFile={setReferenceFile}
            statutoryFile={statutoryFile}
            statutoryFileUrl={statutoryFileUrl}
            onGenerateDraft={handleGenerateDraft}
            isLoading={isLoading}
            progressStep={progressStep}
          />
        </section>

        {/* Document Workspace (Output Markdown 3-in-1, PDF & DOCX Exporter) */}
        <section id="legal-workspace-section">
          <DocumentWorkspace
            bundle={legalBundle}
            isLoading={isLoading}
            command={command}
            referenceFile={referenceFile}
            statutoryFile={statutoryFile}
          />
        </section>

        {/* Feature Highlights & Legal Methodology Footer */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Paket 1: Naskah Akademik</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kajian filosofis, sosiologis berbasis ekstraksi data empiris riil dari file referensi,
              serta evaluasi yuridis vertikal-horizontal UU 17/2023 &amp; PP 28/2024.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Paket 2: Draft Konsep JDIH</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Format baku Perda/Perbup resmi sesuai UU 12/2011 jo. UU 13/2022: Judul, Menimbang, Mengingat,
              Diktum, Batang Tubuh (Bab, Pasal, Ayat) siap undangkan.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Paket 3: Penjelasan Akademis</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Penjelasan rigid pasal demi pasal secara operasional dan klinis guna mencegah multitafsir
              atau ambiguitas tenaga medis di puskesmas, klinik, dan RSUD.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>
          ADHI LEGAL DRAFTING SYSTEM &copy; {new Date().getFullYear()} • Dirancang untuk Penguatan Regulasi Sektor Kesehatan Daerah Indonesia.
        </p>
      </footer>

      {/* Modal Manual Integrasi API (Tugas 2) */}
      <CodeManualModal
        isOpen={isCodeManualOpen}
        onClose={() => setIsCodeManualOpen(false)}
      />
    </div>
  );
}
