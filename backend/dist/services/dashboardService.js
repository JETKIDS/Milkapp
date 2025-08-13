"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const dashboardRepository_1 = require("../repositories/dashboardRepository");
exports.dashboardService = {
    async today() {
        const now = new Date();
        const day = now.getUTCDay();
        const count = await dashboardRepository_1.dashboardRepository.todayDeliveryCount(day);
        return { dayOfWeek: day, deliveryCount: count };
    },
    async pendingDeliveries() {
        const now = new Date();
        const day = now.getUTCDay();
        return dashboardRepository_1.dashboardRepository.pendingDeliveries(day, now);
    },
    async deliveryStatus() {
        const now = new Date();
        const day = now.getUTCDay();
        return dashboardRepository_1.dashboardRepository.deliveryStatusByCourse(day, now);
    },
    async monthlySummary() {
        const now = new Date();
        return dashboardRepository_1.dashboardRepository.monthlySummary(now);
    },
};
