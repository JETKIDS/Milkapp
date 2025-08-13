"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
let swaggerUi;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    swaggerUi = require('swagger-ui-express');
}
catch (_e) {
    swaggerUi = null;
}
const schema_1 = require("../openapi/schema");
const router = (0, express_1.Router)();
if (swaggerUi) {
    const doc = (0, schema_1.generateOpenApiDocument)();
    router.use('/', swaggerUi.serve, swaggerUi.setup(doc));
}
else {
    router.get('/', (_req, res) => res.status(503).json({ success: false, error: { code: 'DOCS_DISABLED', message: 'Swagger not installed' } }));
}
exports.default = router;
