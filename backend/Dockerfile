FROM node:20-slim

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
# Clean install
RUN npm ci 

COPY . .

# Generate Prisma types first
RUN npx prisma generate

# BUILD HERE: This ensures the image only finishes if the code is correct
RUN npm run build

EXPOSE 3001

# The CMD now only handles the database sync and starting the app
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
