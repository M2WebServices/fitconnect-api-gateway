import express from "express";
import { env } from "./config/env";
import { initializeDatabase, shutdownDatabase } from "./database/postgres";
import { initializeSubscriber, shutdownSubscriber } from "./messaging/subscriber";
import { startGrpcServer } from "./grpc/server";
import {
  getChallengeParticipations,
  getChallenges,
  getLeaderboard,
  getUserRanking,
  getUserTitle,
} from "./modules/scoring";

const app = express();
let grpcServer: ReturnType<typeof startGrpcServer> | null = null;

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "challenge-ranking-service" });
});

app.get("/internal/leaderboard", async (req, res) => {
  const limit = Number(req.query.limit ?? 10);
  const rankings = await getLeaderboard(limit);
  res.status(200).json({ rankings });
});

app.get("/internal/users/:userId/ranking", async (req, res) => {
  const userId = req.params.userId;
  const ranking = await getUserRanking(userId);
  const title = await getUserTitle(userId);
  res.status(200).json({
    ranking,
    title,
  });
});

app.get("/internal/challenges", async (_req, res) => {
  const challenges = await getChallenges();
  res.status(200).json({ challenges });
});

app.get("/internal/challenges/:challengeId/participants", async (req, res) => {
  const participants = await getChallengeParticipations(req.params.challengeId);
  res.status(200).json({
    participants,
  });
});

const bootstrap = async () => {
  await initializeDatabase();
  await initializeSubscriber();
  grpcServer = startGrpcServer();

  app.listen(env.httpPort, () => {
    console.log(`Challenge Ranking Service HTTP on port ${env.httpPort}`);
  });
};

const shutdown = async () => {
  await shutdownSubscriber();
  await shutdownDatabase();
  if (grpcServer) {
    grpcServer.forceShutdown();
    grpcServer = null;
  }
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

bootstrap().catch((error) => {
  console.error("Failed to start Challenge Ranking Service", error);
  process.exit(1);
});
