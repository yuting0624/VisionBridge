# ビルドステージ
FROM node:18-alpine AS builder
WORKDIR /app

# パッケージマネージャにpnpmを使用
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

# 依存関係のインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ソースコードのコピーとビルド
COPY . .
COPY .next ./.next
RUN pnpm run build

# ビルド後のファイル構造を確認
RUN ls -la /app/.next

# スタンドアロンディレクトリが存在しない場合、エラーを表示して停止
RUN if [ ! -d "/app/.next/standalone" ]; then echo ".next/standalone directory not found" && exit 1; fi

# 実行ステージ
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのみをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]