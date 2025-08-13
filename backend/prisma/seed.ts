import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Manufacturers
  const manufacturerA = await prisma.manufacturer.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Milk Co', contactInfo: 'info@milkco.example' },
  });
  const manufacturerB = await prisma.manufacturer.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Dairy Corp', contactInfo: 'support@dairycorp.example' },
  });

  // Products
  const productWhole = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Whole Milk 1L',
      manufacturerId: manufacturerA.id,
      price: 180,
      unit: 'bottle',
      description: 'Rich whole milk 1L',
    },
  });
  const productSkim = await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Skim Milk 1L',
      manufacturerId: manufacturerB.id,
      price: 160,
      unit: 'bottle',
      description: 'Low fat skim milk 1L',
    },
  });

  // Delivery Courses
  const courseA = await prisma.deliveryCourse.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Course A', description: 'North area morning route' },
  });
  const courseB = await prisma.deliveryCourse.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Course B', description: 'South area evening route' },
  });

  // Customers
  const customerTaro = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '田中 太郎',
      address: '東京都千代田区1-1-1',
      phone: '03-0000-0001',
      email: 'taro@example.com',
      deliveryCourseId: courseA.id,
    },
  });
  const customerHanako = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '佐藤 花子',
      address: '東京都港区2-2-2',
      phone: '03-0000-0002',
      email: 'hanako@example.com',
      deliveryCourseId: courseA.id,
    },
  });
  const customerIchiro = await prisma.customer.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: '鈴木 一郎',
      address: '東京都新宿区3-3-3',
      phone: '03-0000-0003',
      email: 'ichiro@example.com',
      deliveryCourseId: courseB.id,
    },
  });

  // Course positions
  await prisma.customerCoursePosition.upsert({
    where: { customerId_deliveryCourseId: { customerId: customerTaro.id, deliveryCourseId: courseA.id } },
    update: { position: 1 },
    create: { customerId: customerTaro.id, deliveryCourseId: courseA.id, position: 1 },
  });
  await prisma.customerCoursePosition.upsert({
    where: { customerId_deliveryCourseId: { customerId: customerHanako.id, deliveryCourseId: courseA.id } },
    update: { position: 2 },
    create: { customerId: customerHanako.id, deliveryCourseId: courseA.id, position: 2 },
  });
  await prisma.customerCoursePosition.upsert({
    where: { customerId_deliveryCourseId: { customerId: customerIchiro.id, deliveryCourseId: courseB.id } },
    update: { position: 1 },
    create: { customerId: customerIchiro.id, deliveryCourseId: courseB.id, position: 1 },
  });

  // Delivery schedules (Mon/Wed/Fri for Taro, Tue/Thu for Hanako, Sat for Ichiro)
  const scheduleSeeds = [
    { customerId: customerTaro.id, dayOfWeek: 1 },
    { customerId: customerTaro.id, dayOfWeek: 3 },
    { customerId: customerTaro.id, dayOfWeek: 5 },
    { customerId: customerHanako.id, dayOfWeek: 2 },
    { customerId: customerHanako.id, dayOfWeek: 4 },
    { customerId: customerIchiro.id, dayOfWeek: 6 },
  ];
  for (const s of scheduleSeeds) {
    await prisma.deliverySchedule.create({ data: s });
  }

  // Contracts and patterns
  const contractTaroWhole = await prisma.customerProductContract.create({
    data: {
      customerId: customerTaro.id,
      productId: productWhole.id,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      isActive: true,
    },
  });
  await prisma.deliveryPattern.createMany({
    data: [
      { contractId: contractTaroWhole.id, dayOfWeek: 1, quantity: 1 },
      { contractId: contractTaroWhole.id, dayOfWeek: 3, quantity: 1 },
      { contractId: contractTaroWhole.id, dayOfWeek: 5, quantity: 2 },
    ],
  });

  const contractHanakoSkim = await prisma.customerProductContract.create({
    data: {
      customerId: customerHanako.id,
      productId: productSkim.id,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      isActive: true,
    },
  });
  await prisma.deliveryPattern.createMany({
    data: [
      { contractId: contractHanakoSkim.id, dayOfWeek: 2, quantity: 2 },
      { contractId: contractHanakoSkim.id, dayOfWeek: 4, quantity: 1 },
    ],
  });

  // Sample orders
  await prisma.order.createMany({
    data: [
      {
        customerId: customerTaro.id,
        productId: productWhole.id,
        quantity: 2,
        unitPrice: 180,
        totalPrice: 360,
        orderDate: new Date(),
        status: 'pending',
      },
      {
        customerId: customerHanako.id,
        productId: productSkim.id,
        quantity: 1,
        unitPrice: 160,
        totalPrice: 160,
        orderDate: new Date(),
        status: 'pending',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


