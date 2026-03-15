import { startStandaloneServer } from '@apollo/server/standalone';
import { createApolloServer, setupGracefulShutdown } from './app';
import { createContext } from './graphql/context';
import env from './config/env';

/**
 * Start the API Gateway server
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting FitConnect API Gateway...\n');

    // Create Apollo Server and clients
    const { server, clients } = await createApolloServer();

    // Start standalone server
    const { url } = await startStandaloneServer(server, {
      listen: { port: env.port },
      context: async ({ req }) => createContext({ req, clients }),
    });

    console.log(`\n✅ Server ready!`);
    console.log(`📍 Environment: ${env.nodeEnv}`);
    console.log(`🔮 GraphQL endpoint: ${url}`);
    console.log(`💚 Server URL: http://localhost:${env.port}`);
    console.log('\n📡 gRPC Services:');
    console.log(`   - Community: ${env.grpc.communityServiceUrl}`);
    console.log(`   - Planning & Event: ${env.grpc.planningServiceUrl}`);
    console.log(`   - Chat: ${env.grpc.chatServiceUrl}`);
    console.log(`   - Ranking: ${env.grpc.rankingServiceUrl}\n`);

    // Setup graceful shutdown
    setupGracefulShutdown(server, clients);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
