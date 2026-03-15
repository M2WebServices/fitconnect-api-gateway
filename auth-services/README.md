# Auth Service

Service de gestion de l'authentification et des tokens pour FitConnect.

## Lancer le service

Depuis la racine monorepo:

```bash
npm run auth:install
npm run auth:dev
```

Ou directement dans le service:

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm start
```

Le service expose:

- HTTP sur `PORT` (par defaut 3002)
- gRPC sur `GRPC_PORT` (par defaut 50056)
