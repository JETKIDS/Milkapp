import { z } from 'zod';
import { reportsRepository } from '../repositories/reportsRepository';
import { generateSimplePdf, generateTablePdf, generateMultiInvoicePdf } from '../pdf/pdfUtil';

export const listFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  courseId: z.coerce.number().int().positive().optional(), // 後方互換性のため残す
  courseIds: z.array(z.coerce.number().int().positive()).optional(), // 新しい複数選択フィールド
  manufacturerIds: z.array(z.coerce.number().int().positive()).optional(), // メーカー選択
  outputType: z.enum(['combined', 'separate']).optional(), // 出力形式
});

export const invoiceSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const courseInvoiceSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const reportsService = {
  async deliveryList(input: unknown) {
    const filter = listFilterSchema.parse(input ?? {});
    return reportsRepository.getDeliveryList(filter);
  },
  
  // 新機能: 特定日付のコース別配達スケジュール
  async getDeliveryScheduleForDate(courseId: number, targetDate: string) {
    return reportsRepository.getDeliveryScheduleForDate(courseId, targetDate);
  },

  // 新機能: 複数日対応の配達スケジュール
  async getDeliveryScheduleForDateRange(courseId: number, startDate: string, endDate: string) {
    return reportsRepository.getDeliveryScheduleForDateRange(courseId, startDate, endDate);
  },

  // 新機能: 複数コース対応の配達スケジュール
  async getDeliveryScheduleForMultipleCourses(courseIds: number[], startDate: string, endDate: string) {
    return reportsRepository.getDeliveryScheduleForMultipleCourses(courseIds, startDate, endDate);
  },

  // コース情報取得
  async getCourseInfo(courseId: number) {
    return reportsRepository.getCourseInfo(courseId);
  },
  
  async productList(input: unknown) {
    const filter = listFilterSchema.parse(input ?? {});
    return reportsRepository.getProductList(filter);
  },
  async createInvoice(input: unknown) {
    const data = invoiceSchema.parse(input);
    return reportsRepository.createInvoice(data);
  },
  async invoiceHistory(customerId: number) {
    return reportsRepository.listInvoiceHistory(customerId);
  },

  // 新機能: コース別請求書（複数顧客を1PDFに）
  async createCourseInvoices(input: unknown): Promise<Buffer> {
    const data = courseInvoiceSchema.parse(input);
    const results = await reportsRepository.createInvoicesByCourse(data);

    const yen = (n: number) => `${Number(n ?? 0).toLocaleString('ja-JP')}円`;
    const sections = results.map((r) => ({
      title: `請求書 - ${r.customerName} 様`,
      headers: ['商品名', '単価', '数量', '金額'],
      rows: [
        ...r.details.map((d) => [d.productName, yen(d.unitPrice), String(d.quantity), yen(d.amount)]),
        ['', '', '合計', yen(r.totalAmount)],
      ],
    }));

    // 明細が一切ない場合でも空PDFは返す
    if (sections.length === 0) {
      return generateTablePdf('請求書（対象顧客なし）', ['項目'], [['該当する顧客がいません']]);
    }
    return generateMultiInvoicePdf(sections);
  },
};


