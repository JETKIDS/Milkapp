import PDFDocument from 'pdfkit';
import fontkit from 'fontkit';
import fs from 'fs';
import path from 'path';

type FontCandidate = { path: string; postscriptName?: string };

function getJapaneseFontCandidates(): FontCandidate[] {
  const p = (...segs: string[]) => path.join(...segs);
  const list: FontCandidate[] = [
    // Windows system fonts (TTC)
    { path: 'C:/Windows/Fonts/YuGothR.ttc', postscriptName: 'YuGothic-Regular' },
    { path: 'C:/Windows/Fonts/YuGothM.ttc', postscriptName: 'YuGothic-Medium' },
    { path: 'C:/Windows/Fonts/meiryo.ttc', postscriptName: 'Meiryo' },
    { path: 'C:/Windows/Fonts/msgothic.ttc', postscriptName: 'MS-Gothic' },
    // Project bundled fonts (prefer TTF/OTF)
    { path: p(__dirname, 'fonts', 'NotoSansJP-Regular.ttf') },
    { path: p(__dirname, '..', 'pdf', 'fonts', 'NotoSansJP-Regular.ttf') },
    { path: p(process.cwd(), 'backend', 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.ttf') },
    { path: p(process.cwd(), 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.ttf') },
    { path: p(__dirname, 'fonts', 'NotoSansJP-Regular.otf') },
    { path: p(__dirname, '..', 'pdf', 'fonts', 'NotoSansJP-Regular.otf') },
    { path: p(process.cwd(), 'backend', 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.otf') },
    { path: p(process.cwd(), 'src', 'pdf', 'fonts', 'NotoSansJP-Regular.otf') },
  ];
  return list.filter(c => {
    try { return fs.existsSync(c.path); } catch { return false; }
  });
}

function tryRegisterJapaneseFont(doc: any): boolean {
  const candidates = getJapaneseFontCandidates();
  for (const c of candidates) {
    try {
      if (c.path.toLowerCase().endsWith('.ttc') && c.postscriptName) {
        // Let pdfkit/fontkit choose specific face from TTC by PostScript name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).registerFont('jp', c.path, c.postscriptName);
      } else if (c.path.toLowerCase().endsWith('.ttf') || c.path.toLowerCase().endsWith('.otf')) {
        doc.registerFont('jp', c.path);
      } else {
        continue;
      }
      doc.font('jp');
      return true;
    } catch {
      // try next
    }
  }
  return false;
}

export function generateSimplePdf(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    // Enable fontkit to support TTC/OTF/TTF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).registerFontkit?.(fontkit);
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    if (!tryRegisterJapaneseFont(doc)) {
      doc.font('Helvetica');
    }
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
    // Enable fontkit to support TTC/OTF/TTF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).registerFontkit?.(fontkit);
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    if (!tryRegisterJapaneseFont(doc)) {
      doc.font('Helvetica');
    }

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // 列幅: 3列（左/中央/右）想定を最適化
    const colWidths = headers.length === 3
      ? [150, pageWidth - 150 - 120, 120]
      : headers.length === 4
        ? [160, pageWidth - 160 - 160 - 100, 160, 100]
        : Array(headers.length).fill(pageWidth / Math.max(headers.length, 1));

    const startX = doc.page.margins.left;
    let y = doc.y;
    const padding = 6;

    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown(0.5);
    y = doc.y;

    // ヘッダー（背景とボーダー）
    doc.save();
    doc.rect(startX, y, pageWidth, 22).fill('#f1f5f9');
    doc.restore();
    
    // ヘッダーテキスト
    let x = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
      x += colWidths[i];
    }
    y += 22;
    doc.moveTo(startX, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
    y += 4;

    // 行
    const isNumeric = (s: any) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
    for (const row of rows) {
      // ページ末尾近くなら改ページ
      if (y > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.y;
        // 再度ヘッダー
        doc.save();
        doc.rect(startX, y, pageWidth, 22).fill('#f1f5f9');
        doc.restore();
        x = startX;
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
          x += colWidths[i];
        }
        y += 22;
        doc.moveTo(startX, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
        y += 4;
      }

      // 各セルの高さを計算
      const heights = row.map((cell, i) => doc.heightOfString(String(cell ?? ''), { width: colWidths[i] - padding * 2 }));
      const rowHeight = Math.max(heights.reduce((a, b) => Math.max(a, b), 0), 16);

      // 背景（ゼブラ）と枠線
      doc.save();
      const zebra = Math.floor((y - doc.page.margins.top) / (rowHeight + 8)) % 2 === 1;
      if (zebra) {
        doc.rect(startX, y - 2, pageWidth, rowHeight + 10).fill('#f8fafc');
      }
      doc.restore();
      doc.strokeColor('#e2e8f0').rect(startX, y - 2, pageWidth, rowHeight + 10).stroke();

      x = startX;
      // 休配行: 最終列が「休」なら薄い表示
      const rowIsPaused = String(row[row.length - 1] ?? '').trim() === '休';
      if (rowIsPaused) { doc.save(); doc.fillColor('#9ca3af'); try { (doc as any).opacity?.(0.7); } catch {} }
      for (let i = 0; i < headers.length; i++) {
        const cell = row[i] ?? '';
        const alignRight = isNumeric(cell) || headers[i].includes('価格');
        doc.text(String(cell), x + padding, y + 3, { width: colWidths[i] - padding * 2, align: alignRight ? 'right' : 'left' });
        x += colWidths[i];
      }
      if (rowIsPaused) { try { (doc as any).opacity?.(1); } catch {} doc.fillColor('black'); doc.restore(); }
      y += rowHeight + 10;
    }

    doc.end();
  });
}

// 新機能: 複数コース対応の配達スケジュールPDF（コースごとにページ分割）
export function generateMultiCourseSchedulePdf(
  courseSchedules: Array<{
    courseName: string;
    dateRange: string;
    headers: string[];
    rows: string[][];
  }>
): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    // Enable fontkit to support TTC/OTF/TTF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).registerFontkit?.(fontkit);
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    if (!tryRegisterJapaneseFont(doc)) {
      doc.font('Helvetica');
    }

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const padding = 6;

    // 各コースごとにページを作成
    courseSchedules.forEach((courseSchedule, courseIndex) => {
      if (courseIndex > 0) {
        doc.addPage(); // 2コース目以降は新しいページを作成
      }

      const { courseName, dateRange, headers, rows } = courseSchedule;
      
      // 列幅の計算（ヘッダー数に応じて調整）
      const colWidths = headers.length === 5
        ? [60, 120, pageWidth - 60 - 120 - 120 - 80, 120, 80] // 順番、顧客名、住所、商品名、数量
        : headers.length === 7
        ? [60, 40, 60, 100, pageWidth - 60 - 40 - 60 - 100 - 100 - 60, 100, 60] // 日付、曜日、順番、顧客名、住所、商品名、数量
        : Array(headers.length).fill(pageWidth / Math.max(headers.length, 1));

      let y = doc.y;

      // コース名をタイトルとして表示
      doc.fontSize(20).text(`${courseName}`, { underline: true });
      doc.fillColor('#666').fontSize(14).text(`${dateRange}`);
      doc.fillColor('black'); // 色をリセット
      doc.moveDown(0.5);
      y = doc.y;

      // ヘッダー（背景とボーダー）
      doc.save();
      doc.rect(startX, y, pageWidth, 22).fill('#f1f5f9');
      doc.restore();
      
      // ヘッダーテキスト
      let x = startX;
      for (let i = 0; i < headers.length; i++) {
        doc.fontSize(12).text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
        x += colWidths[i];
      }
      y += 22;
      doc.moveTo(startX, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
      y += 4;

      // 行の描画
      const isNumeric = (s: any) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
      for (const row of rows) {
        // ページ末尾近くなら改ページ（同じコース内で）
        if (y > doc.page.height - doc.page.margins.bottom - 40) {
          doc.addPage();
          y = doc.y;
          
          // コース名を再表示（小さめに）
          doc.fontSize(16).text(`${courseName} (続き)`, { underline: true });
          doc.moveDown(0.3);
          y = doc.y;
          
          // 再度ヘッダー
          doc.save();
          doc.rect(startX, y, pageWidth, 22).fill('#f1f5f9');
          doc.restore();
          x = startX;
          for (let i = 0; i < headers.length; i++) {
            doc.fontSize(12).text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
            x += colWidths[i];
          }
          y += 22;
          doc.moveTo(startX, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
          y += 4;
        }

        // 各セルの高さを計算
        const heights = row.map((cell, i) => doc.heightOfString(String(cell ?? ''), { width: colWidths[i] - padding * 2 }));
        const rowHeight = Math.max(heights.reduce((a, b) => Math.max(a, b), 0), 16);

        // 背景（ゼブラ）と枠線
        doc.save();
        const zebra = Math.floor((y - doc.page.margins.top) / (rowHeight + 8)) % 2 === 1;
        if (zebra) {
          doc.rect(startX, y - 2, pageWidth, rowHeight + 10).fill('#f8fafc');
        }
        doc.restore();
        doc.strokeColor('#e2e8f0').rect(startX, y - 2, pageWidth, rowHeight + 10).stroke();

        x = startX;
        const rowIsPaused = String(row[row.length - 1] ?? '').trim() === '休';
        if (rowIsPaused) { doc.save(); doc.fillColor('#9ca3af'); try { (doc as any).opacity?.(0.7); } catch {} }
        for (let i = 0; i < headers.length; i++) {
          const cell = row[i] ?? '';
          const alignRight = isNumeric(cell) || headers[i].includes('価格') || headers[i].includes('数量');
          doc.fontSize(10).text(String(cell), x + padding, y + 3, { width: colWidths[i] - padding * 2, align: alignRight ? 'right' : 'left' });
          x += colWidths[i];
        }
        if (rowIsPaused) { try { (doc as any).opacity?.(1); } catch {} doc.fillColor('black'); doc.restore(); }
        y += rowHeight + 10;
      }

      // コース間の余白を追加（最後のコースでない場合）
      if (courseIndex < courseSchedules.length - 1) {
        y += 20;
      }
    });

    doc.end();
  });
}

// 新機能: 複数顧客の請求書を1つのPDFにまとめて出力（顧客ごとにセクション）
export function generateMultiInvoicePdf(
  sections: Array<{
    title: string; // 例: "請求書 - 山田太郎 様"
    headers: string[]; // ['商品名', '単価', '数量', '金額']
    rows: string[][];  // 明細 + 最後に合計行
    calendar?: { // 追加: カレンダー表示用の情報
      month: string; // 'YYYY-MM'
      days: Array<{ date: string; items: Array<{ productName: string; quantity: number }> }>; 
      footerStore?: { name: string; address: string; phone?: string | null };
    };
    customer?: { name: string; address: string };
    totals?: { subtotal: number; tax: number; total: number };
  }>
): Promise<Buffer> {
  return new Promise((resolve) => {
    // A4横向き
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 20 });
    // Enable fontkit to support TTC/OTF/TTF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).registerFontkit?.(fontkit);
    const chunks: Uint8Array[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));

    if (!tryRegisterJapaneseFont(doc)) {
      doc.font('Helvetica');
    }

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const padding = 6;

    // 1ページに上下2件（顧客2件）
    const perPage = 2;
    for (let i = 0; i < sections.length; i += perPage) {
      if (i > 0) doc.addPage();
      const slice = sections.slice(i, i + perPage);
      const cellWidth = pageWidth;
      const cellHeight = (doc.page.height - doc.page.margins.top - doc.page.margins.bottom) / 2 - 10; // 2段
      const cellYPositions = [doc.page.margins.top, doc.page.margins.top + cellHeight + 20];

      slice.forEach((section, idx) => {
        // 上下のみ（左右分割はしない）
        const row = idx; // 0=上, 1=下
        const x0 = startX;
        const y0 = cellYPositions[row];
        const w = pageWidth;
        const h = cellHeight;

        // 外枠
        doc.strokeColor('#cbd5e1').rect(x0, y0, w, h).stroke();

        // 3分割: 入金票 / 領収書 / 請求書（横幅比 2 : 2 : 6）
        const partWUnit = w / 10;
        const parts = [
          { title: '入金票', x: x0, width: partWUnit * 2 },
          { title: '領収書', x: x0 + partWUnit * 2, width: partWUnit * 2 },
          { title: '請求書', x: x0 + partWUnit * 4, width: partWUnit * 6 },
        ];

        // 各パートのヘッダー
        parts.forEach(p => {
          doc.save();
          doc.rect(p.x, y0, p.width, 22).fill('#f1f5f9');
          doc.restore();
          doc.fontSize(12).text(p.title, p.x + 6, y0 + 6, { width: p.width - 12, align: 'center' });
          doc.moveTo(p.x, y0 + 22).lineTo(p.x + p.width, y0 + 22).strokeColor('#cbd5e1').stroke();
        });

        // 明細（入金票/領収書はサマリ、請求書はカレンダー）
        const baseY = y0 + 26;
        const innerPadding = 6;

        // 左: 入金票（宛名・住所・合計）
        {
          const p = parts[0];
          doc.fontSize(10);
          if (section.customer) {
            doc.text(`${section.customer.name} 様`, p.x + innerPadding, baseY, { width: p.width - innerPadding * 2 });
            doc.text(section.customer.address, p.x + innerPadding, baseY + 14, { width: p.width - innerPadding * 2 });
          }
          // 合計行（最後の行に合計が入っている想定）
          const last = section.rows[section.rows.length - 1];
          const total = last?.[3] ?? '';
          doc.text(`御請求額: ${total}`, p.x + innerPadding, baseY + 32, { width: p.width - innerPadding * 2 });
        }

        // 中: 領収書（宛名/金額/但し書き/店舗名）
        {
          const p = parts[1];
          doc.fontSize(10);
          const last = section.rows[section.rows.length - 1];
          const total = last?.[3] ?? '';
          if (section.customer) doc.text(`${section.customer.name} 様`, p.x + innerPadding, baseY, { width: p.width - innerPadding * 2 });
          doc.text('但し 品代として', p.x + innerPadding, baseY + 14, { width: p.width - innerPadding * 2 });
          doc.fontSize(12).text(`領収金額: ${total}`, p.x + innerPadding, baseY + 30, { width: p.width - innerPadding * 2 });
          if (section.calendar?.footerStore?.name) {
            doc.fontSize(9).text(
              `発行: ${section.calendar.footerStore.name}`,
              p.x + innerPadding,
              baseY + 48,
              { width: p.width - innerPadding * 2 }
            );
          }
        }

        // 右: 請求書（カレンダー + 店舗名）
        {
          const p = parts[2];
          const cal = section.calendar;
          if (cal) {
            const gridX = p.x + innerPadding;
            const gridY = baseY;
            const gridW = p.width - innerPadding * 2;
            const gridH = h - (gridY - y0) - 40; // フッター分余白
            const cols = 7;
            const rows = 6;
            const cw = gridW / cols;
            const ch = gridH / rows;

            // 月と開始曜日を計算
            const [yy, mm] = cal.month.split('-').map(n => Number(n));
            const first = new Date(Date.UTC(yy, (mm || 1) - 1, 1));
            const startDow = first.getUTCDay();
            const daysInMonth = new Date(Date.UTC(yy, (mm || 1), 0)).getUTCDate();

            // 日付→品目一覧
            const map = new Map<string, { productName: string; quantity: number }[]>();
            cal.days.forEach(d => map.set(d.date, d.items));

            // グリッド描画
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const x = gridX + c * cw;
                const y = gridY + r * ch;
                doc.strokeColor('#e2e8f0').rect(x, y, cw, ch).stroke();

                const idx = r * cols + c;
                const day = idx - startDow + 1;
                if (day >= 1 && day <= daysInMonth) {
                  const dstr = `${yy}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  doc.fontSize(9).text(String(day), x + 3, y + 3, { width: cw - 6, align: 'right' });
                  const items = map.get(dstr) || [];
                  let yyText = y + 14;
                  doc.fontSize(8);
                  for (const it of items) {
                    const line = `${it.productName} ×${it.quantity}`;
                    doc.text(line, x + 4, yyText, { width: cw - 8 });
                    yyText += 10;
                    if (yyText > y + ch - 10) break;
                  }
                }
              }
            }

            // フッター: 店舗情報（店舗名・住所・電話）
            if (cal.footerStore) {
              const footerY = y0 + h - 16;
              doc.fontSize(9).text(
                `${cal.footerStore.name}  ${cal.footerStore.address}${cal.footerStore.phone ? '  TEL: ' + cal.footerStore.phone : ''}`,
                p.x + innerPadding,
                footerY,
                { width: p.width - innerPadding * 2, align: 'center' }
              );
            }
          }
        }
      });
    }

    doc.end();
  });
}


