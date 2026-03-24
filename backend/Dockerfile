FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

EXPOSE 3001

# THE ULTIMATE ZOMBIE TRAP:
# We moved Prisma generation AND the build here. 
CMD ["sh", "-c", "npx prisma generate && npm run build && npm run start:prod || (echo '!!! BACKEND CRASHED !!!' && sleep 3600)"]
