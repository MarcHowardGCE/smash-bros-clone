FROM node:24-slim

RUN npm install -g pnpm@11.20.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/engine/package.json ./packages/engine/
COPY packages/gamepad-input/package.json ./packages/gamepad-input/
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tsconfig.base.json tsconfig.json ./

# Atlases are committed under apps/client/public/assets; raw-assets/ is not
# copied into the image, so skip the AssetPack step.
RUN SKIP_ASSETPACK=1 pnpm build

EXPOSE 3001

ENV NODE_ENV=production
CMD ["node", "apps/server/dist/index.js"]
