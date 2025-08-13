"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsService_1 = require("../services/reportsService");
const pdfUtil_1 = require("../pdf/pdfUtil");
const router = (0, express_1.Router)();
router.post('/delivery-list', async (req, res, next) => {
    try {
        const items = await reportsService_1.reportsService.deliveryList(req.body);
        const lines = items.map((c) => `顧客:${c.name} 住所:${c.address} コース:${c.deliveryCourse?.name ?? '-'} `);
        const pdf = await (0, pdfUtil_1.generateSimplePdf)('配達リスト', lines);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdf.length);
        res.status(200).send(pdf);
    }
    catch (e) {
        next(e);
    }
});
router.post('/product-list', async (req, res, next) => {
    try {
        const items = await reportsService_1.reportsService.productList(req.body);
        const lines = items.map((p) => `商品:${p.name} メーカー:${p.manufacturer?.name ?? '-'} 価格:${p.price}`);
        const pdf = await (0, pdfUtil_1.generateSimplePdf)('商品リスト', lines);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdf.length);
        res.status(200).send(pdf);
    }
    catch (e) {
        next(e);
    }
});
router.post('/invoice/:customerId', async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        const inv = await reportsService_1.reportsService.createInvoice({ ...req.body, customerId });
        const lines = [
            `請求期間: ${new Date(inv.invoicePeriodStart).toISOString()} ~ ${new Date(inv.invoicePeriodEnd).toISOString()}`,
            `合計金額: ${inv.totalAmount}`,
            `発行日: ${new Date(inv.issuedDate).toISOString()}`,
        ];
        const pdf = await (0, pdfUtil_1.generateSimplePdf)('請求書', lines);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdf.length);
        res.status(200).send(pdf);
    }
    catch (e) {
        next(e);
    }
});
router.get('/invoice-history/:customerId', async (req, res, next) => {
    try {
        const customerId = Number(req.params.customerId);
        const items = await reportsService_1.reportsService.invoiceHistory(customerId);
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
