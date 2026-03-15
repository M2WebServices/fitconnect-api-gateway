# Planning Service

Service de gestion des evenements et participations pour le planning FitConnect.

## Prerequis

- PostgreSQL accessible avec les parametres de [.env.example](.env.example)
- Fichier `.env` cree a partir de `.env.example`

## Lancer le service

Depuis la racine monorepo:

```bash
npm run planning:install
npm run planning:dev
```

Ou directement dans le service:

```bash
npm install
npm run dev
```

Le proto gRPC utilise par le service est [proto/event.proto](proto/event.proto).

## Build production

```bash
npm run build
npm start
```

Le service expose:

- HTTP sur `HTTP_PORT` (par defaut 3003)
- gRPC sur `GRPC_PORT` (par defaut 50053)

## Redis Pub/Sub

Le service publie sur Redis:

- `EVENT_CREATED` a chaque creation d'evenement
- `WORKOUT_COMPLETED` via endpoint interne `POST /internal/workouts/completed`

Configuration:

- `REDIS_URL` (defaut `redis://localhost:6379`)
