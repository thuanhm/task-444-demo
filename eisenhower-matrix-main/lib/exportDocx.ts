'use client';

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Header,
  convertInchesToTwip,
} from 'docx';

/**
 * Nhận dạng dạng dòng để áp định dạng phù hợp khi xuất Word:
 * - Quốc hiệu / tiêu ngữ: hai dòng đầu tiên dạng chữ hoa có gạch chân
 * - Tiêu đề "BÁO CÁO": in hoa, căn giữa, cỡ lớn
 * - Mục La Mã (I. II. III...): in đậm
 * - "Kính gửi", "Nơi nhận": in đậm nghiêng
 * - Dòng trống: giữ khoảng cách đoạn
 */
function classifyLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return 'empty' as const;
  if (/^ĐỘC LẬP/i.test(trimmed) || /^CỘNG HÒA/i.test(trimmed)) return 'letterhead' as const;
  if (/^-{3,}$/.test(trimmed)) return 'divider' as const;
  if (/^BÁO CÁO\s*$/i.test(trimmed)) return 'title' as const;
  if (/^(I{1,3}|IV|V)\.\s+\S/.test(trimmed)) return 'heading' as const;
  if (/^Kính gửi[:\s]/i.test(trimmed)) return 'recipient' as const;
  if (/^Nơi nhận[:\s]*$/i.test(trimmed)) return 'recipientList' as const;
  if (/^-\s+/.test(trimmed)) return 'bullet' as const;
  return 'body' as const;
}

/** Sinh file .docx thật (chuẩn OOXML) từ nội dung báo cáo dạng văn bản thuần */
export async function exportReportToDocx(reportText: string, fileName: string) {
  const lines = reportText.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const kind = classifyLine(rawLine);
    const text = rawLine.trim();

    switch (kind) {
      case 'empty':
        paragraphs.push(new Paragraph({ text: '' }));
        break;

      case 'letterhead':
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [
              new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' }),
            ],
          }),
        );
        break;

      case 'divider':
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            border: { bottom: { color: '000000', space: 1, style: 'single', size: 6 } },
            children: [new TextRun({ text: '', size: 2 })],
          }),
        );
        break;

      case 'title':
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text,
                bold: true,
                size: 32,
                font: 'Times New Roman',
              }),
            ],
          }),
        );
        break;

      case 'heading':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({ text, bold: true, size: 26, font: 'Times New Roman' }),
            ],
          }),
        );
        break;

      case 'recipient':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 120, after: 200 },
            children: [
              new TextRun({ text, bold: true, italics: true, size: 26, font: 'Times New Roman' }),
            ],
          }),
        );
        break;

      case 'recipientList':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 200, after: 60 },
            children: [
              new TextRun({ text, bold: true, italics: true, size: 24, font: 'Times New Roman' }),
            ],
          }),
        );
        break;

      case 'bullet':
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: convertInchesToTwip(0.3) },
            children: [new TextRun({ text, size: 26, font: 'Times New Roman' })],
          }),
        );
        break;

      default:
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 360 },
            indent: { firstLine: convertInchesToTwip(0.3) },
            children: [new TextRun({ text, size: 26, font: 'Times New Roman' })],
          }),
        );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }, // A4
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({ children: [] }),
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
