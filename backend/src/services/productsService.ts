import { z } from 'zod';
import { productsRepository } from '../repositories/productsRepository';

export const productCreateSchema = z.object({
  name: z.string().min(1),
  manufacturerId: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  unit: z.string().min(1),
  description: z.string().optional(),
});
export const productUpdateSchema = productCreateSchema.partial();

export const productsService = {
  async list() {
    return productsRepository.list();
  },
  async create(input: unknown) {
    const data = productCreateSchema.parse(input);
    return productsRepository.create(data);
  },
  async update(id: number, input: unknown) {
    const data = productUpdateSchema.parse(input);
    return productsRepository.update(id, data);
  },
  async remove(id: number) {
    const orderCount = await productsRepository.countOrders(id);
    if (orderCount > 0) {
      const err = new Error('商品の関連注文が存在するため削除できません');
      // @ts-ignore add code
      err.code = 'PRODUCT_HAS_ORDERS';
      throw err;
    }
    await productsRepository.remove(id);
  },
};


