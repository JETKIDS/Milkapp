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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("./lib/logger");
const customers_1 = __importDefault(require("./routes/customers"));
const manufacturers_1 = __importDefault(require("./routes/manufacturers"));
const products_1 = __importDefault(require("./routes/products"));
const deliveryCourses_1 = __importDefault(require("./routes/deliveryCourses"));
const errorHandler_1 = require("./middlewares/errorHandler");
const orders_1 = __importDefault(require("./routes/orders"));
const schedules_1 = __importDefault(require("./routes/schedules"));
const contracts_1 = __importStar(require("./routes/contracts"));
const reports_1 = __importDefault(require("./routes/reports"));
const customerDetail_1 = __importDefault(require("./routes/customerDetail"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const docs_1 = __importDefault(require("./routes/docs"));
const schema_1 = require("./openapi/schema");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(logger_1.httpLogger);
app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
});
app.use('/api/customers', customers_1.default);
app.use('/api/manufacturers', manufacturers_1.default);
app.use('/api/products', products_1.default);
app.use('/api/delivery-courses', deliveryCourses_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/schedules', schedules_1.default);
app.use('/api/customers/:id/contracts', contracts_1.default);
app.use('/api/customers/:id/delivery-patterns', contracts_1.patternsRouter);
app.use('/api/reports', reports_1.default);
app.use('/api/customers/:id', customerDetail_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/docs', docs_1.default);
app.get('/docs.json', (_req, res) => {
    const doc = (0, schema_1.generateOpenApiDocument)();
    res.json(doc);
});
app.use(errorHandler_1.errorHandler);
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`backend listening on :${port}`);
    });
}
exports.default = app;
