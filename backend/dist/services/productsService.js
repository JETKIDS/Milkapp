"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.productUpdateSchema = exports.productCreateSchema = void 0;
const zod_1 = require("zod");
const productsRepository_1 = require("../repositories/productsRepository");
exports.productCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    manufacturerId: zod_1.z.number().int().positive(),
    price: zod_1.z.number().int().nonnegative(),
    unit: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.productUpdateSchema = exports.productCreateSchema.partial();
exports.productsService = {
    async list() {
        return productsRepository_1.productsRepository.list();
    },
    async create(input) {
        const data = exports.productCreateSchema.parse(input);
        return productsRepository_1.productsRepository.create(data);
    },
    async update(id, input) {
        const data = exports.productUpdateSchema.parse(input);
        return productsRepository_1.productsRepository.update(id, data);
    },
    async remove(id) {
        const orderCount = await productsRepository_1.productsRepository.countOrders(id);
        if (orderCount > 0) {
            const err = new Error('商品の関連注文が存在するため削除できません');
            // @ts-ignore add code
            err.code = 'PRODUCT_HAS_ORDERS';
            throw err;
        }
        await productsRepository_1.productsRepository.remove(id);
    },
};
