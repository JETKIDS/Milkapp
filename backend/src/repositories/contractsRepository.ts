import prisma from '../lib/prisma';

export interface CreateContractInput {
  customerId?: number;
  productId: number;
  startDate: string; // YYYY-MM-DD形式
  unitPrice: number;
  patternType: string;
  // 各曜日の数量
  sunday?: number;
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday?: number;
  isActive?: boolean;
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
  async createContract(input: CreateContractInput & { customerId: number }) {
    // 契約を作成
    const contract = await prisma.customerProductContract.create({
      data: {
        customerId: input.customerId,
        productId: input.productId,
        unitPrice: input.unitPrice,
        patternType: input.patternType,
        isActive: input.isActive ?? true,
        startDate: new Date(input.startDate),
      },
    });

    // 各曜日の配達パターンを作成
    const patterns = [];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    
    for (let i = 0; i < days.length; i++) {
      const dayKey = days[i];
      const quantity = input[dayKey];
      if (quantity && quantity > 0) {
        patterns.push({
          contractId: contract.id,
          dayOfWeek: i, // 0=日曜, 1=月曜, ...
          quantity: quantity,
          isActive: true,
        });
      }
    }

    // パターンがある場合は一括作成
    if (patterns.length > 0) {
      await prisma.deliveryPattern.createMany({
        data: patterns,
      });
    }

    return contract;
  },
  async updateContract(id: number, input: UpdateContractInput) {
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
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


