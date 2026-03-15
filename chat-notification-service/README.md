# Chat Notification Service

Service de notification et messagerie temps reel.

## Evenements Redis ecoutes

- WORKOUT_COMPLETED
- EVENT_CREATED

## Lancer

Depuis la racine monorepo:

```bash
npm run chatnotif:install
npm run chatnotif:dev
```

Variables d'environnement: voir .env.example.

- `CHATNOTIF_HTTP_PORT` (defaut 3005)
- `REDIS_URL` (defaut redis://localhost:6379)

## WebSocket

Le service demarre un WebSocket sur:

- `ws://localhost:<CHATNOTIF_HTTP_PORT>/ws`

Events pushes:

- `WORKOUT_COMPLETED`
- `EVENT_CREATED`

Endpoint debug:

- `GET /internal/notifications`
