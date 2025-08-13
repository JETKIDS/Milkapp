import { z } from 'zod';
import { ordersRepository } from '../repositories/ordersRepository';
import prisma from '../lib/prisma';

export const orderCreateSchema = z.object({
  customerId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  orderDate: z.string().datetime(),
  deliveryDate: z.string().datetime().optional(),
});
export const orderUpdateSchema = orderCreateSchema.partial().extend({
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
});

export const ordersService = {
  async list() {
    return ordersRepository.list();
  },
  async listByCustomer(customerId: number, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return ordersRepository.listByCustomer(customerId, fromDate, toDate);
  },
  async create(input: unknown) {
    const data = orderCreateSchema.parse(input);
    // 在庫チェック
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      const err = new Error('商品が見つかりません');
      // @ts-ignore
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    if (product.stock < data.quantity) {
      const err = new Error('在庫数量を超過しています');
      // @ts-ignore
      err.code = 'INSUFFICIENT_STOCK';
      // 警告だが保存はする仕様にするならここで続行、今回は要件に従い保存前にエラー
      throw err;
    }
    // 保存時に出荷で在庫減少させる簡易運用
    const created = await ordersRepository.create(data);
    await prisma.product.update({
      where: { id: data.productId },
      data: { stock: product.stock - data.quantity },
    });
    return created;
  },
  async update(id: number, input: unknown) {
    const data = orderUpdateSchema.parse(input);
    return ordersRepository.update(id, data);
  },
  async remove(id: number) {
    await ordersRepository.remove(id);
  },
};


