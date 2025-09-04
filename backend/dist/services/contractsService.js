"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractsService = exports.patternUpdateSchema = exports.patternCreateSchema = exports.contractUpdateSchema = exports.contractCreateSchema = void 0;
const zod_1 = require("zod");
const contractsRepository_1 = require("../repositories/contractsRepository");
const prisma_1 = __importDefault(require("../lib/prisma"));
const deliveryCoursesRepository_1 = require("../repositories/deliveryCoursesRepository");
exports.contractCreateSchema = zod_1.z.object({
    customerId: zod_1.z.number().int().positive().optional(),
    productId: zod_1.z.number().int().positive(),
    startDate: zod_1.z.string().min(1), // 日付文字列（YYYY-MM-DD形式）
    unitPrice: zod_1.z.number().min(0),
    patternType: zod_1.z.enum(['1', '2', '3', '4', '5']).default('1'),
    // 各曜日の数量
    sunday: zod_1.z.number().min(0).optional(),
    monday: zod_1.z.number().min(0).optional(),
    tuesday: zod_1.z.number().min(0).optional(),
    wednesday: zod_1.z.number().min(0).optional(),
    thursday: zod_1.z.number().min(0).optional(),
    friday: zod_1.z.number().min(0).optional(),
    saturday: zod_1.z.number().min(0).optional(),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.contractUpdateSchema = exports.contractCreateSchema.partial();
exports.patternCreateSchema = zod_1.z.object({
    contractId: zod_1.z.number().int().positive(),
    dayOfWeek: zod_1.z.number().int().min(0).max(6),
    quantity: zod_1.z.number().int().positive(),
    isActive: zod_1.z.boolean().optional(),
});
exports.patternUpdateSchema = exports.patternCreateSchema.partial();
exports.contractsService = {
    async listByCustomer(customerId) {
        return contractsRepository_1.contractsRepository.listByCustomer(customerId);
    },
    async createContract(customerId, input) {
        const data = exports.contractCreateSchema.parse(input);
        const contract = await contractsRepository_1.contractsRepository.createContract({ ...data, customerId });
        await autoAssignCourseForCustomerByPatterns(customerId);
        return contract;
    },
    async updateContract(id, input) {
        const data = exports.contractUpdateSchema.parse(input);
        return contractsRepository_1.contractsRepository.updateContract(id, data);
    },
    async removeContract(id) {
        await contractsRepository_1.contractsRepository.removeContract(id);
    },
    async listPatterns(contractId) {
        return contractsRepository_1.contractsRepository.listPatterns(contractId);
    },
    async createPattern(input) {
        const data = exports.patternCreateSchema.parse(input);
        const created = await contractsRepository_1.contractsRepository.createPattern(data);
        // パターン変更に応じてコース自動割当を更新
        const contract = await prisma_1.default.customerProductContract.findUnique({ where: { id: data.contractId }, select: { customerId: true } });
        if (contract?.customerId) {
            await autoAssignCourseForCustomerByPatterns(contract.customerId);
        }
        return created;
    },
    async updatePattern(id, input) {
        const data = exports.patternUpdateSchema.parse(input);
        const updated = await contractsRepository_1.contractsRepository.updatePattern(id, data);
        // パターン変更に応じてコース自動割当を更新
        const pattern = await prisma_1.default.deliveryPattern.findUnique({ where: { id }, select: { contractId: true } });
        if (pattern?.contractId) {
            const contract = await prisma_1.default.customerProductContract.findUnique({ where: { id: pattern.contractId }, select: { customerId: true } });
            if (contract?.customerId) {
                await autoAssignCourseForCustomerByPatterns(contract.customerId);
            }
        }
        return updated;
    },
    async removePattern(id) {
        await contractsRepository_1.contractsRepository.removePattern(id);
    },
};
async function autoAssignCourseForCustomerByPatterns(customerId) {
    // 顧客の全契約に紐づく配達パターンを取得
    const patterns = await prisma_1.default.deliveryPattern.findMany({
        where: { contract: { customerId } },
        select: { dayOfWeek: true },
    });
    const hasMon = patterns.some(p => p.dayOfWeek === 1);
    const hasThu = patterns.some(p => p.dayOfWeek === 4);
    const hasTue = patterns.some(p => p.dayOfWeek === 2);
    const hasFri = patterns.some(p => p.dayOfWeek === 5);
    const hasWed = patterns.some(p => p.dayOfWeek === 3);
    const hasSat = patterns.some(p => p.dayOfWeek === 6);
    let targetCourseId = null;
    // コース候補を取得（名前で優先、なければID昇順の先頭3件）
    const namedCourses = await prisma_1.default.deliveryCourse.findMany({ where: { name: { in: ['コース 01', 'コース 02', 'コース 03'] } }, orderBy: { id: 'asc' } });
    let course1 = namedCourses.find(c => c.name === 'コース 01');
    let course2 = namedCourses.find(c => c.name === 'コース 02');
    let course3 = namedCourses.find(c => c.name === 'コース 03');
    if (!course1 || !course2 || !course3) {
        const firstThree = await prisma_1.default.deliveryCourse.findMany({ orderBy: { id: 'asc' }, take: 3 });
        course1 = course1 ?? firstThree[0];
        course2 = course2 ?? firstThree[1];
        course3 = course3 ?? firstThree[2];
    }
    if (hasMon && hasThu && course1)
        targetCourseId = course1.id;
    else if (hasTue && hasFri && course2)
        targetCourseId = course2.id;
    else if (hasWed && hasSat && course3)
        targetCourseId = course3.id;
    if (!targetCourseId)
        return;
    const customer = await prisma_1.default.customer.findUnique({ where: { id: customerId }, select: { deliveryCourseId: true } });
    if (customer?.deliveryCourseId === targetCourseId)
        return; // 変更不要
    const fromCourseId = customer?.deliveryCourseId ?? 0;
    // 末尾に追加
    await deliveryCoursesRepository_1.deliveryCoursesRepository.transferCustomer(customerId, fromCourseId, targetCourseId);
}
