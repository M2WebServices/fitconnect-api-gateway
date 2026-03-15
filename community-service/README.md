# Community Service

Service de gestion des utilisateurs, groupes et memberships pour FitConnect.

## Structure

```text
community-service/
├── src/
├── proto/
├── package.json
├── tsconfig.json
└── .env
```

## Lancer le service

Depuis la racine monorepo:

```bash
npm run community:install
npm run community:dev
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

- HTTP sur `PORT` (par defaut 3001)
- gRPC sur `GRPC_PORT` (par defaut 50051)
