# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (with memory limit for slim environment)
RUN NODE_OPTIONS="--max-old-space-size=2048" npm install

# Copy the rest of the application code
COPY . .

# Build the React application using the "Capture and Scream" hack
# If Vite/TypeScript fails, it prints the exact error to Portainer and stops.
RUN npm run build > build_debug.log 2>&1 || (cat build_debug.log && exit 1)

# --- Stage 2: Production Server ---
FROM nginx:alpine

# Copy the built React app to Nginx's public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
