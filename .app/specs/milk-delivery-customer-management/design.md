# Design Document - 牛乳配達顧客管理システム

## Overview

牛乳配達顧客管理システムは、牛乳屋さんの日々の業務を効率化するWebアプリケーションです。顧客管理、商品管理、配達スケジュール管理、注文管理、そして各種帳票出力機能を統合したシステムとして設計されています。

システムの主要な設計方針：
- シンプルで直感的なユーザーインターフェース
- データの整合性を保つリレーショナルデータベース設計
- 効率的な配達業務をサポートする機能配置
- PDF出力による帳票機能の実装

## Architecture

### システム構成
```
Frontend (React/TypeScript)
├── Dashboard
├── Customer Management
├── Product Management
├── Delivery Management
└── Report Generation

Backend (Node.js/Express)
├── API Routes
├── Business Logic
├── Data Access Layer
└── PDF Generation Service

Database (SQLite/PostgreSQL)
├── Customers
├── Manufacturers
├── Products
├── Delivery Courses
├── Orders
└── Delivery Records
```

### 技術スタック選択の理由
- **Frontend**: React with TypeScript - 型安全性とコンポーネントベースの開発
- **Backend**: Node.js with Express - JavaScript統一による開発効率
- **Database**: SQLite (開発)/PostgreSQL (本番) - 軽量性と拡張性のバランス
- **PDF生成**: PDFKit または jsPDF - JavaScript環境での帳票生成

## Components and Interfaces

### Core Components

#### 1. Customer Management Component
- 顧客の CRUD 操作（登録・編集・削除・一覧表示）（Requirements 1.1-1.3, 1.5）
- 配達コースとの関連付け（Requirements 1.1, 4.4）
- バリデーション機能（必須項目チェック）（Requirement 1.4）
- 削除時の確認ダイアログ表示（Requirement 1.3）

#### 2. Manufacturer Management Component
- メーカーの CRUD 操作（登録・編集・削除・一覧表示）（Requirements 2.1-2.3）
- 商品との関連チェック（Requirement 2.4）
- 削除時の整合性確認と関連商品削除促進メッセージ（Requirement 2.4）
- 削除時の確認ダイアログ表示（Requirement 2.3）

#### 3. Product Management Component
- 商品の CRUD 操作（登録・編集・削除・一覧表示）（Requirements 3.1-3.3）
- メーカーとの必須関連付け（Requirement 3.4）
- 注文との関連チェックと削除制限（Requirement 3.5）
- 削除時の確認ダイアログ表示（Requirement 3.3）

#### 4. Delivery Course Management Component
- 配達コースの CRUD 操作（登録・編集・削除・一覧表示）（Requirements 4.1-4.3）
- 顧客との関連管理（顧客登録時の関連付け可能）（Requirement 4.4）
- 削除時の整合性確認と関連顧客確認促進メッセージ（Requirement 4.5）
- 削除時の確認ダイアログ表示（Requirement 4.3）

#### 5. Schedule Management Component
- 曜日別配達スケジュール設定（Requirement 5.1）
- 曜日別・コース別顧客リスト表示（Requirement 5.2）
- 配達完了マーク機能と配達状況の更新・記録保存（Requirement 5.3）
- 配達スケジュール編集機能（Requirement 5.4）

#### 6. Order Management Component
- 注文の登録と配達予定への反映（Requirement 6.1）
- 顧客別・期間別注文履歴表示（Requirement 6.2）
- 顧客・商品との必須関連付け（Requirement 6.3）
- 在庫チェック機能と警告メッセージ表示（Requirement 6.4）

#### 7. Report Generation Component
- **配達リスト出力**: 期間・コース指定対応、PDF形式でのダウンロード（Requirements 7.1-7.5）
- **商品リスト出力**: 期間・コース指定対応、商品別数量集計、PDF形式でのダウンロード（Requirements 8.1-8.5）
- **請求書発行**: 顧客・期間指定対応、商品別数量・金額集計、PDF形式での生成（Requirements 9.1-9.3）
- **請求書発行履歴管理**: 履歴記録・表示機能（Requirements 9.4-9.5）
- 条件指定とPDF生成機能
- データ存在チェックとエラーハンドリング（該当データなし時のメッセージ表示）

#### 8. Customer Contract Management Component
- 顧客の契約商品設定機能（商品と配達パターンの関連付け）（Requirement 10.1）
- 配達パターン設定（曜日・数量）（Requirement 10.2）
- 契約期間管理機能
- 契約商品の有効/無効切り替え（Requirement 10.6）
- コース内配達順番管理と自動調整機能（Requirement 10.4）
- 契約商品・配達パターン・コース順番に基づく配達リスト自動生成（Requirement 10.5）

#### 9. Customer Detail Component
- 顧客の配達コース情報表示（Requirement 11.1）
- コース内配達順番表示（Requirement 11.2）
- カレンダー形式での契約商品・配達予定表示（Requirement 11.3）
- 月次請求額表示（Requirement 11.4）
- 日別配達予定詳細表示（カレンダー日付選択時）（Requirement 11.5）

#### 10. Dashboard Component
- 今日の配達予定顧客数表示（Requirement 12.1）
- 未完了の配達リスト表示（Requirement 12.2）
- 今月の売上概要表示（Requirement 12.3）
- コース別の配達状況表示（Requirement 12.4）
- リアルタイム配達進捗管理
- データ更新機能による最新情報の取得と表示更新（Requirement 12.5）

### API Interface Design

```typescript
// Customer API
GET    /api/customers
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id

// Manufacturer API
GET    /api/manufacturers
POST   /api/manufacturers
PUT    /api/manufacturers/:id
DELETE /api/manufacturers/:id

// Product API
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

// Delivery Course API
GET    /api/delivery-courses
POST   /api/delivery-courses
PUT    /api/delivery-courses/:id
DELETE /api/delivery-courses/:id

// Order API
GET    /api/orders
POST   /api/orders
PUT    /api/orders/:id
GET    /api/orders/history/:customerId
GET    /api/orders/history?customerId=:id&startDate=:date&endDate=:date

// Schedule API
GET    /api/schedules
GET    /api/schedules/by-day/:dayOfWeek
GET    /api/schedules/by-course/:courseId
POST   /api/schedules
PUT    /api/schedules/:id
POST   /api/schedules/complete/:id

// Report API
POST   /api/reports/delivery-list
POST   /api/reports/product-list
POST   /api/reports/invoice/:customerId
GET    /api/reports/invoice-history/:customerId
POST   /api/reports/invoice-history

// Customer Contract API
GET    /api/customers/:id/contracts
POST   /api/customers/:id/contracts
PUT    /api/customers/:id/contracts/:contractId
DELETE /api/customers/:id/contracts/:contractId
GET    /api/customers/:id/delivery-patterns
POST   /api/customers/:id/delivery-patterns
PUT    /api/customers/:id/delivery-patterns/:patternId
DELETE /api/customers/:id/delivery-patterns/:patternId

// Customer Detail API
GET    /api/customers/:id/detail
GET    /api/customers/:id/delivery-schedule
GET    /api/customers/:id/monthly-calendar/:year/:month
GET    /api/customers/:id/monthly-billing/:year/:month
GET    /api/customers/:id/course-position
PUT    /api/customers/:id/course-position

// Dashboard API
GET    /api/dashboard/today
GET    /api/dashboard/monthly-summary
GET    /api/dashboard/delivery-status
GET    /api/dashboard/pending-deliveries
```

## Data Models

### Database Schema

#### Customers Table
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  delivery_course_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_course_id) REFERENCES delivery_courses(id)
);
```

#### Manufacturers Table
```sql
CREATE TABLE manufacturers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  manufacturer_id INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
);
```

#### Delivery Courses Table
```sql
CREATE TABLE delivery_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### Delivery Schedules Table
```sql
CREATE TABLE delivery_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

#### Customer Course Positions Table
```sql
CREATE TABLE customer_course_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  delivery_course_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (delivery_course_id) REFERENCES delivery_courses(id),
  UNIQUE(customer_id, delivery_course_id)
);
```

#### Customer Product Contracts Table
```sql
CREATE TABLE customer_product_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### Delivery Patterns Table
```sql
CREATE TABLE delivery_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES customer_product_contracts(id)
);
```

#### Delivery Records Table
```sql
CREATE TABLE delivery_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  delivery_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'completed', 'failed', 'pending'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

#### Invoice History Table
```sql
CREATE TABLE invoice_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  invoice_period_start DATE NOT NULL,
  invoice_period_end DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  issued_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### TypeScript Interfaces

```typescript
interface Customer {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  deliveryCourseId?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Manufacturer {
  id: number;
  name: string;
  contactInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: number;
  name: string;
  manufacturerId: number;
  price: number;
  unit: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DeliveryCourse {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface DeliverySchedule {
  id: number;
  customerId: number;
  dayOfWeek: number;
  isActive: boolean;
  createdAt: Date;
}

interface DeliveryRecord {
  id: number;
  orderId: number;
  deliveryDate: Date;
  status: 'completed' | 'failed' | 'pending';
  notes?: string;
  createdAt: Date;
}

interface InvoiceHistory {
  id: number;
  customerId: number;
  invoicePeriodStart: Date;
  invoicePeriodEnd: Date;
  totalAmount: number;
  issuedDate: Date;
  createdAt: Date;
}

interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  courseId?: number;
  customerId?: number;
}

interface CustomerDetail {
  customer: Customer;
  deliveryCourse: DeliveryCourse;
  coursePosition: number;
  monthlyBilling: number;
  deliverySchedules: DeliverySchedule[];
}

interface MonthlyCalendarItem {
  date: Date;
  products: {
    product: Product;
    quantity: number;
    deliveryStatus: 'scheduled' | 'completed' | 'failed';
  }[];
  totalAmount: number;
}

interface CoursePosition {
  customerId: number;
  courseId: number;
  position: number;
  totalCustomersInCourse: number;
}

interface CustomerProductContract {
  id: number;
  customerId: number;
  productId: number;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DeliveryPattern {
  id: number;
  contractId: number;
  dayOfWeek: number;
  quantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerContractDetail {
  contract: CustomerProductContract;
  product: Product;
  patterns: DeliveryPattern[];
}
```

## Error Handling

### Frontend Error Handling
- フォームバリデーションエラーの表示
- API通信エラーのユーザーフレンドリーなメッセージ
- 削除時の確認ダイアログ（関連データ存在チェック含む）
- データ整合性エラーの適切な通知
- 在庫不足警告の表示
- 帳票出力時のデータ存在チェック

### Backend Error Handling
- データベース制約違反の適切な処理
- 関連データ存在時の削除拒否（メーカー・商品・配達コース）
- バリデーションエラーの詳細な応答
- システムエラーのログ記録
- 帳票生成エラーの適切な処理
- 請求書重複発行の防止

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}
```

### Validation and Business Rules

#### データ整合性ルール
- **メーカー削除制限**: 関連する商品が存在する場合、メーカーの削除を拒否し、関連商品の削除を促すメッセージを表示（Requirement 2.4）
- **商品削除制限**: 関連する注文が存在する場合、商品の削除を拒否し、関連注文の確認を促すメッセージを表示（Requirement 3.5）
- **配達コース削除制限**: 関連する顧客が存在する場合、配達コースの削除を拒否し、関連顧客の確認を促すメッセージを表示（Requirement 4.5）
- **在庫チェック**: 注文数量が在庫数量を超過する場合の警告表示（Requirement 6.4）
- **削除確認ダイアログ**: 全ての削除操作において確認ダイアログを表示し、承認後に実行（Requirements 1.3, 2.3, 3.3, 4.3）

#### バリデーションルール
- **必須項目チェック**: 顧客名、商品名、メーカー名等の必須項目検証。未入力時はバリデーションエラーを表示し保存を拒否（Requirement 1.4）
- **データ形式チェック**: 電話番号、メールアドレス、価格等の形式検証
- **関連データチェック**: 商品登録時のメーカー関連付け必須検証（Requirement 3.4）
- **注文関連付けチェック**: 注文登録時の顧客と商品の関連付け必須検証（Requirement 6.3）

#### 帳票出力時のビジネスルール
- **データ存在チェック**: 指定条件に該当するデータが存在しない場合、適切なメッセージを表示（Requirements 7.5, 8.5, 9.6）
- **デフォルト条件**: 出力条件未指定時は全期間・全コースのデータを対象とする（Requirements 7.4, 8.4）
- **請求書重複発行防止**: 同一期間・同一顧客の請求書重複発行をチェック

## Testing Strategy

### Unit Testing
- データモデルのバリデーション機能
- ビジネスロジックの単体テスト
- API エンドポイントの個別テスト
- PDF生成機能のテスト

### Integration Testing
- データベース操作の統合テスト
- API とフロントエンドの連携テスト
- 帳票生成の統合テスト

### End-to-End Testing
- 顧客登録から配達完了までの一連の流れ
- 注文から請求書発行までのワークフロー
- 各種帳票出力機能の動作確認

### Testing Tools
- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright または Cypress
- **Database**: テスト用のインメモリSQLite

## Security Considerations

### データ保護
- 顧客情報の適切な暗号化
- データベースアクセスの制限
- バックアップデータの安全な管理

### 入力検証
- SQLインジェクション対策
- XSS攻撃の防止
- CSRFトークンの実装

### アクセス制御
- 認証機能の実装（将来的な拡張として）
- セッション管理
- API アクセスの制限

## Performance Considerations

### 想定データ規模での性能分析
- **顧客数**: 2,000件
- **商品数**: 100点
- **配達コース数**: 20コース
- **履歴保持期間**: 5年間
- **推定注文レコード数**: 約500,000件（顧客1人あたり月10回注文×5年）
- **推定配達レコード数**: 約500,000件

### データベース最適化戦略

#### インデックス設計
```sql
-- 顧客検索の高速化
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_course ON customers(delivery_course_id);

-- 注文検索の高速化
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);

-- 配達記録検索の高速化
CREATE INDEX idx_delivery_records_date ON delivery_records(delivery_date);
CREATE INDEX idx_delivery_records_order ON delivery_records(order_id);

-- 請求書履歴検索の高速化
CREATE INDEX idx_invoice_history_customer ON invoice_history(customer_id);
CREATE INDEX idx_invoice_history_period ON invoice_history(invoice_period_start, invoice_period_end);
```

#### クエリ最適化
- **ページネーション**: 大量データの表示時は LIMIT/OFFSET を使用
- **日付範囲検索**: インデックスを活用した効率的な期間検索
- **集計クエリ**: 月次・年次サマリーテーブルの活用を検討

#### データアーカイブ戦略
```sql
-- 古いデータのアーカイブテーブル
CREATE TABLE orders_archive (
  -- orders テーブルと同じ構造
  archived_date DATE DEFAULT CURRENT_DATE
);

-- 2年以上前のデータを定期的にアーカイブ
-- パフォーマンス向上のため、アクティブテーブルのサイズを制限
```

### フロントエンド最適化

#### データ表示の最適化
- **仮想スクロール**: 大量の顧客・注文リスト表示時
- **遅延読み込み**: 画面に表示される分のみデータ取得
- **検索フィルタ**: サーバーサイドでの絞り込み処理

#### キャッシュ戦略
```typescript
// React Query を使用したデータキャッシュ
const useCustomers = (page: number, limit: number) => {
  return useQuery({
    queryKey: ['customers', page, limit],
    queryFn: () => fetchCustomers(page, limit),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
};
```

#### コンポーネント最適化
- **React.memo**: 不要な再レンダリングの防止
- **useMemo/useCallback**: 重い計算処理のメモ化
- **コード分割**: 機能別の動的インポート

### バックエンド最適化

#### API レスポンス最適化
```typescript
// ページネーション対応
GET /api/customers?page=1&limit=50&search=田中

// 必要なフィールドのみ取得
GET /api/orders?fields=id,customer_name,product_name,total_price&date_from=2024-01-01

// 集計データの事前計算
GET /api/dashboard/summary // 事前計算済みの集計データを返却
```

#### データベース接続最適化
```typescript
// 接続プール設定
const pool = new Pool({
  max: 20, // 最大接続数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### PDF生成の最適化
- **テンプレートキャッシュ**: PDFテンプレートの再利用
- **非同期処理**: 大量データの帳票生成時
- **ストリーミング**: 大きなPDFファイルの効率的な配信
- **条件指定最適化**: 期間・コース指定による効率的なデータ抽出

### 帳票機能の設計詳細

#### 配達リスト出力
- **フィルタ条件**: 開始日、終了日、配達コース
- **出力内容**: 顧客名、住所、商品名、数量、配達予定日
- **デフォルト動作**: 条件未指定時は全期間・全コース対象

#### 商品リスト出力  
- **フィルタ条件**: 開始日、終了日、配達コース
- **出力内容**: 商品名、メーカー名、合計数量、単価、合計金額
- **集計機能**: 商品別数量集計とメーカー別グループ化

#### 請求書発行
- **必須条件**: 顧客指定、請求期間指定
- **出力内容**: 顧客情報、請求期間、商品明細、合計金額
- **履歴管理**: 請求書発行履歴の記録と重複チェック

### 性能目標値
- **顧客一覧表示**: 1秒以内（50件ずつページネーション）
- **注文履歴検索**: 2秒以内（月単位での検索）
- **配達リスト生成**: 5秒以内（1ヶ月分のデータ）
- **商品リスト生成**: 5秒以内（1ヶ月分のデータ）
- **請求書生成**: 3秒以内（1顧客1ヶ月分）
- **ダッシュボード表示**: 1秒以内（事前集計データ使用）

### モニタリング戦略
- **データベースクエリ実行時間の監視**
- **API レスポンス時間の測定**
- **メモリ使用量の監視**
- **ディスク使用量の定期チェック**

この設計により、想定データ規模での快適な動作を実現できます。