import { createCustomerSchema, updateCustomerSchema } from '../services/customersService';
import { manufacturerCreateSchema, manufacturerUpdateSchema } from '../services/manufacturersService';
import { productCreateSchema, productUpdateSchema } from '../services/productsService';
import { deliveryCourseCreateSchema, deliveryCourseUpdateSchema } from '../services/deliveryCoursesService';
import { scheduleCreateSchema, scheduleUpdateSchema } from '../services/schedulesService';
import { orderCreateSchema, orderUpdateSchema } from '../services/ordersService';
import { contractCreateSchema, contractUpdateSchema, patternCreateSchema, patternUpdateSchema } from '../services/contractsService';
import { listFilterSchema, invoiceSchema } from '../services/reportsService';
import { z } from 'zod';

export function generateOpenApiDocument() {
  // Lazy require to avoid test env hard-dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { OpenAPIRegistry, OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
  extendZodWithOpenApi(z);
  const registry = new OpenAPIRegistry();

  // Domain schemas (model-side)
  const Customer = z.object({
    id: z.number().int(),
    name: z.string(),
    address: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    deliveryCourseId: z.number().int().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const Manufacturer = z.object({
    id: z.number().int(),
    name: z.string(),
    contactInfo: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const Product = z.object({
    id: z.number().int(),
    name: z.string(),
    manufacturerId: z.number().int(),
    price: z.number().int(),
    unit: z.string(),
    description: z.string().optional(),
    stock: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const DeliveryCourse = z.object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const Order = z.object({
    id: z.number().int(),
    customerId: z.number().int(),
    productId: z.number().int(),
    quantity: z.number().int(),
    unitPrice: z.number().int(),
    totalPrice: z.number().int(),
    orderDate: z.string().datetime(),
    deliveryDate: z.string().datetime().optional(),
    status: z.string(),
    createdAt: z.string().datetime(),
  });

  const DeliverySchedule = z.object({
    id: z.number().int(),
    customerId: z.number().int(),
    dayOfWeek: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
  });

  const DeliveryRecord = z.object({
    id: z.number().int(),
    orderId: z.number().int().optional(),
    customerId: z.number().int(),
    deliveryDate: z.string().datetime(),
    status: z.string(),
    notes: z.string().optional(),
    createdAt: z.string().datetime(),
  });

  const CustomerProductContract = z.object({
    id: z.number().int(),
    customerId: z.number().int(),
    productId: z.number().int(),
    isActive: z.boolean(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const DeliveryPattern = z.object({
    id: z.number().int(),
    contractId: z.number().int(),
    dayOfWeek: z.number().int(),
    quantity: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const CustomerCoursePosition = z.object({
    id: z.number().int(),
    customerId: z.number().int(),
    deliveryCourseId: z.number().int(),
    position: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const InvoiceHistory = z.object({
    id: z.number().int(),
    customerId: z.number().int(),
    invoicePeriodStart: z.string().datetime(),
    invoicePeriodEnd: z.string().datetime(),
    totalAmount: z.number().int(),
    issuedDate: z.string().datetime(),
    createdAt: z.string().datetime(),
  });

  const SuccessResponse = z.object({
    success: z.literal(true),
    data: z.any(),
    message: z.string().optional(),
  });
  const ErrorResponse = z.object({
    success: z.literal(false),
    error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }),
  });
  registry.register('CustomerCreate', createCustomerSchema);
  registry.register('CustomerUpdate', updateCustomerSchema);
  registry.register('Customer', Customer);
  registry.register('Manufacturer', Manufacturer);
  registry.register('ManufacturerCreate', manufacturerCreateSchema);
  registry.register('ManufacturerUpdate', manufacturerUpdateSchema);
  registry.register('Product', Product);
  registry.register('ProductCreate', productCreateSchema);
  registry.register('ProductUpdate', productUpdateSchema);
  registry.register('DeliveryCourse', DeliveryCourse);
  registry.register('DeliveryCourseCreate', deliveryCourseCreateSchema);
  registry.register('DeliveryCourseUpdate', deliveryCourseUpdateSchema);
  registry.register('Order', Order);
  registry.register('ScheduleCreate', scheduleCreateSchema);
  registry.register('ScheduleUpdate', scheduleUpdateSchema);
  registry.register('DeliverySchedule', DeliverySchedule);
  registry.register('DeliveryRecord', DeliveryRecord);
  registry.register('OrderCreate', orderCreateSchema);
  registry.register('OrderUpdate', orderUpdateSchema);
  registry.register('CustomerProductContract', CustomerProductContract);
  registry.register('ContractCreate', contractCreateSchema);
  registry.register('ContractUpdate', contractUpdateSchema);
  registry.register('DeliveryPattern', DeliveryPattern);
  registry.register('PatternCreate', patternCreateSchema);
  registry.register('PatternUpdate', patternUpdateSchema);
  registry.register('CustomerCoursePosition', CustomerCoursePosition);
  registry.register('ReportFilter', listFilterSchema);
  registry.register('InvoiceInput', invoiceSchema);
  registry.register('InvoiceHistory', InvoiceHistory);
  registry.register('SuccessResponse', SuccessResponse);
  registry.register('ErrorResponse', ErrorResponse);

  // Paths (sample for customers and invoice history)
  registry.registerPath({
    method: 'get',
    path: '/api/customers',
    summary: 'List customers',
    tags: ['Customers'],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: SuccessResponse.extend({ data: z.array(Customer) }),
          },
        },
      },
    },
  });

  // Manufacturers
  registry.registerPath({
    method: 'get',
    path: '/api/manufacturers',
    summary: 'List manufacturers',
    tags: ['Manufacturers'],
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(Manufacturer) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/manufacturers',
    summary: 'Create manufacturer',
    tags: ['Manufacturers'],
    request: { body: { content: { 'application/json': { schema: manufacturerCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: Manufacturer }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/manufacturers/{id}',
    summary: 'Update manufacturer',
    tags: ['Manufacturers'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: manufacturerUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Manufacturer }) } } } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/manufacturers/{id}',
    summary: 'Delete manufacturer',
    tags: ['Manufacturers'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  // Products
  registry.registerPath({
    method: 'get',
    path: '/api/products',
    summary: 'List products',
    tags: ['Products'],
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(Product) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/products',
    summary: 'Create product',
    tags: ['Products'],
    request: { body: { content: { 'application/json': { schema: productCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: Product }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/products/{id}',
    summary: 'Update product',
    tags: ['Products'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: productUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Product }) } } } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/products/{id}',
    summary: 'Delete product',
    tags: ['Products'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  // Delivery Courses
  registry.registerPath({
    method: 'get',
    path: '/api/delivery-courses',
    summary: 'List delivery courses',
    tags: ['DeliveryCourses'],
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(DeliveryCourse) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/delivery-courses',
    summary: 'Create delivery course',
    tags: ['DeliveryCourses'],
    request: { body: { content: { 'application/json': { schema: deliveryCourseCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryCourse }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/delivery-courses/{id}',
    summary: 'Update delivery course',
    tags: ['DeliveryCourses'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: deliveryCourseUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryCourse }) } } } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/delivery-courses/{id}',
    summary: 'Delete delivery course',
    tags: ['DeliveryCourses'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  // Orders
  registry.registerPath({
    method: 'get',
    path: '/api/orders',
    summary: 'List orders',
    tags: ['Orders'],
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(Order) }) } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/orders/by-customer/{customerId}',
    summary: 'List orders by customer and period',
    tags: ['Orders'],
    request: { params: z.object({ customerId: z.string() }), query: z.object({ from: z.string().optional(), to: z.string().optional() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(Order) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/orders',
    summary: 'Create order',
    tags: ['Orders'],
    request: { body: { content: { 'application/json': { schema: orderCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: Order }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/orders/{id}',
    summary: 'Update order',
    tags: ['Orders'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: orderUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Order }) } } } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/orders/{id}',
    summary: 'Delete order',
    tags: ['Orders'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  // Schedules
  registry.registerPath({
    method: 'get',
    path: '/api/schedules',
    summary: 'List schedules',
    tags: ['Schedules'],
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(DeliverySchedule) }) } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/schedules/by-day/{day}',
    summary: 'List schedules by day of week',
    tags: ['Schedules'],
    request: { params: z.object({ day: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(DeliverySchedule) }) } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/schedules/by-course/{courseId}',
    summary: 'List schedules by delivery course',
    tags: ['Schedules'],
    request: { params: z.object({ courseId: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(DeliverySchedule) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/schedules',
    summary: 'Create schedule',
    tags: ['Schedules'],
    request: { body: { content: { 'application/json': { schema: scheduleCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliverySchedule }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/schedules/{id}',
    summary: 'Update schedule',
    tags: ['Schedules'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: scheduleUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliverySchedule }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/schedules/complete/{id}',
    summary: 'Complete schedule for a date',
    tags: ['Schedules'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: z.object({ date: z.string().datetime().optional() }) } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryRecord }) } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/schedules/history/by-customer/{customerId}',
    summary: 'Delivery history by customer',
    tags: ['Schedules'],
    request: { params: z.object({ customerId: z.string() }), query: z.object({ from: z.string().optional(), to: z.string().optional() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(DeliveryRecord) }) } } } },
  });

  // Contracts and Patterns
  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/contracts',
    summary: 'List contracts by customer',
    tags: ['Contracts'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(CustomerProductContract) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/customers/{id}/contracts',
    summary: 'Create contract for customer',
    tags: ['Contracts'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: contractCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerProductContract }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/customers/{id}/contracts/{contractId}',
    summary: 'Update contract',
    tags: ['Contracts'],
    request: { params: z.object({ id: z.string(), contractId: z.string() }), body: { content: { 'application/json': { schema: contractUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerProductContract }) } } } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/customers/{id}/contracts/{contractId}',
    summary: 'Delete contract',
    tags: ['Contracts'],
    request: { params: z.object({ id: z.string(), contractId: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/delivery-patterns/{contractId}',
    summary: 'List patterns for contract',
    tags: ['DeliveryPatterns'],
    request: { params: z.object({ id: z.string(), contractId: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: z.array(DeliveryPattern) }) } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/customers/{id}/delivery-patterns',
    summary: 'Create delivery pattern',
    tags: ['DeliveryPatterns'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: patternCreateSchema } } } },
    responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryPattern }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/customers/{id}/delivery-patterns/{patternId}',
    summary: 'Update delivery pattern',
    tags: ['DeliveryPatterns'],
    request: { params: z.object({ id: z.string(), patternId: z.string() }), body: { content: { 'application/json': { schema: patternUpdateSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryPattern }) } } } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/customers/{id}/delivery-patterns/{patternId}',
    summary: 'Delete delivery pattern',
    tags: ['DeliveryPatterns'],
    request: { params: z.object({ id: z.string(), patternId: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  // Customer detail
  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/detail',
    summary: 'Customer detail aggregate',
    tags: ['CustomerDetail'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/delivery-schedule',
    summary: 'Customer delivery schedule',
    tags: ['CustomerDetail'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/monthly-calendar/{year}/{month}',
    summary: 'Customer monthly calendar',
    tags: ['CustomerDetail'],
    request: { params: z.object({ id: z.string(), year: z.string(), month: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/monthly-billing/{year}/{month}',
    summary: 'Customer monthly billing',
    tags: ['CustomerDetail'],
    request: { params: z.object({ id: z.string(), year: z.string(), month: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/customers/{id}/course-position',
    summary: 'Get course position',
    tags: ['CustomerDetail'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerCoursePosition.nullable() }) } } } },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/customers/{id}/course-position',
    summary: 'Set course position',
    tags: ['CustomerDetail'],
    request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: z.object({ courseId: z.number().int(), position: z.number().int() }) } } } },
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerCoursePosition }) } } } },
  });

  // Reports
  const PdfBinary = z.any();
  registry.registerPath({
    method: 'post',
    path: '/api/reports/delivery-list',
    summary: 'Generate delivery list PDF',
    tags: ['Reports'],
    request: { body: { content: { 'application/json': { schema: listFilterSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/pdf': { schema: PdfBinary } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/reports/product-list',
    summary: 'Generate product list PDF',
    tags: ['Reports'],
    request: { body: { content: { 'application/json': { schema: listFilterSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/pdf': { schema: PdfBinary } } } },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/reports/invoice/{customerId}',
    summary: 'Generate invoice PDF',
    tags: ['Reports'],
    request: { params: z.object({ customerId: z.string() }), body: { content: { 'application/json': { schema: invoiceSchema } } } },
    responses: { 200: { description: 'OK', content: { 'application/pdf': { schema: PdfBinary } } } },
  });

  // Dashboard
  registry.registerPath({ method: 'get', path: '/api/dashboard/today', summary: 'Today overview', tags: ['Dashboard'], responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } } });
  registry.registerPath({ method: 'get', path: '/api/dashboard/pending-deliveries', summary: 'Pending deliveries', tags: ['Dashboard'], responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } } });
  registry.registerPath({ method: 'get', path: '/api/dashboard/delivery-status', summary: 'Delivery status by course/day', tags: ['Dashboard'], responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } } });
  registry.registerPath({ method: 'get', path: '/api/dashboard/monthly-summary', summary: 'Monthly sales summary', tags: ['Dashboard'], responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } } });

  registry.registerPath({
    method: 'post',
    path: '/api/customers',
    summary: 'Create customer',
    tags: ['Customers'],
    request: {
      body: {
        content: {
          'application/json': { schema: createCustomerSchema },
        },
      },
    },
    responses: {
      201: {
        description: 'Created',
        content: {
          'application/json': {
            schema: SuccessResponse.extend({ data: Customer }),
          },
        },
      },
      400: { description: 'Bad Request', content: { 'application/json': { schema: ErrorResponse } } },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/customers/{id}',
    summary: 'Update customer',
    tags: ['Customers'],
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { 'application/json': { schema: updateCustomerSchema } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Customer }) } } },
      400: { description: 'Bad Request', content: { 'application/json': { schema: ErrorResponse } } },
      404: { description: 'Not Found', content: { 'application/json': { schema: ErrorResponse } } },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/customers/{id}',
    summary: 'Delete customer',
    tags: ['Customers'],
    request: { params: z.object({ id: z.string() }) },
    responses: { 204: { description: 'No Content' } },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/reports/invoice-history/{customerId}',
    summary: 'Get invoice history',
    tags: ['Reports'],
    request: { params: z.object({ customerId: z.string() }) },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: SuccessResponse.extend({ data: z.array(InvoiceHistory) }),
          },
        },
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: { title: 'Milk Delivery Customer Management API', version: '0.1.0' },
    paths: {},
  });
}


