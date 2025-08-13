import prisma from '../lib/prisma';

export interface CreateProductInput {
  name: string;
  manufacturerId: number;
  price: number;
  unit: string;
  description?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export const productsRepository = {
  async list() {
    return prisma.product.findMany({ orderBy: { id: 'asc' } });
  },
  async create(input: CreateProductInput) {
    return prisma.product.create({ data: input });
  },
  async update(id: number, input: UpdateProductInput) {
    return prisma.product.update({ where: { id }, data: input });
  },
  async remove(id: number) {
    return prisma.product.delete({ where: { id } });
  },
  async countOrders(productId: number) {
    return prisma.order.count({ where: { productId } });
  },
};


