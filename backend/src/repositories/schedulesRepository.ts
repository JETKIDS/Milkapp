import prisma from '../lib/prisma';

export interface CreateScheduleInput {
  customerId: number;
  dayOfWeek: number; // 0-6
  isActive?: boolean;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {}

export const schedulesRepository = {
  async list() {
    return prisma.deliverySchedule.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { customerId: 'asc' }] });
  },
  async listByDay(dayOfWeek: number) {
    return prisma.deliverySchedule.findMany({ where: { dayOfWeek }, orderBy: { customerId: 'asc' } });
  },
  async listByCourse(courseId: number) {
    return prisma.deliverySchedule.findMany({
      where: { customer: { deliveryCourseId: courseId } },
      orderBy: [{ dayOfWeek: 'asc' }, { customerId: 'asc' }],
      include: { customer: true },
    });
  },
  async create(input: CreateScheduleInput) {
    return prisma.deliverySchedule.create({ data: { ...input, isActive: input.isActive ?? true } });
  },
  async update(id: number, input: UpdateScheduleInput) {
    return prisma.deliverySchedule.update({ where: { id }, data: input });
  },
  async complete(scheduleId: number, dateISO: string) {
    const schedule = await prisma.deliverySchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new Error('SCHEDULE_NOT_FOUND');
    return prisma.deliveryRecord.create({
      data: {
        customerId: schedule.customerId,
        deliveryDate: new Date(dateISO),
        status: 'completed',
      },
    });
  },
};


