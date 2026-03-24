FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .
RUN npx prisma generate

# IMPORTANT: We DO NOT run 'npm run build' here.
# Instead, we run it when the container starts so it can write to the /app/logs volume.

EXPOSE 3001

# This command builds the app, saves the output to your NAS folder, and then starts the app
CMD ["sh", "-c", "npm run build > /app/logs/build.log 2>&1 && npm run start:prod"]
