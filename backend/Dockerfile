FROM node:20-slim
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "npx prisma generate && npm run build && npm run start:prod || (echo '!!! BACKEND CRASHED !!!' && sleep 3600)"]
