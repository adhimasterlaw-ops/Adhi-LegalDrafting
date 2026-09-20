/**
 * ============================================================================
 * LEGAL DRAFT SERVICE (Client-Side API Client)
 * ============================================================================
 * Menghubungkan antarmuka React dengan Endpoint Backend Express
 * POST /v1/generate-legal-draft
 */

import { LegalDraftRequest, LegalDraftResponse, ParsedLegalBundle, ThemeMetadata } from '../types';

export async function requestLegalDraft(payload: LegalDraftRequest): Promise<LegalDraftResponse> {
  const response = await fetch('/v1/generate-legal-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Server error: HTTP ${response.status}`);
  }

  return data as LegalDraftResponse;
}

/**
 * Memecah string Markdown gabungan menjadi 3 paket terpisah
 * (Naskah Akademik, Draft Konsep Regulasi, Penjelasan Akademis)
 * serta mengekstrak blok metadata tema frontmatter jika ada.
 */
export function parseLegalBundle(markdown: string, modelUsed?: string): ParsedLegalBundle {
  if (!markdown) {
    return {
      raw: '',
      title: 'ADHI LEGAL DRAFTING SYSTEM',
      naskahAkademik: '',
      draftRegulasi: '',
      penjelasanAkademis: '',
      modelUsed,
    };
  }

  // Ekstrak metadata frontmatter JSON konfigurasi sistem (Theme Engine)
  let themeMetadata: ThemeMetadata | undefined = undefined;
  const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (frontmatterMatch) {
    try {
      const parsedJson = JSON.parse(frontmatterMatch[1].trim());
      themeMetadata = {
        suggested_theme: parsedJson.suggested_theme,
        document_type: parsedJson.document_type,
        jurisdiction: parsedJson.jurisdiction,
      };
    } catch (e) {
      // Jika bukan JSON murni, biarkan tanpa crash
    }
  }

  // Cari posisi penanda paket utama (Mendukung baik format PART 1/2/3 maupun PAKET 1/2/3, dengan berbagai variasi judul)
  const naRegex = /(?:^|\n)##?\s*(?:(?:PAKET|PART)\s*1\b|NASKAH\s*AKADEMIK\b)/i;
  const regRegex = /(?:^|\n)##?\s*(?:(?:PAKET|PART)\s*2\b|(?:DRAFT|RANCANGAN|KONSEP)\s*(?:KONSEP\s*)?(?:REGULASI|PERATURAN|LEGAL\s*DRAFT)\b)/i;
  const expRegex = /(?:^|\n)##?\s*(?:(?:PAKET|PART)\s*3\b|PENJELASAN\s*(?:AKADEMIS|AKADEMIK|PASAL|UMUM)?\b)/i;

  let naIndex = markdown.search(naRegex);
  if (naIndex > 0 && markdown[naIndex] === '\n') naIndex += 1;

  let regIndex = markdown.search(regRegex);
  if (regIndex > 0 && markdown[regIndex] === '\n') regIndex += 1;

  let expIndex = markdown.search(expRegex);
  if (expIndex > 0 && markdown[expIndex] === '\n') expIndex += 1;

  let naskahAkademik = '';
  let draftRegulasi = '';
  let penjelasanAkademis = '';

  if (naIndex !== -1 && regIndex !== -1 && expIndex !== -1) {
    naskahAkademik = markdown.slice(naIndex, regIndex).trim();
    draftRegulasi = markdown.slice(regIndex, expIndex).trim();
    penjelasanAkademis = markdown.slice(expIndex).trim();
  } else if (regIndex !== -1 && expIndex !== -1) {
    naskahAkademik = naIndex !== -1 ? markdown.slice(naIndex, regIndex).trim() : '';
    draftRegulasi = markdown.slice(regIndex, expIndex).trim();
    penjelasanAkademis = markdown.slice(expIndex).trim();
  } else {
    // Jika format heading sedikit berbeda, fallback ke seluruh markdown
    naskahAkademik = markdown;
    draftRegulasi = markdown;
    penjelasanAkademis = markdown;
  }

  // Ekstrak judul utama jika ada (abaikan baris frontmatter)
  const linesWithoutFrontmatter = frontmatterMatch
    ? markdown.slice(frontmatterMatch[0].length).split('\n')
    : markdown.split('\n');

  const firstLine =
    linesWithoutFrontmatter.find((l) => l.startsWith('# ')) ||
    'Rancangan Regulasi Kesehatan Daerah';
  const title = firstLine.replace(/^#\s*/, '').trim();

  return {
    raw: markdown,
    title,
    naskahAkademik: naskahAkademik || markdown,
    draftRegulasi: draftRegulasi || markdown,
    penjelasanAkademis: penjelasanAkademis || markdown,
    modelUsed,
    themeMetadata,
  };
}
