import { z } from 'zod';
import { manufacturersRepository } from '../repositories/manufacturersRepository';

export const manufacturerCreateSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.string().optional(),
});
export const manufacturerUpdateSchema = manufacturerCreateSchema.partial();

export const manufacturersService = {
  async list() {
    return manufacturersRepository.list();
  },
  async create(input: unknown) {
    const data = manufacturerCreateSchema.parse(input);
    return manufacturersRepository.create(data);
  },
  async update(id: number, input: unknown) {
    const data = manufacturerUpdateSchema.parse(input);
    return manufacturersRepository.update(id, data);
  },
  async remove(id: number) {
    const productCount = await manufacturersRepository.countProducts(id);
    if (productCount > 0) {
      const err = new Error('メーカーに関連する商品が存在するため削除できません');
      // @ts-ignore add code
      err.code = 'MANUFACTURER_HAS_PRODUCTS';
      throw err;
    }
    await manufacturersRepository.remove(id);
  },
};


