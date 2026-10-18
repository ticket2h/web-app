# syntax=docker/dockerfile:1
# Image của web-app: SPA đã build + nginx làm gateway (nginx/default.conf.template).
# Build: docker build -t ghcr.io/ticket2h/web-app . (chỉ cần Docker). CI (.github/workflows/ci.yml) build và đẩy lên GHCR.

# Bước 1: build SPA. Image node đầy đủ (không phải slim/alpine) vì momi-ui cài từ git cần lệnh git.
FROM node:24-bookworm AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# Bước 2: chỉ nginx và file tĩnh
FROM nginx:1.29-alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/proxy-headers.inc /etc/nginx/conf.d/proxy-headers.inc
COPY --from=build /src/dist /usr/share/nginx/html
# Địa chỉ service trong docker compose của infra; ghi đè bằng biến môi trường khi chạy ở nơi khác
ENV IDENTITY_UPSTREAM=http://identity-service:8082 \
    CORE_UPSTREAM=http://core-service:8080
EXPOSE 80
