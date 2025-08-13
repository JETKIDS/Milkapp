import prisma from '../lib/prisma';

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export const dashboardRepository = {
  async todayDeliveryCount(dayOfWeek: number) {
    return prisma.deliverySchedule.count({ where: { dayOfWeek, isActive: true } });
  },

  async pendingDeliveries(dayOfWeek: number, today: Date) {
    const [schedules, records] = await Promise.all([
      prisma.deliverySchedule.findMany({
        where: { dayOfWeek, isActive: true },
        include: { customer: { select: { id: true, name: true, address: true, deliveryCourseId: true } } },
      }),
      prisma.deliveryRecord.findMany({
        where: { deliveryDate: { gte: startOfDay(today), lte: endOfDay(today) }, status: 'completed' },
        select: { customerId: true },
      }),
    ]);
    const completedSet = new Set(records.map((r) => r.customerId));
    return schedules
      .filter((s) => !completedSet.has(s.customerId))
      .map((s) => ({ customerId: s.customer.id, name: s.customer.name, address: s.customer.address, courseId: s.customer.deliveryCourseId }));
  },

  async deliveryStatusByCourse(dayOfWeek: number, today: Date) {
    const [schedules, records, courses] = await Promise.all([
      prisma.deliverySchedule.findMany({
        where: { dayOfWeek, isActive: true },
        include: { customer: { select: { id: true, deliveryCourseId: true } } },
      }),
      prisma.deliveryRecord.findMany({
        where: { deliveryDate: { gte: startOfDay(today), lte: endOfDay(today) }, status: 'completed' },
        select: { customerId: true },
      }),
      prisma.deliveryCourse.findMany(),
    ]);
    const completedSet = new Set(records.map((r) => r.customerId));
    const courseMap = new Map<number, { courseId: number; courseName: string; total: number; completed: number; pending: number }>();
    for (const c of courses) {
      courseMap.set(c.id, { courseId: c.id, courseName: c.name, total: 0, completed: 0, pending: 0 });
    }
    for (const s of schedules) {
      const courseId = s.customer.deliveryCourseId ?? 0;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, { courseId, courseName: courseId === 0 ? '未設定' : String(courseId), total: 0, completed: 0, pending: 0 });
      }
      const entry = courseMap.get(courseId)!;
      entry.total += 1;
      if (completedSet.has(s.customerId)) entry.completed += 1;
      else entry.pending += 1;
    }
    return Array.from(courseMap.values());
  },

  async monthlySummary(now: Date) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const orders = await prisma.order.findMany({ where: { orderDate: { gte: start, lte: end } } });
    const totalSales = orders.reduce((a, o) => a + o.totalPrice, 0);
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, totalSales };
  },
};


