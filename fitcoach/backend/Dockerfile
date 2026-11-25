# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copiar código fuente y compilar
COPY tsconfig.json ./
COPY src ./src/

RUN npx prisma generate
RUN npm run build

# Etapa final de producción
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Instalar solo dependencias de producción y cliente Prisma
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

# Copiar dist compilado
COPY --from=builder /app/dist ./dist

# Usuario sin privilegios por seguridad
USER node

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
