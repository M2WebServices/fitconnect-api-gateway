# Challenge Ranking Service

Service en charge du scoring, des challenges et du classement.

## Evenements Redis ecoutes

- WORKOUT_COMPLETED
- EVENT_CREATED

## Lancer

Depuis la racine monorepo:

```bash
npm run challenge:install
npm run challenge:dev
```

Variables d'environnement: voir .env.example.

- `CHALLENGE_HTTP_PORT` (defaut 3004)
- `CHALLENGE_GRPC_PORT` (defaut 50055)
- `REDIS_URL` (defaut redis://localhost:6379)

Le service expose aussi gRPC (RankingService) sur `CHALLENGE_GRPC_PORT`.

## Logique metier actuellement active

- `WORKOUT_COMPLETED` augmente le score utilisateur.
- `EVENT_CREATED` cree un challenge associe a l'evenement.
- Si un `WORKOUT_COMPLETED` contient `eventId`, le challenge associe est valide et donne un bonus.
- Attribution automatique des titres: `ROOKIE`, `BRONZE`, `SILVER`, `GOLD`, `LEGEND`.

## Endpoints internes (debug)

- `GET /internal/leaderboard?limit=10`
- `GET /internal/users/:userId/ranking`
- `GET /internal/challenges`
- `GET /internal/challenges/:challengeId/participants`
