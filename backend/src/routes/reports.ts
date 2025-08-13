import { Router } from 'express';
import { reportsService } from '../services/reportsService';
import { generateSimplePdf } from '../pdf/pdfUtil';

const router = Router();

router.post('/delivery-list', async (req, res, next) => {
  try {
    const items = await reportsService.deliveryList(req.body);
    const lines = items.map((c: any) => `顧客:${c.name} 住所:${c.address} コース:${c.deliveryCourse?.name ?? '-'} `);
    const pdf = await generateSimplePdf('配達リスト', lines);
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
    const lines = items.map((p: any) => `商品:${p.name} メーカー:${p.manufacturer?.name ?? '-'} 価格:${p.price}`);
    const pdf = await generateSimplePdf('商品リスト', lines);
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
    const lines = [
      `請求期間: ${new Date(inv.invoicePeriodStart).toISOString()} ~ ${new Date(inv.invoicePeriodEnd).toISOString()}`,
      `合計金額: ${inv.totalAmount}`,
      `発行日: ${new Date(inv.issuedDate).toISOString()}`,
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


