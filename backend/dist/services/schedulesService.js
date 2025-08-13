"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulesService = exports.scheduleUpdateSchema = exports.scheduleCreateSchema = void 0;
const zod_1 = require("zod");
const schedulesRepository_1 = require("../repositories/schedulesRepository");
exports.scheduleCreateSchema = zod_1.z.object({
    customerId: zod_1.z.number().int().positive(),
    dayOfWeek: zod_1.z.number().int().min(0).max(6),
    isActive: zod_1.z.boolean().optional(),
});
exports.scheduleUpdateSchema = exports.scheduleCreateSchema.partial();
exports.schedulesService = {
    async list() {
        return schedulesRepository_1.schedulesRepository.list();
    },
    async listByDay(day) {
        return schedulesRepository_1.schedulesRepository.listByDay(day);
    },
    async listByCourse(courseId) {
        return schedulesRepository_1.schedulesRepository.listByCourse(courseId);
    },
    async create(input) {
        const data = exports.scheduleCreateSchema.parse(input);
        return schedulesRepository_1.schedulesRepository.create(data);
    },
    async update(id, input) {
        const data = exports.scheduleUpdateSchema.parse(input);
        return schedulesRepository_1.schedulesRepository.update(id, data);
    },
    async complete(scheduleId, dateISO) {
        return schedulesRepository_1.schedulesRepository.complete(scheduleId, dateISO);
    },
    async historyByCustomer(customerId, from, to) {
        const { deliveryRecordsRepository } = await Promise.resolve().then(() => __importStar(require('../repositories/deliveryRecordsRepository')));
        return deliveryRecordsRepository.list({
            customerId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    },
};
