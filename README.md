# FitConnect – API Gateway (GraphQL Federation)

Ce service est le point d’entrée unique du frontend.  
Il agrège les sous-schémas GraphQL des microservices et gère :

- l’authentification (vérification du JWT)
- la fédération GraphQL
- l’orchestration des appels vers les microservices

---

## Stack

- Node.js / TypeScript
- NestJS
- Apollo Gateway / GraphQL Federation
- gRPC clients vers les microservices

---

## Fonctionnalités

- Expose un schéma GraphQL unifié
- Vérifie le JWT (délivré par Auth Service)
- Route les requêtes vers :
  - Auth Service
  - Community Service
  - Planning Service
  - Challenge Service
  - Chat Service (si historique exposé)

---

## Installation

```bash
npm install
npm run start:dev
