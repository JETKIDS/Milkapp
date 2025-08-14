"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../lib/logger");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
function errorHandler(err, _req, res, _next) {
    try {
        logger_1.logger.error(err);
    }
    catch { }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '入力が不正です', details: err.issues } });
    }
    if (err && err.code) {
        const map = {
            MANUFACTURER_HAS_PRODUCTS: { status: 409, message: '関連商品が存在するためメーカーを削除できません' },
            PRODUCT_HAS_ORDERS: { status: 409, message: '関連注文が存在するため商品を削除できません' },
            COURSE_HAS_CUSTOMERS: { status: 409, message: '関連顧客が存在するためコースを削除できません' },
            INSUFFICIENT_STOCK: { status: 409, message: '注文数量が在庫数量を超えています' },
            PRODUCT_NOT_FOUND: { status: 404, message: '対象商品が見つかりません' },
        };
        const hit = map[err.code];
        if (hit)
            return res.status(hit.status).json({ success: false, error: { code: err.code, message: hit.message } });
    }
    // Prisma known errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const map = {
            P2002: { status: 409, message: '一意制約に違反しています' },
            P2003: { status: 409, message: '外部キー制約に違反しています' },
            P2025: { status: 404, message: '対象データが存在しません' },
        };
        const hit = map[err.code];
        if (hit)
            return res.status(hit.status).json({ success: false, error: { code: err.code, message: hit.message } });
    }
    // fallback
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err?.message || '予期しないエラーが発生しました' } });
}
