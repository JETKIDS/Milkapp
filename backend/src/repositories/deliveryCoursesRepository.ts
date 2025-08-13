import prisma from '../lib/prisma';

export interface CreateDeliveryCourseInput {
  name: string;
  description?: string;
}

export interface UpdateDeliveryCourseInput extends Partial<CreateDeliveryCourseInput> {}

export const deliveryCoursesRepository = {
  async list() {
    return prisma.deliveryCourse.findMany({ orderBy: { id: 'asc' } });
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
};


