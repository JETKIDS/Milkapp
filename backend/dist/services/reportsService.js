"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.courseInvoiceSchema = exports.invoiceSchema = exports.listFilterSchema = void 0;
const zod_1 = require("zod");
const reportsRepository_1 = require("../repositories/reportsRepository");
const pdfUtil_1 = require("../pdf/pdfUtil");
exports.listFilterSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    courseId: zod_1.z.coerce.number().int().positive().optional(), // 後方互換性のため残す
    courseIds: zod_1.z.array(zod_1.z.coerce.number().int().positive()).optional(), // 新しい複数選択フィールド
    manufacturerIds: zod_1.z.array(zod_1.z.coerce.number().int().positive()).optional(), // メーカー選択
    outputType: zod_1.z.enum(['combined', 'separate']).optional(), // 出力形式
});
exports.invoiceSchema = zod_1.z.object({
    customerId: zod_1.z.coerce.number().int().positive(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
});
exports.courseInvoiceSchema = zod_1.z.object({
    courseId: zod_1.z.coerce.number().int().positive(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
});
exports.reportsService = {
    async deliveryList(input) {
        const filter = exports.listFilterSchema.parse(input ?? {});
        return reportsRepository_1.reportsRepository.getDeliveryList(filter);
    },
    // 新機能: 特定日付のコース別配達スケジュール
    async getDeliveryScheduleForDate(courseId, targetDate) {
        return reportsRepository_1.reportsRepository.getDeliveryScheduleForDate(courseId, targetDate);
    },
    // 新機能: 複数日対応の配達スケジュール
    async getDeliveryScheduleForDateRange(courseId, startDate, endDate) {
        return reportsRepository_1.reportsRepository.getDeliveryScheduleForDateRange(courseId, startDate, endDate);
    },
    // 新機能: 複数コース対応の配達スケジュール
    async getDeliveryScheduleForMultipleCourses(courseIds, startDate, endDate) {
        return reportsRepository_1.reportsRepository.getDeliveryScheduleForMultipleCourses(courseIds, startDate, endDate);
    },
    // コース情報取得
    async getCourseInfo(courseId) {
        return reportsRepository_1.reportsRepository.getCourseInfo(courseId);
    },
    async productList(input) {
        const filter = exports.listFilterSchema.parse(input ?? {});
        return reportsRepository_1.reportsRepository.getProductList(filter);
    },
    async createInvoice(input) {
        const data = exports.invoiceSchema.parse(input);
        return reportsRepository_1.reportsRepository.createInvoice(data);
    },
    async invoiceHistory(customerId) {
        return reportsRepository_1.reportsRepository.listInvoiceHistory(customerId);
    },
    // 新機能: コース別請求書（複数顧客を1PDFに）
    async createCourseInvoices(input) {
        const data = exports.courseInvoiceSchema.parse(input);
        const results = await reportsRepository_1.reportsRepository.createInvoicesByCourse(data);
        const yen = (n) => `${Number(n ?? 0).toLocaleString('ja-JP')}円`;
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
            return (0, pdfUtil_1.generateTablePdf)('請求書（対象顧客なし）', ['項目'], [['該当する顧客がいません']]);
        }
        return (0, pdfUtil_1.generateMultiInvoicePdf)(sections);
    },
};
