# Stage 1: Build locally
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY test ./test
COPY firebase ./firebase

# Build the application
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/firebase ./firebase

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
