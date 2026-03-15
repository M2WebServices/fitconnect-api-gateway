import express from "express";
import { Server } from "http";
import { env } from "./config/env";
import { initializeDatabase, shutdownDatabase } from "./database/postgres";
import { initializeSubscriber, shutdownSubscriber } from "./messaging/subscriber";
import { listNotifications } from "./modules/notifications";
import { startWebSocketHub, stopWebSocketHub } from "./websocket/hub";
import { startGrpcServer } from "./grpc/server";

const app = express();
let httpServer: Server | null = null;
let grpcServer: ReturnType<typeof startGrpcServer> | null = null;

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "chat-notification-service" });
});

app.get("/internal/notifications", async (_req, res) => {
  const notifications = await listNotifications();
  res.status(200).json({ notifications });
});

const bootstrap = async () => {
  await initializeDatabase();
  await initializeSubscriber();
  grpcServer = startGrpcServer();

  httpServer = app.listen(env.httpPort, () => {
    console.log(`Chat Notification Service HTTP on port ${env.httpPort}`);
    startWebSocketHub(httpServer!);
  });
};

const shutdown = async () => {
  await stopWebSocketHub();
  await shutdownSubscriber();
  await shutdownDatabase();

  if (grpcServer) {
    grpcServer.forceShutdown();
    grpcServer = null;
  }

  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    httpServer = null;
  }
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

bootstrap().catch((error) => {
  console.error("Failed to start Chat Notification Service", error);
  process.exit(1);
});
