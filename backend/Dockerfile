# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for NestJS CLI)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine

WORKDIR /app

# Copy only the compiled output, package files, and Prisma folder from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose the API port
EXPOSE 3001

# Run Prisma db push to ensure database schema is synced, then start the server
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
