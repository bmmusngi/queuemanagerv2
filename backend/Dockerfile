FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy everything else and generate Prisma
COPY . .
RUN npx prisma generate

EXPOSE 3001

# THE ZOMBIE TRAP:
# Try to build and start. If it fails (||), print a warning and sleep for 1 hour.
# This keeps the container alive so you can read the logs in Portainer!
CMD ["sh", "-c", "npm run build && npm run start:prod || (echo '!!! BUILD FAILED !!! Check errors above.' && sleep 3600)"]
