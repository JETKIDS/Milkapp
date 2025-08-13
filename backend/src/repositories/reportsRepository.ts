import prisma from '../lib/prisma';

export interface DeliveryListFilter {
  startDate?: string; // ISO
  endDate?: string;   // ISO
  courseId?: number;
}

export interface ProductListFilter extends DeliveryListFilter {}

export interface InvoiceInput {
  customerId: number;
  startDate: string; // ISO
  endDate: string;   // ISO
}

export const reportsRepository = {
  async getDeliveryList(filter: DeliveryListFilter) {
    // 簡易取得: スケジュールと顧客・コースをベースに当該期間の予定を展開（モック）
    // 実運用では契約パターンと期間展開ロジックが必要
    return prisma.customer.findMany({
      where: filter.courseId ? { deliveryCourseId: filter.courseId } : {},
      include: { deliveryCourse: true },
    });
  },

  async getProductList(filter: ProductListFilter) {
    // モック: 全商品の一覧を返却（本来は注文/契約集計）
    return prisma.product.findMany({ include: { manufacturer: true } });
  },

  async createInvoice(input: InvoiceInput) {
    // モック: 期間内の注文合計を集計
    const orders = await prisma.order.findMany({
      where: {
        customerId: input.customerId,
        orderDate: { gte: new Date(input.startDate), lte: new Date(input.endDate) },
      },
    });
    const totalAmount = orders.reduce((acc, o) => acc + o.totalPrice, 0);
    const inv = await prisma.invoiceHistory.create({
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

  async listInvoiceHistory(customerId: number) {
    return prisma.invoiceHistory.findMany({ where: { customerId }, orderBy: { issuedDate: 'desc' } });
  },
};


