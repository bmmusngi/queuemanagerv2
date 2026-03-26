# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with memory limit for slim environments
RUN NODE_OPTIONS="--max-old-space-size=2048" npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# --- Stage 2: Production Server ---
FROM nginx:alpine

# Copy the built React app to Nginx's public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx inside the container
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

//forcebuild