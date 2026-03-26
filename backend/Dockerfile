FROM node:20-slim

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

# THE ZOMBIE TRAP:
# We moved Prisma generation AND the build here so Portainer can't hide the logs.
#CMD ["sh", "-c", "npx prisma generate && npm run build && npm run start:prod || (echo '!!! BACKEND CRASHED !!!' && sleep 3600)"]

# We added 'npx prisma db push' to sync the new schema to your Postgres DB
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run build && npm run start:prod || (echo '!!! BACKEND CRASHED !!!' && sleep 3600)"]

//forcebuild