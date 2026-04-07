# syntax=docker/dockerfile:1
# LiveKit Cloud builds this image from the agent/ directory (`lk agent deploy`).
# See https://docs.livekit.io/deploy/agents/builds/

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim AS base

RUN apt-get update -qq \
  && apt-get install --no-install-recommends -y ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN node dist/index.js download-files
RUN npm prune --production

FROM base

ARG UID=10001
RUN adduser \
  --disabled-password \
  --gecos "" \
  --home "/app" \
  --shell "/sbin/nologin" \
  --uid "${UID}" \
  appuser

WORKDIR /app

COPY --from=build --chown=appuser:appuser /app /app

USER appuser

ENV NODE_ENV=production

CMD ["node", "dist/index.js", "start"]
