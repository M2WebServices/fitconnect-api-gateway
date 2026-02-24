import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { GraphQLContext } from './graphql/context';
import { createCommunityClient } from './clients/community.client';
import { createEventClient } from './clients/event.client';
import { createPlanningClient } from './clients/planning.client';
import { createChatClient } from './clients/chat.client';
import { createRankingClient } from './clients/ranking.client';
import env from './config/env';

/**
 * Create and configure the Apollo Server
 */
export const createApolloServer = async () => {
  // Initialize gRPC clients
  const clients = {
    community: createCommunityClient(),
    event: createEventClient(),
    planning: createPlanningClient(),
    chat: createChatClient(),
    ranking: createRankingClient(),
  };

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError: (formattedError, error) => {
      console.error('GraphQL Error:', formattedError);
      return formattedError;
    },
    introspection: true, // Enable in development
    csrfPrevention: false, // Disable CSRF in development (enable in production with proper CORS)
    plugins: [
      // Install a landing page plugin based on NODE_ENV
      ApolloServerPluginLandingPageLocalDefault({
        includeCookies: true,
        embed: true,
      }),
    ],
  });

  return { server, clients };
};

/**
 * Graceful shutdown handler
 */
export const setupGracefulShutdown = async (server: ApolloServer<GraphQLContext>, clients: any) => {
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    try {
      // Stop Apollo Server
      await server.stop();
      console.log('✅ Apollo Server stopped');

      // Close gRPC clients
      Object.entries(clients).forEach(([name, client]: [string, any]) => {
        if (client && typeof client.close === 'function') {
          client.close();
          console.log(`✅ ${name} client closed`);
        }
      });

      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Listen for termination signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
