# syntax=docker/dockerfile:1

# ---------- Stage 1: build NestJS ----------
FROM node:20-alpine AS build
WORKDIR /app

# Cần cả devDeps (@nestjs/cli, typescript) để build
COPY package*.json ./
RUN npm ci

COPY . .
# nest build biên dịch toàn bộ src/ -> dist/ (gồm cả dist/seed.js)
RUN npm run build

# ---------- Stage 2: runtime gọn (chỉ prod deps) ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy artifact đã biên dịch
COPY --from=build /app/dist ./dist

EXPOSE 4000
# main.ts -> dist/main.js
CMD ["node", "dist/main.js"]
