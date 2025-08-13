import { z } from 'zod';
import { reportsRepository } from '../repositories/reportsRepository';

export const listFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  courseId: z.coerce.number().int().positive().optional(),
});

export const invoiceSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const reportsService = {
  async deliveryList(input: unknown) {
    const filter = listFilterSchema.parse(input ?? {});
    return reportsRepository.getDeliveryList(filter);
  },
  async productList(input: unknown) {
    const filter = listFilterSchema.parse(input ?? {});
    return reportsRepository.getProductList(filter);
  },
  async createInvoice(input: unknown) {
    const data = invoiceSchema.parse(input);
    return reportsRepository.createInvoice(data);
  },
  async invoiceHistory(customerId: number) {
    return reportsRepository.listInvoiceHistory(customerId);
  },
};


