import { z } from 'zod';
import { customersRepository } from '../repositories/customersRepository';

export const createCustomerSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional().nullable(),
  collectionMethod: z.string().optional().nullable(),
  bankBranchCode7: z.string().regex(/^\d{7}$/).optional().nullable(),
  accountNumber7: z.string().regex(/^\d{7}$/).optional().nullable(),
  accountHolderKana: z.string().regex(/^[\u30A0-\u30FF\uFF65-\uFF9F\s]+$/).optional().nullable(),
  customerCode7: z.string().regex(/^\d{7}$/).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  deliveryCourseId: z.number().int().positive().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customersService = {
  async list() {
    return customersRepository.list();
  },
  async create(input: unknown) {
    const data = createCustomerSchema.parse(input);
    return customersRepository.create(data);
  },
  async update(id: number, input: unknown) {
    const data = updateCustomerSchema.parse(input);
    return customersRepository.update(id, data);
  },
  async remove(id: number) {
    await customersRepository.remove(id);
  },
};


