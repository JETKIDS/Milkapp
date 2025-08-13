import prisma from '../lib/prisma';

export interface CreateOrderInput {
  customerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  orderDate: string; // ISO
  deliveryDate?: string; // ISO
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  status?: 'pending' | 'completed' | 'cancelled';
}

export const ordersRepository = {
  async list() {
    return prisma.order.findMany({ orderBy: { id: 'asc' } });
  },
  async listByCustomer(customerId: number, from?: Date, to?: Date) {
    const where: any = { customerId };
    if (from || to) {
      where.orderDate = {} as any;
      if (from) where.orderDate.gte = from;
      if (to) where.orderDate.lte = to;
    }
    return prisma.order.findMany({ where, orderBy: { orderDate: 'asc' } });
  },
  async create(input: CreateOrderInput) {
    const totalPrice = input.quantity * input.unitPrice;
    return prisma.order.create({
      data: {
        customerId: input.customerId,
        productId: input.productId,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalPrice,
        orderDate: new Date(input.orderDate),
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
      },
    });
  },
  async update(id: number, input: UpdateOrderInput) {
    const data: any = { ...input };
    if (input.orderDate) data.orderDate = new Date(input.orderDate);
    if (input.deliveryDate) data.deliveryDate = new Date(input.deliveryDate);
    if (input.quantity != null && input.unitPrice != null) {
      data.totalPrice = input.quantity * input.unitPrice;
    }
    return prisma.order.update({ where: { id }, data });
  },
  async remove(id: number) {
    return prisma.order.delete({ where: { id } });
  },
  async countByProduct(productId: number) {
    return prisma.order.count({ where: { productId } });
  },
};


