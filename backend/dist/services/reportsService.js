"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.invoiceSchema = exports.listFilterSchema = void 0;
const zod_1 = require("zod");
const reportsRepository_1 = require("../repositories/reportsRepository");
exports.listFilterSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    courseId: zod_1.z.coerce.number().int().positive().optional(),
});
exports.invoiceSchema = zod_1.z.object({
    customerId: zod_1.z.coerce.number().int().positive(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
});
exports.reportsService = {
    async deliveryList(input) {
        const filter = exports.listFilterSchema.parse(input ?? {});
        return reportsRepository_1.reportsRepository.getDeliveryList(filter);
    },
    async productList(input) {
        const filter = exports.listFilterSchema.parse(input ?? {});
        return reportsRepository_1.reportsRepository.getProductList(filter);
    },
    async createInvoice(input) {
        const data = exports.invoiceSchema.parse(input);
        return reportsRepository_1.reportsRepository.createInvoice(data);
    },
    async invoiceHistory(customerId) {
        return reportsRepository_1.reportsRepository.listInvoiceHistory(customerId);
    },
};
