"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.reportsRepository = {
    async getDeliveryList(filter) {
        // 簡易取得: スケジュールと顧客・コースをベースに当該期間の予定を展開（モック）
        // 実運用では契約パターンと期間展開ロジックが必要
        return prisma_1.default.customer.findMany({
            where: filter.courseId ? { deliveryCourseId: filter.courseId } : {},
            include: { deliveryCourse: true },
        });
    },
    async getProductList(filter) {
        // モック: 全商品の一覧を返却（本来は注文/契約集計）
        return prisma_1.default.product.findMany({ include: { manufacturer: true } });
    },
    async createInvoice(input) {
        // モック: 期間内の注文合計を集計
        const orders = await prisma_1.default.order.findMany({
            where: {
                customerId: input.customerId,
                orderDate: { gte: new Date(input.startDate), lte: new Date(input.endDate) },
            },
        });
        const totalAmount = orders.reduce((acc, o) => acc + o.totalPrice, 0);
        const inv = await prisma_1.default.invoiceHistory.create({
            data: {
                customerId: input.customerId,
                invoicePeriodStart: new Date(input.startDate),
                invoicePeriodEnd: new Date(input.endDate),
                totalAmount,
                issuedDate: new Date(),
            },
        });
        return inv;
    },
    async listInvoiceHistory(customerId) {
        return prisma_1.default.invoiceHistory.findMany({ where: { customerId }, orderBy: { issuedDate: 'desc' } });
    },
};
