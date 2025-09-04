"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSimplePdf = generateSimplePdf;
exports.generateTablePdf = generateTablePdf;
exports.generateMultiCourseSchedulePdf = generateMultiCourseSchedulePdf;
exports.generateMultiInvoicePdf = generateMultiInvoicePdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fontkit_1 = __importDefault(require("fontkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getJapaneseFontCandidates() {
    const p = (...segs) => path_1.default.join(...segs);
    const list = [
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
        try {
            return fs_1.default.existsSync(c.path);
        }
        catch {
            return false;
        }
    });
}
function tryRegisterJapaneseFont(doc) {
    const candidates = getJapaneseFontCandidates();
    for (const c of candidates) {
        try {
            if (c.path.toLowerCase().endsWith('.ttc') && c.postscriptName) {
                // Let pdfkit/fontkit choose specific face from TTC by PostScript name
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                doc.registerFont('jp', c.path, c.postscriptName);
            }
            else if (c.path.toLowerCase().endsWith('.ttf') || c.path.toLowerCase().endsWith('.otf')) {
                doc.registerFont('jp', c.path);
            }
            else {
                continue;
            }
            doc.font('jp');
            return true;
        }
        catch {
            // try next
        }
    }
    return false;
}
function generateSimplePdf(title, lines) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        // Enable fontkit to support TTC/OTF/TTF
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.registerFontkit?.(fontkit_1.default);
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));
        if (!tryRegisterJapaneseFont(doc)) {
            doc.font('Helvetica');
        }
        doc.fontSize(18).text(title, { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        for (const line of lines)
            doc.text(line);
        doc.end();
    });
}
function generateTablePdf(title, headers, rows) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        // Enable fontkit to support TTC/OTF/TTF
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.registerFontkit?.(fontkit_1.default);
        const chunks = [];
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
        const isNumeric = (s) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
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
// 新機能: 複数コース対応の配達スケジュールPDF（コースごとにページ分割）
function generateMultiCourseSchedulePdf(courseSchedules) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        // Enable fontkit to support TTC/OTF/TTF
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.registerFontkit?.(fontkit_1.default);
        const chunks = [];
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
            const isNumeric = (s) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
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
                for (let i = 0; i < headers.length; i++) {
                    const cell = row[i] ?? '';
                    const alignRight = isNumeric(cell) || headers[i].includes('価格') || headers[i].includes('数量');
                    doc.fontSize(10).text(String(cell), x + padding, y + 3, { width: colWidths[i] - padding * 2, align: alignRight ? 'right' : 'left' });
                    x += colWidths[i];
                }
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
function generateMultiInvoicePdf(sections) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        // Enable fontkit to support TTC/OTF/TTF
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.registerFontkit?.(fontkit_1.default);
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));
        if (!tryRegisterJapaneseFont(doc)) {
            doc.font('Helvetica');
        }
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const startX = doc.page.margins.left;
        const padding = 6;
        sections.forEach((section, idx) => {
            if (idx > 0) {
                doc.addPage();
            }
            // タイトル
            doc.fontSize(18).text(section.title, { underline: true });
            doc.moveDown(0.5);
            let y = doc.y;
            // 列幅（4列前提: 商品名/単価/数量/金額）
            const headers = section.headers;
            const colWidths = headers.length === 4
                ? [pageWidth - 100 - 70 - 120, 100, 70, 120]
                : Array(headers.length).fill(pageWidth / Math.max(headers.length, 1));
            // ヘッダー背景
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
            const isNumeric = (s) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
            for (const row of section.rows) {
                // 改ページ
                if (y > doc.page.height - doc.page.margins.bottom - 40) {
                    doc.addPage();
                    y = doc.y;
                    // ヘッダー再描画
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
                // 行高さ
                const heights = row.map((cell, i) => doc.heightOfString(String(cell ?? ''), { width: colWidths[i] - padding * 2 }));
                const rowHeight = Math.max(heights.reduce((a, b) => Math.max(a, b), 0), 16);
                // ゼブラ背景
                doc.save();
                const zebra = Math.floor((y - doc.page.margins.top) / (rowHeight + 8)) % 2 === 1;
                if (zebra) {
                    doc.rect(startX, y - 2, pageWidth, rowHeight + 10).fill('#f8fafc');
                }
                doc.restore();
                doc.strokeColor('#e2e8f0').rect(startX, y - 2, pageWidth, rowHeight + 10).stroke();
                x = startX;
                for (let i = 0; i < headers.length; i++) {
                    const cell = row[i] ?? '';
                    const alignRight = isNumeric(cell) || headers[i].includes('単価') || headers[i].includes('数量') || headers[i].includes('金額');
                    doc.fontSize(10).text(String(cell), x + padding, y + 3, { width: colWidths[i] - padding * 2, align: alignRight ? 'right' : 'left' });
                    x += colWidths[i];
                }
                y += rowHeight + 10;
            }
        });
        doc.end();
    });
}
