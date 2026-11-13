FROM node:24-slim

RUN npm install -g pnpm@11.20.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/engine/package.json ./packages/engine/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY packages/engine/ ./packages/engine/
COPY apps/server/ ./apps/server/
COPY tsconfig.base.json tsconfig.json ./

RUN pnpm --filter @smash/server... build

EXPOSE 3001

ENV NODE_ENV=production SMASH_BACKEND_ONLY=1
CMD ["node", "apps/server/dist/index.js"]
