import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function getJapaneseFontPath(): string | null {
  const candidates = [
    // Windows system fonts (common Japanese fonts)
    'C:/Windows/Fonts/YuGothR.ttc',
    'C:/Windows/Fonts/YuGothM.ttc',
    'C:/Windows/Fonts/meiryo.ttc',
    'C:/Windows/Fonts/msgothic.ttc',
    path.join(__dirname, 'fonts', 'NotoSansJP-Regular.ttf'),
    path.join(__dirname, '..', 'pdf', 'fonts', 'NotoSansJP-Regular.ttf'),
    path.join(process.cwd(), 'backend', 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.ttf'),
    path.join(process.cwd(), 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.ttf'),
    // OTF fallback
    path.join(__dirname, 'fonts', 'NotoSansJP-Regular.otf'),
    path.join(__dirname, '..', 'pdf', 'fonts', 'NotoSansJP-Regular.otf'),
    path.join(process.cwd(), 'backend', 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.otf'),
    path.join(process.cwd(), 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.otf'),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

export function generateSimplePdf(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    const jp = getJapaneseFontPath();
    try { if (jp) doc.font(jp); else doc.font('Helvetica'); } catch { doc.font('Helvetica'); }
    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    for (const line of lines) doc.text(line);

    doc.end();
  });
}

export function generateTablePdf(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    const jp = getJapaneseFontPath();
    try { if (jp) doc.font(jp); else doc.font('Helvetica'); } catch { doc.font('Helvetica'); }

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // 列幅: 3列（左/中央/右）想定を最適化
    const colWidths = headers.length === 3
      ? [150, pageWidth - 150 - 120, 120]
      : headers.length === 4
        ? [160, pageWidth - 160 - 160 - 100, 160, 100]
        : Array(headers.length).fill(pageWidth / Math.max(headers.length, 1));

    let x = doc.x;
    let y = doc.y;
    const padding = 6;

    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown(0.5);

    // ヘッダー（背景とボーダー）
    doc.save();
    doc.rect(doc.page.margins.left, y, pageWidth, 22).fill('#f1f5f9');
    doc.restore();
    try { if (jp) doc.font(jp); else doc.font('Helvetica'); } catch { doc.font('Helvetica'); }
    x = doc.x;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
      x += colWidths[i];
    }
    y += 22;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
    y += 4;

    // 行
    try { if (jp) doc.font(jp); else doc.font('Helvetica'); } catch { doc.font('Helvetica'); }
    const isNumeric = (s: any) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
    for (const row of rows) {
      // ページ末尾近くなら改ページ
      if (y > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.y;
        // 再度ヘッダー
        x = doc.x;
        try { if (jp) doc.font(jp); else doc.font('Helvetica'); } catch { doc.font('Helvetica'); }
        doc.save();
        doc.rect(doc.page.margins.left, y, pageWidth, 22).fill('#f1f5f9');
        doc.restore();
        x = doc.x;
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
          x += colWidths[i];
        }
        y += 22;
        doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
        y += 4;
        try { if (jp) doc.font(jp); else doc.font('Helvetica'); } catch { doc.font('Helvetica'); }
      }

      // 各セルの高さを計算
      const heights = row.map((cell, i) => doc.heightOfString(String(cell ?? ''), { width: colWidths[i] - padding * 2 }));
      const rowHeight = Math.max(heights.reduce((a, b) => Math.max(a, b), 0), 16);

      // 背景（ゼブラ）と枠線
      doc.save();
      const zebra = Math.floor((y - doc.page.margins.top) / (rowHeight + 8)) % 2 === 1;
      if (zebra) {
        doc.rect(doc.page.margins.left, y - 2, pageWidth, rowHeight + 10).fill('#f8fafc');
      }
      doc.restore();
      doc.strokeColor('#e2e8f0').rect(doc.page.margins.left, y - 2, pageWidth, rowHeight + 10).stroke();

      x = doc.x;
      for (let i = 0; i < headers.length; i++) {
        const cell = row[i] ?? '';
        const alignRight = isNumeric(cell) || headers[i].includes('価格');
        doc.text(String(cell), x + padding, y + 3, { width: colWidths[i] - padding * 2, align: alignRight ? 'right' : 'left' });
        x += colWidths[i];
      }
      y += rowHeight + 10;
    }

    doc.end();
  });
}


