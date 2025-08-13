"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSimplePdf = generateSimplePdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
function generateSimplePdf(title, lines) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks.map((u) => Buffer.from(u)))));
        doc.fontSize(18).text(title, { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        for (const line of lines)
            doc.text(line);
        doc.end();
    });
}
