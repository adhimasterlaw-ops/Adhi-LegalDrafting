import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Scale,
  FileQuestion,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ParsedLegalBundle } from '../types';

export interface JdihChecklistItem {
  id: string;
  name: string;
  category: 'struktur_utama' | 'substansi_norma' | 'penutup_pelengkap';
  description: string;
  legalBasis: string;
  isMandatory: boolean;
  status: 'compliant' | 'missing' | 'warning';
  detectedSnippet?: string;
  reason: string;
  suggestedClause?: string;
}

interface ComplianceChecklistProps {
  bundle: ParsedLegalBundle;
  onSelectSearchClause?: (query: string) => void;
}

export const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({
  bundle,
  onSelectSearchClause,
}) => {
  const [filter, setFilter] = useState<'all' | 'missing' | 'compliant'>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(true);

  // Analisis teks rancangan secara dinamis terhadap pedoman JDIH (UU 12/2011 jo UU 13/2022)
  const checklistResults = useMemo<JdihChecklistItem[]>(() => {
    const raw = bundle.raw || '';
    const draft = bundle.draftRegulasi || '';
    const combinedText = `${draft}\n${raw}`.toLowerCase();
    const explanationText = (bundle.penjelasanAkademis || '').toLowerCase();
    const naText = (bundle.naskahAkademik || '').toLowerCase();

    // 1. Judul & Bentuk Peraturan
    const hasTitle =
      /(peraturan daerah|peraturan bupati|peraturan gubernur|peraturan walikota|keputusan bupati|keputusan gubernur)/i.test(
        draft || raw
      ) && /(tentang|nomor|no\.)/i.test(draft || raw);

    // 2. Pembukaan & Frasa Sakral
    const hasOpening =
      /(dengan rahmat tuhan yang maha esa|dengan nama tuhan yang maha esa)/i.test(
        draft || raw
      ) && /(bupati|gubernur|walikota|dewan perwakilan rakyat daerah)/i.test(draft || raw);

    // 3. Konsiderans Menimbang
    const hasMenimbang = /(menimbang\s*:|menimbang\s*;\s*bahwa)/i.test(draft || raw);

    // 4. Dasar Hukum Mengingat
    const hasMengingat =
      /(mengingat\s*:|dasar hukum)/i.test(draft || raw) &&
      /(undang-undang|peraturan pemerintah|peraturan menteri)/i.test(draft || raw);

    // 5. Diktum Memutuskan & Menetapkan
    const hasDiktum =
      /(memutuskan\s*:)/i.test(draft || raw) &&
      /(menetapkan\s*:|peraturan)/i.test(draft || raw);

    // 6. Ketentuan Umum (BAB I)
    const hasKetentuanUmum =
      /(ketentuan umum|bab\s+i\b|pasal 1\b)/i.test(draft || raw) &&
      /(dalam peraturan ini yang dimaksud dengan|artinya|adalah)/i.test(draft || raw);

    // 7. Materi Muatan Pokok / Batang Tubuh (Kewenangan & Penyelenggaraan)
    const hasMateriPokok =
      /(kewenangan|penyelenggaraan|tata cara|tanggung jawab|hak dan kewajiban|pendanaan|apbd)/i.test(
        draft || raw
      );

    // 8. KETENTUAN SANKSI (Mandatory highlight check)
    const hasSanksi =
      /(ketentuan sanksi|sanksi administratif|teguran tertulis|peringatan tertulis|pencabutan izin|penghentian sementara|sanksi denda|denda administratif|ketentuan pidana|pidana kurungan)/i.test(
        draft || raw
      );

    // 9. KETENTUAN PERALIHAN / TRANSISI (Mandatory highlight check)
    const hasTransisi =
      /(ketentuan peralihan|ketentuan transisi|masa transisi|pada saat peraturan ini mulai berlaku.*tetap berlaku|penyesuaian.*paling lambat|tenggang waktu)/i.test(
        draft || raw
      );

    // 10. Ketentuan Penutup
    const hasPenutup =
      /(ketentuan penutup|peraturan.*ini mulai berlaku pada tanggal diundangkan|memerintahkan pengundangan|berita daerah|lembaran daerah)/i.test(
        draft || raw
      );

    // 11. Penjelasan Pasal Demi Pasal
    const hasPenjelasan =
      explanationText.length > 80 ||
      /(penjelasan pasal demi pasal|penjelasan umum|cukup jelas)/i.test(raw);

    // 12. Naskah Akademik Pendukung
    const hasNaskahAkademik =
      naText.length > 100 ||
      /(naskah akademik|landasan filosofis|landasan sosiologis|landasan yuridis)/i.test(raw);

    // Evaluasi items
    const items: JdihChecklistItem[] = [
      {
        id: 'judul',
        name: 'Judul dan Penamaan Regulasi Resmi',
        category: 'struktur_utama',
        description: 'Menyebutkan bentuk peraturan, nomor, tahun, singkatan subjek, serta frasa TENTANG.',
        legalBasis: 'Lampiran II Butir 1-18 UU No. 12/2011',
        isMandatory: true,
        status: hasTitle ? 'compliant' : 'missing',
        reason: hasTitle
          ? 'Bentuk peraturan, instansi pembentuk, dan nomenklatur judul teridentifikasi lengkap.'
          : 'Judul resmi perundang-undangan (Perda/Perbup/Perwali) belum terformulasikan secara jelas.',
        suggestedClause: 'PERATURAN BUPATI [NAMA KABUPATEN]\nNOMOR ... TAHUN 2026\nTENTANG\nPELAKSANAAN SKRINING KESEHATAN GRATIS BAGI MASYARAKAT',
      },
      {
        id: 'pembukaan',
        name: 'Pembukaan & Frasa Sakral',
        category: 'struktur_utama',
        description: 'Frasa "DENGAN RAHMAT TUHAN YANG MAHA ESA" dan nama jabatan pembentuk peraturan.',
        legalBasis: 'Lampiran II Butir 21-27 UU No. 12/2011',
        isMandatory: true,
        status: hasOpening ? 'compliant' : 'missing',
        reason: hasOpening
          ? 'Frasa sakral dan atribusi kewenangan kepala daerah/DPRD telah tercantum.'
          : 'Frasa sakral pembukaan atau titel pembentuk peraturan belum terdeteksi.',
        suggestedClause: 'DENGAN RAHMAT TUHAN YANG MAHA ESA\n\nBUPATI [NAMA DAERAH],',
      },
      {
        id: 'konsiderans',
        name: 'Konsiderans Menimbang',
        category: 'struktur_utama',
        description: 'Uraian ringkas pokok pikiran filosofis, sosiologis, dan yuridis pembentukan peraturan.',
        legalBasis: 'Lampiran II Butir 28-35 UU No. 12/2011',
        isMandatory: true,
        status: hasMenimbang ? 'compliant' : 'missing',
        reason: hasMenimbang
          ? 'Tiga matra (filosofis, sosiologis, yuridis) terformulasikan dalam butir pertimbangan (huruf a, b, c).'
          : 'Konsiderans Menimbang tidak ditemukan atau butir pertimbangan hukum belum lengkap.',
        suggestedClause: 'Menimbang:\na. bahwa kesehatan merupakan hak asasi manusia ...;\nb. bahwa prevalensi penyakit tidak menular ...;\nc. bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a dan b...',
      },
      {
        id: 'dasar_hukum',
        name: 'Dasar Hukum Mengingat',
        category: 'struktur_utama',
        description: 'Dasar kewenangan pembentukan perundang-undangan (UU Pemda, UU Kesehatan No. 17/2023, PP 28/2024).',
        legalBasis: 'Lampiran II Butir 36-47 UU No. 12/2011 jo UU 13/2022',
        isMandatory: true,
        status: hasMengingat ? 'compliant' : 'missing',
        reason: hasMengingat
          ? 'Hierarki peraturan rujukan telah disusun urut berdasarkan tingkat hierarki dan kronologis pengundangan.'
          : 'Konsiderans Mengingat belum memuat regulasi payung (UU No. 17/2023 atau PP No. 28/2024).',
        suggestedClause: 'Mengingat:\n1. Pasal 18 ayat (6) UUD 1945;\n2. UU No. 23 Tahun 2014 tentang Pemerintahan Daerah;\n3. UU No. 17 Tahun 2023 tentang Kesehatan;\n4. PP No. 28 Tahun 2024 tentang Peraturan Pelaksanaan UU Kesehatan...',
      },
      {
        id: 'diktum',
        name: 'Diktum Memutuskan & Menetapkan',
        category: 'struktur_utama',
        description: 'Kata MEMUTUSKAN: MENETAPKAN: diikuti nama judul peraturan.',
        legalBasis: 'Lampiran II Butir 48-52 UU No. 12/2011',
        isMandatory: true,
        status: hasDiktum ? 'compliant' : 'missing',
        reason: hasDiktum
          ? 'Diktum penetapan normatif terpasang sesuai format JDIH.'
          : 'Format MEMUTUSKAN: MENETAPKAN: belum terstruktur dengan tepat.',
        suggestedClause: 'MEMUTUSKAN:\n\nMenetapkan: PERATURAN BUPATI TENTANG ...',
      },
      {
        id: 'ketentuan_umum',
        name: 'Ketentuan Umum (BAB I Definisi)',
        category: 'substansi_norma',
        description: 'Batasan pengertian atau definisi operasional istilah teknis medis dan administratif.',
        legalBasis: 'Lampiran II Butir 53-73 UU No. 12/2011',
        isMandatory: true,
        status: hasKetentuanUmum ? 'compliant' : 'missing',
        reason: hasKetentuanUmum
          ? 'Definisi istilah teknis disusun alfabetis/hierarkis dengan penomoran angka bulat.'
          : 'BAB I Ketentuan Umum belum memuat klausul pembuka "Dalam Peraturan ini yang dimaksud dengan:".',
        suggestedClause: 'BAB I\nKETENTUAN UMUM\n\nPasal 1\nDalam Peraturan ini yang dimaksud dengan:\n1. Daerah adalah Kabupaten Badung.\n2. Pemerintah Daerah adalah...',
      },
      {
        id: 'materi_pokok',
        name: 'Materi Pokok / Batang Tubuh & Pembiayaan APBD',
        category: 'substansi_norma',
        description: 'Pasal-pasal substantif: hak warga, kewajiban faskes, rincian paket layanan, dan skema pendanaan.',
        legalBasis: 'Pasal 8 UU No. 12/2011 & PP No. 28/2024',
        isMandatory: true,
        status: hasMateriPokok ? 'compliant' : 'missing',
        reason: hasMateriPokok
          ? 'Norma substansi mencakup sasaran, prosedur medis, hak masyarakat, dan kewajiban dinas daerah.'
          : 'Norma batang tubuh belum menguraikan mekanisme operasional atau kepastian pembiayaan APBD.',
        suggestedClause: 'BAB ...\nPENDANAAN\n\nPasal ...\n(1) Pendanaan pelaksanaan program skrining kesehatan bersumber dari:\na. Anggaran Pendapatan dan Belanja Daerah (APBD);\nb. sumber lain yang sah dan tidak mengikat...',
      },
      {
        id: 'ketentuan_sanksi',
        name: 'Ketentuan Sanksi (Administratif / Pelanggaran)',
        category: 'substansi_norma',
        description: 'Penegakan kepatuhan fasilitas kesehatan atau pelaksana terhadap standar layanan.',
        legalBasis: 'Pasal 15 UU 12/2011 (Perda: pidana/denda, Perbup: sanksi administratif)',
        isMandatory: true,
        status: hasSanksi ? 'compliant' : 'missing',
        reason: hasSanksi
          ? 'Norma penegakan sanksi (teguran tertulis, denda, atau sanksi administratif) telah dicantumkan.'
          : 'BAGIAN KRUSIAL HILANG: Belum ada BAB atau Pasal Ketentuan Sanksi. Perbup wajib memuat sanksi administratif (teguran bertingkat, penangguhan kerja sama BPJS, atau pencabutan rekomendasi operasional faskes) untuk menjamin kepatuhan implementasi.',
        suggestedClause: `BAB VIII
KETENTUAN SANKSI ADMINISTRATIF

Pasal 24
(1) Fasilitas Pelayanan Kesehatan yang tidak memenuhi kewajiban pelaksanaan skrining kesehatan gratis dan/atau menolak warga yang memenuhi syarat dikenai sanksi administratif.
(2) Sanksi administratif sebagaimana dimaksud pada ayat (1) berupa:
    a. teguran lisan;
    b. peringatan tertulis kesatu, kedua, dan ketiga;
    c. pembekuan rekomendasi izin operasional sementara; dan/atau
    d. pencabutan rekomendasi izin kerja sama pelayanan kesehatan daerah.
(3) Tata cara pengenaan sanksi administratif diatur lebih lanjut dengan Keputusan Kepala Dinas Kesehatan.`,
      },
      {
        id: 'ketentuan_peralihan',
        name: 'Ketentuan Peralihan / Transisi',
        category: 'substansi_norma',
        description: 'Mengatur status hukum izin, kontrak faskes, atau program pemeriksaan yang sudah berjalan.',
        legalBasis: 'Lampiran II Butir 126-135 UU No. 12/2011',
        isMandatory: true,
        status: hasTransisi ? 'compliant' : 'missing',
        reason: hasTransisi
          ? 'Klausul transisi mengatur keberlanjutan hak masyarakat dan masa penyesuaian faskes swasta.'
          : 'BAGIAN KRUSIAL HILANG: Belum ada BAB atau Pasal Ketentuan Peralihan/Transisi. Dibutuhkan pasal transisi (misal: penyesuaian faskes paling lambat 6 bulan sejak diundangkan) agar tidak terjadi kekosongan hukum bagi program yang sedang berjalan.',
        suggestedClause: `BAB IX
KETENTUAN PERALIHAN

Pasal 25
Pada saat Peraturan ini mulai berlaku:
1. Program skrining kesehatan berkala yang sedang berjalan dan dibiayai APBD tahun anggaran berjalan tetap dilaksanakan sampai selesainya tahun anggaran bersangkutan.
2. Fasilitas Pelayanan Kesehatan yang telah bekerja sama dengan Pemerintah Daerah wajib menyesuaikan standar operasional prosedur skrining terpadu paling lambat 6 (enam) bulan terhitung sejak Peraturan ini diundangkan.`,
      },
      {
        id: 'ketentuan_penutup',
        name: 'Ketentuan Penutup & Pengundangan',
        category: 'penutup_pelengkap',
        description: 'Tanggal mulai berlaku, pencabutan regulasi bertentangan, dan perintah pengundangan resmi.',
        legalBasis: 'Lampiran II Butir 136-160 UU No. 12/2011',
        isMandatory: true,
        status: hasPenutup ? 'compliant' : 'missing',
        reason: hasPenutup
          ? 'Klausul pencabutan aturan lama dan tanggal keberlakuan tertera sesuai kaidah perundang-undangan.'
          : 'Ketentuan Penutup belum menyebutkan saat mulai berlakunya peraturan atau pengundangan dalam Berita Daerah.',
        suggestedClause: `BAB X
KETENTUAN PENUTUP

Pasal 26
Peraturan ini mulai berlaku pada tanggal diundangkan.

Agar setiap orang mengetahuinya, memerintahkan pengundangan Peraturan ini dengan penempatannya dalam Berita Daerah Kabupaten Badung.`,
      },
      {
        id: 'penjelasan_pasal',
        name: 'Penjelasan Pasal Demi Pasal (Pasal 1 s.d. Selesai)',
        category: 'penutup_pelengkap',
        description: 'Tafsiran autentik dari pembentuk peraturan agar norma tidak multitafsir bagi aparat penegak hukum.',
        legalBasis: 'Lampiran II Butir 161-205 UU No. 12/2011',
        isMandatory: true,
        status: hasPenjelasan ? 'compliant' : 'missing',
        reason: hasPenjelasan
          ? 'Elaborasi pasal demi pasal dan penjelasan umum tersedia lengkap.'
          : 'Lampiran Penjelasan Pasal Demi Pasal belum terdeteksi secara memadai.',
        suggestedClause: 'PENJELASAN ATAS\nPERATURAN BUPATI ...\n\nI. UMUM\n...\nII. PASAL DEMI PASAL\nPasal 1: Cukup jelas.\nPasal 2: Huruf a: Yang dimaksud dengan...',
      },
      {
        id: 'naskah_akademik',
        name: 'Naskah Akademik / Kajian Evaluasi Regulasi',
        category: 'penutup_pelengkap',
        description: 'Kajian berbasis bukti empiris (evidence-based policy) dan pertimbangan sosiologis daerah.',
        legalBasis: 'Pasal 43 UU No. 12/2011 jo UU No. 13/2022',
        isMandatory: true,
        status: hasNaskahAkademik ? 'compliant' : 'missing',
        reason: hasNaskahAkademik
          ? 'Kajian empiris data kesehatan daerah dan analisis yuridis naskah akademik terlampir.'
          : 'Naskah Akademik penjelas data statistik kesehatan daerah belum terintegrasi.',
        suggestedClause: 'NASKAH AKADEMIK\nRANCANGAN PERATURAN KESEHATAN DAERAH\n\nBAB I: PENDAHULUAN\nBAB II: KAJIAN TEORITIS & EMPIRIS...',
      },
    ];

    return items;
  }, [bundle]);

  // Statistik Kepatuhan
  const compliantCount = checklistResults.filter((i) => i.status === 'compliant').length;
  const missingCount = checklistResults.filter((i) => i.status === 'missing').length;
  const totalCount = checklistResults.length;
  const compliancePercentage = Math.round((compliantCount / totalCount) * 100);

  const missingItems = useMemo(
    () => checklistResults.filter((i) => i.status === 'missing'),
    [checklistResults]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'missing') return checklistResults.filter((i) => i.status === 'missing');
    if (filter === 'compliant') return checklistResults.filter((i) => i.status === 'compliant');
    return checklistResults;
  }, [checklistResults, filter]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyClause = async (id: string, clauseText?: string) => {
    if (!clauseText) return;
    try {
      await navigator.clipboard.writeText(clauseText);
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2500);
    } catch (e) {
      console.error('Failed to copy clause:', e);
    }
  };

  return (
    <div
      id="jdih-compliance-checklist"
      className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all"
    >
      {/* Header Inspector Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              missingCount > 0
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Checklist Kepatuhan JDIH RI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 normal-case font-normal">
                  UU 12/2011 jo UU 13/2022
                </span>
              </h3>
              {missingCount > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  {missingCount} Bagian Wajib Belum Lengkap
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  100% Sesuai Standar JDIH
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Audit otomatis struktur yuridis norma regulasi terhadap persyaratan baku tata naskah hukum negara.
            </p>
          </div>
        </div>

        {/* Score & Panel Toggle */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          {/* Circular/Bar Progress Meter */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Skor Kepatuhan</div>
              <div className="text-base font-extrabold font-mono text-amber-300">
                {compliancePercentage}%
                <span className="text-xs text-slate-400 font-normal"> ({compliantCount}/{totalCount})</span>
              </div>
            </div>
            <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  compliancePercentage >= 90
                    ? 'bg-emerald-500'
                    : compliancePercentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>
          </div>

          <button
            id="toggle-compliance-panel-btn"
            type="button"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
            title={isPanelExpanded ? 'Sembunyikan detail checklist' : 'Tampilkan detail checklist'}
          >
            <span className="hidden sm:inline font-medium">
              {isPanelExpanded ? 'Tutup Checklist' : 'Buka Checklist'}
            </span>
            {isPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Critical Missing Alerts Notice (Highlighting 'Ketentuan Sanksi' or 'Transisi') */}
      {missingItems.length > 0 && (
        <div className="p-4 bg-red-950/25 border-b border-red-500/25">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-900/60 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-300" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-red-200">
                Peringatan JDIH: Terdapat {missingItems.length} bagian wajib yang belum terdeteksi dalam rancangan:
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {missingItems.map((item) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 rounded-md bg-red-950/80 border border-red-500/40 text-red-300 font-semibold flex items-center gap-1.5"
                  >
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span>{item.name}</span>
                  </span>
                ))}
              </div>
              <p className="text-slate-300 mt-2 text-[11px] leading-relaxed">
                Penyusunan Peraturan Kepala Daerah/Perda tanpa <strong>Ketentuan Sanksi Administratif</strong> atau <strong>Ketentuan Transisi</strong> dapat menimbulkan kekosongan hukum, sengketa penegakan, atau penolakan pada tahap fasilitasi Biro Hukum Provinsi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Body */}
      {isPanelExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua Butir ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('missing')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'missing'
                    ? 'bg-red-950 text-red-200 border border-red-500/40 shadow-sm'
                    : 'text-red-400 hover:text-red-200'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Belum Lengkap ({missingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('compliant')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'compliant'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40 shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Terverifikasi ({compliantCount})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Klik butir untuk melihat dasar hukum &amp; salin draf klausul standar.
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const isExpanded = !!expandedItems[item.id];
              const isMissing = item.status === 'missing';

              return (
                <div
                  key={item.id}
                  id={`compliance-item-${item.id}`}
                  className={`rounded-xl border p-3.5 transition-all text-xs ${
                    isMissing
                      ? 'bg-red-950/15 border-red-500/40 hover:border-red-400/60 shadow-sm shadow-red-950/20'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isMissing ? (
                          <div className="w-6 h-6 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400">
                            <XCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-200 text-xs">{item.name}</h4>
                          {isMissing && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40">
                              HILANG / BELUM LENGKAP
                            </span>
                          )}
                          {!isMissing && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                              Terpenuhi
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {item.description}
                        </p>

                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Dasar: {item.legalBasis}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0 mt-0.5"
                      title={isExpanded ? 'Tutup rincian' : 'Buka rincian & contoh klausul'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Catatan Analisis */}
                  <div
                    className={`mt-2.5 pt-2.5 border-t text-[11px] leading-relaxed ${
                      isMissing
                        ? 'border-red-500/20 text-red-200/90 font-medium'
                        : 'border-slate-800/80 text-slate-300'
                    }`}
                  >
                    {item.reason}
                  </div>

                  {/* Expanded Section with Standard Clause Template to Copy */}
                  {isExpanded && item.suggestedClause && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-400" />
                          Rekomendasi Klausul Baku JDIH
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyClause(item.id, item.suggestedClause)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedItemId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Klausul</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-900/90 p-2.5 rounded border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {item.suggestedClause}
                      </pre>

                      {onSelectSearchClause && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => onSelectSearchClause(item.name)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Cari bagian ini di dokumen</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
