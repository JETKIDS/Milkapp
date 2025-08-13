"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryCoursesService = exports.deliveryCourseUpdateSchema = exports.deliveryCourseCreateSchema = void 0;
const zod_1 = require("zod");
const deliveryCoursesRepository_1 = require("../repositories/deliveryCoursesRepository");
exports.deliveryCourseCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.deliveryCourseUpdateSchema = exports.deliveryCourseCreateSchema.partial();
exports.deliveryCoursesService = {
    async list() {
        return deliveryCoursesRepository_1.deliveryCoursesRepository.list();
    },
    async create(input) {
        const data = exports.deliveryCourseCreateSchema.parse(input);
        return deliveryCoursesRepository_1.deliveryCoursesRepository.create(data);
    },
    async update(id, input) {
        const data = exports.deliveryCourseUpdateSchema.parse(input);
        return deliveryCoursesRepository_1.deliveryCoursesRepository.update(id, data);
    },
    async remove(id) {
        const count = await deliveryCoursesRepository_1.deliveryCoursesRepository.countCustomers(id);
        if (count > 0) {
            const err = new Error('コースに関連する顧客が存在するため削除できません');
            // @ts-ignore add code
            err.code = 'COURSE_HAS_CUSTOMERS';
            throw err;
        }
        await deliveryCoursesRepository_1.deliveryCoursesRepository.remove(id);
    },
};
