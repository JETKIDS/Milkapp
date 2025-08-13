import { dashboardRepository } from '../repositories/dashboardRepository';

export const dashboardService = {
  async today() {
    const now = new Date();
    const day = now.getUTCDay();
    const count = await dashboardRepository.todayDeliveryCount(day);
    return { dayOfWeek: day, deliveryCount: count };
  },
  async pendingDeliveries() {
    const now = new Date();
    const day = now.getUTCDay();
    return dashboardRepository.pendingDeliveries(day, now);
  },
  async deliveryStatus() {
    const now = new Date();
    const day = now.getUTCDay();
    return dashboardRepository.deliveryStatusByCourse(day, now);
  },
  async monthlySummary() {
    const now = new Date();
    return dashboardRepository.monthlySummary(now);
  },
};


