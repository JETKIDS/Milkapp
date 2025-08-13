import prisma from '../lib/prisma';

export interface DeliveryRecordFilter {
  customerId?: number;
  from?: Date;
  to?: Date;
}

export interface UpdateDeliveryRecordInput {
  status?: string;
  notes?: string;
}

export const deliveryRecordsRepository = {
  async list(filter: DeliveryRecordFilter) {
    const where: any = {};
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.from || filter.to) {
      where.deliveryDate = {} as any;
      if (filter.from) where.deliveryDate.gte = filter.from;
      if (filter.to) where.deliveryDate.lte = filter.to;
    }
    return prisma.deliveryRecord.findMany({ where, orderBy: { deliveryDate: 'asc' } });
  },
  async update(id: number, input: UpdateDeliveryRecordInput) {
    return prisma.deliveryRecord.update({ where: { id }, data: input });
  },
  async findById(id: number) {
    return prisma.deliveryRecord.findUnique({ where: { id } });
  },
};


