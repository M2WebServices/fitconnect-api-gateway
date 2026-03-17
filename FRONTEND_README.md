# Frontend README - Utiliser la Gateway FitConnect

Ce document explique comment consommer toutes les requetes exposees par la gateway GraphQL depuis ton frontend.

## 0) Suivi des dependances backend (mise a jour continue)

Statut actuel (du plus prioritaire au moins prioritaire):

1. Challenges API dediee via gateway
- Statut: FAIT (etape 1)
- Ajouts: `challenges`, `challengeParticipants(challengeId)`

2. Planning/Workout API dediee via gateway
- Statut: FAIT (etape 2)
- Ajouts: `myWorkoutSessions(limit)`, `completeWorkoutSession(...)`

3. Temps reel chat (WebSocket) via gateway
- Statut: FAIT (etape 3)
- Ajouts: `chatRealtimeConfig`

4. Profil utilisateur (update profile)
- Statut: FAIT (etape 4)
- Ajouts: `updateMyProfile(email, pseudo)`

5. Auth avancee (forgot/reset password)
- Statut: A FAIRE

## 1) Endpoints a utiliser

- Gateway GraphQL (frontend -> gateway): http://localhost:4100/
- Auth GraphQL (signup/signin, recup token): http://localhost:4102/graphql

La gateway attend des requetes GraphQL en HTTP POST avec un body JSON:

```json
{
  "query": "query { __typename }",
  "variables": {}
}
```

## 2) Flux de communication recommande

1. Le frontend cree un compte ou se connecte via le service auth.
2. Le frontend stocke le token JWT (memoire, localStorage, cookie, selon ton choix).
3. Le frontend appelle la gateway en ajoutant l'en-tete Authorization: Bearer <token>.
4. La gateway orchestre ensuite les appels gRPC vers community/planning/chat/ranking.

## 3) Authentification frontend

Toutes les operations de la gateway demandent un utilisateur authentifie.
Si le token est absent/invalide, la gateway renvoie une erreur GraphQL avec code UNAUTHENTICATED.

### Mutation signUp (auth-service)

```graphql
mutation SignUp($email: String!, $pseudo: String!, $password: String!) {
  signUp(email: $email, pseudo: $pseudo, password: $password) {
    token
    user {
      id
      email
      pseudo
    }
  }
}
```

Variables:

```json
{
  "email": "user@example.com",
  "pseudo": "myPseudo",
  "password": "StrongPassword123!"
}
```

### Mutation signIn (auth-service)

```graphql
mutation SignIn($email: String!, $password: String!) {
  signIn(email: $email, password: $password) {
    token
    user {
      id
      email
      pseudo
    }
  }
}
```

Variables:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

## 4) Helper frontend (fetch)

```ts
const GATEWAY_URL = "http://localhost:4100/";

export async function gatewayRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string
): Promise<T> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (!response.ok || payload.errors?.length) {
    throw payload;
  }

  return payload.data as T;
}
```

## 5) Catalogue complet des requetes de la gateway

## Queries

### me
Retourne l'utilisateur connecte.

```graphql
query Me {
  me {
    id
    username
    email
  }
}
```

### group(id)
Retourne un groupe par son ID.

```graphql
query Group($id: ID!) {
  group(id: $id) {
    id
    name
    description
    createdAt
    members {
      id
      username
      email
    }
  }
}
```

### myGroups
Liste les groupes de l'utilisateur connecte.

```graphql
query MyGroups {
  myGroups {
    id
    name
    description
    createdAt
  }
}
```

### searchGroups(query)
Recherche des groupes par texte.

```graphql
query SearchGroups($query: String!) {
  searchGroups(query: $query) {
    id
    name
    description
    createdAt
  }
}
```

### groupEvents(groupId)
Liste les evenements d'un groupe.

```graphql
query GroupEvents($groupId: ID!) {
  groupEvents(groupId: $groupId) {
    id
    title
    description
    date
    groupId
  }
}
```

### event(id)
Retourne un evenement par ID.

```graphql
query Event($id: ID!) {
  event(id: $id) {
    id
    title
    description
    date
    groupId
    group {
      id
      name
    }
  }
}
```

### myEvents
Liste les evenements associes a l'utilisateur connecte.

```graphql
query MyEvents {
  myEvents {
    id
    title
    description
    date
    groupId
  }
}
```

### eventParticipants(eventId)
Liste les participants d'un evenement.

```graphql
query EventParticipants($eventId: ID!) {
  eventParticipants(eventId: $eventId) {
    userId
    joinedAt
    user {
      id
      username
      email
    }
  }
}
```

### groupMessages(groupId, limit)
Recupere les messages d'un groupe.

```graphql
query GroupMessages($groupId: ID!, $limit: Int) {
  groupMessages(groupId: $groupId, limit: $limit) {
    id
    content
    senderId
    groupId
    createdAt
    sender {
      id
      username
      email
    }
  }
}
```

### leaderboard(limit)
Recupere le classement global.

```graphql
query Leaderboard($limit: Int) {
  leaderboard(limit: $limit) {
    userId
    score
    rank
    user {
      id
      username
      email
    }
  }
}
```

### myRanking
Recupere le classement de l'utilisateur connecte.

```graphql
query MyRanking {
  myRanking {
    userId
    score
    rank
  }
}
```

### challenges
Recupere la liste des challenges backend.

```graphql
query Challenges {
  challenges {
    id
    eventId
    groupId
    title
    createdAt
    pointsReward
  }
}
```

### challengeParticipants(challengeId)
Recupere les participants d'un challenge.

```graphql
query ChallengeParticipants($challengeId: ID!) {
  challengeParticipants(challengeId: $challengeId) {
    id
    challengeId
    userId
    joinedAt
    completed
    completedAt
    user {
      id
      username
      email
    }
  }
}
```

### myWorkoutSessions(limit)
Recupere les seances completees de l'utilisateur connecte.

```graphql
query MyWorkoutSessions($limit: Int) {
  myWorkoutSessions(limit: $limit) {
    workoutSessionId
    userId
    completedAt
    durationMinutes
    caloriesBurned
    eventId
    groupId
    user {
      id
      username
      email
    }
  }
}
```

### chatRealtimeConfig
Recupere la configuration officielle du canal temps reel chat a utiliser cote frontend.

```graphql
query ChatRealtimeConfig {
  chatRealtimeConfig {
    wsUrl
    events
    heartbeatSeconds
  }
}
```

Exemple d'usage frontend:

1. Appeler `chatRealtimeConfig` via gateway.
2. Ouvrir un WebSocket sur `wsUrl` (ex: `ws://localhost:4105/ws`).
3. Ecouter les events `WORKOUT_COMPLETED` et `EVENT_CREATED`.

## Mutations

### createGroup(name, description)
Cree un groupe. Le createur est ajoute automatiquement en ADMIN.

```graphql
mutation CreateGroup($name: String!, $description: String) {
  createGroup(name: $name, description: $description) {
    id
    name
    description
    createdAt
  }
}
```

### updateGroup(id, name, description)
Modifie un groupe.

```graphql
mutation UpdateGroup($id: ID!, $name: String, $description: String) {
  updateGroup(id: $id, name: $name, description: $description) {
    id
    name
    description
    createdAt
  }
}
```

### deleteGroup(id)
Supprime un groupe.

```graphql
mutation DeleteGroup($id: ID!) {
  deleteGroup(id: $id)
}
```

### joinGroup(groupId)
Rejoint un groupe.

```graphql
mutation JoinGroup($groupId: ID!) {
  joinGroup(groupId: $groupId)
}
```

### leaveGroup(groupId)
Quitte un groupe.

```graphql
mutation LeaveGroup($groupId: ID!) {
  leaveGroup(groupId: $groupId)
}
```

### createEvent(groupId, title, description, date)
Cree un evenement dans un groupe.
Condition metier: l'utilisateur doit etre membre du groupe.

```graphql
mutation CreateEvent(
  $groupId: ID!
  $title: String!
  $description: String
  $date: String!
) {
  createEvent(
    groupId: $groupId
    title: $title
    description: $description
    date: $date
  ) {
    id
    title
    description
    date
    groupId
  }
}
```

### updateEvent(id, title, description, date)
Met a jour un evenement.

```graphql
mutation UpdateEvent($id: ID!, $title: String, $description: String, $date: String) {
  updateEvent(id: $id, title: $title, description: $description, date: $date) {
    id
    title
    description
    date
    groupId
  }
}
```

### deleteEvent(id)
Supprime un evenement.

```graphql
mutation DeleteEvent($id: ID!) {
  deleteEvent(id: $id)
}
```

### joinEvent(eventId)
Inscrit l'utilisateur a un evenement.

```graphql
mutation JoinEvent($eventId: ID!) {
  joinEvent(eventId: $eventId)
}
```

### sendMessage(groupId, content)
Envoie un message dans un groupe.

```graphql
mutation SendMessage($groupId: ID!, $content: String!) {
  sendMessage(groupId: $groupId, content: $content) {
    id
    content
    senderId
    groupId
    createdAt
  }
}
```

### deleteMessage(id)
Supprime un message.

```graphql
mutation DeleteMessage($id: ID!) {
  deleteMessage(id: $id)
}
```

### updateScore(userId, points)
Met a jour un score utilisateur (usage admin/systeme).

```graphql
mutation UpdateScore($userId: ID!, $points: Int!) {
  updateScore(userId: $userId, points: $points) {
    userId
    score
    rank
  }
}
```

### completeWorkoutSession(...)
Enregistre une seance completee pour l'utilisateur connecte et publie l'evenement metier cote backend.

```graphql
mutation CompleteWorkoutSession(
  $workoutSessionId: ID!
  $completedAt: String
  $durationMinutes: Int
  $caloriesBurned: Int
  $eventId: ID
  $groupId: ID
) {
  completeWorkoutSession(
    workoutSessionId: $workoutSessionId
    completedAt: $completedAt
    durationMinutes: $durationMinutes
    caloriesBurned: $caloriesBurned
    eventId: $eventId
    groupId: $groupId
  ) {
    workoutSessionId
    userId
    completedAt
    durationMinutes
    caloriesBurned
    eventId
    groupId
  }
}
```

### updateMyProfile(email, pseudo)
Met a jour le profil de l'utilisateur connecte.

```graphql
mutation UpdateMyProfile($email: String, $pseudo: String) {
  updateMyProfile(email: $email, pseudo: $pseudo) {
    id
    username
    email
  }
}
```

Variables exemple:

```json
{
  "email": "new-email@example.com",
  "pseudo": "newPseudo"
}
```

## 6) Exemple de client Apollo (optionnel)

```ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = new HttpLink({ uri: "http://localhost:4100/" });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("fitconnect_token");
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

## 7) Erreurs courantes cote frontend

- UNAUTHENTICATED: token manquant, expire ou invalide.
- FORBIDDEN: operation autorisee techniquement mais refusee par la regle metier (ex: createEvent hors groupe).
- NOT_FOUND: ressource inexistante (event/groupe/message).

## 8) Check rapide de bon fonctionnement

1. Effectue signIn ou signUp sur auth-service.
2. Recupere token.
3. Envoie query me sur la gateway avec Authorization.
4. Si me renvoie un user, ton frontend est correctement branche.
