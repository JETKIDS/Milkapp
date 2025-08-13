import { z } from 'zod';
import { customerDetailRepository } from '../repositories/customerDetailRepository';

export const customerDetailService = {
  async getDetail(customerId: number) {
    return customerDetailRepository.getDetail(customerId);
  },
  async getDeliverySchedule(customerId: number) {
    const detail = await customerDetailRepository.getDetail(customerId);
    return detail?.customer.schedules ?? [];
  },
  async getMonthlyCalendar(customerId: number, year: number, month: number) {
    return customerDetailRepository.getMonthlyCalendar(customerId, year, month);
  },
  async getMonthlyBilling(customerId: number, year: number, month: number) {
    return customerDetailRepository.getMonthlyBilling(customerId, year, month);
  },
  async getCoursePosition(customerId: number) {
    return customerDetailRepository.getCoursePosition(customerId);
  },
  async setCoursePosition(customerId: number, courseId: number, position: number) {
    return customerDetailRepository.setCoursePosition(customerId, courseId, position);
  },
};


