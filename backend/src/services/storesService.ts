import { z } from 'zod';
import { storesRepository } from '../repositories/storesRepository';

export const storeCreateSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional().nullable(),
});
export const storeUpdateSchema = storeCreateSchema.partial();

export const storesService = {
  async list() {
    return storesRepository.list();
  },
  async create(input: unknown) {
    const data = storeCreateSchema.parse(input);
    return storesRepository.create(data);
  },
  async update(id: number, input: unknown) {
    const data = storeUpdateSchema.parse(input);
    return storesRepository.update(id, data);
  },
  async remove(id: number) {
    await storesRepository.remove(id);
  },
};


