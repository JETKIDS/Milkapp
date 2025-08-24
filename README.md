# Milk Delivery Customer Management - Backend

## セットアップ

1) 依存インストール

```
npm i --workspaces
```

2) 環境変数

`backend/.env` に以下を設定（開発はSQLite）

```
DATABASE_URL="file:./dev.db"
```

3) Prisma クライアント生成（postinstallで自動）

```
npm -w backend run prisma:generate
```

4) マイグレーション適用とシード

```
npm -w backend run db:migrate:dev
npm -w backend run seed
```

5) 実行

```
npm -w backend run dev
```

### フロントエンドの起動

前提: バックエンドが `http://localhost:3001` で稼働中であること。

Vite開発サーバ（ポート5173、`/api` はバックエンドにプロキシ）を起動します。

方法A（frontendに移動）
```
cd frontend
npm install
npm run dev
```

方法B（ルートからprefix指定）
```
npm --prefix frontend install
npm --prefix frontend run dev
```

ブラウザで `http://localhost:5173` にアクセス。

### APIドキュメント

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs.json`
- JSONファイル出力（リポジトリに保存）
```
cd backend
npm run build:openapi
# backend/openapi.json が生成されます
```

### Windows / OneDrive ご利用時の注意

- OneDrive 配下での作業中、Prisma の postinstall（`prisma generate`）で EPERM（リネーム不可）が発生する場合があります。
  - 対処例: 一時的に OneDrive 同期を停止、またはリポジトリを `C:\Users\<あなた>\source` など同期外に移動
  - フロント依存だけ入れたい場合は以下のようにスクリプト無効でインストール
    ```
    npm --prefix frontend install --ignore-scripts
    ```
- 本番等でバックエンドURLを分ける場合は、フロント `.env` に `VITE_API_BASE` を設定してください（未設定時は Vite の `/api` プロキシを利用）。

## 運用（2.1 マイグレーション運用）

- 開発でスキーマ変更時

```
npm -w backend run db:migrate:dev --name your_change
```

- 本番/ステージングで適用

```
npm -w backend run db:migrate:deploy
```

- リセット（開発）

```
npm -w backend run db:reset
npm -w backend run seed
```

## テスト

```
npm -w backend test
```

## デモ手順（MVP）

以下の流れで主要機能を通し確認できます。

1) カタログ初期化
- メーカー作成 → 商品作成 → 配達コース作成 → 顧客作成（必要に応じてSeedも利用: `npm -w backend run seed`）

2) 契約と配達パターン
- 画面: Customers → 行の「契約」
- 顧客に対して契約を追加（商品/開始日を指定）
- 契約を選択し、曜日と数量の配達パターンを追加/更新/削除

3) 注文とスケジュール
- 画面: Orders で注文登録（顧客/商品/数量/単価）。在庫超過の場合はエラー
- 画面: Schedules でスケジュールを作成（顧客/曜日）→ 完了マークで実績登録

4) 帳票（PDF）と履歴
- 画面: Reports
- 配達リスト・商品リスト・請求書の各PDFを出力（自動ダウンロード）
- 請求書発行は履歴に記録（バックエンドAPI: `/api/reports/invoice-history/:customerId`）

5) 顧客詳細とダッシュボード
- 画面: Customers → 行の「詳細」
  - 概要、月次カレンダー/請求の確認、コース順の編集
- 画面: Dashboard
  - 今日/未完了/配達状況/月次サマリを確認

## フロントの使い方メモ

- 一覧画面（Customers/Manufacturers/Products/Courses）は検索・並び替え・ページがURLに同期されます
- 画面遷移の主なルート
  - Customers: `/customers` → 契約: `/customers/:id/contracts` → 詳細: `/customers/:id/detail`
  - Reports: `/reports`（PDF出力）
  - Dashboard: `/`


