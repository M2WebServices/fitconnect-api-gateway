# FitConnect Backend Monorepo

Ce repo est organise pour accueillir plusieurs services independants a la racine.

## Structure cible

```text
.
├── api-gateway/
├── auth-services/
├── community-service/
├── planning-service/
├── challenge-ranking-service/
├── chat-notification-service/
└── ... autres services a ajouter
```

## Service disponible

- API Gateway: voir [api-gateway/README.md](api-gateway/README.md)
- Community Service: voir [community-service/README.md](community-service/README.md)
- Planning Service: voir [planning-service/README.md](planning-service/README.md)
- Challenge Ranking Service: voir [challenge-ranking-service/README.md](challenge-ranking-service/README.md)
- Chat Notification Service: voir [chat-notification-service/README.md](chat-notification-service/README.md)

## Commandes API Gateway

Depuis la racine du repo:

```bash
npm --prefix api-gateway install
npm --prefix api-gateway run dev
npm --prefix api-gateway run build
npm --prefix api-gateway start
```

## Commandes Community Service

Depuis la racine du repo:

```bash
npm --prefix community-service install
npm --prefix community-service run dev
npm --prefix community-service run build
npm --prefix community-service start
```

Ou avec les scripts racine:

```bash
npm run gateway:install
npm run gateway:dev
npm run gateway:build
npm run gateway:start
npm run community:install
npm run community:dev
npm run community:build
npm run community:start
npm run planning:install
npm run planning:dev
npm run planning:build
npm run planning:start
npm run challenge:install
npm run challenge:dev
npm run challenge:build
npm run challenge:start
npm run chatnotif:install
npm run chatnotif:dev
npm run chatnotif:build
npm run chatnotif:start
```

## Ajout d'un nouveau service

1. Creer un dossier a la racine (exemple: `event-service`).
2. Ajouter au minimum `src/`, `proto/`, `package.json`, `tsconfig.json`, `.env.example`, `README.md`.
3. Exposer le service en gRPC sur un port dedie.
4. Ajouter l'URL dans [api-gateway/.env.example](api-gateway/.env.example) et [api-gateway/src/config/env.ts](api-gateway/src/config/env.ts).
5. Ajouter un client gRPC dans [api-gateway/src/clients](api-gateway/src/clients) puis les resolvers associes.

Si tu veux, au prochain tour je peux te generer automatiquement le squelette complet de `auth-services` (TypeScript + gRPC + proto + scripts npm).

## Test local automatise

Depuis la racine:

```bash
npm run local:up
npm run local:status
npm run local:smoke
```

Pour arreter les services demarres en arriere-plan:

```bash
npm run local:down
```
