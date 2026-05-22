# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install all dependencies (needed for full build and typescript/vite compilation)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the client-side bundle and bundle the server using esbuild
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=8080

# Copy package files to install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled assets and server bundles from builder stage
COPY --from=builder /app/dist ./dist

# Expose the default application port (8080)
EXPOSE 8080

# Start the application server
CMD ["npm", "run", "start"]
