import { z } from 'zod';
import { contractsRepository } from '../repositories/contractsRepository';

export const contractCreateSchema = z.object({
  customerId: z.number().int().positive(),
  productId: z.number().int().positive(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
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
  async createContract(input: unknown) {
    const data = contractCreateSchema.parse(input);
    return contractsRepository.createContract(data);
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


