import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

export interface RankingClient {
  getLeaderboard: (request: { limit: number }) => Promise<any>;
  getUserRanking: (request: { userId: string }) => Promise<any>;
  updateScore: (request: { userId: string; points: number }) => Promise<any>;
  close: () => void;
}

/**
 * Create Ranking Service gRPC client
 * Handles leaderboard and scoring operations
 */
export const createRankingClient = (): RankingClient => {
  console.log('🔗 Ranking Service client connecting to:', env.grpc.rankingServiceUrl);

  const grpcClient = createGrpcClient(
    'ranking.proto',
    'ranking',
    'RankingService',
    env.grpc.rankingServiceUrl
  );

  const { client } = grpcClient;
  const getLeaderboardProto = promisifyGrpcCall(client, 'GetLeaderboard');
  const getUserRankingProto = promisifyGrpcCall(client, 'GetUserRanking');
  const updateScoreProto = promisifyGrpcCall(client, 'UpdateScore');

  return {
    getLeaderboard: async (request: { limit: number }) => {
      return getLeaderboardProto({ limit: request.limit });
    },
    getUserRanking: async (request: { userId: string }) => {
      return getUserRankingProto({ userId: request.userId });
    },
    updateScore: async (request) => {
      return updateScoreProto({ userId: request.userId, points: request.points });
    },
    close: () => {
      grpcClient.close();
    },
  };
};
