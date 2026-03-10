# Multi-stage build for Vite + React app
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm and project dependencies
COPY package.json pnpm-lock.yaml* ./
# Use Corepack (shipped with Node) to enable pnpm without global npm installs
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --no-frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: replace default nginx config if you need SPA fallback
# COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
