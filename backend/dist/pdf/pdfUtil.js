"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSimplePdf = generateSimplePdf;
exports.generateTablePdf = generateTablePdf;
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
        let x = doc.x;
        let y = doc.y;
        const padding = 6;
        doc.fontSize(18).text(title, { underline: true });
        doc.moveDown(0.5);
        // ヘッダー（背景とボーダー）
        doc.save();
        doc.rect(doc.page.margins.left, y, pageWidth, 22).fill('#f1f5f9');
        doc.restore();
        // font already set
        x = doc.x;
        for (let i = 0; i < headers.length; i++) {
            doc.text(headers[i], x + padding, y + 6, { width: colWidths[i] - padding * 2 });
            x += colWidths[i];
        }
        y += 22;
        doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
        y += 4;
        // 行
        const isNumeric = (s) => typeof s === 'number' || (typeof s === 'string' && /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s));
        for (const row of rows) {
            // ページ末尾近くなら改ページ
            if (y > doc.page.height - doc.page.margins.bottom - 40) {
                doc.addPage();
                y = doc.y;
                // 再度ヘッダー
                x = doc.x;
                // font already set
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
                // font already set
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
