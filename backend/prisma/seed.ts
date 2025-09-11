import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function resetAll() {
  // 参照制約順に削除（参照先から先に削除）
  await prisma.deliveryRecord.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deliveryPattern.deleteMany();
  await prisma.contractPause.deleteMany();
  await prisma.customerProductContract.deleteMany();
  await prisma.deliverySchedule.deleteMany();
  await prisma.customerCoursePosition.deleteMany();
  await prisma.invoiceHistory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.manufacturer.deleteMany();
  await prisma.deliveryCourse.deleteMany();
}

async function seedCatalog() {
  // Manufacturers: 5件
  const manufacturerNames = [
    '北海乳業',
    '信州デイリー',
    '関東ミルク',
    '関西デーリィ',
    '九州乳品'
  ];
  const manufacturers = [] as { id: number; name: string }[];
  for (const name of manufacturerNames) {
    const m = await prisma.manufacturer.create({
      data: { name, contactInfo: `${name.toLowerCase()}@example.com` },
      select: { id: true, name: true },
    });
    manufacturers.push(m);
  }

  // Products: 20件（メーカーに均等割り当て）
  const products = [] as { id: number; name: string; price: number }[];
  for (let i = 1; i <= 20; i++) {
    const man = manufacturers[(i - 1) % manufacturers.length];
    const price = 120 + (i % 6) * 20; // 120〜220の範囲
    const p = await prisma.product.create({
      data: {
        name: `牛乳 ${i}本パック`,
        manufacturerId: man.id,
        price,
        unit: 'bottle',
        description: `${man.name} の人気商品 ${i}`,
        stock: 99999,
      },
      select: { id: true, name: true, price: true },
    });
    products.push(p);
  }

  // Delivery Courses: 10件
  const courses = [] as { id: number; name: string }[];
  for (let i = 1; i <= 10; i++) {
    const c = await prisma.deliveryCourse.create({
      data: { name: `コース ${String(i).padStart(2, '0')}`, description: `エリア${i}担当ルート` },
      select: { id: true, name: true },
    });
    courses.push(c);
  }

  return { manufacturers, products, courses };
}

async function seedCustomersAndContracts(products: { id: number; price: number }[], courses: { id: number; name: string }[]) {
  // 顧客名候補
  const familyNames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
  const givenNames = ['太郎', '花子', '一郎', '次郎', '美咲', '陽菜', '大輔', '直樹', '由美', '恵'];

  // 3種類の配達パターングループ（月木 / 火金 / 水土）を均等割り当て
  const groups: Array<{ name: 'MonThu' | 'TueFri' | 'WedSat'; days: [number, number] }> = [
    { name: 'MonThu', days: [1, 4] },
    { name: 'TueFri', days: [2, 5] },
    { name: 'WedSat', days: [3, 6] },
  ];

  const groupCounts = [0, 0, 0];
  const groupTargets = [17, 17, 16]; // 50人をほぼ均等に

  // コースごとの並び順カウンタ
  const coursePositionMap = new Map<number, number>();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  for (let i = 1; i <= 50; i++) {
    // 名前は重複しにくい組み合わせで生成（姓は循環、名はブロック単位で進行）
    const family = familyNames[(i - 1) % familyNames.length];
    const given = givenNames[Math.floor((i - 1) / familyNames.length) % givenNames.length];
    const name = `${family} ${given}`;
    const address = `東京都サンプル区${Math.ceil(i / 5)}-${(i % 5) + 1}-${(i % 9) + 1}`;
    const phone = `03-0000-${String(1000 + i).slice(-4)}`;
    const email = `user${i}@example.com`;

    // パターングループを均等に割当
    let groupIndex = 0;
    for (let gi = 0; gi < groups.length; gi++) {
      if (groupCounts[gi] < groupTargets[gi]) {
        groupIndex = gi;
        break;
      }
    }
    groupCounts[groupIndex]++;
    const group = groups[groupIndex];

    // コースは曜日に応じて 01/02/03 に自動振分
    const course01 = courses.find(c => c.name === 'コース 01') ?? courses[0];
    const course02 = courses.find(c => c.name === 'コース 02') ?? courses[1] ?? courses[0];
    const course03 = courses.find(c => c.name === 'コース 03') ?? courses[2] ?? courses[0];
    const course = (group.name === 'MonThu') ? course01 : (group.name === 'TueFri') ? course02 : course03;
    const customer = await prisma.customer.create({
      data: {
        name,
        address,
        phone,
        email,
        deliveryCourseId: course.id,
      },
      select: { id: true, deliveryCourseId: true },
    });

    // 並び順
    const currentPos = (coursePositionMap.get(course.id) ?? 0) + 1;
    coursePositionMap.set(course.id, currentPos);
    await prisma.customerCoursePosition.create({
      data: { customerId: customer.id, deliveryCourseId: course.id, position: currentPos },
    });

    // ランダムな商品と単価
    const product = pick(products);
    const unitPrice = product.price; // 契約単価は商品価格に揃える

    const contract = await prisma.customerProductContract.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        startDate: startOfMonth,
        unitPrice,
        isActive: true,
      },
      select: { id: true },
    });

    // 配達パターン（各曜日に1〜3本のランダム本数）
    const qty1 = randInt(1, 3);
    const qty2 = randInt(1, 3);
    await prisma.deliveryPattern.createMany({
      data: [
        { contractId: contract.id, dayOfWeek: group.days[0], quantity: qty1 },
        { contractId: contract.id, dayOfWeek: group.days[1], quantity: qty2 },
      ],
    });

    // スケジュール（任意）: パターンの曜日を有効化
    await prisma.deliverySchedule.createMany({
      data: [
        { customerId: customer.id, dayOfWeek: group.days[0] },
        { customerId: customer.id, dayOfWeek: group.days[1] },
      ],
    });
  }
}

async function main() {
  await resetAll();
  const { products, courses } = await seedCatalog();
  await seedCustomersAndContracts(products, courses);
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


