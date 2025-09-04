import prisma from '../lib/prisma';

export interface CreateStoreInput {
  id?: number;
  name: string;
  address: string;
  phone?: string | null;
}

export interface UpdateStoreInput extends Partial<CreateStoreInput> {}

export const storesRepository = {
  async list() {
    return prisma.store.findMany({ orderBy: { id: 'asc' } });
  },
  async create(input: CreateStoreInput) {
    return prisma.store.create({ data: input });
  },
  async update(id: number, input: UpdateStoreInput) {
    return prisma.store.update({ where: { id }, data: input });
  },
  async remove(id: number) {
    return prisma.store.delete({ where: { id } });
  },
};


