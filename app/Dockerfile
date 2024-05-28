# Set-up build image
FROM node:22-alpine AS builder
ENV NODE_ENV=production

WORKDIR /app

# Copy package.json and lockfile
COPY ["pnpm-lock.yaml", "package.json", "./"]

# Install build tools
RUN apk add --no-cache alpine-sdk python3 && \
    npm install -g pnpm && \
    NODE_ENV=development pnpm install

# Copy all files to working directory
COPY . .

# Compile Typescript and remove dev packages
RUN pnpm build && \
    pnpm prune --prod

# Set-up running image
FROM node:22-alpine
ARG commit_hash
ENV NODE_ENV=production \
    COMMIT_HASH=$commit_hash
WORKDIR /app

# Copy all files (including source :/)
COPY --from=builder /app .

# Run
CMD ["npm", "start"]