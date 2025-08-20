import { Router } from 'express';
import { reportsService } from '../services/reportsService';
import { generateSimplePdf, generateTablePdf, generateMultiCourseSchedulePdf } from '../pdf/pdfUtil';
import prisma from '../lib/prisma';

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

// 新機能: 特定日付のコース別配達スケジュールPDF
router.post('/delivery-schedule', async (req, res, next) => {
  try {
    const { courseId, targetDate } = req.body;
    if (!courseId || !targetDate) {
      return res.status(400).json({ error: 'courseId and targetDate are required' });
    }
    
    const items = await reportsService.getDeliveryScheduleForDate(courseId, targetDate);
    
    // PDF用のデータを整形
    const headers = ['順番', '顧客名', '住所', '商品名', '数量'];
    const rows: string[][] = [];
    
    items.forEach((item: any, index: number) => {
      item.deliveries.forEach((delivery: any, deliveryIndex: number) => {
        rows.push([
          deliveryIndex === 0 ? String(index + 1) : '', // 最初の商品のみ順番表示
          deliveryIndex === 0 ? item.customerName : '', // 最初の商品のみ顧客名表示
          deliveryIndex === 0 ? item.customerAddress : '', // 最初の商品のみ住所表示
          delivery.productName,
          String(delivery.quantity)
        ]);
      });
    });
    
    const date = new Date(targetDate);
    const title = `配達スケジュール - ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    const pdf = await generateTablePdf(title, headers, rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.status(200).send(pdf);
  } catch (e) {
    next(e);
  }
});

// 新機能: 複数日対応の配達スケジュールPDF
router.post('/delivery-schedule-multi', async (req, res, next) => {
  try {
    const { courseId, courseIds, startDate, endDate } = req.body;
    
    // 複数コース対応
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      // 複数コース選択の場合
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'courseIds, startDate, and endDate are required' });
      }
      
      const items = await reportsService.getDeliveryScheduleForMultipleCourses(courseIds, startDate, endDate);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateRange = `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日〜${end.getMonth() + 1}月${end.getDate()}日`;
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      
      // 各コースごとにデータを整理
      const courseSchedules: Array<{
        courseName: string;
        dateRange: string;
        headers: string[];
        rows: string[][];
      }> = [];

      // コース情報を取得してコースごとに処理
      for (const courseId of courseIds) {
        const courseInfo = await reportsService.getCourseInfo(courseId);
        const courseName = courseInfo?.name || `コース${courseId}`;
        
        const headers = ['日付', '曜日', '順番', '顧客名', '住所', '商品名', '数量'];
        const rows: string[][] = [];
        
        // 該当コースのデータのみを抽出
        items.forEach((dateItem: any) => {
          const date = new Date(dateItem.date);
          const dayName = dayNames[date.getDay()];
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
          
          const courseData = dateItem.courses.find((c: any) => c.courseId === courseId);
          if (courseData) {
            courseData.deliveries.forEach((item: any, index: number) => {
              item.deliveries.forEach((delivery: any, deliveryIndex: number) => {
                rows.push([
                  deliveryIndex === 0 && index === 0 ? dateStr : '', // 最初の行のみ日付表示
                  deliveryIndex === 0 && index === 0 ? dayName : '', // 最初の行のみ曜日表示
                  deliveryIndex === 0 ? String(index + 1) : '', // 最初の商品のみ順番表示
                  deliveryIndex === 0 ? item.customerName : '', // 最初の商品のみ顧客名表示
                  deliveryIndex === 0 ? item.customerAddress : '', // 最初の商品のみ住所表示
                  delivery.productName,
                  String(delivery.quantity)
                ]);
              });
            });
          }
        });
        
        if (rows.length > 0) {
          courseSchedules.push({
            courseName,
            dateRange,
            headers,
            rows
          });
        }
      }
      
      const pdf = await generateMultiCourseSchedulePdf(courseSchedules);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    } else {
      // 単一コース選択の場合（後方互換性）
      if (!courseId || !startDate || !endDate) {
        return res.status(400).json({ error: 'courseId, startDate, and endDate are required' });
      }
      
      const items = await reportsService.getDeliveryScheduleForDateRange(courseId, startDate, endDate);
      
      // PDF用のデータを整形
      const headers = ['日付', '曜日', '順番', '顧客名', '住所', '商品名', '数量'];
      const rows: string[][] = [];
      
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      
      items.forEach((dateItem: any) => {
        const date = new Date(dateItem.date);
        const dayName = dayNames[date.getDay()];
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        
        dateItem.deliveries.forEach((item: any, index: number) => {
          item.deliveries.forEach((delivery: any, deliveryIndex: number) => {
            rows.push([
              deliveryIndex === 0 && index === 0 ? dateStr : '', // 最初の行のみ日付表示
              deliveryIndex === 0 && index === 0 ? dayName : '', // 最初の行のみ曜日表示
              deliveryIndex === 0 ? String(index + 1) : '', // 最初の商品のみ順番表示
              deliveryIndex === 0 ? item.customerName : '', // 最初の商品のみ顧客名表示
              deliveryIndex === 0 ? item.customerAddress : '', // 最初の商品のみ住所表示
              delivery.productName,
              String(delivery.quantity)
            ]);
          });
        });
      });
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const title = `配達スケジュール - ${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日〜${end.getMonth() + 1}月${end.getDate()}日`;
      
      const pdf = await generateTablePdf(title, headers, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    }
  } catch (e) {
    next(e);
  }
});

router.post('/product-list', async (req, res, next) => {
  try {
    const items = await reportsService.productList(req.body);
    const { outputType, courseIds } = req.body;
    
    if (outputType === 'separate' && courseIds && courseIds.length > 1) {
      // コース別出力の場合
      const courseSchedules: Array<{
        courseName: string;
        dateRange: string;
        headers: string[];
        rows: string[][];
      }> = [];

      // 各コースのデータを整理
      const courseMap = new Map<number, { courseName: string; products: any[] }>();
      
      items.forEach((item: any) => {
        if (item.courseBreakdown) {
          item.courseBreakdown.forEach((courseData: any, courseId: number) => {
            if (!courseMap.has(courseId)) {
              courseMap.set(courseId, {
                courseName: courseData.courseName,
                products: []
              });
            }
            courseMap.get(courseId)!.products.push({
              productName: item.productName,
              manufacturerName: item.manufacturerName,
              quantity: courseData.quantity
            });
          });
        }
      });

      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      const dateRange = `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日〜${end.getMonth() + 1}月${end.getDate()}日`;

      courseMap.forEach((courseData, courseId) => {
        const headers = ['商品名', 'メーカー', '必要数量'];
        const rows = courseData.products.map(p => [
          p.productName,
          p.manufacturerName,
          String(p.quantity)
        ]);

        if (rows.length > 0) {
          courseSchedules.push({
            courseName: courseData.courseName,
            dateRange,
            headers,
            rows
          });
        }
      });

      const pdf = await generateMultiCourseSchedulePdf(courseSchedules);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    } else {
      // 合算出力の場合
      const start = new Date(req.body.startDate || new Date());
      const end = new Date(req.body.endDate || new Date());
      const title = `商品リスト - ${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日〜${end.getMonth() + 1}月${end.getDate()}日`;
      
      const headers = ['商品名', 'メーカー', '必要数量'];
      const rows = items.map((item: any) => [
        item.productName,
        item.manufacturerName,
        String(item.totalQuantity)
      ]);
      
      const pdf = await generateTablePdf(title, headers, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    }
  } catch (e) {
    next(e);
  }
});

router.post('/invoice/:customerId', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const inv = await reportsService.createInvoice({ ...req.body, customerId });
    
    // 顧客情報を取得
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true }
    });
    
    const formatJst = (d: string | Date) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const yen = (n: number) => `${Number(n ?? 0).toLocaleString('ja-JP')}円`;
    
    // 詳細な請求書PDFを作成
    if (inv.details && inv.details.length > 0) {
      const title = `請求書 - ${customer?.name || '顧客'}様`;
      const headers = ['商品名', '単価', '数量', '金額'];
      const rows = inv.details.map((detail: any) => [
        detail.productName,
        yen(detail.unitPrice),
        String(detail.quantity),
        yen(detail.amount)
      ]);
      
      // 合計行を追加
      rows.push(['', '', '合計', yen(inv.totalAmount)]);
      
      const pdf = await generateTablePdf(title, headers, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    } else {
      // 詳細がない場合はシンプルな請求書
      const lines = [
        `お客様: ${customer?.name || '顧客'}`,
        `請求期間: ${formatJst(inv.invoicePeriodStart)} ～ ${formatJst(inv.invoicePeriodEnd)}`,
        `合計金額: ${yen(inv.totalAmount)}`,
        `発行日: ${formatJst(inv.issuedDate)}`,
        '',
        '※契約データが見つかりませんでした',
      ];
      const pdf = await generateSimplePdf('請求書', lines);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    }
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


