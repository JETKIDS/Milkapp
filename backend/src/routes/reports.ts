import { Router } from 'express';
import { reportsService } from '../services/reportsService';
import { generateSimplePdf, generateTablePdf } from '../pdf/pdfUtil';

const router = Router();

router.post('/delivery-list', async (req, res, next) => {
  try {
    const items = await reportsService.deliveryList(req.body);
    const headers = ['顧客', '住所', 'コース'];
    const rows = items.map((c: any) => [c.name, c.address, c.deliveryCourse?.name ?? '-']);
    const pdf = await generateTablePdf('配達リスト', headers, rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.status(200).send(pdf);
  } catch (e) {
    next(e);
  }
});

router.post('/product-list', async (req, res, next) => {
  try {
    const items = await reportsService.productList(req.body);
    const headers = ['商品', 'メーカー', '価格'];
    const rows = items.map((p: any) => [p.name, p.manufacturer?.name ?? '-', String(p.price)]);
    const pdf = await generateTablePdf('商品リスト', headers, rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.status(200).send(pdf);
  } catch (e) {
    next(e);
  }
});

router.post('/invoice/:customerId', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const inv = await reportsService.createInvoice({ ...req.body, customerId });
    const formatJst = (d: string | Date) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      const ss = String(dt.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
    };
    const yen = (n: number) => `${Number(n ?? 0).toLocaleString('ja-JP')}円`;
    const lines = [
      `請求期間: ${formatJst(inv.invoicePeriodStart)} ~ ${formatJst(inv.invoicePeriodEnd)}`,
      `合計金額: ${yen(inv.totalAmount)}`,
      `発行日: ${formatJst(inv.issuedDate)}`,
    ];
    const pdf = await generateSimplePdf('請求書', lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.status(200).send(pdf);
  } catch (e) {
    next(e);
  }
});

router.get('/invoice-history/:customerId', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const items = await reportsService.invoiceHistory(customerId);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

export default router;


