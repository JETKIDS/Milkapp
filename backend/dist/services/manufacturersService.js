"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manufacturersService = exports.manufacturerUpdateSchema = exports.manufacturerCreateSchema = void 0;
const zod_1 = require("zod");
const manufacturersRepository_1 = require("../repositories/manufacturersRepository");
exports.manufacturerCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    contactInfo: zod_1.z.string().optional(),
});
exports.manufacturerUpdateSchema = exports.manufacturerCreateSchema.partial();
exports.manufacturersService = {
    async list() {
        return manufacturersRepository_1.manufacturersRepository.list();
    },
    async create(input) {
        const data = exports.manufacturerCreateSchema.parse(input);
        return manufacturersRepository_1.manufacturersRepository.create(data);
    },
    async update(id, input) {
        const data = exports.manufacturerUpdateSchema.parse(input);
        return manufacturersRepository_1.manufacturersRepository.update(id, data);
    },
    async remove(id) {
        const productCount = await manufacturersRepository_1.manufacturersRepository.countProducts(id);
        if (productCount > 0) {
            const err = new Error('メーカーに関連する商品が存在するため削除できません');
            // @ts-ignore add code
            err.code = 'MANUFACTURER_HAS_PRODUCTS';
            throw err;
        }
        await manufacturersRepository_1.manufacturersRepository.remove(id);
    },
};
