import { z } from 'zod';
import { contractsRepository } from '../repositories/contractsRepository';

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
});
export const contractUpdateSchema = contractCreateSchema.partial();

export const patternCreateSchema = z.object({
  contractId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  quantity: z.number().int().positive(),
  isActive: z.boolean().optional(),
});
export const patternUpdateSchema = patternCreateSchema.partial();

export const contractsService = {
  async listByCustomer(customerId: number) {
    return contractsRepository.listByCustomer(customerId);
  },
  async createContract(customerId: number, input: unknown) {
    const data = contractCreateSchema.parse(input);
    return contractsRepository.createContract({ ...data, customerId });
  },
  async updateContract(id: number, input: unknown) {
    const data = contractUpdateSchema.parse(input);
    return contractsRepository.updateContract(id, data);
  },
  async removeContract(id: number) {
    await contractsRepository.removeContract(id);
  },

  async listPatterns(contractId: number) {
    return contractsRepository.listPatterns(contractId);
  },
  async createPattern(input: unknown) {
    const data = patternCreateSchema.parse(input);
    return contractsRepository.createPattern(data);
  },
  async updatePattern(id: number, input: unknown) {
    const data = patternUpdateSchema.parse(input);
    return contractsRepository.updatePattern(id, data);
  },
  async removePattern(id: number) {
    await contractsRepository.removePattern(id);
  },
};


