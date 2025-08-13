"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerDetailService = void 0;
const customerDetailRepository_1 = require("../repositories/customerDetailRepository");
exports.customerDetailService = {
    async getDetail(customerId) {
        return customerDetailRepository_1.customerDetailRepository.getDetail(customerId);
    },
    async getDeliverySchedule(customerId) {
        const detail = await customerDetailRepository_1.customerDetailRepository.getDetail(customerId);
        return detail?.customer.schedules ?? [];
    },
    async getMonthlyCalendar(customerId, year, month) {
        return customerDetailRepository_1.customerDetailRepository.getMonthlyCalendar(customerId, year, month);
    },
    async getMonthlyBilling(customerId, year, month) {
        return customerDetailRepository_1.customerDetailRepository.getMonthlyBilling(customerId, year, month);
    },
    async getCoursePosition(customerId) {
        return customerDetailRepository_1.customerDetailRepository.getCoursePosition(customerId);
    },
    async setCoursePosition(customerId, courseId, position) {
        return customerDetailRepository_1.customerDetailRepository.setCoursePosition(customerId, courseId, position);
    },
};
