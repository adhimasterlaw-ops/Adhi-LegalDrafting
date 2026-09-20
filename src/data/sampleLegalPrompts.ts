import { SamplePrompt } from '../types';

export const SAMPLE_LEGAL_PROMPTS: SamplePrompt[] = [
  {
    id: 'badung-skrining-gratis',
    title: 'Pemeriksaan Kesehatan Gratis Kab. Badung',
    jurisdiction: 'Kabupaten Badung, Provinsi Bali',
    regulationType: 'PERBUP',
    prompt: 'Buatlah konsep rancangan peraturan Bupati tentang Pemeriksaan Kesehatan Gratis di Kabupaten Badung, mencakup skrining terpadu penyakit tidak menular (hipertensi, diabetes melitus, kardiovaskular, kanker serviks & payudara) serta integrasi layanan puskesmas se-Kabupaten Badung sesuai UU No. 17 Tahun 2023 dan PP No. 28 Tahun 2024.',
    sampleDatasetDescription: 'Laporan Profil Kesehatan & Beban Morbiditas Dinas Kesehatan Kab. Badung',
    sampleDatasetText: `DATA PROFIL EPIDEMIOLOGI & STATISTIK FASILITAS KESEHATAN KABUPATEN BADUNG:
1. Total Penduduk: 554.890 Jiwa (Kecamatan Kuta Selatan, Kuta, Kuta Utara, Mengwi, Abiansemal, Petang).
2. Capaian UHC (Universal Health Coverage): 99,4% terdaftar BPJS Kesehatan.
3. Beban Penyakit Tidak Menular (PTM):
   - Prevalensi Hipertensi pada usia >15 tahun: 31,8% (estimasi 132.500 penderita).
   - Prevalensi Diabetes Melitus: 11,2% (estimasi 46.700 penderita).
   - Tingkat kepatuhan minum obat kronis PTM di Puskesmas: baru 42,6%.
4. Fasilitas Kesehatan:
   - 13 Unit Puskesmas Induk (seluruhnya telah terakreditasi Paripurna).
   - 52 Puskesmas Pembantu (Pustu) dan 49 Posyandu Prima.
   - 1 RSUD Mangusada tipe B Pendidikan milik Pemkab Badung.
5. Alokasi Fiskal APBD Kesehatan:
   - Anggaran Dinas Kesehatan: Rp 385 Milyar (memenuhi mandat belanja kesehatan daerah).
   - Pendapatan Bagi Hasil Cukai Hasil Tembakau (DBH-CHT) dialokasikan Rp 28 Milyar untuk penguatan faskes primer.
6. Kendala Lapangan:
   - 58% penderita baru terdiagnosis saat stadium komplikasi (stroke atau gagal ginjal).
   - Belum adanya payung hukum Perbup yang mewajibkan skrining tahunan berkala bagi seluruh krama dan pekerja pariwisata ber-KTP/domisili Badung.`,
  },
  {
    id: 'stunting-integrasi-primer',
    title: 'Pencegahan Stunting Terintegrasi & USG Puskesmas',
    jurisdiction: 'Kabupaten Badung, Bali',
    regulationType: 'PERBUP',
    prompt: 'Buatlah rancangan Peraturan Bupati tentang Percepatan Pencegahan dan Penurunan Stunting Terintegrasi Melalui Penguatan Layanan Primer dan Penyediaan USG Obstetrik Dasar Terbatas di Seluruh Puskesmas Pembantu.',
    sampleDatasetDescription: 'Survei Status Gizi Indonesia (SSGI) & Data EPPGBM',
    sampleDatasetText: `DATA PREVALENSI & INTERVENSI SPESIFIK GIZI DAERAH:
1. Angka Prevalensi Balita Stunting: 6,8% (target penurunan menjadi <4% dalam 2 tahun).
2. Jumlah Ibu Hamil Kurang Energi Kronis (KEK): 8,4% (742 ibu hamil).
3. Ketersediaan Alat:
   - Alat Ultrasonografi (USG) 2D telah terdistribusi ke 13 Puskesmas Induk, namun pemanfaatan baru 64% karena keterbatasan sertifikasi kompetensi dokter umum.
   - Antropometri kit standar Kemenkes telah tersedia di 420 Posyandu.
4. Target Pengaturan:
   - Mandat pemeriksaan antenatal care (ANC) minimal 6 kali dengan 2 kali pemeriksaan USG oleh dokter umum terlatih.
   - Pemberian Makanan Tambahan (PMT) berbasis pangan lokal bernutrisi tinggi (ikan dan telur).`,
  },
  {
    id: 'perda-sistem-kesehatan-daerah',
    title: 'PERDA Penyelenggaraan Sistem Kesehatan Daerah (SKD)',
    jurisdiction: 'Pemerintah Daerah Kabupaten',
    regulationType: 'PERDA',
    prompt: 'Rancanglah Peraturan Daerah (PERDA) tentang Penyelenggaraan Sistem Kesehatan Daerah (SKD) yang menyelaraskan transformasi 6 pilar kesehatan daerah sesuai mandat Undang-Undang Nomor 17 Tahun 2023 tentang Kesehatan dan Peraturan Pemerintah Nomor 28 Tahun 2024.',
    sampleDatasetDescription: 'Matriks Transformasi Kesehatan Daerah & Analisis Kewenangan',
    sampleDatasetText: `INDIKATOR KINERJA URUSAN KESEHATAN DAERAH:
1. Rasio Tempat Tidur Rumah Sakit: 1,8 per 1.000 penduduk.
2. Rasio Dokter Umum: 48 per 100.000 penduduk; Dokter Spesialis: 18 per 100.000 penduduk.
3. Kesiapan Sistem Rujukan Berbasis Digital (Integrasi SatuSehat): 82% Faskes terhubung.
4. Mandat Pendanaan: Penyediaan alokasi APBD untuk pemenuhan Standar Pelayanan Minimal (SPM) Kesehatan 100% sasaran.`,
  },
];
