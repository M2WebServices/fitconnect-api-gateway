# Frontend README - Utiliser la Gateway FitConnect

Ce document explique comment consommer toutes les requetes exposees par la gateway GraphQL depuis ton frontend.
Il reflete l'etat **reel** du backend verifie dans le code source.

---

## 0) Etat reel du backend — vue rapide

| Service | Fonctionnalite | Etat |
|---|---|---|
| Auth | signUp / signIn | ✅ |
| Auth | forgotPassword / resetPassword | ❌ non implemente |
| Auth | updateMyProfile | ✅ |
| Community | CRUD groupe, membres | ✅ |
| Community | role expose sur members | ❌ members ne contient que id/username/email |
| Planning | CRUD evenement, joinEvent | ✅ |
| Planning | leaveEvent | ❌ non implemente |
| Planning | updateEvent / deleteEvent sans check createur | ⚠️ tout user auth peut modifier/supprimer |
| Planning | Event.createdBy | ❌ toujours null (pas de creatorId en base) |
| Planning | myEvents | ✅ = evenements ou l'user est **participant** (joinEvent) |
| Planning | myWorkoutSessions | ✅ |
| Chat | sendMessage / groupMessages / deleteMessage | ✅ |
| Chat | deleteMessage ownership | ✅ verifie en base (seul l'expediteur) |
| Chat | Subscriptions GraphQL (messageAdded, groupUpdated) | ❌ non implementees |
| Chat | WebSocket temps reel | ✅ ws://localhost:4105/ws |
| Ranking | leaderboard / myRanking / challenges | ✅ |
| Ranking | updateScore sans check admin | ⚠️ tout user auth peut modifier n'importe quel score |

---

## 1) Endpoints

- **Gateway GraphQL** (toutes les requetes, sauf auth): `http://localhost:4100/`
- **Auth GraphQL** (signUp / signIn uniquement): `http://localhost:4102/graphql`

Toutes les requetes sont des HTTP POST avec body JSON:

```json
{ "query": "...", "variables": {} }
```

---

## 2) Flux de communication recommande

1. `signUp` ou `signIn` sur `http://localhost:4102/graphql` → recupere le token JWT.
2. Stocker le token (memoire, localStorage ou cookie).
3. Toutes les requetes suivantes vont sur `http://localhost:4100/` avec l'en-tete `Authorization: Bearer <token>`.
4. La gateway orchestre les appels gRPC vers les services.

---

## 3) Authentification

Toutes les operations de la gateway exigent un token valide.
Token absent/invalide → erreur `UNAUTHENTICATED`.

### signUp

```graphql
mutation SignUp($email: String!, $pseudo: String!, $password: String!) {
  signUp(email: $email, pseudo: $pseudo, password: $password) {
    token
    user { id email pseudo }
  }
}
```

### signIn

```graphql
mutation SignIn($email: String!, $password: String!) {
  signIn(email: $email, password: $password) {
    token
    user { id email pseudo }
  }
}
```

---

## 4) Helper fetch

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

---

## 5) Catalogue complet des requetes

---

### SERVICE AUTH

Toutes les requetes auth passent par `http://localhost:4102/graphql`.

#### signUp / signIn

Voir section 3.

#### forgotPassword / resetPassword

❌ **Non implementes.** Ces mutations n'existent pas dans le backend actuel.

---

### SERVICE COMMUNITY (via gateway)

#### Queries

##### me
Retourne l'utilisateur courant depuis le JWT (pas d'appel DB).

```graphql
query Me {
  me { id username email }
}
```

##### group(id)
Retourne un groupe et ses membres.
Note: `members` contient uniquement `id`, `username`, `email` — pas de champ `role`.
`ownerId` est defini dans le schema mais non peuple cote backend.

```graphql
query Group($id: ID!) {
  group(id: $id) {
    id
    name
    description
    createdAt
    members { id username email }
  }
}
```

##### myGroups
Liste les groupes dont l'utilisateur est membre.

```graphql
query MyGroups {
  myGroups { id name description createdAt }
}
```

##### searchGroups(query)
Recherche par nom de groupe.

```graphql
query SearchGroups($query: String!) {
  searchGroups(query: $query) { id name description createdAt }
}
```

#### Mutations Community

##### createGroup(name, description)
Le createur est automatiquement ajoute en ADMIN.

```graphql
mutation CreateGroup($name: String!, $description: String) {
  createGroup(name: $name, description: $description) {
    id name description createdAt
  }
}
```

##### updateGroup(id, name, description)
Requiert d'etre ADMIN du groupe. Erreur `FORBIDDEN` sinon.

```graphql
mutation UpdateGroup($id: ID!, $name: String, $description: String) {
  updateGroup(id: $id, name: $name, description: $description) {
    id name description createdAt
  }
}
```

##### deleteGroup(id)
Requiert d'etre ADMIN du groupe.

```graphql
mutation DeleteGroup($id: ID!) {
  deleteGroup(id: $id)
}
```

##### joinGroup(groupId)
Rejoint un groupe. Cree l'entree utilisateur dans community-service si absente.

```graphql
mutation JoinGroup($groupId: ID!) {
  joinGroup(groupId: $groupId)
}
```

##### leaveGroup(groupId)
Quitte un groupe.

```graphql
mutation LeaveGroup($groupId: ID!) {
  leaveGroup(groupId: $groupId)
}
```

##### addGroupMember(groupId, userId, role)
Requiert d'etre ADMIN. Valide que `userId` existe dans le service auth.
`role` accepte `"ADMIN"` ou `"MEMBER"` (defaut `"MEMBER"`).

```graphql
mutation AddGroupMember($groupId: ID!, $userId: ID!, $role: String) {
  addGroupMember(groupId: $groupId, userId: $userId, role: $role)
}
```

##### removeGroupMember(groupId, userId)
Requiert d'etre ADMIN.

```graphql
mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
  removeGroupMember(groupId: $groupId, userId: $userId)
}
```

#### Regles metier Community

- `myGroups` = groupes ou l'user a une membership active (ADMIN ou MEMBER).
- `updateGroup`, `deleteGroup`, `addGroupMember`, `removeGroupMember` exigent le role ADMIN.
- La detection du role ADMIN cote frontend est impossible via `group(id)` (le role n'est pas expose sur les membres). Baser l'affichage conditionnel sur les erreurs `FORBIDDEN`.
- Pour savoir si l'user est admin: tenter une action admin et intercepter `FORBIDDEN`.

#### Erreurs Community

| Code | Cause |
|---|---|
| `UNAUTHENTICATED` | Token absent ou invalide |
| `FORBIDDEN` | Action admin sans etre ADMIN |
| `BAD_USER_INPUT` | userId introuvable dans auth, ou role invalide |
| `NOT_FOUND` | Groupe introuvable |

---

### SERVICE PLANNING / EVENTS (via gateway)

#### Queries

##### groupEvents(groupId)
Liste les evenements d'un groupe, tries par date decroissante.

```graphql
query GroupEvents($groupId: ID!) {
  groupEvents(groupId: $groupId) {
    id title description date groupId
  }
}
```

##### event(id)
Detail d'un evenement avec le groupe associe.
`createdBy` est defini dans le schema mais **toujours null** (pas de creatorId en base).

```graphql
query Event($id: ID!) {
  event(id: $id) {
    id title description date groupId
    group { id name }
  }
}
```

##### myEvents
Evenements auxquels l'utilisateur **a rejoint** via `joinEvent`.
Ce n'est PAS la liste des evenements crees — c'est la liste des participations.

```graphql
query MyEvents {
  myEvents { id title description date groupId }
}
```

##### eventParticipants(eventId)
Liste les participants d'un evenement avec resolution de l'utilisateur.

```graphql
query EventParticipants($eventId: ID!) {
  eventParticipants(eventId: $eventId) {
    userId
    joinedAt
    user { id username email }
  }
}
```

##### myWorkoutSessions(limit)
Seances d'entrainement completees. Defaut: 20.

```graphql
query MyWorkoutSessions($limit: Int) {
  myWorkoutSessions(limit: $limit) {
    workoutSessionId userId completedAt
    durationMinutes caloriesBurned
    eventId groupId
    user { id username email }
  }
}
```

#### Mutations Planning

##### createEvent(groupId, title, description, date)
Requiert d'etre membre du groupe. Erreur `FORBIDDEN` sinon.
`date` au format ISO 8601 (ex: `"2026-05-15T10:00:00.000Z"`).

```graphql
mutation CreateEvent($groupId: ID!, $title: String!, $description: String, $date: String!) {
  createEvent(groupId: $groupId, title: $title, description: $description, date: $date) {
    id title description date groupId
  }
}
```

##### updateEvent(id, title, description, date)
⚠️ Tout utilisateur authentifie peut modifier n'importe quel evenement.
Le backend ne verifie pas que l'appelant est le createur (le champ `creatorId` n'existe pas en base).

```graphql
mutation UpdateEvent($id: ID!, $title: String, $description: String, $date: String) {
  updateEvent(id: $id, title: $title, description: $description, date: $date) {
    id title description date groupId
  }
}
```

##### deleteEvent(id)
⚠️ Meme limitation que `updateEvent` — aucune verification de createur.

```graphql
mutation DeleteEvent($id: ID!) {
  deleteEvent(id: $id)
}
```

##### joinEvent(eventId)
Inscrit l'utilisateur courant a un evenement.
Erreur `ALREADY_EXISTS` si deja inscrit.

```graphql
mutation JoinEvent($eventId: ID!) {
  joinEvent(eventId: $eventId)
}
```

##### leaveEvent — NON IMPLEMENTE
❌ Aucune mutation `leaveEvent` n'existe. Ne pas afficher ce bouton sans l'avoir implemente backend.
Pour l'ajouter il faut modifier: `participation.repository`, `participation.service`, `event.grpc.controller`, `event.proto`, et le resolver gateway.

##### completeWorkoutSession(...)
Enregistre une seance pour l'utilisateur courant et publie l'evenement Redis `WORKOUT_COMPLETED`.

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
    workoutSessionId userId completedAt durationMinutes caloriesBurned eventId groupId
  }
}
```

#### Regles metier Planning

- `createEvent` exige la membership au groupe (verifie cote gateway).
- `myEvents` = liste des participations (joinEvent), pas des evenements crees.
- Pas de notion de "createur" sur un evenement en base — impossible de distinguer le createur des participants.
- `leaveEvent` n'est pas implemente.

#### Erreurs Planning

| Code | Cause |
|---|---|
| `UNAUTHENTICATED` | Token absent ou invalide |
| `FORBIDDEN` | `createEvent` hors du groupe |
| `NOT_FOUND` | Evenement introuvable |
| `ALREADY_EXISTS` | `joinEvent` alors que deja inscrit |

---

### SERVICE CHAT (via gateway)

#### Queries

##### groupMessages(groupId, limit)
Retourne les messages d'un groupe tries par date decroissante. Defaut: 50.
`sender` est resolu via DataLoader (un appel batch vers auth-service).

```graphql
query GroupMessages($groupId: ID!, $limit: Int) {
  groupMessages(groupId: $groupId, limit: $limit) {
    id content senderId groupId createdAt
    sender { id username email }
  }
}
```

##### chatRealtimeConfig
Retourne la configuration du WebSocket temps reel.

```graphql
query ChatRealtimeConfig {
  chatRealtimeConfig {
    wsUrl
    events
    heartbeatSeconds
  }
}
```

Reponse typique:
```json
{
  "wsUrl": "ws://localhost:4105/ws",
  "events": ["WS_CONNECTED", "WORKOUT_COMPLETED", "EVENT_CREATED"],
  "heartbeatSeconds": 30
}
```

#### Mutations Chat

##### sendMessage(groupId, content)
Tout utilisateur authentifie peut envoyer un message dans n'importe quel groupe.
L'ID du message est au format `msg-{timestamp}-{random}` (pas un UUID).

```graphql
mutation SendMessage($groupId: ID!, $content: String!) {
  sendMessage(groupId: $groupId, content: $content) {
    id content senderId groupId createdAt
  }
}
```

##### deleteMessage(id)
Seul l'expediteur du message peut le supprimer (verifie en base: `WHERE id=$1 AND sender_id=$2`).
Si l'appelant n'est pas l'expediteur, retourne `true` sans erreur mais ne supprime rien.

```graphql
mutation DeleteMessage($id: ID!) {
  deleteMessage(id: $id)
}
```

#### WebSocket temps reel

1. Appeler `chatRealtimeConfig` pour obtenir `wsUrl`.
2. Ouvrir `new WebSocket(wsUrl)`.
3. Ecouter les evenements:

| Event | Declencheur |
|---|---|
| `WS_CONNECTED` | A la connexion |
| `WORKOUT_COMPLETED` | Quand un utilisateur complete une seance via `completeWorkoutSession` |
| `EVENT_CREATED` | Quand un evenement est cree via `createEvent` |

#### Subscriptions GraphQL — NON IMPLEMENTEES

❌ `messageAdded(groupId)` et `groupUpdated(groupId)` sont definis dans le schema GraphQL mais **n'ont aucun resolver**. Ne pas les utiliser — utiliser le WebSocket a la place.

#### Regles metier Chat

- Pas de verification de membership pour envoyer un message (tout user auth peut ecrire dans tout groupe).
- `deleteMessage` est silencieux si l'expediteur ne correspond pas (retourne true, ne supprime rien).

#### Erreurs Chat

| Code | Cause |
|---|---|
| `UNAUTHENTICATED` | Token absent ou invalide |

---

### SERVICE RANKING / CHALLENGE (via gateway)

#### Queries

##### leaderboard(limit)
Classement global. Defaut: 10. `user` resolu via DataLoader.

```graphql
query Leaderboard($limit: Int) {
  leaderboard(limit: $limit) {
    userId score rank
    user { id username email }
  }
}
```

##### myRanking
Classement de l'utilisateur courant.

```graphql
query MyRanking {
  myRanking { userId score rank }
}
```

##### challenges
Liste tous les challenges du backend.

```graphql
query Challenges {
  challenges {
    id eventId groupId title createdAt pointsReward
  }
}
```

##### challengeParticipants(challengeId)
Participants d'un challenge avec resolution de l'utilisateur.

```graphql
query ChallengeParticipants($challengeId: ID!) {
  challengeParticipants(challengeId: $challengeId) {
    id challengeId userId joinedAt completed completedAt
    user { id username email }
  }
}
```

#### Mutations Ranking

##### updateScore(userId, points)
⚠️ Aucune verification admin — tout utilisateur authentifie peut modifier le score de n'importe quel user.
Mutation a usage interne / systeme uniquement. Ne pas exposer dans l'UI utilisateur standard.

```graphql
mutation UpdateScore($userId: ID!, $points: Int!) {
  updateScore(userId: $userId, points: $points) {
    userId score rank
  }
}
```

#### Regles metier Ranking

- Les scores sont mis a jour automatiquement par le backend via Redis Pub/Sub (`WORKOUT_COMPLETED`, `EVENT_CREATED`).
- `updateScore` est un point d'entree manuel sans garde-fou — a reserver aux admins ou aux tests.

#### Erreurs Ranking

| Code | Cause |
|---|---|
| `UNAUTHENTICATED` | Token absent ou invalide |

---

### SERVICE PROFILE (via gateway)

##### updateMyProfile(email, pseudo)
Met a jour le profil de l'utilisateur courant dans auth-service.
Au moins un des deux champs est requis.

```graphql
mutation UpdateMyProfile($email: String, $pseudo: String) {
  updateMyProfile(email: $email, pseudo: $pseudo) {
    id username email
  }
}
```

---

## 6) Champs resolus automatiquement (DataLoader)

Ces champs sont resolus automatiquement en un appel batch vers auth-service quand tu les inclus dans ta query. Pas de surcharge de performance si tu en demandes plusieurs en meme temps.

| Type GraphQL | Champ | Source |
|---|---|---|
| `Message` | `sender` | auth-service via DataLoader |
| `Ranking` | `user` | auth-service via DataLoader |
| `Group` | `members` | community-service (GetGroupMembers) |
| `Participant` | `user` | auth-service via DataLoader |
| `ChallengeParticipant` | `user` | auth-service via DataLoader |
| `WorkoutSession` | `user` | auth-service via DataLoader |
| `Event` | `group` | community-service (GetGroup) |

---

## 7) Exemple de client Apollo (optionnel)

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

---

## 8) Erreurs courantes

| Code | Cause |
|---|---|
| `UNAUTHENTICATED` | Token absent, expire ou invalide — rediriger vers login |
| `FORBIDDEN` | Operation refusee par regle metier (ex: non-ADMIN sur action admin, non-membre sur createEvent) |
| `NOT_FOUND` | Ressource introuvable (event, groupe, message) |
| `BAD_USER_INPUT` | Donnee invalide (userId inexistant, role invalide) |
| `ALREADY_EXISTS` | Doublon (ex: joinEvent deja rejoint) |

---

## 9) Fonctionnalites manquantes a implémenter

| Fonctionnalite | Impact |
|---|---|
| `leaveEvent` | Pas de desistement possible d'un evenement |
| `forgotPassword` / `resetPassword` | Pas de recuperation de compte |
| Restriction createur sur `updateEvent` / `deleteEvent` | Tout user peut modifier/supprimer tout evenement |
| Role expose sur `group.members` | Impossible de savoir qui est ADMIN via GraphQL |
| `Event.createdBy` | Toujours null — le modele n'a pas de creatorId |
| Subscriptions GraphQL | `messageAdded` / `groupUpdated` non implementees — utiliser WebSocket |
| Check admin sur `updateScore` | Tout user peut changer n'importe quel score |

---

## 10) Check rapide de bon fonctionnement

1. `signIn` sur auth-service → token.
2. `me` sur gateway avec le token → doit retourner l'user.
3. `createGroup` → noter l'id.
4. `createEvent(groupId, ...)` → l'event doit etre cree.
5. `joinEvent(eventId)` → doit retourner true.
6. `myEvents` → l'event doit apparaitre.
