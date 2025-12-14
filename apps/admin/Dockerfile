# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm i
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine AS runner
# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config for SPA routing with /admin/ base path
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Install wget for healthcheck
RUN apk add --no-cache wget
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
