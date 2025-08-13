import { Router } from 'express';
let swaggerUi: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  swaggerUi = require('swagger-ui-express');
} catch (_e) {
  swaggerUi = null;
}
import { generateOpenApiDocument } from '../openapi/schema';

const router = Router();
if (swaggerUi) {
  const doc = generateOpenApiDocument();
  router.use('/', swaggerUi.serve, swaggerUi.setup(doc));
} else {
  router.get('/', (_req, res) => res.status(503).json({ success: false, error: { code: 'DOCS_DISABLED', message: 'Swagger not installed' } }));
}

export default router;


