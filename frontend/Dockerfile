FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies 
RUN NODE_OPTIONS="--max-old-space-size=2048" npm install

# Copy the rest of the application code
COPY . .

EXPOSE 3000

# THE ZOMBIE TRAP:
# Try to build. If it fails, print a warning and sleep so we can read the logs!
CMD ["sh", "-c", "npm run build || (echo '!!! FRONTEND BUILD FAILED !!! Check errors above.' && sleep 3600)"]
