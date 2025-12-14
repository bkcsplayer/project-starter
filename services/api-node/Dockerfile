FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm i

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
# Install wget for healthcheck
RUN apk add --no-cache wget
EXPOSE 8080
CMD ["npm", "run", "start"]
