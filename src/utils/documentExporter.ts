/**
 * ============================================================================
 * DOCUMENT EXPORTER (PDF & DOCX GENERATOR)
 * ============================================================================
 * Mengonversi teks Markdown produk hukum menjadi dokumen fisik:
 * 1. File .pdf (Format Standar Naskah Perundang-undangan JDIH dengan kop & margin)
 * 2. File .docx (Format Dokumen Word Resmi JDIH yang dapat diedit langsung oleh Biro Hukum)
 *    Mendukung Heading 1-4, bullet list, ordered/legal list (Pasal, Ayat, Butir),
 *    tabel Markdown, format cetak tebal/miring inline, kop naskah resmi, dan penomoran halaman.
 */

import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Membersihkan simbol Markdown untuk teks murni (PDF)
 */
function stripMarkdownSymbols(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/___(.*?)___/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^#+\s*/, '')
    .trim();
}

/**
 * Mengurai string inline Markdown menjadi array TextRun docx
 * Mendukung kombinasi bold (** atau __), italic (* atau _), bold-italic, dan code
 */
function parseInlineMarkdown(
  text: string,
  defaultProps: {
    font?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italics?: boolean;
  } = {}
): TextRun[] {
  const font = defaultProps.font || 'Times New Roman';
  const size = defaultProps.size || 22; // 11pt = 22 half-points
  const color = defaultProps.color || '0F172A';

  const runs: TextRun[] = [];
  // Regex untuk mencocokkan ***bold italic***, **bold**, *italic*, __bold__, _italic_, `code`
  const regex =
    /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|__[\s\S]+?__|(?<!\*)\*[^*]+?\*(?!\*)|(?<!_)_[^_]+?_(?!_)|\`[^\`]+?\`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.substring(lastIndex, match.index);
      if (plain) {
        runs.push(
          new TextRun({
            text: plain,
            font,
            size,
            color,
            bold: defaultProps.bold || false,
            italics: defaultProps.italics || false,
          })
        );
      }
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('***') && matchedStr.endsWith('***')) {
      runs.push(
        new TextRun({
          text: matchedStr.slice(3, -3),
          font,
          size,
          color,
          bold: true,
          italics: true,
        })
      );
    } else if (
      (matchedStr.startsWith('**') && matchedStr.endsWith('**')) ||
      (matchedStr.startsWith('__') && matchedStr.endsWith('__'))
    ) {
      runs.push(
        new TextRun({
          text: matchedStr.slice(2, -2),
          font,
          size,
          color,
          bold: true,
          italics: defaultProps.italics || false,
        })
      );
    } else if (
      (matchedStr.startsWith('*') && matchedStr.endsWith('*')) ||
      (matchedStr.startsWith('_') && matchedStr.endsWith('_'))
    ) {
      runs.push(
        new TextRun({
          text: matchedStr.slice(1, -1),
          font,
          size,
          color,
          bold: defaultProps.bold || false,
          italics: true,
        })
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      runs.push(
        new TextRun({
          text: matchedStr.slice(1, -1),
          font: 'Courier New',
          size: Math.max(size - 2, 18),
          color: '1E293B',
        })
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const trailing = text.substring(lastIndex);
    if (trailing) {
      runs.push(
        new TextRun({
          text: trailing,
          font,
          size,
          color,
          bold: defaultProps.bold || false,
          italics: defaultProps.italics || false,
        })
      );
    }
  }

  // Jika tidak ada run sama sekali (string kosong), return fallback
  if (runs.length === 0) {
    runs.push(new TextRun({ text: '', font, size, color }));
  }

  return runs;
}

/**
 * Pemicu unduhan berkas biner di browser
 */
async function triggerBrowserDownload(blob: Blob, filename: string): Promise<void> {
  try {
    saveAs(blob, filename);
  } catch {
    // Fallback aman untuk lingkungan sandbox iframe
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 200);
  }
}

export interface DocxExportOptions {
  title?: string;
  documentCategory?: 'draft_regulasi' | 'naskah_akademik' | 'penjelasan_akademis' | 'bundle' | 'manual_integrasi' | string;
  filename?: string;
  institutionName?: string;
}

/**
 * Ekspor ke file fisik .docx (Microsoft Word) dengan styling hukum profesional
 */
export async function exportToDocx(
  markdownContent: string,
  filenameOrOptions?: string | DocxExportOptions
): Promise<void> {
  const options: DocxExportOptions =
    typeof filenameOrOptions === 'string'
      ? { filename: filenameOrOptions }
      : filenameOrOptions || {};

  const baseFilename = options.filename || 'Draft_Regulasi_Kesehatan_Daerah.docx';
  const targetFilename = baseFilename.endsWith('.docx') ? baseFilename : `${baseFilename}.docx`;

  const lines = markdownContent.split('\n');
  const docElements: (Paragraph | Table)[] = [];

  // 1. KOP NASKAH RESMI JDIH (Biro Hukum / Pemda)
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'JARINGAN DOKUMENTASI DAN INFORMASI HUKUM (JDIH)',
          bold: true,
          size: 26, // 13pt
          font: 'Times New Roman',
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'PERANCANGAN PERATURAN PERUNDANG-UNDANGAN SEKTOR KESEHATAN DAERAH',
          bold: true,
          size: 20, // 10pt
          font: 'Times New Roman',
          color: '334155',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: 'Harmonisasi Yuridis: UU No. 17 Tahun 2023 tentang Kesehatan & PP No. 28 Tahun 2024',
          italics: true,
          size: 18, // 9pt
          font: 'Times New Roman',
          color: '64748B',
        }),
      ],
    }),
    // Garis Batas Kop Dokumen
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 12, // 1.5pt
          color: '1E293B',
        },
      },
      children: [new TextRun({ text: '' })],
    })
  );

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Baris kosong
    if (!trimmed) {
      docElements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      i++;
      continue;
    }

    // A. DETEKSI TABEL MARKDOWN (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Parsing baris tabel
      const validRows = tableLines.filter((l) => !/^[\|\s\-:]+$/.test(l));
      if (validRows.length > 0) {
        const docxRows: TableRow[] = validRows.map((rowText, rowIndex) => {
          const cells = rowText
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());

          return new TableRow({
            children: cells.map((cellText) => {
              const isHeader = rowIndex === 0;
              return new TableCell({
                width: { size: Math.floor(100 / (cells.length || 1)), type: WidthType.PERCENTAGE },
                shading: isHeader ? { fill: 'F1F5F9' } : undefined,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                    children: parseInlineMarkdown(cellText, {
                      font: 'Times New Roman',
                      size: isHeader ? 20 : 19,
                      bold: isHeader,
                    }),
                  }),
                ],
              });
            }),
          });
        });

        docElements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: docxRows,
          })
        );
        docElements.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
        continue;
      }
    }

    // B. HEADINGS MARKDOWN (#, ##, ###, ####)
    if (rawLine.startsWith('# ')) {
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 260, after: 140 },
          children: parseInlineMarkdown(rawLine.slice(2).trim(), {
            font: 'Times New Roman',
            size: 26, // 13pt
            bold: true,
            color: '0F172A',
          }),
        })
      );
      i++;
      continue;
    }

    if (rawLine.startsWith('## ')) {
      const headingText = rawLine.slice(3).trim();
      const isBab = /^BAB\s+[IVXLCDM]+/i.test(headingText);
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: isBab ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 240, after: 120 },
          children: parseInlineMarkdown(headingText, {
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            color: '1E293B',
          }),
        })
      );
      i++;
      continue;
    }

    if (rawLine.startsWith('### ')) {
      const headingText = rawLine.slice(4).trim();
      const isPasal = /^Pasal\s+\d+/i.test(headingText);
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: isPasal ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 200, after: 100 },
          children: parseInlineMarkdown(headingText, {
            font: 'Times New Roman',
            size: 22, // 11pt
            bold: true,
            color: '1E293B',
          }),
        })
      );
      i++;
      continue;
    }

    if (rawLine.startsWith('#### ')) {
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_4,
          alignment: AlignmentType.LEFT,
          spacing: { before: 160, after: 80 },
          children: parseInlineMarkdown(rawLine.slice(5).trim(), {
            font: 'Times New Roman',
            size: 21, // 10.5pt
            bold: true,
            color: '334155',
          }),
        })
      );
      i++;
      continue;
    }

    // C. BLOCKQUOTE (> ...)
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 720 }, // 0.5 inch indent
          spacing: { after: 100, line: 276 },
          children: parseInlineMarkdown(quoteText, {
            font: 'Times New Roman',
            size: 21,
            italics: true,
            color: '334155',
          }),
        })
      );
      i++;
      continue;
    }

    // D. HORIZONTAL RULE (---, ***, ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      docElements.push(
        new Paragraph({
          spacing: { before: 160, after: 160 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
          },
          children: [],
        })
      );
      i++;
      continue;
    }

    // E. BULLET LIST (- , * , + )
    const bulletMatch = rawLine.match(/^(\s*)([\*\-\+])\s+(.*)$/);
    if (bulletMatch) {
      const indentSpaces = bulletMatch[1].length;
      const level = Math.min(Math.floor(indentSpaces / 2), 3);
      const listContent = bulletMatch[3];

      docElements.push(
        new Paragraph({
          bullet: { level },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 70, line: 276 },
          children: parseInlineMarkdown(listContent, {
            font: 'Times New Roman',
            size: 22,
          }),
        })
      );
      i++;
      continue;
    }

    // F. ORDERED / LEGAL NUMBERED LIST (1. , a. , (1) , 1) , dst.)
    const legalNumberMatch = rawLine.match(
      /^(\s*)(\d+\.|\([0-9]+\)|[a-zA-Z]\.|\([a-zA-Z]\)|\d+\))\s+(.*)$/
    );
    if (legalNumberMatch) {
      const indentSpaces = legalNumberMatch[1].length;
      const level = Math.min(Math.floor(indentSpaces / 2), 3);
      const prefix = legalNumberMatch[2];
      const bodyText = legalNumberMatch[3];

      docElements.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: 720 + level * 360,
            hanging: 360,
          },
          spacing: { after: 80, line: 276 },
          children: [
            new TextRun({
              text: prefix + '\t',
              bold: true,
              font: 'Times New Roman',
              size: 22,
              color: '0F172A',
            }),
            ...parseInlineMarkdown(bodyText, {
              font: 'Times New Roman',
              size: 22,
            }),
          ],
        })
      );
      i++;
      continue;
    }

    // G. TEKS HUKUM SPESIFIK (BAB, Pasal, Frasa Sakral)
    const isCenteredStatute =
      /^BAB\s+[IVXLCDM]+/i.test(trimmed) ||
      /^DENGAN RAHMAT TUHAN YANG MAHA ESA/i.test(trimmed) ||
      /^(BUPATI|GUBERNUR|WALIKOTA|DEWAN PERWAKILAN RAKYAT DAERAH)/i.test(trimmed) ||
      /^MEMUTUSKAN\s*:/i.test(trimmed) ||
      /^MENETAPKAN\s*:/i.test(trimmed);

    const isPasalTitle = /^Pasal\s+\d+/i.test(trimmed);

    if (isCenteredStatute) {
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 120 },
          children: parseInlineMarkdown(trimmed, {
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            color: '0F172A',
          }),
        })
      );
      i++;
      continue;
    }

    if (isPasalTitle) {
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 80 },
          children: parseInlineMarkdown(trimmed, {
            font: 'Times New Roman',
            size: 22,
            bold: true,
            color: '0F172A',
          }),
        })
      );
      i++;
      continue;
    }

    // H. PARAGRAF STANDAR (Justified, Times New Roman 11pt, 1.15 line spacing)
    const isMajorLegalHeader =
      trimmed.startsWith('Menimbang:') ||
      trimmed.startsWith('Mengingat:') ||
      trimmed.startsWith('Ketentuan Umum:') ||
      trimmed.startsWith('KETENTUAN SANKSI') ||
      trimmed.startsWith('KETENTUAN PERALIHAN') ||
      trimmed.startsWith('KETENTUAN PENUTUP');

    docElements.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: {
          before: isMajorLegalHeader ? 140 : 0,
          after: 100,
          line: 276, // 1.15 line spacing
        },
        children: parseInlineMarkdown(trimmed, {
          font: 'Times New Roman',
          size: 22,
          bold: isMajorLegalHeader,
        }),
      })
    );
    i++;
  }

  // 2. STRUKTUR DOKUMEN DENGAN RUNNING HEADER, FOOTER, & MARGIN RESMI
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1417, // 2.5 cm
              bottom: 1417, // 2.5 cm
              left: 1701, // 3.0 cm (margin jilid resmi perundang-undangan)
              right: 1134, // 2.0 cm
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: 'JDIH KESEHATAN DAERAH • HARMONISASI UU NO. 17/2023 & PP NO. 28/2024',
                    size: 16, // 8pt
                    font: 'Times New Roman',
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: 'Halaman ',
                    size: 18,
                    font: 'Times New Roman',
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: 'Times New Roman',
                    color: '64748B',
                  }),
                  new TextRun({
                    text: ' dari ',
                    size: 18,
                    font: 'Times New Roman',
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    font: 'Times New Roman',
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  await triggerBrowserDownload(blob, targetFilename);
}

/**
 * Ekspor ke file fisik .pdf (PDF)
 */
export async function exportToPdf(
  markdownContent: string,
  filename: string = 'Draft_Regulasi_Kesehatan_Daerah.pdf'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 25;
  const marginRight = 20;
  const marginTop = 25;
  const marginBottom = 20;
  const usableWidth = pageWidth - marginLeft - marginRight;

  let yCursor = marginTop;

  // Header Dokumen Hukum
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text('ADHI LEGAL DRAFTING SYSTEM - SEKTOR KESEHATAN DAERAH', marginLeft, 15);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Standar JDIH Berdasarkan UU No. 17/2023 & PP No. 28/2024', marginLeft, 19);

  // Garis batas kop naskah
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, 21, pageWidth - marginRight, 21);

  const lines = markdownContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Baris kosong
    if (!trimmed) {
      yCursor += 4;
      if (yCursor > pageHeight - marginBottom) {
        doc.addPage();
        yCursor = marginTop;
      }
      continue;
    }

    // Heading 1 (# ...)
    if (rawLine.startsWith('# ')) {
      yCursor += 6;
      if (yCursor > pageHeight - marginBottom - 15) {
        doc.addPage();
        yCursor = marginTop;
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900

      const clean = stripMarkdownSymbols(rawLine);
      const wrapped = doc.splitTextToSize(clean, usableWidth);
      for (const w of wrapped) {
        doc.text(w, marginLeft, yCursor);
        yCursor += 6;
      }
      yCursor += 2;
      continue;
    }

    // Heading 2 (## ...)
    if (rawLine.startsWith('## ')) {
      yCursor += 5;
      if (yCursor > pageHeight - marginBottom - 12) {
        doc.addPage();
        yCursor = marginTop;
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 40, 80);

      const clean = stripMarkdownSymbols(rawLine);
      const wrapped = doc.splitTextToSize(clean, usableWidth);
      for (const w of wrapped) {
        doc.text(w, marginLeft, yCursor);
        yCursor += 5.5;
      }
      yCursor += 2;
      continue;
    }

    // Heading 3 (### ...)
    if (rawLine.startsWith('### ')) {
      yCursor += 4;
      if (yCursor > pageHeight - marginBottom - 10) {
        doc.addPage();
        yCursor = marginTop;
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);

      const clean = stripMarkdownSymbols(rawLine);
      const wrapped = doc.splitTextToSize(clean, usableWidth);
      for (const w of wrapped) {
        doc.text(w, marginLeft, yCursor);
        yCursor += 5;
      }
      continue;
    }

    // Teks biasa / Paragraf / Pasal
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(35, 35, 35);

    // Cek jika teks berhuruf tebal (misal "Pasal 1", "Menimbang:")
    if (rawLine.startsWith('**') || trimmed.startsWith('Pasal ') || trimmed.startsWith('BAB ')) {
      doc.setFont('times', 'bold');
    }

    const clean = stripMarkdownSymbols(rawLine);
    const wrapped = doc.splitTextToSize(clean, usableWidth);

    for (const w of wrapped) {
      if (yCursor > pageHeight - marginBottom) {
        doc.addPage();
        yCursor = marginTop;
      }
      doc.text(w, marginLeft, yCursor);
      yCursor += 4.8;
    }
  }

  // Tambahkan penomoran halaman resmi di bagian bawah
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `ADHI LEGAL DRAFTING SYSTEM - Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

