import prisma from '../lib/prisma';

export interface CreateManufacturerInput {
  name: string;
  contactInfo?: string;
}

export interface UpdateManufacturerInput extends Partial<CreateManufacturerInput> {}

export const manufacturersRepository = {
  async list() {
    return prisma.manufacturer.findMany({ orderBy: { id: 'asc' } });
  },
  async create(input: CreateManufacturerInput) {
    return prisma.manufacturer.create({ data: input });
  },
  async update(id: number, input: UpdateManufacturerInput) {
    return prisma.manufacturer.update({ where: { id }, data: input });
  },
  async remove(id: number) {
    return prisma.manufacturer.delete({ where: { id } });
  },
  async countProducts(id: number) {
    return prisma.product.count({ where: { manufacturerId: id } });
  },
};


