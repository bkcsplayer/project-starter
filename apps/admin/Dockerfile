FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm i
COPY . .
EXPOSE 5174
CMD ["npm","run","dev"]
