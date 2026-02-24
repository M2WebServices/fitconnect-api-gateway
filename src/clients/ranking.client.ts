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
  // TODO: Update with actual proto file path once available
  // const grpcClient = createGrpcClient(
  //   'ranking.proto',
  //   'ranking',
  //   'RankingService',
  //   env.grpc.rankingServiceUrl
  // );

  // Mock implementation for development
  console.log('🔗 Ranking Service client connecting to:', env.grpc.rankingServiceUrl);

  return {
    getLeaderboard: async (request: { limit: number }) => {
      console.log('Ranking.getLeaderboard called with:', request);
      return {
        rankings: [
          { userId: 'user-1', score: 1500, rank: 1 },
          { userId: 'user-2', score: 1200, rank: 2 },
          { userId: 'user-3', score: 1000, rank: 3 },
        ].slice(0, request.limit),
      };
    },
    getUserRanking: async (request: { userId: string }) => {
      console.log('Ranking.getUserRanking called with:', request);
      return {
        userId: request.userId,
        score: 850,
        rank: 5,
      };
    },
    updateScore: async (request) => {
      console.log('Ranking.updateScore called with:', request);
      return {
        userId: request.userId,
        score: request.points,
        rank: 4,
      };
    },
    close: () => {
      console.log('Ranking client closed');
    },
  };
};
