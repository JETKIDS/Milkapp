import prisma from '../lib/prisma';

export interface CreateDeliveryCourseInput {
  id?: number;
  name: string;
  description?: string;
}

export interface UpdateDeliveryCourseInput extends Partial<CreateDeliveryCourseInput> {}

export const deliveryCoursesRepository = {
  async list() {
    return prisma.deliveryCourse.findMany({ orderBy: { id: 'asc' } });
  },
  async getById(id: number) {
    return prisma.deliveryCourse.findUniqueOrThrow({ where: { id } });
  },
  async create(input: CreateDeliveryCourseInput) {
    return prisma.deliveryCourse.create({ data: input });
  },
  async update(id: number, input: UpdateDeliveryCourseInput) {
    return prisma.deliveryCourse.update({ where: { id }, data: input });
  },
  async remove(id: number) {
    return prisma.deliveryCourse.delete({ where: { id } });
  },
  async countCustomers(id: number) {
    return prisma.customer.count({ where: { deliveryCourseId: id } });
  },
  
  // コース内顧客一覧取得（順番付き）
  async getCourseCustomers(courseId: number) {
    // まず、ポジション情報を含む顧客を取得
    const customersWithPosition = await prisma.customerCoursePosition.findMany({
      where: { deliveryCourseId: courseId },
      include: {
        customer: true
      },
      orderBy: { position: 'asc' }
    });

    // ポジション情報がない顧客も取得
    const allCustomers = await prisma.customer.findMany({
      where: { deliveryCourseId: courseId }
    });

    const positionedCustomerIds = customersWithPosition.map(cp => cp.customerId);
    const unpositionedCustomers = allCustomers.filter(c => !positionedCustomerIds.includes(c.id));

    // 結果をマージ
    const result = [
      ...customersWithPosition.map(cp => ({
        ...cp.customer,
        position: cp.position
      })),
      ...unpositionedCustomers.map(customer => ({
        ...customer,
        position: null as number | null
      }))
    ];

    return result;
  },
  
  // コース内顧客の順番変更
  async reorderCustomers(courseId: number, customerIds: number[]) {
    return prisma.$transaction(async (tx) => {
      // 既存のポジションを削除
      await tx.customerCoursePosition.deleteMany({
        where: { deliveryCourseId: courseId }
      });
      
      // 新しいポジションを設定
      for (let i = 0; i < customerIds.length; i++) {
        await tx.customerCoursePosition.create({
          data: {
            customerId: customerIds[i],
            deliveryCourseId: courseId,
            position: i + 1
          }
        });
      }
    });
  },
  
  // 顧客のコース間移動
  async transferCustomer(customerId: number, fromCourseId: number, toCourseId: number, position?: number) {
    return prisma.$transaction(async (tx) => {
      // 顧客のコースを更新
      await tx.customer.update({
        where: { id: customerId },
        data: { deliveryCourseId: toCourseId }
      });
      
      // 元のコースのポジションを削除
      await tx.customerCoursePosition.deleteMany({
        where: { 
          customerId: customerId,
          deliveryCourseId: fromCourseId
        }
      });
      
      // 新しいコースでのポジションを設定
      if (position !== undefined) {
        // 指定位置以降の顧客のポジションを1つずつ後ろにずらす
        await tx.customerCoursePosition.updateMany({
          where: {
            deliveryCourseId: toCourseId,
            position: { gte: position }
          },
          data: {
            position: { increment: 1 }
          }
        });
        
        // 新しいポジションを設定
        await tx.customerCoursePosition.create({
          data: {
            customerId: customerId,
            deliveryCourseId: toCourseId,
            position: position
          }
        });
      } else {
        // 最後に追加
        const maxPosition = await tx.customerCoursePosition.findFirst({
          where: { deliveryCourseId: toCourseId },
          orderBy: { position: 'desc' }
        });
        
        await tx.customerCoursePosition.create({
          data: {
            customerId: customerId,
            deliveryCourseId: toCourseId,
            position: (maxPosition?.position || 0) + 1
          }
        });
      }
    });
  },
};


