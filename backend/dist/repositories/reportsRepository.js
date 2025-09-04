"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.reportsRepository = {
    async getDeliveryList(filter) {
        // 簡易取得: スケジュールと顧客・コースをベースに当該期間の予定を展開（モック）
        // 実運用では契約パターンと期間展開ロジックが必要
        let courseFilter = {};
        // 複数コース選択がある場合はそれを優先
        if (filter.courseIds && filter.courseIds.length > 0) {
            courseFilter = { deliveryCourseId: { in: filter.courseIds } };
        }
        else if (filter.courseId) {
            // 後方互換性: 単一コース選択
            courseFilter = { deliveryCourseId: filter.courseId };
        }
        return prisma_1.default.customer.findMany({
            where: courseFilter,
            include: { deliveryCourse: true },
            orderBy: [
                { deliveryCourseId: 'asc' }, // コース順
                { id: 'asc' } // 同じコース内では顧客ID順
            ]
        });
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
                                startDate: { lte: date } // 契約開始日以降のみ
                            },
                            include: {
                                product: true,
                                patterns: {
                                    where: {
                                        dayOfWeek: dayOfWeek,
                                        quantity: { gt: 0 } // 数量が0より大きいもののみ
                                    }
                                }
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
                        startDate: { lte: date }
                    },
                    include: {
                        product: true,
                        patterns: {
                            where: {
                                dayOfWeek: dayOfWeek,
                                quantity: { gt: 0 }
                            }
                        }
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
        // 配達がある顧客のみフィルタリング
        const deliveryList = allCustomersOrdered
            .map(customer => {
            const deliveries = customer.contracts
                .filter(contract => contract.patterns.length > 0)
                .map(contract => ({
                productName: contract.product.name,
                quantity: contract.patterns[0].quantity,
                unitPrice: contract.unitPrice
            }));
            return deliveries.length > 0 ? {
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
        // 開始日から終了日まで1日ずつ処理
        for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
            const dayOfWeek = currentDate.getDay(); // 0=日曜, 1=月曜, ...
            // コース内の顧客を順番通りに取得
            const customersWithPosition = await prisma_1.default.customerCoursePosition.findMany({
                where: { deliveryCourseId: courseId },
                include: {
                    customer: {
                        include: {
                            contracts: {
                                where: {
                                    isActive: true,
                                    startDate: { lte: currentDate } // 契約開始日以降のみ
                                },
                                include: {
                                    product: true,
                                    patterns: {
                                        where: {
                                            dayOfWeek: dayOfWeek,
                                            quantity: { gt: 0 } // 数量が0より大きいもののみ
                                        }
                                    }
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
                            startDate: { lte: currentDate }
                        },
                        include: {
                            product: true,
                            patterns: {
                                where: {
                                    dayOfWeek: dayOfWeek,
                                    quantity: { gt: 0 }
                                }
                            }
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
            // 配達がある顧客のみフィルタリング
            const deliveryList = allCustomersOrdered
                .map(customer => {
                const deliveries = customer.contracts
                    .filter(contract => contract.patterns.length > 0)
                    .map(contract => ({
                    productName: contract.product.name,
                    quantity: contract.patterns[0].quantity,
                    unitPrice: contract.unitPrice
                }));
                return deliveries.length > 0 ? {
                    customerId: customer.id,
                    customerName: customer.name,
                    customerAddress: customer.address,
                    deliveries
                } : null;
            })
                .filter(item => item !== null);
            if (deliveryList.length > 0) {
                result.push({
                    date: currentDate.toISOString(),
                    deliveries: deliveryList
                });
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
                patterns: true
            }
        });
        // 商品ごとに数量を集計
        const productMap = new Map();
        // 日付範囲内の各日について計算
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            contracts.forEach((contract) => {
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
            details: invoiceDetails
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
