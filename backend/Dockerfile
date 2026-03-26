FROM node:20-slim

RUN apt-get update && apt-get install -y openssl iputils-ping

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# We comment these out so the "Zombie Trap" below can handle them and show logs
# RUN npx prisma generate
# RUN npm run build

EXPOSE 3001

# THE ZOMBIE TRAP (UPGRADED):
# 1. sleep 5: Gives the network bridge a moment to breathe
# 2. rm -rf dist: Clears any old "ghost" files
# 3. npx prisma generate: Rebuilds types for the fresh environment
# 4. npx prisma db push: Syncs the DB schema (Fixes P1001 issues)
# 5. npm run build: The final check
CMD ["sh", "-c", "sleep 5 && rm -rf dist && npx prisma generate && npx prisma db push && npm run build && npm run start:prod || (echo '!!! BACKEND CRASHED !!!' && sleep 3600)"]
