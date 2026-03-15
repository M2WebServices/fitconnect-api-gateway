import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const protoPath = path.join(__dirname, '../proto/community.proto');

  // Configure gRPC Microservice
  const grpcPort = parseInt(process.env.GRPC_PORT || '5101', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'community',
      protoPath: protoPath,
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  // Start microservices
  await app.startAllMicroservices();

  // Start HTTP server
  const port = process.env.PORT || 4101;
  await app.listen(port);
  console.log(`🚀 Community Service HTTP on port ${port}`);
  console.log(`🚀 Community Service gRPC on port ${grpcPort}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Community Service:', error);
  process.exit(1);
});
