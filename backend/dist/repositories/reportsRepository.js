"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.reportsRepository = {
    async getDeliveryList(filter) {
        // 対象日（startDate があればその日、なければ今日）において
        // 契約・配達パターン・休配・契約終了日を考慮して、実際に配達が発生する顧客のみを返す
        const targetDate = filter.startDate ? new Date(filter.startDate) : new Date();
        const dayOfWeek = targetDate.getDay(); // 0=日曜
        // コース条件
        const courseFilter = (filter.courseIds && filter.courseIds.length > 0)
            ? { deliveryCourseId: { in: filter.courseIds } }
            : (filter.courseId ? { deliveryCourseId: filter.courseId } : {});
        // 対象コースの顧客を取得（対象日の配達契約を内包）
        const customers = await prisma_1.default.customer.findMany({
            where: courseFilter,
            include: {
                deliveryCourse: true,
                contracts: {
                    where: {
                        isActive: true,
                        startDate: { lte: targetDate },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: targetDate } },
                        ],
                        // 休配期間に含まれない契約のみ
                        pauses: {
                            none: {
                                startDate: { lte: targetDate },
                                endDate: { gte: targetDate },
                            },
                        },
                        // 当該曜日の配達パターンがあること
                        patterns: {
                            some: { dayOfWeek: dayOfWeek, quantity: { gt: 0 }, isActive: true },
                        },
                    },
                    include: {
                        patterns: true,
                    },
                },
            },
            orderBy: [
                { deliveryCourseId: 'asc' },
                { id: 'asc' },
            ],
        });
        // 当日の有効契約を持つ顧客のみ返す
        return customers.filter((c) => (c.contracts?.length ?? 0) > 0);
    },
    // 新機能: 特定日付のコース別配達詳細リスト（順番付き）
    async getDeliveryScheduleForDate(courseId, targetDate) {
        const date = new Date(targetDate);
        const dayOfWeek = date.getDay(); // 0=日曜, 1=月曜, ...
        // コース内の顧客を順番通りに取得
        const customersWithPosition = await prisma_1.default.customerCoursePosition.findMany({
            where: { deliveryCourseId: courseId },
            include: {
                customer: {
                    include: {
                        contracts: {
                            where: {
                                isActive: true,
                                startDate: { lte: date }, // 契約開始日以降のみ
                                OR: [
                                    { endDate: null },
                                    { endDate: { gte: date } },
                                ],
                            },
                            include: {
                                product: true,
                                patterns: {
                                    where: {
                                        dayOfWeek: dayOfWeek,
                                        quantity: { gt: 0 }, // 数量が0より大きいもののみ
                                        isActive: true,
                                    }
                                },
                                pauses: true,
                            }
                        }
                    }
                }
            },
            orderBy: { position: 'asc' }
        });
        // ポジションがない顧客も取得
        const allCustomers = await prisma_1.default.customer.findMany({
            where: { deliveryCourseId: courseId },
            include: {
                contracts: {
                    where: {
                        isActive: true,
                        startDate: { lte: date },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: date } },
                        ],
                    },
                    include: {
                        product: true,
                        patterns: {
                            where: {
                                dayOfWeek: dayOfWeek,
                                quantity: { gt: 0 },
                                isActive: true,
                            }
                        },
                        pauses: true,
                    }
                }
            }
        });
        const positionedCustomerIds = customersWithPosition.map(cp => cp.customerId);
        const unpositionedCustomers = allCustomers.filter(c => !positionedCustomerIds.includes(c.id));
        // 結果をマージ（順番付き顧客 + 順番なし顧客）
        const allCustomersOrdered = [
            ...customersWithPosition.map(cp => cp.customer),
            ...unpositionedCustomers
        ];
        // 配達がある顧客、または休配の顧客のみフィルタリング（休配は数量欄に「休」を表示するため保持）
        const deliveryList = allCustomersOrdered
            .map(customer => {
            const deliveries = customer.contracts
                .filter(contract => contract.patterns.length > 0)
                .map(contract => {
                const qty = contract.patterns[0].quantity;
                const paused = Array.isArray(contract.pauses) && contract.pauses.some((p) => {
                    const s = new Date(p.startDate);
                    const e = new Date(p.endDate);
                    return s <= date && date <= e;
                });
                return {
                    productName: contract.product.name,
                    quantity: qty,
                    unitPrice: contract.unitPrice,
                    paused,
                };
            });
            const hasAny = deliveries.length > 0;
            return hasAny ? {
                customerId: customer.id,
                customerName: customer.name,
                customerAddress: customer.address,
                deliveries
            } : null;
        })
            .filter(item => item !== null);
        return deliveryList;
    },
    // 新機能: 複数日対応の配達スケジュール
    async getDeliveryScheduleForDateRange(courseId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const result = [];
        for (let currentDate = new Date(start); currentDate <= end; currentDate.setUTCDate(currentDate.getUTCDate() + 1)) {
            const deliveries = await exports.reportsRepository.getDeliveryScheduleForDate(courseId, currentDate.toISOString());
            if (deliveries.length > 0) {
                result.push({ date: currentDate.toISOString(), deliveries });
            }
        }
        return result;
    },
    // 新機能: 複数コース対応の配達スケジュール
    async getDeliveryScheduleForMultipleCourses(courseIds, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const result = [];
        // 各日付を処理
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayDeliveries = [];
            // 各コースを処理
            for (const courseId of courseIds) {
                const courseDeliveries = await this.getDeliveryScheduleForDate(courseId, currentDate.toISOString());
                // コース情報を追加
                const courseInfo = await prisma_1.default.deliveryCourse.findUnique({
                    where: { id: courseId }
                });
                if (courseDeliveries.length > 0) {
                    dayDeliveries.push({
                        courseId,
                        courseName: courseInfo?.name || `コース${courseId}`,
                        deliveries: courseDeliveries
                    });
                }
            }
            if (dayDeliveries.length > 0) {
                result.push({
                    date: dateStr,
                    dayOfWeek,
                    courses: dayDeliveries
                });
            }
            // 次の日へ
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        return result;
    },
    // コース情報取得
    async getCourseInfo(courseId) {
        return prisma_1.default.deliveryCourse.findUnique({
            where: { id: courseId }
        });
    },
    async getProductList(filter) {
        // 実際の商品需要を契約データから集計
        const startDate = filter.startDate ? new Date(filter.startDate) : new Date();
        const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
        // 日付範囲内の契約を取得
        const contracts = await prisma_1.default.customerProductContract.findMany({
            where: {
                isActive: true,
                startDate: { lte: endDate },
                OR: [
                    { endDate: null },
                    { endDate: { gte: startDate } },
                ],
                // コースフィルタ
                ...(filter.courseIds && filter.courseIds.length > 0 ? {
                    customer: { deliveryCourseId: { in: filter.courseIds } }
                } : filter.courseId ? {
                    customer: { deliveryCourseId: filter.courseId }
                } : {}),
            },
            include: {
                product: {
                    include: {
                        manufacturer: true
                    }
                },
                customer: {
                    include: {
                        deliveryCourse: true
                    }
                },
                patterns: { where: { isActive: true } },
                pauses: true,
            }
        });
        // 商品ごとに数量を集計
        const productMap = new Map();
        // 日付範囲内の各日について計算
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            contracts.forEach((contract) => {
                // 休配期間に該当する場合はスキップ
                const paused = Array.isArray(contract.pauses) && contract.pauses.some((p) => {
                    const s = new Date(p.startDate);
                    const e = new Date(p.endDate);
                    return s <= currentDate && currentDate <= e;
                });
                if (paused)
                    return;
                // その日のパターンを確認
                const dayPattern = contract.patterns.find((p) => p.dayOfWeek === dayOfWeek);
                if (dayPattern && dayPattern.quantity > 0) {
                    const key = contract.product.id;
                    if (!productMap.has(key)) {
                        productMap.set(key, {
                            productId: contract.product.id,
                            productName: contract.product.name,
                            manufacturerId: contract.product.manufacturerId || 0,
                            manufacturerName: contract.product.manufacturer?.name || '不明',
                            totalQuantity: 0,
                            ...(filter.outputType === 'separate' ? { courseBreakdown: new Map() } : {})
                        });
                    }
                    const product = productMap.get(key);
                    product.totalQuantity += dayPattern.quantity;
                    // コース別出力の場合はコース別にも集計
                    if (filter.outputType === 'separate' && contract.customer.deliveryCourse) {
                        const courseId = contract.customer.deliveryCourse.id;
                        const courseName = contract.customer.deliveryCourse.name;
                        if (!product.courseBreakdown.has(courseId)) {
                            product.courseBreakdown.set(courseId, { courseName, quantity: 0 });
                        }
                        product.courseBreakdown.get(courseId).quantity += dayPattern.quantity;
                    }
                }
            });
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        // メーカーフィルタを適用
        let results = Array.from(productMap.values());
        if (filter.manufacturerIds && filter.manufacturerIds.length > 0) {
            results = results.filter(p => filter.manufacturerIds.includes(p.manufacturerId));
        }
        return results.sort((a, b) => a.productName.localeCompare(b.productName, 'ja'));
    },
    async createInvoice(input) {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        // 契約ベースで請求金額を計算
        const contracts = await prisma_1.default.customerProductContract.findMany({
            where: {
                customerId: input.customerId,
                isActive: true,
                startDate: { lte: endDate }, // 契約開始日が請求期間終了日以前
                OR: [
                    { endDate: null }, // 契約終了日が設定されていない
                    { endDate: { gte: startDate } } // 契約終了日が請求期間開始日以降
                ]
            },
            include: {
                product: true,
                patterns: {
                    where: { isActive: true }
                }
            }
        });
        console.log('=== 契約ベース請求書作成デバッグ ===');
        console.log('顧客ID:', input.customerId);
        console.log('期間:', input.startDate, '～', input.endDate);
        console.log('取得した契約数:', contracts.length);
        let totalAmount = 0;
        const invoiceDetails = [];
        const deliveriesByDate = {};
        // 各契約について期間内の配達予定を計算
        for (const contract of contracts) {
            console.log(`契約: ${contract.product.name} - 単価: ${contract.unitPrice}円`);
            // 期間内の各日について配達パターンをチェック
            let deliveryCount = 0;
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay(); // 0=日曜, 1=月曜, ...
                // この曜日に配達パターンがあるかチェック
                const pattern = contract.patterns.find(p => p.dayOfWeek === dayOfWeek);
                if (pattern && pattern.quantity > 0) {
                    deliveryCount += pattern.quantity;
                    const y = currentDate.getFullYear();
                    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const d = String(currentDate.getDate()).padStart(2, '0');
                    const key = `${y}-${m}-${d}`;
                    if (!deliveriesByDate[key])
                        deliveriesByDate[key] = [];
                    deliveriesByDate[key].push({ productName: contract.product.name, quantity: pattern.quantity });
                }
                // 次の日に進む
                currentDate.setDate(currentDate.getDate() + 1);
            }
            if (deliveryCount > 0) {
                const contractAmount = deliveryCount * (contract.unitPrice || contract.product.price);
                totalAmount += contractAmount;
                invoiceDetails.push({
                    productName: contract.product.name,
                    unitPrice: contract.unitPrice || contract.product.price,
                    quantity: deliveryCount,
                    amount: contractAmount
                });
                console.log(`  - 配達回数: ${deliveryCount}, 小計: ${contractAmount}円`);
            }
        }
        console.log('請求詳細:', invoiceDetails);
        console.log('計算された合計金額:', totalAmount);
        console.log('=====================================');
        const inv = await prisma_1.default.invoiceHistory.create({
            data: {
                customerId: input.customerId,
                invoicePeriodStart: startDate,
                invoicePeriodEnd: endDate,
                totalAmount,
                issuedDate: new Date(),
            },
        });
        // 請求詳細も返す（PDFに使用）
        return {
            ...inv,
            details: invoiceDetails,
            deliveriesByDate,
        };
    },
    async listInvoiceHistory(customerId) {
        return prisma_1.default.invoiceHistory.findMany({ where: { customerId }, orderBy: { issuedDate: 'desc' } });
    },
    // 新機能: 指定コースに属する全顧客の請求書データをまとめて作成
    async createInvoicesByCourse(input) {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        // コース配下の顧客を取得
        const customers = await prisma_1.default.customer.findMany({
            where: { deliveryCourseId: input.courseId },
            orderBy: { id: 'asc' },
        });
        const results = [];
        for (const c of customers) {
            // 顧客ごとに契約ベースで請求計算（createInvoice のロジックを再利用）
            const contracts = await prisma_1.default.customerProductContract.findMany({
                where: {
                    customerId: c.id,
                    isActive: true,
                    startDate: { lte: endDate },
                    OR: [
                        { endDate: null },
                        { endDate: { gte: startDate } },
                    ],
                },
                include: { product: true, patterns: { where: { isActive: true } } },
            });
            let totalAmount = 0;
            const invoiceDetails = [];
            for (const contract of contracts) {
                let deliveryCount = 0;
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dayOfWeek = currentDate.getDay();
                    const pattern = contract.patterns.find((p) => p.dayOfWeek === dayOfWeek);
                    if (pattern && pattern.quantity > 0) {
                        deliveryCount += pattern.quantity;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                if (deliveryCount > 0) {
                    const unitPrice = contract.unitPrice || contract.product.price;
                    const amount = deliveryCount * unitPrice;
                    totalAmount += amount;
                    invoiceDetails.push({
                        productName: contract.product.name,
                        unitPrice,
                        quantity: deliveryCount,
                        amount,
                    });
                }
            }
            // 履歴に記録（顧客ごと）
            await prisma_1.default.invoiceHistory.create({
                data: {
                    customerId: c.id,
                    invoicePeriodStart: startDate,
                    invoicePeriodEnd: endDate,
                    totalAmount,
                    issuedDate: new Date(),
                },
            });
            results.push({
                customerId: c.id,
                customerName: c.name,
                details: invoiceDetails,
                totalAmount,
            });
        }
        return results;
    },
};
