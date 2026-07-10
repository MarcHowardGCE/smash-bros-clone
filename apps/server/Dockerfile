FROM node:20-slim

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/engine/package.json ./packages/engine/
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tsconfig.base.json tsconfig.json ./

RUN pnpm build

EXPOSE 3001

ENV NODE_ENV=production
CMD ["node", "apps/server/dist/index.js"]
