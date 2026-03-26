FROM node:20-slim

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

# THE ZOMBIE TRAP (UPGRADED):
# Added 'rm -rf dist' to guarantee a 100% clean slate for the NestJS compiler
CMD ["sh", "-c", "rm -rf dist && npx prisma generate && npx prisma db push && npm run build && npm run start:prod || (echo '!!! BACKEND CRASHED !!!' && sleep 3600)"]
