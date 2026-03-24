FROM node:20-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client and build the NestJS application
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# Start the compiled production app
CMD ["npm", "run", "start:prod"]
