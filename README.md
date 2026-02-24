# FitConnect – API Gateway

> 🎯 **Point d'entrée unique** pour toutes les requêtes frontend vers les microservices FitConnect

L'API Gateway agrège les microservices via GraphQL et gère l'authentification, l'autorisation, la validation et le mapping GraphQL → gRPC.

**⚠️ Cette Gateway ne contient AUCUNE logique métier** - elle orchestre uniquement les appels aux microservices.

---

## 📋 Table des matières

- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Schéma GraphQL](#-schéma-graphql)
- [Microservices](#-microservices)
- [Développement](#-développement)

---

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ GraphQL
       ▼
┌─────────────────────────────────┐
│      API Gateway                │
│  ┌──────────────────────────┐  │
│  │  Authentication (JWT)     │  │
│  ├──────────────────────────┤  │
│  │  GraphQL Schema          │  │
│  ├──────────────────────────┤  │
│  │  Resolvers               │  │
│  ├──────────────────────────┤  │
│  │  gRPC Clients            │  │
│  └──────────────────────────┘  │
└────┬────┬────┬────┬────┬───────┘
     │    │    │    │    │ gRPC
     ▼    ▼    ▼    ▼    ▼
  ┌────┐┌────┐┌────┐┌────┐┌────┐
  │Com││Evt││Chat││Plan││Rank│
  │munity││ent││    ││ning││ing │
  └────┘└────┘└────┘└────┘└────┘
```

### Responsabilités

| Composant | Rôle |
|-----------|------|
| 🔐 **Authentication** | Vérification JWT, injection user dans context |
| 📊 **GraphQL Schema** | Schéma unifié exposant toutes les entités |
| 🔄 **Resolvers** | Mapping GraphQL → gRPC |
| 🚀 **Data Loaders** | Batching & caching (évite N+1 queries) |
| ⚡ **Aggregation** | Composition de données multi-services |

---

## 🛠️ Stack technique

- **Runtime:** Node.js 20+ / TypeScript 5+
- **Framework:** Express.js
- **GraphQL:** Apollo Server 3
- **gRPC:** @grpc/grpc-js + @grpc/proto-loader
- **Auth:** JWT (jsonwebtoken)
- **Data Loading:** DataLoader (batching)

---

## 📁 Structure du projet

```
src/
├── app.ts                      # Configuration Express + Apollo
├── server.ts                   # Point d'entrée du serveur
│
├── config/
│   ├── env.ts                  # Variables d'environnement
│   ├── grpc.ts                 # Configuration gRPC
│   └── auth.ts                 # Configuration JWT
│
├── graphql/
│   ├── schema.ts               # Schéma GraphQL unifié
│   ├── resolvers.ts            # Résolveurs GraphQL
│   ├── context.ts              # Context (user, clients, loaders)
│   └── loaders/
│       └── userLoader.ts       # DataLoader pour users
│
├── clients/
│   ├── community.client.ts     # Client gRPC Community Service
│   ├── event.client.ts         # Client gRPC Event Service
│   ├── planning.client.ts      # Client gRPC Planning Service
│   ├── chat.client.ts          # Client gRPC Chat Service
│   └── ranking.client.ts       # Client gRPC Ranking Service
│
├── middleware/
│   ├── auth.middleware.ts      # Middleware d'authentification
│   └── error.middleware.ts     # Gestion d'erreurs
│
└── utils/
    └── index.ts                # Utilitaires divers
```

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd fitconnect-api-gateway
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez `.env` avec vos configurations :

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
COMMUNITY_SERVICE_URL=localhost:50051
EVENT_SERVICE_URL=localhost:50052
# ... autres services
```

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | `4000` |
| `NODE_ENV` | Environnement | `development` |
| `JWT_SECRET` | Secret pour JWT | ⚠️ **À définir** |
| `JWT_EXPIRES_IN` | Durée de validité JWT | `24h` |
| `COMMUNITY_SERVICE_URL` | URL gRPC Community | `localhost:50051` |
| `EVENT_SERVICE_URL` | URL gRPC Event | `localhost:50052` |
| `PLANNING_SERVICE_URL` | URL gRPC Planning | `localhost:50053` |
| `CHAT_SERVICE_URL` | URL gRPC Chat | `localhost:50054` |
| `RANKING_SERVICE_URL` | URL gRPC Ranking | `localhost:50055` |
| `CORS_ORIGIN` | Origine CORS autorisée | `http://localhost:3000` |

---

## 💻 Utilisation

### Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:4000`

### Production

```bash
npm run build
npm start
```

### Scripts disponibles

```bash
npm run dev          # Mode développement avec hot-reload
npm run build        # Compilation TypeScript
npm start            # Lancer en production
npm run lint         # Linter le code
npm run format       # Formater avec Prettier
```

---

## 📊 Schéma GraphQL

### Types principaux

```graphql
type User {
  id: ID!
  username: String!
  email: String!
}

type Group {
  id: ID!
  name: String!
  description: String
  members: [User!]!
  ownerId: ID!
}

type Event {
  id: ID!
  title: String!
  description: String
  date: String!
  groupId: ID!
  group: Group
}

type Message {
  id: ID!
  content: String!
  senderId: ID!
  sender: User
  groupId: ID!
}

type Ranking {
  userId: ID!
  user: User
  score: Int!
  rank: Int!
}
```

### Queries

```graphql
type Query {
  # User
  me: User
  
  # Community
  group(id: ID!): Group
  myGroups: [Group!]!
  searchGroups(query: String!): [Group!]!
  
  # Events
  groupEvents(groupId: ID!): [Event!]!
  event(id: ID!): Event
  myEvents: [Event!]!
  
  # Chat
  groupMessages(groupId: ID!, limit: Int): [Message!]!
  
  # Ranking
  leaderboard(limit: Int): [Ranking!]!
  myRanking: Ranking
}
```

### Mutations

```graphql
type Mutation {
  # Community
  createGroup(name: String!, description: String): Group
  updateGroup(id: ID!, name: String, description: String): Group
  deleteGroup(id: ID!): Boolean
  joinGroup(groupId: ID!): Boolean
  leaveGroup(groupId: ID!): Boolean
  
  # Events
  createEvent(groupId: ID!, title: String!, description: String, date: String!): Event
  updateEvent(id: ID!, title: String, description: String, date: String): Event
  deleteEvent(id: ID!): Boolean
  
  # Chat
  sendMessage(groupId: ID!, content: String!): Message
  deleteMessage(id: ID!): Boolean
  
  # Ranking
  updateScore(userId: ID!, points: Int!): Ranking
}
```

### Exemple de requête

```graphql
query GetMyGroups {
  me {
    id
    username
  }
  myGroups {
    id
    name
    members {
      username
    }
  }
}
```

---

## 🔌 Microservices

### Community Service (port 50051)
- Gestion des groupes
- Membres et inscriptions

### Event Service (port 50052)
- Création d'événements
- Planning des événements

### Planning Service (port 50053)
- Planification utilisateur
- Calendrier personnel

### Chat Service (port 50054)
- Messages de groupe
- Historique des conversations

### Ranking Service (port 50055)
- Classement des utilisateurs
- Système de points

---

## 🔧 Développement

### Ajouter un nouveau resolver

1. Mettre à jour le schéma dans `src/graphql/schema.ts`
2. Ajouter le resolver dans `src/graphql/resolvers.ts`
3. Si nécessaire, créer/modifier le client gRPC correspondant

### Ajouter un nouveau microservice

1. Créer le client dans `src/clients/`
2. Ajouter l'URL dans `src/config/env.ts`
3. Instancier le client dans `src/app.ts`
4. Utiliser le client dans les resolvers

### Tests GraphQL

Accéder à Apollo Studio : `http://localhost:4000/graphql`

### Authentification

Ajouter le header dans vos requêtes :

```
Authorization: Bearer <your-jwt-token>
```

### Health Check

```bash
curl http://localhost:4000/health
```

---

## 📝 Notes

- **Mock Data:** Les clients gRPC utilisent des données mockées en attendant les proto files
- **Proto Files:** Placer les `.proto` dans le dossier `proto/`
- **Production:** Définir `JWT_SECRET` et désactiver `introspection` en production
- **Monitoring:** Logger les requêtes et erreurs (voir `src/middleware/error.middleware.ts`)

---

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commit : `git commit -m "feat: nouvelle feature"`
3. Push : `git push origin feature/ma-feature`
4. Pull Request

---

## 📄 License

MIT
