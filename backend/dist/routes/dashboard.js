"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardService_1 = require("../services/dashboardService");
const router = (0, express_1.Router)();
router.get('/today', async (_req, res, next) => {
    try {
        res.json({ success: true, data: await dashboardService_1.dashboardService.today() });
    }
    catch (e) {
        next(e);
    }
});
router.get('/pending-deliveries', async (_req, res, next) => {
    try {
        res.json({ success: true, data: await dashboardService_1.dashboardService.pendingDeliveries() });
    }
    catch (e) {
        next(e);
    }
});
router.get('/delivery-status', async (_req, res, next) => {
    try {
        res.json({ success: true, data: await dashboardService_1.dashboardService.deliveryStatus() });
    }
    catch (e) {
        next(e);
    }
});
router.get('/monthly-summary', async (_req, res, next) => {
    try {
        res.json({ success: true, data: await dashboardService_1.dashboardService.monthlySummary() });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
