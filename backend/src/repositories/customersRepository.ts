import prisma from '../lib/prisma';

export interface CreateCustomerInput {
  id?: number;
  name: string;
  address: string;
  phone?: string | null;
  collectionMethod?: string | null;
  bankBranchCode7?: string | null;
  accountNumber7?: string | null;
  accountHolderKana?: string | null;
  customerCode7?: string | null;
  email?: string | null;
  deliveryCourseId?: number | null;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export const customersRepository = {
  async list() {
    return prisma.customer.findMany({ orderBy: { id: 'asc' } });
  },
  async create(input: CreateCustomerInput) {
    return prisma.customer.create({ data: input });
  },
  async findById(id: number) {
    return prisma.customer.findUnique({ where: { id } });
  },
  async update(id: number, input: UpdateCustomerInput) {
    return prisma.customer.update({ where: { id }, data: input });
  },
  async remove(id: number) {
    return prisma.customer.delete({ where: { id } });
  },
};


