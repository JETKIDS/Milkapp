"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryCoursesRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.deliveryCoursesRepository = {
    async list() {
        return prisma_1.default.deliveryCourse.findMany({ orderBy: { id: 'asc' } });
    },
    async getById(id) {
        return prisma_1.default.deliveryCourse.findUniqueOrThrow({ where: { id } });
    },
    async create(input) {
        return prisma_1.default.deliveryCourse.create({ data: input });
    },
    async update(id, input) {
        return prisma_1.default.deliveryCourse.update({ where: { id }, data: input });
    },
    async remove(id) {
        return prisma_1.default.deliveryCourse.delete({ where: { id } });
    },
    async countCustomers(id) {
        return prisma_1.default.customer.count({ where: { deliveryCourseId: id } });
    },
    // コース内顧客一覧取得（順番付き）
    async getCourseCustomers(courseId) {
        // まず、ポジション情報を含む顧客を取得
        const customersWithPosition = await prisma_1.default.customerCoursePosition.findMany({
            where: { deliveryCourseId: courseId },
            include: {
                customer: true
            },
            orderBy: { position: 'asc' }
        });
        // ポジション情報がない顧客も取得
        const allCustomers = await prisma_1.default.customer.findMany({
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
                position: null
            }))
        ];
        return result;
    },
    // コース内顧客の順番変更
    async reorderCustomers(courseId, customerIds) {
        return prisma_1.default.$transaction(async (tx) => {
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
    async transferCustomer(customerId, fromCourseId, toCourseId, position) {
        return prisma_1.default.$transaction(async (tx) => {
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
            }
            else {
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
