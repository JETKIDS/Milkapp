"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerDetailService_1 = require("../services/customerDetailService");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/detail', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = await customerDetailService_1.customerDetailService.getDetail(id);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
router.get('/delivery-schedule', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = await customerDetailService_1.customerDetailService.getDeliverySchedule(id);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
router.get('/monthly-calendar/:year/:month', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const year = Number(req.params.year);
        const month = Number(req.params.month);
        const data = await customerDetailService_1.customerDetailService.getMonthlyCalendar(id, year, month);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
router.get('/monthly-billing/:year/:month', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const year = Number(req.params.year);
        const month = Number(req.params.month);
        const data = await customerDetailService_1.customerDetailService.getMonthlyBilling(id, year, month);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
router.get('/course-position', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = await customerDetailService_1.customerDetailService.getCoursePosition(id);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
router.put('/course-position', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { courseId, position } = req.body;
        const data = await customerDetailService_1.customerDetailService.setCoursePosition(id, Number(courseId), Number(position));
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
