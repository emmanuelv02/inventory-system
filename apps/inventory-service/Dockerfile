# Use Node.js as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json* turbo.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/inventory-service/package.json ./apps/inventory-service/package.json

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/inventory-service ./apps/inventory-service

# Build both shared and inventory service
RUN npx turbo build --filter=inventory-service

# Stage 2: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package files and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy shared package
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy inventory service
COPY --from=builder /app/apps/inventory-service/package.json ./apps/inventory-service/package.json
COPY --from=builder /app/apps/inventory-service/dist ./apps/inventory-service/dist

# Set proper ownership
USER nestjs

# Expose port
EXPOSE 3001

# Run the application
CMD ["node", "apps/inventory-service/dist/main.js"]