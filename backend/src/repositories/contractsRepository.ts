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
  cancelDate?: string; // 解約日
}

export interface UpdateContractInput extends Partial<CreateContractInput> {}

export interface CreatePatternInput {
  contractId: number;
  dayOfWeek: number; // 0-6
  quantity: number;
  isActive?: boolean;
}

export interface UpdatePatternInput extends Partial<CreatePatternInput> {}

export interface CreatePatternChangeInput {
  contractId: number;
  changeDate: string; // YYYY-MM-DD形式
  patterns: Record<number, number>; // 曜日別数量 {0: 2, 1: 3, ...}
}

export interface UpdatePatternChangeInput extends Partial<CreatePatternChangeInput> {}

export const contractsRepository = {
  // contracts
  async listByCustomer(customerId: number) {
    return prisma.customerProductContract.findMany({ where: { customerId }, include: { product: true, patterns: true, pauses: true } });
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
    if (input.cancelDate) data.cancelDate = new Date(input.cancelDate);
    return prisma.customerProductContract.update({ where: { id }, data });
  },
  async removeContract(id: number) {
    await prisma.$transaction([
      prisma.deliveryPattern.deleteMany({ where: { contractId: id } }),
      prisma.customerProductContract.delete({ where: { id } }),
    ]);
  },
  async cancelContract(id: number, cancelDate: string) {
    // 解約日を設定し、契約を非アクティブにする
    return prisma.customerProductContract.update({
      where: { id },
      data: {
        cancelDate: new Date(cancelDate),
        isActive: false,
      },
    });
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


	// pauses
	async createPause(contractId: number, startDateISO: string, endDateISO: string) {
		return prisma.contractPause.create({ data: { contractId, startDate: new Date(startDateISO), endDate: new Date(endDateISO) } });
	},

	// pattern changes
	async listPatternChanges(contractId: number) {
		return prisma.patternChangeHistory.findMany({ 
			where: { contractId },
			orderBy: { changeDate: 'asc' }
		});
	},
	async createPatternChange(input: CreatePatternChangeInput) {
		return prisma.patternChangeHistory.create({
			data: {
				contractId: input.contractId,
				changeDate: new Date(input.changeDate),
				patterns: JSON.stringify(input.patterns),
			},
		});
	},
	async updatePatternChange(id: number, input: UpdatePatternChangeInput) {
		const data: any = { ...input };
		if (input.changeDate) data.changeDate = new Date(input.changeDate);
		if (input.patterns) data.patterns = JSON.stringify(input.patterns);
		return prisma.patternChangeHistory.update({ where: { id }, data });
	},
	async removePatternChange(id: number) {
		return prisma.patternChangeHistory.delete({ where: { id } });
	},
	async getPatternChangesByDate(contractId: number, targetDate: string) {
		// 指定日付以前の最新のパターン変更を取得
		return prisma.patternChangeHistory.findFirst({
			where: {
				contractId,
				changeDate: { lte: new Date(targetDate) }
			},
			orderBy: { changeDate: 'desc' }
		});
	},
};


