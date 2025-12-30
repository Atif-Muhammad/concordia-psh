FROM node:20-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl libssl-dev

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3003

# Generate Prisma client + run safe migrations + start app
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node main.js"]
