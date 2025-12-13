# services/api/Dockerfile
# Multi-stage build for TypeScript Fastify API

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
# copy shared package (for build)
COPY ../../packages ./packages
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# runtime needs shared wrappers (compiled import path points to packages/shared/ai/openrouter.js)
COPY --from=build /app/packages ./packages
EXPOSE 3001
CMD ["node", "dist/server.js"]
