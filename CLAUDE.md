# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

FitConnect is a **GraphQL-over-gRPC microservices monorepo**. The `api-gateway` is the sole public entrypoint — it exposes a GraphQL API (Apollo Server 4) and translates every query/mutation into gRPC calls to one of the five backend services. There is no direct HTTP communication between services; proto files are the contracts.

```
Client → GraphQL (api-gateway :4100) → gRPC → auth-services      (:5106)
                                              → community-service  (:5101)
                                              → planning-service   (:5103)
                                              → challenge-ranking-service (:5105)
                                              → chat-notification-service (:5104)
```

The gateway holds no business logic — all validation, persistence, and domain rules live in the individual services.

## Service Map

| Service | Framework | HTTP Port | gRPC Port | Notes |
|---------|-----------|-----------|-----------|-------|
| `api-gateway` | Apollo Server 4 (standalone) | 4100 | — | GraphQL only |
| `auth-services` | Express + Apollo + gRPC | 4102 | 5106 | JWT, bcrypt, Redis cache |
| `community-service` | NestJS | 3001 | 5101 | TypeORM migrations |
| `planning-service` | Express + gRPC | 4103 | 5103 | |
| `challenge-ranking-service` | Express + gRPC | — | 5105 | Pub/sub messaging |
| `chat-notification-service` | Express + gRPC + WebSocket | — | 5104 | Real-time via `ws` |

## Commands

All commands are run from the **monorepo root** using the `--prefix` pattern.

### Start a service in dev mode (hot-reload via ts-node-dev)
```bash
npm run gateway:dev
npm run auth:dev
npm run community:dev
npm run planning:dev
npm run challenge:dev
npm run chatnotif:dev
```

### Build a service
```bash
npm run gateway:build
npm run auth:build
# pattern: <service>:build
```

### Run compiled output
```bash
npm run gateway:start
npm run auth:start
```

### Install dependencies for a service
```bash
npm run gateway:install
npm run auth:install
# pattern: <service>:install
```

### Local environment (Docker Compose)
```bash
npm run local:up       # start all services via docker-compose
npm run local:status   # health-check all services
npm run local:smoke    # integration/smoke tests
npm run local:down     # stop all services
```

### Lint & format (per-service, run inside the service directory)
```bash
npm run lint
npm run format
```

## Key File Locations

- **GraphQL schema & resolvers**: `api-gateway/src/graphql/`
- **gRPC client stubs (gateway side)**: `api-gateway/src/clients/`
- **Proto definitions**: `<service>/proto/*.proto` — these are the source of truth for inter-service contracts
- **gRPC server implementations**: `<service>/src/grpc/`
- **Auth middleware**: `api-gateway/src/middleware/`
- **Database migrations**: `community-service/src/migrations/`

## Environment Setup

Each service has its own `.env.example`. Key variables follow a consistent pattern:

```
PORT=<http_port>
GRPC_PORT=<grpc_port>
DATABASE_URL=<postgres_connection_string>
REDIS_URL=<redis_url>           # optional; services degrade gracefully without it
JWT_SECRET=<secret>
# gRPC addresses for services the gateway/other services need to reach:
AUTH_GRPC_URL=localhost:5106
COMMUNITY_GRPC_URL=localhost:5101
# ...etc
```

Copy `.env.example` → `.env` in each service directory before running.

## Technology Stack

- **Language**: TypeScript 5.x (strict mode), Node.js 20+
- **gRPC**: `@grpc/grpc-js` + `@grpc/proto-loader`
- **Database**: PostgreSQL (Supabase-compatible); accessed via TypeORM
- **Cache**: Redis (optional)
- **Auth**: JWT (`jsonwebtoken`) + `bcrypt`
- **Real-time**: WebSocket (`ws` library) in chat-notification-service
- **Dev tooling**: `ts-node-dev` (hot-reload), ESLint, Prettier

## Adding a New Service Feature

1. Update the `.proto` file for the relevant service — this is the interface contract.
2. Implement the gRPC handler in `<service>/src/grpc/`.
3. If exposed to clients, add a GraphQL resolver in `api-gateway/src/graphql/resolvers/` and call the gRPC client in `api-gateway/src/clients/`.
4. No direct HTTP calls between services — always go through gRPC.

## NestJS vs Express

`community-service` uses NestJS; all other services use plain Express with manual gRPC server setup. Keep this distinction in mind when adding modules: NestJS services use the module/decorator pattern, others use straightforward class or function exports.
