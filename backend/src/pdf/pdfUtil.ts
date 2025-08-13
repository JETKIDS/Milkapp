import PDFDocument from 'pdfkit';

export function generateSimplePdf(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    for (const line of lines) doc.text(line);

    doc.end();
  });
}


