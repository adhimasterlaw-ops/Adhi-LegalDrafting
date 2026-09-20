import React, { useState } from 'react';
import { X, Copy, Check, Code2, Server, Globe, FileCode } from 'lucide-react';

interface CodeManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeManualModal: React.FC<CodeManualModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const frontendCode = `// ============================================================================
// A. SISI FRONTEND (React.js / JavaScript Client-Side Handler)
// ADHI LEGAL DRAFTING SYSTEM
// ============================================================================
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function LegalDraftingClient() {
  const [command, setCommand] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [markdownResult, setMarkdownResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Handler Pengambilan File & Perintah dari Input UI
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 2. Alur Pengunggahan File Biner ke Firebase Storage Bucket
  const uploadToFirebaseStorage = async (file) => {
    const storage = getStorage(); // Inisialisasi Firebase Storage
    const storageRef = ref(storage, \`referensi/\${Date.now()}_\${file.name}\`);
    
    // Unggah file biner
    const snapshot = await uploadBytes(storageRef, file);
    // Ambil tautan unduhan publik yang valid
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  };

  // 3. Handler Tembak HTTP POST Fetch ke Endpoint Backend
  const handleGenerateDraft = async () => {
    if (!command.trim()) return alert('Masukkan instruksi perintah!');
    setIsProcessing(true);

    try {
      let fileUrl = null;
      let fileBase64 = null;

      // Jika ada file referensi, unggah ke Firebase Storage
      if (selectedFile) {
        try {
          fileUrl = await uploadToFirebaseStorage(selectedFile);
        } catch (storageErr) {
          console.warn('Firebase Storage offline, fallback ke Base64 langsung:', storageErr);
          // Fallback lokal jika kredensial bucket belum dihubungkan
          fileBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(selectedFile);
          });
        }
      }

      // Tembakkan payload ke Backend Express
      const response = await fetch('/v1/generate-legal-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: command,
          fileUrl: fileUrl,
          fileBase64: fileBase64,
          fileName: selectedFile?.name,
          fileType: selectedFile?.type,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal generate regulasi');

      // 4. Tangkap string Markdown hasil respons AI dan simpan ke state
      setMarkdownResult(data.markdown);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Konversi Instan ke File Fisik .pdf (PDF) Menggunakan jsPDF
  const exportToPdfInstant = (content, filename = 'Draft_Regulasi.pdf') => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const splitText = doc.splitTextToSize(content, 160);
    doc.text(splitText, 25, 25);
    doc.save(filename);
  };

  // 6. Konversi Instan ke File Fisik .docx (Word) Menggunakan docx & file-saver
  const exportToDocxInstant = async (content, filename = 'Draft_Regulasi.docx') => {
    const paragraphs = content.split('\\n').map((line) => {
      return new Paragraph({
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 24 })],
      });
    });

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
  };

  return { command, setCommand, handleFileChange, handleGenerateDraft, markdownResult, exportToPdfInstant, exportToDocxInstant };
}`;

  const backendCode = `// ============================================================================
// B. SISI BACKEND (Node.js dengan Express & SDK Resmi @google/genai)
// Endpoint: POST /v1/generate-legal-draft
// Model: gemini-3.8-flash
// ============================================================================
import express from 'express';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '50mb' })); // Buffer body besar untuk file

// 1. Inisialisasi SDK Resmi @google/genai (bukan library lama)
// Menggunakan process.env.GEMINI_API_KEY yang aman di sisi server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' },
  },
});

// 2. Endpoint POST /v1/generate-legal-draft
app.post('/v1/generate-legal-draft', async (req, res) => {
  try {
    const { command, fileUrl, fileBase64, fileName } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Parameter "command" wajib diisi!' });
    }

    let extractedFileText = '';

    // 3. Ekstraksi Data File Referensi (Unduh aman via axios jika berupa URL)
    if (fileUrl && fileUrl.startsWith('http')) {
      // Unduh biner aman menggunakan axios sebagai arraybuffer
      const axiosRes = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
        maxContentLength: 30 * 1024 * 1024, // Limit aman 30MB
      });

      const buffer = Buffer.from(axiosRes.data);

      // Ekstraksi teks dari PDF menggunakan pustaka 'pdf-parse'
      if (fileName?.endsWith('.pdf') || axiosRes.headers['content-type']?.includes('pdf')) {
        const parsedPdf = await pdfParse(buffer);
        extractedFileText = parsedPdf.text;
      } else {
        // Plain text / CSV / JSON
        extractedFileText = buffer.toString('utf-8');
      }
    } else if (fileBase64) {
      // Penanganan jika payload dikirim via Base64 langsung
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (fileName?.endsWith('.pdf')) {
        const parsedPdf = await pdfParse(buffer);
        extractedFileText = parsedPdf.text;
      } else {
        extractedFileText = buffer.toString('utf-8');
      }
    }

    // 4. Buat variabel 'structuredPrompt' yang otomatis menggabungkan:
    // [Teks Perintah Textbox User] + [Teks Mentah Hasil Ekstraksi File Referensi]
    const structuredPrompt = \`
PERINTAH PERANCANGAN REGULASI KESEHATAN DAERAH:
\${command}

DATA / INFORMASI EMPIRIS DARI FILE REFERENSI (NAMA: \${fileName || 'Data Referensi'}):
\${extractedFileText ? extractedFileText.slice(0, 35000) : '(Tidak ada data empiris tambahan)'}

MANDAT PENYUSUNAN (THREE-IN-ONE BUNDLE):
Wajib hasilkan 3 Paket Utama secara lengkap tanpa memotong baris:
1. NASKAH AKADEMIK (Landasan Filosofis, Sosiologis [ekstrak angka/data empiris di atas], Yuridis UU 17/2023 & PP 28/2024).
2. DRAFT KONSEP REGULASI (Format JDIH Resmi: Judul, Menimbang, Mengingat, Bab, Pasal, Ayat).
3. PENJELASAN AKADEMIS (Penjelasan rigid pasal demi pasal tanpa multitafsir).
\`;

    // 5. Pemanggilan Request API ke Google AI Studio dengan model 'gemini-3.8-flash'
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: structuredPrompt,
      config: {
        systemInstruction: 'Anda adalah Senior Legislative Drafter & Pakar Hukum Kesehatan Republik Indonesia.',
        temperature: 0.25, // Rendah untuk kepastian yuridis dan presisi norma hukum
      },
    });

    // 6. Tangkap teks respons Markdown secara utuh dari properti .text (bukan .text())
    const markdownDraft = aiResponse.text;

    // 7. Kembalikan respons HTTP 200 JSON ke frontend
    return res.status(200).json({
      success: true,
      model: 'gemini-3.8-flash',
      command: command,
      markdown: markdownDraft,
    });
  } catch (error) {
    console.error('Error saat memproses legal draft:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                MANUAL INTEGRASI API & ARSITEKTUR KODE LENGKAP
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  TUGAS 2 TERVERIFIKASI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dokumentasi implementasi Frontend (Firebase & PDF/DOCX) dan Backend (Express, Axios, PDF-Parse, @google/genai)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Architecture Diagram */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-xs">
              <FileCode className="w-4 h-4 text-amber-400" />
              ALUR DATA TERINTEGRASI (END-TO-END PIPELINE):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-cyan-400 font-bold">1. UI Input & File</span>
                <p className="text-[10px] text-slate-400 mt-1">Perintah + Upload Referensi</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold">2. Storage & Payload</span>
                <p className="text-[10px] text-slate-400 mt-1">Firebase Download URL</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold">3. Express + Axios + PDF</span>
                <p className="text-[10px] text-slate-400 mt-1">Ekstraksi Teks Empiris</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-indigo-400 font-bold">4. @google/genai</span>
                <p className="text-[10px] text-slate-400 mt-1">gemini-3.8-flash (3-in-1)</p>
              </div>
            </div>
          </div>

          {/* Sisi Frontend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-200">
                  A. SISI FRONTEND: React.js, Firebase Storage, HTTP Fetch, PDF (.pdf) & Word (.docx)
                </h3>
              </div>
              <button
                onClick={() => handleCopy('frontend', frontendCode)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
              >
                {copiedKey === 'frontend' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'frontend' ? 'Tersalin' : 'Salin Kode Frontend'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{frontendCode}</code>
            </pre>
          </div>

          {/* Sisi Backend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-200">
                  B. SISI BACKEND: Express Endpoint /v1/generate-legal-draft, Axios, PDF-Parse, @google/genai
                </h3>
              </div>
              <button
                onClick={() => handleCopy('backend', backendCode)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
              >
                {copiedKey === 'backend' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'backend' ? 'Tersalin' : 'Salin Kode Backend'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{backendCode}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Model: <strong>gemini-3.8-flash</strong> • Format JDIH Standar UU 12/2011 jo. UU 13/2022</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
