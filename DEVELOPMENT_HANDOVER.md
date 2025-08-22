# 🥛 牛乳配達管理システム - 開発引き継ぎドキュメント

## 📋 **現在の完成状況**

### ✅ **実装済み機能**
- **基本的なCRUD操作**: 顧客・商品・メーカー・配達コース管理
- **高度なコース管理機能**: 
  - 3つの操作モード（一覧表示・順位変更・顧客移動）
  - コース間顧客移動（ドラッグ&ドロップ）
  - 左右表示UI（移動元・移動先）
- **顧客詳細機能**: コース変更ボタン
- **配達パターン管理**: 月木・火金・水土の3パターン
- **PDF帳票出力**: 配達スケジュール・商品リスト・請求書
- **サンプルデータ**: 50名の顧客・20商品・2メーカー・8コース

### 🏗️ **技術スタック**
- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: SQLite + Prisma ORM
- **PDF生成**: PDFKit
- **開発ツール**: ts-node-dev (ホットリロード)

## 🛡️ **重要な保護対象ファイル**

### **絶対に変更してはいけないファイル**
```
backend/src/routes/deliveryCourses.ts     # コース管理API（ルーティング順序重要）
frontend/src/pages/Courses.tsx           # コース管理画面（複雑なUI）
frontend/src/pages/CourseDetail.tsx      # コース詳細画面
frontend/src/pages/CustomerDetail.tsx    # 顧客詳細画面（コース変更機能）
backend/src/repositories/deliveryCoursesRepository.ts  # コース移動ロジック
```

### **注意が必要なファイル**
```
backend/prisma/schema.prisma             # データベーススキーマ
backend/src/lib/prisma.ts               # DB接続設定
frontend/src/lib/typedApi.ts            # API呼び出し関数
```

## 🚨 **既知の重要な技術的注意点**

### 1. **ルーティング順序**
`backend/src/routes/deliveryCourses.ts`で、`/transfer-customer`エンドポイントは必ず`/:id`より前に配置すること。順序を変更するとルーティング競合でエラーが発生します。

### 2. **顧客移動API**
- エンドポイント: `PUT /api/delivery-courses/transfer-customer`
- パラメータ: `{ customerId: number, targetCourseId: number }`
- 自動で現在のコースIDを検出して移動処理を実行

### 3. **配達パターンデータ構造**
- `DeliveryPattern`テーブルの`dayOfWeek`は0-6（日-土）
- 月木=1,4 / 火金=2,5 / 水土=3,6

### 4. **UI状態管理**
`Courses.tsx`の`mode`状態（'list' | 'reorder' | 'transfer'）が全体の表示を制御しています。

## 📦 **ブランチ構成**

### **stable-v1.0** ⭐
- **用途**: 現在の完成版の保護用
- **状態**: 動作確認済み・本番利用可能
- **変更禁止**: このブランチは絶対に変更しない

### **development** 🚧
- **用途**: 新機能開発・実験用
- **状態**: 自由に変更可能
- **復旧方法**: 問題が発生したら`stable-v1.0`から復旧

### **main**
- **用途**: メインブランチ（現在はstable-v1.0と同じ状態）

## 🔄 **安全な開発手順**

### **新機能開発時**
```bash
# 1. 開発ブランチに切り替え
git checkout development

# 2. 最新状態に更新
git pull origin development

# 3. 機能ブランチ作成（推奨）
git checkout -b feature/new-feature

# 4. 開発・テスト

# 5. 問題なければマージ
git checkout development
git merge feature/new-feature
```

### **緊急復旧時**
```bash
# 安定版に戻す
git checkout stable-v1.0
git checkout -b emergency-fix
# または
git reset --hard stable-v1.0
```

## 📊 **現在のデータベース状況**
- 顧客: 54名（53名が配達契約あり）
- コースA: 20名（月木パターン）
- コースB: 17名（火金パターン）
- コースC: 16名（水土パターン）
- 商品: 20種類
- メーカー: 6社（うち2社がメイン）

## 🎯 **推奨する次の開発項目**

### **優先度: 高**
- 配達記録機能の強化
- 在庫管理機能
- 売上分析レポート

### **優先度: 中**
- 顧客アプリ（注文・配達状況確認）
- 配達員アプリ（配達完了報告）
- 自動請求書生成

### **優先度: 低**
- UI/UXの改善
- パフォーマンス最適化
- 多言語対応

## 🆘 **トラブルシューティング**

### **よくある問題**
1. **500エラー**: ルーティング順序を確認
2. **顧客移動失敗**: APIエンドポイントの確認
3. **データ不整合**: Prismaスキーマとの差異確認
4. **ビルドエラー**: TypeScript型定義の確認

### **緊急連絡先**
- GitHub: https://github.com/JETKIDS/Milkapp
- 安定版ブランチ: stable-v1.0
- 開発ブランチ: development

---

**⚠️ 重要**: このドキュメントを読んでから開発を開始してください。不明な点があれば、まず`stable-v1.0`ブランチのコードを参考にしてください。
