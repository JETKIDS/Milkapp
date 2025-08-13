"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenApiDocument = generateOpenApiDocument;
const customersService_1 = require("../services/customersService");
const manufacturersService_1 = require("../services/manufacturersService");
const productsService_1 = require("../services/productsService");
const deliveryCoursesService_1 = require("../services/deliveryCoursesService");
const schedulesService_1 = require("../services/schedulesService");
const ordersService_1 = require("../services/ordersService");
const contractsService_1 = require("../services/contractsService");
const reportsService_1 = require("../services/reportsService");
const zod_1 = require("zod");
function generateOpenApiDocument() {
    // Lazy require to avoid test env hard-dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OpenAPIRegistry, OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
    extendZodWithOpenApi(zod_1.z);
    const registry = new OpenAPIRegistry();
    // Domain schemas (model-side)
    const Customer = zod_1.z.object({
        id: zod_1.z.number().int(),
        name: zod_1.z.string(),
        address: zod_1.z.string(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        deliveryCourseId: zod_1.z.number().int().optional(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const Manufacturer = zod_1.z.object({
        id: zod_1.z.number().int(),
        name: zod_1.z.string(),
        contactInfo: zod_1.z.string().optional(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const Product = zod_1.z.object({
        id: zod_1.z.number().int(),
        name: zod_1.z.string(),
        manufacturerId: zod_1.z.number().int(),
        price: zod_1.z.number().int(),
        unit: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        stock: zod_1.z.number().int(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const DeliveryCourse = zod_1.z.object({
        id: zod_1.z.number().int(),
        name: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const Order = zod_1.z.object({
        id: zod_1.z.number().int(),
        customerId: zod_1.z.number().int(),
        productId: zod_1.z.number().int(),
        quantity: zod_1.z.number().int(),
        unitPrice: zod_1.z.number().int(),
        totalPrice: zod_1.z.number().int(),
        orderDate: zod_1.z.string().datetime(),
        deliveryDate: zod_1.z.string().datetime().optional(),
        status: zod_1.z.string(),
        createdAt: zod_1.z.string().datetime(),
    });
    const DeliverySchedule = zod_1.z.object({
        id: zod_1.z.number().int(),
        customerId: zod_1.z.number().int(),
        dayOfWeek: zod_1.z.number().int(),
        isActive: zod_1.z.boolean(),
        createdAt: zod_1.z.string().datetime(),
    });
    const DeliveryRecord = zod_1.z.object({
        id: zod_1.z.number().int(),
        orderId: zod_1.z.number().int().optional(),
        customerId: zod_1.z.number().int(),
        deliveryDate: zod_1.z.string().datetime(),
        status: zod_1.z.string(),
        notes: zod_1.z.string().optional(),
        createdAt: zod_1.z.string().datetime(),
    });
    const CustomerProductContract = zod_1.z.object({
        id: zod_1.z.number().int(),
        customerId: zod_1.z.number().int(),
        productId: zod_1.z.number().int(),
        isActive: zod_1.z.boolean(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime().optional(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const DeliveryPattern = zod_1.z.object({
        id: zod_1.z.number().int(),
        contractId: zod_1.z.number().int(),
        dayOfWeek: zod_1.z.number().int(),
        quantity: zod_1.z.number().int(),
        isActive: zod_1.z.boolean(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const CustomerCoursePosition = zod_1.z.object({
        id: zod_1.z.number().int(),
        customerId: zod_1.z.number().int(),
        deliveryCourseId: zod_1.z.number().int(),
        position: zod_1.z.number().int(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    });
    const InvoiceHistory = zod_1.z.object({
        id: zod_1.z.number().int(),
        customerId: zod_1.z.number().int(),
        invoicePeriodStart: zod_1.z.string().datetime(),
        invoicePeriodEnd: zod_1.z.string().datetime(),
        totalAmount: zod_1.z.number().int(),
        issuedDate: zod_1.z.string().datetime(),
        createdAt: zod_1.z.string().datetime(),
    });
    const SuccessResponse = zod_1.z.object({
        success: zod_1.z.literal(true),
        data: zod_1.z.any(),
        message: zod_1.z.string().optional(),
    });
    const ErrorResponse = zod_1.z.object({
        success: zod_1.z.literal(false),
        error: zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string(), details: zod_1.z.any().optional() }),
    });
    registry.register('CustomerCreate', customersService_1.createCustomerSchema);
    registry.register('CustomerUpdate', customersService_1.updateCustomerSchema);
    registry.register('Customer', Customer);
    registry.register('Manufacturer', Manufacturer);
    registry.register('ManufacturerCreate', manufacturersService_1.manufacturerCreateSchema);
    registry.register('ManufacturerUpdate', manufacturersService_1.manufacturerUpdateSchema);
    registry.register('Product', Product);
    registry.register('ProductCreate', productsService_1.productCreateSchema);
    registry.register('ProductUpdate', productsService_1.productUpdateSchema);
    registry.register('DeliveryCourse', DeliveryCourse);
    registry.register('DeliveryCourseCreate', deliveryCoursesService_1.deliveryCourseCreateSchema);
    registry.register('DeliveryCourseUpdate', deliveryCoursesService_1.deliveryCourseUpdateSchema);
    registry.register('Order', Order);
    registry.register('ScheduleCreate', schedulesService_1.scheduleCreateSchema);
    registry.register('ScheduleUpdate', schedulesService_1.scheduleUpdateSchema);
    registry.register('DeliverySchedule', DeliverySchedule);
    registry.register('DeliveryRecord', DeliveryRecord);
    registry.register('OrderCreate', ordersService_1.orderCreateSchema);
    registry.register('OrderUpdate', ordersService_1.orderUpdateSchema);
    registry.register('CustomerProductContract', CustomerProductContract);
    registry.register('ContractCreate', contractsService_1.contractCreateSchema);
    registry.register('ContractUpdate', contractsService_1.contractUpdateSchema);
    registry.register('DeliveryPattern', DeliveryPattern);
    registry.register('PatternCreate', contractsService_1.patternCreateSchema);
    registry.register('PatternUpdate', contractsService_1.patternUpdateSchema);
    registry.register('CustomerCoursePosition', CustomerCoursePosition);
    registry.register('ReportFilter', reportsService_1.listFilterSchema);
    registry.register('InvoiceInput', reportsService_1.invoiceSchema);
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
                        schema: SuccessResponse.extend({ data: zod_1.z.array(Customer) }),
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
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(Manufacturer) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/manufacturers',
        summary: 'Create manufacturer',
        tags: ['Manufacturers'],
        request: { body: { content: { 'application/json': { schema: manufacturersService_1.manufacturerCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: Manufacturer }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/manufacturers/{id}',
        summary: 'Update manufacturer',
        tags: ['Manufacturers'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: manufacturersService_1.manufacturerUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Manufacturer }) } } } },
    });
    registry.registerPath({
        method: 'delete',
        path: '/api/manufacturers/{id}',
        summary: 'Delete manufacturer',
        tags: ['Manufacturers'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    // Products
    registry.registerPath({
        method: 'get',
        path: '/api/products',
        summary: 'List products',
        tags: ['Products'],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(Product) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/products',
        summary: 'Create product',
        tags: ['Products'],
        request: { body: { content: { 'application/json': { schema: productsService_1.productCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: Product }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/products/{id}',
        summary: 'Update product',
        tags: ['Products'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: productsService_1.productUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Product }) } } } },
    });
    registry.registerPath({
        method: 'delete',
        path: '/api/products/{id}',
        summary: 'Delete product',
        tags: ['Products'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    // Delivery Courses
    registry.registerPath({
        method: 'get',
        path: '/api/delivery-courses',
        summary: 'List delivery courses',
        tags: ['DeliveryCourses'],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(DeliveryCourse) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/delivery-courses',
        summary: 'Create delivery course',
        tags: ['DeliveryCourses'],
        request: { body: { content: { 'application/json': { schema: deliveryCoursesService_1.deliveryCourseCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryCourse }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/delivery-courses/{id}',
        summary: 'Update delivery course',
        tags: ['DeliveryCourses'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: deliveryCoursesService_1.deliveryCourseUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryCourse }) } } } },
    });
    registry.registerPath({
        method: 'delete',
        path: '/api/delivery-courses/{id}',
        summary: 'Delete delivery course',
        tags: ['DeliveryCourses'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    // Orders
    registry.registerPath({
        method: 'get',
        path: '/api/orders',
        summary: 'List orders',
        tags: ['Orders'],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(Order) }) } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/orders/by-customer/{customerId}',
        summary: 'List orders by customer and period',
        tags: ['Orders'],
        request: { params: zod_1.z.object({ customerId: zod_1.z.string() }), query: zod_1.z.object({ from: zod_1.z.string().optional(), to: zod_1.z.string().optional() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(Order) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/orders',
        summary: 'Create order',
        tags: ['Orders'],
        request: { body: { content: { 'application/json': { schema: ordersService_1.orderCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: Order }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/orders/{id}',
        summary: 'Update order',
        tags: ['Orders'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: ordersService_1.orderUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: Order }) } } } },
    });
    registry.registerPath({
        method: 'delete',
        path: '/api/orders/{id}',
        summary: 'Delete order',
        tags: ['Orders'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    // Schedules
    registry.registerPath({
        method: 'get',
        path: '/api/schedules',
        summary: 'List schedules',
        tags: ['Schedules'],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(DeliverySchedule) }) } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/schedules/by-day/{day}',
        summary: 'List schedules by day of week',
        tags: ['Schedules'],
        request: { params: zod_1.z.object({ day: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(DeliverySchedule) }) } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/schedules/by-course/{courseId}',
        summary: 'List schedules by delivery course',
        tags: ['Schedules'],
        request: { params: zod_1.z.object({ courseId: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(DeliverySchedule) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/schedules',
        summary: 'Create schedule',
        tags: ['Schedules'],
        request: { body: { content: { 'application/json': { schema: schedulesService_1.scheduleCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliverySchedule }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/schedules/{id}',
        summary: 'Update schedule',
        tags: ['Schedules'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: schedulesService_1.scheduleUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliverySchedule }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/schedules/complete/{id}',
        summary: 'Complete schedule for a date',
        tags: ['Schedules'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: zod_1.z.object({ date: zod_1.z.string().datetime().optional() }) } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryRecord }) } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/schedules/history/by-customer/{customerId}',
        summary: 'Delivery history by customer',
        tags: ['Schedules'],
        request: { params: zod_1.z.object({ customerId: zod_1.z.string() }), query: zod_1.z.object({ from: zod_1.z.string().optional(), to: zod_1.z.string().optional() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(DeliveryRecord) }) } } } },
    });
    // Contracts and Patterns
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/contracts',
        summary: 'List contracts by customer',
        tags: ['Contracts'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(CustomerProductContract) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/customers/{id}/contracts',
        summary: 'Create contract for customer',
        tags: ['Contracts'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: contractsService_1.contractCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerProductContract }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/customers/{id}/contracts/{contractId}',
        summary: 'Update contract',
        tags: ['Contracts'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), contractId: zod_1.z.string() }), body: { content: { 'application/json': { schema: contractsService_1.contractUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerProductContract }) } } } },
    });
    registry.registerPath({
        method: 'delete',
        path: '/api/customers/{id}/contracts/{contractId}',
        summary: 'Delete contract',
        tags: ['Contracts'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), contractId: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/delivery-patterns/{contractId}',
        summary: 'List patterns for contract',
        tags: ['DeliveryPatterns'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), contractId: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: zod_1.z.array(DeliveryPattern) }) } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/customers/{id}/delivery-patterns',
        summary: 'Create delivery pattern',
        tags: ['DeliveryPatterns'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: contractsService_1.patternCreateSchema } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryPattern }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/customers/{id}/delivery-patterns/{patternId}',
        summary: 'Update delivery pattern',
        tags: ['DeliveryPatterns'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), patternId: zod_1.z.string() }), body: { content: { 'application/json': { schema: contractsService_1.patternUpdateSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: DeliveryPattern }) } } } },
    });
    registry.registerPath({
        method: 'delete',
        path: '/api/customers/{id}/delivery-patterns/{patternId}',
        summary: 'Delete delivery pattern',
        tags: ['DeliveryPatterns'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), patternId: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    // Customer detail
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/detail',
        summary: 'Customer detail aggregate',
        tags: ['CustomerDetail'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/delivery-schedule',
        summary: 'Customer delivery schedule',
        tags: ['CustomerDetail'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/monthly-calendar/{year}/{month}',
        summary: 'Customer monthly calendar',
        tags: ['CustomerDetail'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), year: zod_1.z.string(), month: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/monthly-billing/{year}/{month}',
        summary: 'Customer monthly billing',
        tags: ['CustomerDetail'],
        request: { params: zod_1.z.object({ id: zod_1.z.string(), year: zod_1.z.string(), month: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse } } } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/customers/{id}/course-position',
        summary: 'Get course position',
        tags: ['CustomerDetail'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerCoursePosition.nullable() }) } } } },
    });
    registry.registerPath({
        method: 'put',
        path: '/api/customers/{id}/course-position',
        summary: 'Set course position',
        tags: ['CustomerDetail'],
        request: { params: zod_1.z.object({ id: zod_1.z.string() }), body: { content: { 'application/json': { schema: zod_1.z.object({ courseId: zod_1.z.number().int(), position: zod_1.z.number().int() }) } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: SuccessResponse.extend({ data: CustomerCoursePosition }) } } } },
    });
    // Reports
    const PdfBinary = zod_1.z.any();
    registry.registerPath({
        method: 'post',
        path: '/api/reports/delivery-list',
        summary: 'Generate delivery list PDF',
        tags: ['Reports'],
        request: { body: { content: { 'application/json': { schema: reportsService_1.listFilterSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/pdf': { schema: PdfBinary } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/reports/product-list',
        summary: 'Generate product list PDF',
        tags: ['Reports'],
        request: { body: { content: { 'application/json': { schema: reportsService_1.listFilterSchema } } } },
        responses: { 200: { description: 'OK', content: { 'application/pdf': { schema: PdfBinary } } } },
    });
    registry.registerPath({
        method: 'post',
        path: '/api/reports/invoice/{customerId}',
        summary: 'Generate invoice PDF',
        tags: ['Reports'],
        request: { params: zod_1.z.object({ customerId: zod_1.z.string() }), body: { content: { 'application/json': { schema: reportsService_1.invoiceSchema } } } },
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
                    'application/json': { schema: customersService_1.createCustomerSchema },
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
            params: zod_1.z.object({ id: zod_1.z.string() }),
            body: { content: { 'application/json': { schema: customersService_1.updateCustomerSchema } } },
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
        request: { params: zod_1.z.object({ id: zod_1.z.string() }) },
        responses: { 204: { description: 'No Content' } },
    });
    registry.registerPath({
        method: 'get',
        path: '/api/reports/invoice-history/{customerId}',
        summary: 'Get invoice history',
        tags: ['Reports'],
        request: { params: zod_1.z.object({ customerId: zod_1.z.string() }) },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: SuccessResponse.extend({ data: zod_1.z.array(InvoiceHistory) }),
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
