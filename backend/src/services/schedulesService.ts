import { z } from 'zod';
import { schedulesRepository } from '../repositories/schedulesRepository';

export const scheduleCreateSchema = z.object({
  customerId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean().optional(),
});
export const scheduleUpdateSchema = scheduleCreateSchema.partial();

export const schedulesService = {
  async list() {
    return schedulesRepository.list();
  },
  async listByDay(day: number) {
    return schedulesRepository.listByDay(day);
  },
  async listByCourse(courseId: number) {
    return schedulesRepository.listByCourse(courseId);
  },
  async create(input: unknown) {
    const data = scheduleCreateSchema.parse(input);
    return schedulesRepository.create(data);
  },
  async update(id: number, input: unknown) {
    const data = scheduleUpdateSchema.parse(input);
    return schedulesRepository.update(id, data);
  },
  async complete(scheduleId: number, dateISO: string) {
    return schedulesRepository.complete(scheduleId, dateISO);
  },
  async historyByCustomer(customerId: number, from?: string, to?: string) {
    const { deliveryRecordsRepository } = await import('../repositories/deliveryRecordsRepository');
    return deliveryRecordsRepository.list({
      customerId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  },
};


