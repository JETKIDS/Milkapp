import { z } from 'zod';
import { customersRepository } from '../repositories/customersRepository';

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  deliveryCourseId: z.number().int().positive().optional(),
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


