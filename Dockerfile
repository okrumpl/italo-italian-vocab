# --- Stage 1: Sestavení React Frontendu ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Spuštění Backend serveru + Servírování frontendu ---
FROM node:20-alpine AS runner
WORKDIR /app

# Konfigurace prostředí
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_DIR=/app/data

# Vytvoření složky pro persistentní data SQLite
RUN mkdir -p /app/data

# Instalace závislostí backendu
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Kopírování zdrojových souborů backendu
COPY backend/ ./backend/

# Kopírování sestaveného frontendu ze Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expozice portu
EXPOSE 3000

# Spuštění aplikace
WORKDIR /app/backend
CMD ["npm", "start"]
