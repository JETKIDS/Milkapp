import prisma from '../lib/prisma';

export interface CreateContractInput {
  customerId: number;
  productId: number;
  isActive?: boolean;
  startDate: string; // ISO
  endDate?: string;  // ISO
}

export interface UpdateContractInput extends Partial<CreateContractInput> {}

export interface CreatePatternInput {
  contractId: number;
  dayOfWeek: number; // 0-6
  quantity: number;
  isActive?: boolean;
}

export interface UpdatePatternInput extends Partial<CreatePatternInput> {}

export const contractsRepository = {
  // contracts
  async listByCustomer(customerId: number) {
    return prisma.customerProductContract.findMany({ where: { customerId }, include: { product: true, patterns: true } });
  },
  async createContract(input: CreateContractInput) {
    return prisma.customerProductContract.create({
      data: {
        customerId: input.customerId,
        productId: input.productId,
        isActive: input.isActive ?? true,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      },
    });
  },
  async updateContract(id: number, input: UpdateContractInput) {
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);
    return prisma.customerProductContract.update({ where: { id }, data });
  },
  async removeContract(id: number) {
    await prisma.$transaction([
      prisma.deliveryPattern.deleteMany({ where: { contractId: id } }),
      prisma.customerProductContract.delete({ where: { id } }),
    ]);
  },

  // patterns
  async listPatterns(contractId: number) {
    return prisma.deliveryPattern.findMany({ where: { contractId } });
  },
  async createPattern(input: CreatePatternInput) {
    return prisma.deliveryPattern.create({
      data: {
        contractId: input.contractId,
        dayOfWeek: input.dayOfWeek,
        quantity: input.quantity,
        isActive: input.isActive ?? true,
      },
    });
  },
  async updatePattern(id: number, input: UpdatePatternInput) {
    return prisma.deliveryPattern.update({ where: { id }, data: input });
  },
  async removePattern(id: number) {
    return prisma.deliveryPattern.delete({ where: { id } });
  },
};


