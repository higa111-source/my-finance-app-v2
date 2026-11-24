# 家計簿アプリ (my-finance-app-v2)

[my-finance-app](https://github.com/higa111-source/my-finance-app) と同じSupabaseデータを使う、モバイル向けにグラフィカルな見た目で作り直した家計簿アプリです。

## 主な機能

- 支出入力: アイコングリッドでカテゴリを選び、電卓風テンキーで金額入力
- 一覧・編集: 月別の支出一覧、タップして編集
- レポート: カテゴリ別の円グラフ
- グラフ: カテゴリ別の月次推移(棒グラフ)
- テンプレート: 定期的な支出テンプレートの管理と月次一括計上

## 技術スタック

React + Vite + Tailwind CSS + lucide-react + Recharts + Chart.js + Supabase

## 開発

```
npm install
npm run dev
```

## デプロイ

`master` ブランチに push すると、GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルドし、[GitHub Pages](https://higa111-source.github.io/my-finance-app-v2/) に公開します。

手動で再デプロイしたいときは、GitHub の Actions タブで「Deploy to GitHub Pages」を選び、「Run workflow」を実行してください。
