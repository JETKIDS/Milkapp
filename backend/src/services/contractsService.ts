import { z } from 'zod';
import { contractsRepository } from '../repositories/contractsRepository';
import prisma from '../lib/prisma';
import { deliveryCoursesRepository } from '../repositories/deliveryCoursesRepository';

export const contractCreateSchema = z.object({
  customerId: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  startDate: z.string().min(1), // 日付文字列（YYYY-MM-DD形式）
  unitPrice: z.number().min(0),
  patternType: z.enum(['1', '2', '3', '4', '5']).default('1'),
  // 各曜日の数量
  sunday: z.number().min(0).optional(),
  monday: z.number().min(0).optional(),
  tuesday: z.number().min(0).optional(),
  wednesday: z.number().min(0).optional(),
  thursday: z.number().min(0).optional(),
  friday: z.number().min(0).optional(),
  saturday: z.number().min(0).optional(),
  isActive: z.boolean().optional().default(true),
  cancelDate: z.string().optional(), // 解約日
});
export const contractUpdateSchema = contractCreateSchema.partial();

export const patternCreateSchema = z.object({
  contractId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  quantity: z.number().int().positive(),
  isActive: z.boolean().optional(),
});
export const patternUpdateSchema = patternCreateSchema.partial();

export const pauseCreateSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const contractsService = {
  async listByCustomer(customerId: number) {
    return contractsRepository.listByCustomer(customerId);
  },
  async createContract(customerId: number, input: unknown) {
    const data = contractCreateSchema.parse(input);
    const contract = await contractsRepository.createContract({ ...data, customerId });
    if (process.env.AUTO_ASSIGN_COURSE_BY_PATTERNS !== 'false') {
      await autoAssignCourseForCustomerByPatterns(customerId);
    }
    return contract;
  },
  async updateContract(id: number, input: unknown) {
    const data = contractUpdateSchema.parse(input);
    return contractsRepository.updateContract(id, data);
  },
  async removeContract(id: number) {
    await contractsRepository.removeContract(id);
  },
  async cancelContract(id: number, cancelDate: string) {
    return contractsRepository.cancelContract(id, cancelDate);
  },

  async listPatterns(contractId: number) {
    return contractsRepository.listPatterns(contractId);
  },
  async createPattern(input: unknown) {
    const data = patternCreateSchema.parse(input);
    const created = await contractsRepository.createPattern(data);
    // パターン変更に応じてコース自動割当を更新
    const contract = await prisma.customerProductContract.findUnique({ where: { id: data.contractId }, select: { customerId: true } });
    if (contract?.customerId) {
      if (process.env.AUTO_ASSIGN_COURSE_BY_PATTERNS !== 'false') {
        await autoAssignCourseForCustomerByPatterns(contract.customerId);
      }
    }
    return created;
  },
  async updatePattern(id: number, input: unknown) {
    const data = patternUpdateSchema.parse(input);
    const updated = await contractsRepository.updatePattern(id, data);
    // パターン変更に応じてコース自動割当を更新
    const pattern = await prisma.deliveryPattern.findUnique({ where: { id }, select: { contractId: true } });
    if (pattern?.contractId) {
      const contract = await prisma.customerProductContract.findUnique({ where: { id: pattern.contractId }, select: { customerId: true } });
      if (contract?.customerId) {
        if (process.env.AUTO_ASSIGN_COURSE_BY_PATTERNS !== 'false') {
          await autoAssignCourseForCustomerByPatterns(contract.customerId);
        }
      }
    }
    return updated;
  },
  async removePattern(id: number) {
    await contractsRepository.removePattern(id);
  },


  async createPause(contractId: number, input: unknown) {
    const data = pauseCreateSchema.parse(input);
    if (new Date(data.endDate) < new Date(data.startDate)) throw new Error('INVALID_RANGE');
    return contractsRepository.createPause(contractId, data.startDate, data.endDate);
  },
};

async function autoAssignCourseForCustomerByPatterns(customerId: number): Promise<void> {
  // 顧客の全契約に紐づく配達パターンを取得
  const patterns = await prisma.deliveryPattern.findMany({
    where: { contract: { customerId } },
    select: { dayOfWeek: true },
  });

  const hasMon = patterns.some(p => p.dayOfWeek === 1);
  const hasThu = patterns.some(p => p.dayOfWeek === 4);
  const hasTue = patterns.some(p => p.dayOfWeek === 2);
  const hasFri = patterns.some(p => p.dayOfWeek === 5);
  const hasWed = patterns.some(p => p.dayOfWeek === 3);
  const hasSat = patterns.some(p => p.dayOfWeek === 6);

  let targetCourseId: number | null = null;

  // コース候補を取得（名前で優先、なければID昇順の先頭3件）
  const namedCourses = await prisma.deliveryCourse.findMany({ where: { name: { in: ['コース 01', 'コース 02', 'コース 03'] } }, orderBy: { id: 'asc' } });
  let course1 = namedCourses.find(c => c.name === 'コース 01');
  let course2 = namedCourses.find(c => c.name === 'コース 02');
  let course3 = namedCourses.find(c => c.name === 'コース 03');
  if (!course1 || !course2 || !course3) {
    const firstThree = await prisma.deliveryCourse.findMany({ orderBy: { id: 'asc' }, take: 3 });
    course1 = course1 ?? firstThree[0];
    course2 = course2 ?? firstThree[1];
    course3 = course3 ?? firstThree[2];
  }

  if (hasMon && hasThu && course1) targetCourseId = course1.id;
  else if (hasTue && hasFri && course2) targetCourseId = course2.id;
  else if (hasWed && hasSat && course3) targetCourseId = course3.id;

  if (!targetCourseId) return;

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { deliveryCourseId: true } });
  if (customer?.deliveryCourseId === targetCourseId) return; // 変更不要

  const fromCourseId = customer?.deliveryCourseId ?? 0;
  // 末尾に追加
  await deliveryCoursesRepository.transferCustomer(customerId, fromCourseId, targetCourseId);
}


