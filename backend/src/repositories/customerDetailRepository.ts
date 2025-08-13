import prisma from '../lib/prisma';

export const customerDetailRepository = {
  async getDetail(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        deliveryCourse: true,
        schedules: true,
        contracts: { include: { product: true, patterns: true } },
      },
    });
    if (!customer) return null;

    const position = await prisma.customerCoursePosition.findFirst({
      where: { customerId: customerId, deliveryCourseId: customer.deliveryCourseId ?? undefined },
    });

    return { customer, position: position?.position ?? null };
  },

  async getMonthlyCalendar(customerId: number, year: number, month: number) {
    // モック: 契約パターンをカレンダーに展開せず、簡易レスポンス
    const contracts = await prisma.customerProductContract.findMany({
      where: { customerId },
      include: { product: true, patterns: true },
    });
    return { year, month, contracts };
  },

  async getMonthlyBilling(customerId: number, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const orders = await prisma.order.findMany({ where: { customerId, orderDate: { gte: start, lte: end } } });
    const total = orders.reduce((a, o) => a + o.totalPrice, 0);
    return { year, month, total };
  },

  async getCoursePosition(customerId: number) {
    return prisma.customerCoursePosition.findMany({ where: { customerId } });
  },

  async setCoursePosition(customerId: number, courseId: number, position: number) {
    return prisma.customerCoursePosition.upsert({
      where: { customerId_deliveryCourseId: { customerId, deliveryCourseId: courseId } },
      update: { position },
      create: { customerId, deliveryCourseId: courseId, position },
    });
  },
};


