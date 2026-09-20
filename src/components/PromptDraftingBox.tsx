import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  X,
  Sparkles,
  Database,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  FolderSync,
  Scale,
  ChevronDown,
} from 'lucide-react';
import { SAMPLE_LEGAL_PROMPTS } from '../data/sampleLegalPrompts';
import { ReferenceFileInfo, SamplePrompt, DocumentTypeValue } from '../types';
import { uploadReferenceFileToFirebase } from '../services/firebaseStorageHelper';

interface PromptDraftingBoxProps {
  command: string;
  setCommand: (val: string) => void;
  documentType: DocumentTypeValue;
  setDocumentType: (type: DocumentTypeValue) => void;
  referenceFile: ReferenceFileInfo | null;
  setReferenceFile: (file: ReferenceFileInfo | null) => void;
  statutoryFile?: ReferenceFileInfo | null;
  statutoryFileUrl?: string | null;
  onGenerateDraft: () => void;
  isLoading: boolean;
  progressStep: string;
}

export const PromptDraftingBox: React.FC<PromptDraftingBoxProps> = ({
  command,
  setCommand,
  documentType,
  setDocumentType,
  referenceFile,
  setReferenceFile,
  statutoryFile,
  statutoryFileUrl,
  onGenerateDraft,
  isLoading,
  progressStep,
}) => {
  // Dragging states
  const [isDraggingEmpirical, setIsDraggingEmpirical] = useState(false);

  // Upload progress states
  const [empiricalProgress, setEmpiricalProgress] = useState<number | null>(null);

  const [activeTemplateId, setActiveTemplateId] = useState<string>('badung-skrining-gratis');
  const empiricalFileInputRef = useRef<HTMLInputElement>(null);

  // Handler saat user memilih template siap pakai
  const handleSelectTemplate = (template: SamplePrompt) => {
    setActiveTemplateId(template.id);
    setCommand(template.prompt);

    // Otomatis sinkronkan jenis instrumen jika template menyatakannya
    if (template.regulationType === 'PERDA') {
      setDocumentType('Perda');
    } else if (template.regulationType === 'KEPBUP') {
      setDocumentType('SK Bupati');
    } else {
      setDocumentType('Perbup');
    }

    if (template.sampleDatasetText) {
      // Simulasikan file referensi dari data empiris daerah
      const simulatedBlob = new Blob([template.sampleDatasetText], { type: 'text/plain' });
      const simulatedFile = new File([simulatedBlob], `Data_Empiris_${template.jurisdiction.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, {
        type: 'text/plain',
      });

      const reader = new FileReader();
      reader.onload = () => {
        setReferenceFile({
          name: simulatedFile.name,
          size: simulatedFile.size,
          type: 'text/plain',
          base64: reader.result as string,
          rawTextPreview: template.sampleDatasetText,
        });
      };
      reader.readAsDataURL(simulatedFile);
    }
  };

  // Handler upload file referensi empiris (ke storage path referensi-kesehatan/)
  const handleEmpiricalFileProcess = async (file: File) => {
    setEmpiricalProgress(10);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadResult = await uploadReferenceFileToFirebase(
        file,
        (percent) => setEmpiricalProgress(percent),
        'referensi-kesehatan'
      );

      setReferenceFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        base64: base64Data,
        downloadUrl: uploadResult.downloadUrl,
      });

      setEmpiricalProgress(null);
    } catch (err: any) {
      console.error('Gagal mengunggah file empiris:', err);
      setEmpiricalProgress(null);
      alert(`Gagal memproses file empiris: ${err.message || 'Kesalahan pembacaan data'}`);
    }
  };

  const handleClearEmpiricalFile = () => {
    setReferenceFile(null);
    if (empiricalFileInputRef.current) {
      empiricalFileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl shadow-slate-950/40">
      {/* Template Quick Picks */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Pilih Template Regulasi Kesehatan Daerah (Siap Pakai):
          </label>
          <span className="text-[11px] text-slate-400">Harmonisasi UU 17/2023 & PP 28/2024</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_LEGAL_PROMPTS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t)}
              className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                activeTemplateId === t.id
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold truncate">{t.title}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-amber-300">
                  {t.regulationType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{t.jurisdiction}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Command & Document Type Responsive Grid Layout */}
      <div className="mb-5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Dropdown: Jenis Instrumen Hukum */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="document-type-selector"
                className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Jenis Instrumen Hukum:</span>
              </label>
              <span className="text-[10px] text-amber-300/80 font-mono font-medium hidden sm:inline">
                Standar JDIH
              </span>
            </div>

            <div className="relative">
              <select
                id="document-type-selector"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentTypeValue)}
                className="w-full bg-[#0F172A] border border-slate-700/80 hover:border-amber-500/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none rounded-xl px-3.5 py-3 text-sm font-bold text-slate-100 shadow-lg shadow-slate-950/70 transition-all cursor-pointer appearance-none pr-10"
              >
                <option value="Perbup" className="bg-[#0F172A] text-slate-100 py-2">
                  Peraturan Bupati (Perbup)
                </option>
                <option value="Perda" className="bg-[#0F172A] text-slate-100 py-2">
                  Peraturan Daerah (Perda)
                </option>
                <option value="SK Bupati" className="bg-[#0F172A] text-slate-100 py-2">
                  Surat Keputusan Bupati (SK Bupati)
                </option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Contextual Legal Hierarchy & Scope Note */}
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] leading-relaxed shadow-sm">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-slate-400 font-medium">Tingkat Yuridis:</span>
              <span className="font-bold text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40">
                {documentType === 'Perbup'
                  ? 'Regulasi Eksekutif'
                  : documentType === 'Perda'
                  ? 'Legislasi Bersama DPRD'
                  : 'Penetapan Tata Usaha (KTUN)'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {documentType === 'Perbup'
                ? 'Peraturan pelaksanaan eksekutif Kepala Daerah berlandaskan atribusi / delegasi UU & Perda (Pasal 8 ayat (1) UU No. 12/2011).'
                : documentType === 'Perda'
                ? 'Peraturan perundang-undangan tertinggi tingkat daerah yang dibentuk bersama DPRD (Pasal 7 ayat (1) huruf e UU No. 12/2011).'
                : 'Keputusan bersifat individual, konkret, dan final untuk penetapan teknis tim, besaran alokasi, atau SK operasional faskes.'}
            </p>
          </div>
        </div>

        {/* Textbox Command */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="legal-command-input"
              className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instruksi / Perintah Perancangan Regulasi:</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Ketik subjek hukum, objek kebijakan, &amp; yurisdiksi daerah
            </span>
          </div>
          <textarea
            id="legal-command-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Contoh: Buatlah konsep rancangan peraturan Bupati tentang Pemeriksaan Kesehatan Gratis di Kabupaten Badung, mencakup skrining terpadu PTM dan integrasi faskes primer..."
            rows={5}
            className="w-full flex-1 bg-slate-950 border border-slate-700 hover:border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 transition-colors resize-y leading-relaxed font-sans shadow-lg shadow-slate-950/70"
          />
        </div>
      </div>

      {/* File Referensi Empiris (PDF / CSV / TXT) */}
      <div className="mb-5">
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                File Referensi Empiris (PDF / CSV / TXT):
              </label>
              {referenceFile ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold">
                  Data Terhubung
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Data Daerah (Opsional)</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5 leading-snug">
              Data prevalensi / APBD / faskes / indikator kesehatan daerah diekstrak otomatis ke Naskah Akademik &amp; Konsiderans.
            </p>
          </div>

          {referenceFile ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-emerald-200 truncate">{referenceFile.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                      <span>{(referenceFile.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {referenceFile.downloadUrl ? 'Tautan Siap / Terunggah' : 'Buffer Siap Ekstraksi'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearEmpiricalFile}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Hapus file referensi empiris"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingEmpirical(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingEmpirical(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingEmpirical(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleEmpiricalFileProcess(file);
              }}
              onClick={() => empiricalFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
                isDraggingEmpirical
                  ? 'border-emerald-400 bg-emerald-950/20 text-emerald-200'
                  : 'border-slate-700/80 hover:border-emerald-500/50 bg-slate-900/50 text-slate-400'
              }`}
            >
              <input
                type="file"
                ref={empiricalFileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleEmpiricalFileProcess(f);
                }}
                accept=".pdf,.csv,.txt,.json,.docx"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-1">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-200">Upload File Referensi Empiris</span>
                </div>
                <p className="text-[10px] text-slate-500">Mendukung PDF dinkes, CSV puskesmas, atau ringkasan TXT</p>
              </div>
            </div>
          )}

          {empiricalProgress !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-[11px] text-emerald-300 mb-1">
                <span>Mengunggah Data Empiris ke Storage...</span>
                <span>{empiricalProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${empiricalProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button & Drafting Progress Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-cyan-300 font-medium animate-pulse">
              <FolderSync className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{progressStep || 'Memproses Perancangan Hukum...'}</span>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Dual-Track Input:{' '}
                <strong className={statutoryFileUrl ? 'text-amber-300' : 'text-slate-300'}>
                  {statutoryFileUrl ? 'Standar Yuridis Dinamis' : 'Baseline UU 17/2023'}
                </strong>{' '}
                +{' '}
                <strong className={referenceFile ? 'text-emerald-300' : 'text-slate-300'}>
                  {referenceFile ? 'Data Empiris Lokal' : 'Praktik Baku'}
                </strong>
              </span>
            </span>
          )}
        </div>

        <button
          onClick={onGenerateDraft}
          disabled={isLoading || !command.trim()}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            isLoading || !command.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white shadow-amber-950/60 border border-amber-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyusun Berkas Regulasi...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Formulasikan Regulasi (3-in-1 Bundle)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

