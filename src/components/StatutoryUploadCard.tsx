import React, { useRef, useState } from 'react';
import {
  Scale,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { ReferenceFileInfo } from '../types';
import { uploadReferenceFileToFirebase } from '../services/firebaseStorageHelper';

interface StatutoryUploadCardProps {
  statutoryFile: ReferenceFileInfo | null;
  setStatutoryFile: (file: ReferenceFileInfo | null) => void;
  statutoryFileUrl: string | null;
  setStatutoryFileUrl: (url: string | null) => void;
}

export const StatutoryUploadCard: React.FC<StatutoryUploadCardProps> = ({
  statutoryFile,
  setStatutoryFile,
  statutoryFileUrl,
  setStatutoryFileUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setUploadProgress(10);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Simpan ke storage path terpisah standar-yuridis di Firebase Storage
      const uploadResult = await uploadReferenceFileToFirebase(
        file,
        (percent) => setUploadProgress(percent),
        'standar-yuridis'
      );

      setStatutoryFileUrl(uploadResult.downloadUrl);

      setStatutoryFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        base64: base64Data,
        downloadUrl: uploadResult.downloadUrl,
      });

      setUploadProgress(null);
    } catch (err: any) {
      console.error('Gagal mengunggah file standar yuridis:', err);
      setUploadProgress(null);
      alert(`Gagal memproses file standar yuridis: ${err.message || 'Kesalahan pembacaan data'}`);
    }
  };

  const handleClear = () => {
    setStatutoryFile(null);
    setStatutoryFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="statutory-upload-card"
      className="bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-amber-950/20 rounded-2xl border border-amber-500/35 p-4 shadow-lg shadow-black/30 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                FILE STANDAR YURIDIS BARU (PDF/TXT)
              </h3>
              {statutoryFile ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Override Aktif
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
                  Opsional (Override Dinamis)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Upload amandemen atau UU Kesehatan terbaru untuk memperbarui basis hukum AI secara real-time.
            </p>
          </div>
        </div>

        {statutoryFile && (
          <div className="text-[11px] text-amber-300/80 font-mono bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30 shrink-0 self-start sm:self-auto">
            Rujukan Primer Terkunci
          </div>
        )}
      </div>

      {statutoryFile ? (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-amber-900/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-amber-300" />
              </div>
              <div className="truncate">
                <p className="font-semibold text-amber-100 text-xs truncate">{statutoryFile.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{(statutoryFile.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Basis Yuridis Tersinkronisasi ({statutoryFileUrl ? 'Firebase Storage' : 'Lokal'})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 text-xs text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 rounded-lg border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="Hapus dan kembalikan ke baseline UU 17/2023"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hapus Override</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileProcess(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-950/30 text-amber-200'
              : 'border-slate-700/80 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-950/80 text-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileProcess(file);
            }}
          />
          {uploadProgress !== null ? (
            <div className="flex items-center justify-center gap-2 text-amber-300 py-1 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Memproses & mengunggah berkas yuridis ({uploadProgress}%)...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shrink-0">
                <UploadCloud className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">
                  Klik atau seret berkas UU/Amandemen baru ke sini (PDF atau TXT)
                </p>
                <p className="text-[11px] text-slate-400">
                  Otomatis diekstrak dan dijadikan rujukan hukum tertinggi perancangan regulasi daerah
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
