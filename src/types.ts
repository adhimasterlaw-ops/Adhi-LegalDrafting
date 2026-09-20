/**
 * Shared types for ADHI LEGAL DRAFTING SYSTEM
 */

export type DocumentTab =
  | 'bundle'
  | 'naskah_akademik'
  | 'draft_regulasi'
  | 'penjelasan_akademis'
  | 'manual_integrasi';

export type RegulationType = 'PERBUP' | 'PERDA' | 'PERWALI' | 'KEPBUP';

export type DocumentTypeValue = 'Perbup' | 'Perda' | 'SK Bupati';

export interface ReferenceFileInfo {
  name: string;
  size: number;
  type: string;
  base64?: string;
  downloadUrl?: string;
  rawTextPreview?: string;
}

export interface LegalDraftRequest {
  command: string;
  documentType?: DocumentTypeValue | string;
  statutoryFileUrl?: string | null;
  empiricalFileUrl?: string | null;
  statutoryFileName?: string;
  statutoryBase64?: string;
  statutoryFileType?: string;
  empiricalFileName?: string;
  fileUrl?: string;
  fileBase64?: string;
  fileName?: string;
  fileType?: string;
}

export interface LegalDraftResponse {
  success: boolean;
  model: string;
  command: string;
  documentType?: string;
  hasReferenceFile: boolean;
  referenceFileName?: string | null;
  extractedDataLength?: number;
  markdown: string;
  generatedAt: string;
  error?: string;
  message?: string;
}

export type VisualTheme = 'default-dark' | 'light-judicial' | 'crimson-alert' | 'dark-emerald';

export interface ThemeMetadata {
  suggested_theme?: string;
  document_type?: string;
  jurisdiction?: string;
}

export interface ParsedLegalBundle {
  raw: string;
  title: string;
  naskahAkademik: string;
  draftRegulasi: string;
  penjelasanAkademis: string;
  modelUsed?: string;
  themeMetadata?: ThemeMetadata;
}

export interface SamplePrompt {
  id: string;
  title: string;
  jurisdiction: string;
  regulationType: RegulationType;
  prompt: string;
  sampleDatasetDescription: string;
  sampleDatasetText?: string;
}
