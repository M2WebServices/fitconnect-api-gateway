import { app } from "./app";
import { env } from "./config/env";
import { initializeDatabase } from "./config/database";
import { startGrpcServer } from "./grpc/event.grpc.controller";
import { initializePublisher, shutdownPublisher } from "./messaging/publisher";

const startHttpServer = () => {
  app.listen(env.httpPort, () => {
    console.log(`HTTP server listening on port ${env.httpPort}`);
  });
};

const bootstrap = async () => {
  await initializeDatabase();
  await initializePublisher();
  startHttpServer();
  startGrpcServer();
};

const shutdown = async () => {
  await shutdownPublisher();
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

bootstrap().catch((error) => {
  console.error("Failed to start Planning Service", error);
  process.exit(1);
});
