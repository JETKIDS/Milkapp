import { z } from 'zod';
import prisma from '../lib/prisma';

export const temporaryDeliveryCreateSchema = z.object({
  customerId: z.number().int().positive(),
  productId: z.number().int().positive(),
  deliveryDate: z.string().min(1), // 日付文字列（YYYY-MM-DD形式）
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
});

export const temporaryDeliveryUpdateSchema = z.object({
  productId: z.number().int().positive().optional(),
  deliveryDate: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().min(0).optional(),
});

export const temporaryDeliveriesService = {
  async list(customerId: number) {
    return await prisma.temporaryDelivery.findMany({
      where: { customerId },
      include: {
        product: true,
      },
      orderBy: { deliveryDate: 'desc' },
    });
  },

  async create(data: z.infer<typeof temporaryDeliveryCreateSchema>) {
    return await prisma.temporaryDelivery.create({
      data: {
        customerId: data.customerId,
        productId: data.productId,
        deliveryDate: new Date(data.deliveryDate),
        quantity: data.quantity,
        unitPrice: data.unitPrice,
      },
      include: {
        product: true,
      },
    });
  },

  async update(id: number, data: z.infer<typeof temporaryDeliveryUpdateSchema>) {
    return await prisma.temporaryDelivery.update({
      where: { id },
      data: {
        productId: data.productId,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
      },
      include: {
        product: true,
      },
    });
  },

  async remove(id: number) {
    return await prisma.temporaryDelivery.delete({
      where: { id },
    });
  },

  async getByDate(customerId: number, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    return await prisma.temporaryDelivery.findMany({
      where: {
        customerId,
        deliveryDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        product: true,
      },
    });
  },
};
