# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Top-Level Rules

- To maximize efficiency, **if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially**.
- **You must think exclusively in English**. However, you are required to **respond in Japanese**.
- When all TODOs are completed or user action is required, run the `afplay /System/Library/Sounds/glass.aiff` command once to notify.

## Repository Overview

このリポジトリは **README.md に記載された仕様** を満たすフロントエンドアプリケーションを開発するためのプロジェクトです。実装は **React + Vite + TypeScript** を前提とします。

---

## 1. ゴール / 非ゴール

### ゴール

- README.md の仕様を満たす UI/UX を React + Vite + TypeScript で提供する。
- 開発者体験（DX）を高めるため、ビルド・型チェック・Linter・テストを自動化する。

### 非ゴール

- バックエンド/API の新規設計（必要ならモックで代替）。
- 有料APIキーの導入や外部課金の発生。

## 2. 開発基本方針

- **TypeScript Strict**：`tsconfig.json` で `"strict": true`。
- **React**：関数コンポーネント + Hooks。副作用は `useEffect` / `useMemo` を適切に限定。
- **関数型プログラミング**：**クラスは使用禁止**。すべてのロジックを純粋関数で実装する。
- **状態管理**：仕様に明記がなければ、まずは **軽量（useState/useReducer + コンテキスト）** で開始。
- **ルーティング**：必要時に `react-router` を導入。
- **スタイル**：未指定なら CSS Modules もしくは Tailwind のいずれかを選択。既存の採用があればそれに従う。
- **アクセシビリティ**：ARIA属性、キーボード操作、コントラスト比を担保。
- **i18n**：文言は日本語のみ。多言語対応はしない。

---

## 3. ツールチェーン / バージョン

- Node.js **>= 20**（LTS）。
- Vite **^6 以降**、React **^18**、TypeScript **^5.5 以降**。
- パッケージマネージャ：**リポジトリに存在するロックファイルを優先**（`yarn.lock` / `pnpm-lock.yaml` / `package-lock.json`）。

---

## 4. 推奨ディレクトリ構成

```
/ (repo root)
├─ src/
│  ├─ app/            # ルーター・アプリ初期化
│  ├─ components/     # 再利用可能なUI
│  ├─ pages/          # 画面単位のコンテナ
│  ├─ hooks/          # カスタムフック
│  ├─ lib/            # 汎用ロジック（関数型設計）
│  │  ├─ utils/       # 純粋関数（計算、変換、日付操作等）
│  │  ├─ validators/  # バリデーション関数
│  │  ├─ queries/     # データCRUD操作（依存注入対応）
│  │  └─ *.ts         # ドメインロジック統合ファイル
│  ├─ styles/         # グローバルCSS or Tailwind
│  ├─ assets/         # 画像/アイコン等
│  ├─ types/          # 型定義
│  └─ main.tsx        # エントリポイント
├─ public/            # 静的ファイル
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ .eslintrc(.*) / eslint.config.(js|mjs|ts)
├─ .prettierrc(.*)
└─ README.md
```

> **Vite のエイリアス**：`~/*` → `src/*` を `vite.config.ts` と `tsconfig.json` (`compilerOptions.paths`) に設定。

---

## 5. npm scripts（標準）

`package.json` に以下が無ければ追加し、存在する場合は **既存を尊重** して整合。

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5173",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run --reporter=verbose",
    "test:ui": "vitest",
  },
}
```

- **テスト**：Vitest + React Testing Library。新規コンポーネントには最低1つのレンダリングテストを付与。
- **ESLint/Prettier**：Flat Config 推奨。import順やunused-var検出を有効化。

---

## 6. 関数型設計ガイドライン

### 基本原則

- **完全クラス禁止**: 新規コードでクラス（`class`）は一切使用しない
- **純粋関数優先**: 副作用のない、予測可能な関数を作成
- **合成とパイプライン**: 小さな関数を組み合わせて複雑な処理を構築
- **依存注入**: テスタビリティのため外部依存は注入する

### libディレクトリ設計

```typescript
// ❌ 避ける（クラス）
export class UserService {
  static validate(data: UserData) { /* */ }
  static create(data: UserData) { /* */ }
}

// ✅ 推奨（関数群）
// lib/validators/user.ts
export function validateUser(data: UserData): ValidationError[] { /* */ }

// lib/queries/user.ts  
export function createUser(storage: StorageAdapter, data: UserData): User { /* */ }

// lib/user.ts（統合）
export { validateUser } from './validators/user';
export { createUser } from './queries/user';
```

### 依存注入パターン

```typescript
// ✅ StorageAdapter経由で依存を注入
interface StorageAdapter {
  save<T>(key: string, data: T): void;
  load<T>(key: string): T | null;
}

export function saveUser(storage: StorageAdapter, user: User): void {
  storage.save('users', user);
}
```

---

## 7. セキュリティ / 依存

- **外部キー・有料API** を暗黙に導入しない。`.env` を参照するコードを追加する場合は、PRで用途を明示。
- 依存追加時は理由とサイズ影響を PR に記載（軽量を優先）。
- 危険操作（`rm -rf`、大量 rename 等）は事前に **計画を提示** し、最小差分で実行。

---

## 8. Definition of Done（完了条件）

- README の受け入れ基準を満たす。
- **クラス使用禁止**の原則に従っている。
- 型エラー・Lint エラーなし。
- 主要コンポーネントに最小テストがある。
- 初回クローンから `npm i && npm run dev` で起動できる。
- 追加依存とその理由を PR に記載。

### タスク完了時の必須チェック

**タスク完了前に以下3つのコマンドを実行し、すべてエラーなしであることを確認すること**：

```bash
# 1. Lint チェック
npm run lint

# 2. 型チェック
npm run typecheck

# 3. 単体テスト実行
npm run test
```

これらのチェックが全て成功してからタスク完了とする。失敗した場合は修正後に再実行。
