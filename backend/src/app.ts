import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLogger } from './lib/logger';
import customersRouter from './routes/customers';
import manufacturersRouter from './routes/manufacturers';
import productsRouter from './routes/products';
import deliveryCoursesRouter from './routes/deliveryCourses';
import { errorHandler } from './middlewares/errorHandler';
import ordersRouter from './routes/orders';
import schedulesRouter from './routes/schedules';
import contractsRouter, { patternsRouter, patternChangesRouter } from './routes/contracts';
import reportsRouter from './routes/reports';
import customerDetailRouter from './routes/customerDetail';
import dashboardRouter from './routes/dashboard';
import docsRouter from './routes/docs';
import { pausesRouter } from './routes/contracts';
import storesRouter from './routes/stores';
import temporaryDeliveriesRouter from './routes/temporaryDeliveries';
import { generateOpenApiDocument } from './openapi/schema';

const app = express();
app.use(helmet());
app.use(cors({
  origin: '*',
  exposedHeaders: ['X-Total-Count']
}));
app.use(express.json());
app.use(httpLogger);

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/customers', customersRouter);
app.use('/api/manufacturers', manufacturersRouter);
app.use('/api/products', productsRouter);
app.use('/api/delivery-courses', deliveryCoursesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/customers/:id/temporary-deliveries', temporaryDeliveriesRouter);
app.use('/api/customers/:id/contracts', contractsRouter);
app.use('/api/customers/:id/delivery-patterns', patternsRouter);
app.use('/api/customers/:id/contracts', patternChangesRouter);
app.use('/api/customers/:id/contracts', pausesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/customers/:id', customerDetailRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/stores', storesRouter);
app.use('/docs', docsRouter);
app.get('/docs.json', (_req, res) => {
  const doc = generateOpenApiDocument();
  res.json(doc);
});
app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`backend listening on :${port}`);
  });
}

export default app;


