import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { env } from "../config/env";
import {
  addPoints,
  getChallengeParticipations,
  getChallenges,
  getLeaderboard,
  getUserRanking,
} from "../modules/scoring";

const PROTO_PATH = path.join(__dirname, "../../proto/ranking.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const rankingProto = grpc.loadPackageDefinition(packageDefinition) as any;

const getLeaderboardHandler = async (
  call: grpc.ServerUnaryCall<{ limit?: number }, { rankings: Array<{ userId: string; score: number; rank: number }> }>,
  callback: grpc.sendUnaryData<{ rankings: Array<{ userId: string; score: number; rank: number }> }>
) => {
  try {
    const rankings = await getLeaderboard(call.request.limit ?? 10);
    callback(null, { rankings });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to get leaderboard",
    });
  }
};

const getUserRankingHandler = async (
  call: grpc.ServerUnaryCall<{ userId: string }, { userId: string; score: number; rank: number }>,
  callback: grpc.sendUnaryData<{ userId: string; score: number; rank: number }>
) => {
  try {
    const ranking = await getUserRanking(call.request.userId);
    callback(null, ranking);
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to get user ranking",
    });
  }
};

const updateScoreHandler = async (
  call: grpc.ServerUnaryCall<{ userId: string; points: number }, { userId: string; score: number; rank: number }>,
  callback: grpc.sendUnaryData<{ userId: string; score: number; rank: number }>
) => {
  try {
    const ranking = await addPoints(call.request.userId, call.request.points);
    callback(null, ranking);
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to update score",
    });
  }
};

const getChallengesHandler = async (
  _call: grpc.ServerUnaryCall<Record<string, never>, { challenges: unknown[] }>,
  callback: grpc.sendUnaryData<{ challenges: unknown[] }>
) => {
  try {
    const challenges = await getChallenges();
    callback(null, { challenges });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to get challenges",
    });
  }
};

const getChallengeParticipantsHandler = async (
  call: grpc.ServerUnaryCall<{ challengeId: string }, { participants: unknown[] }>,
  callback: grpc.sendUnaryData<{ participants: unknown[] }>
) => {
  try {
    const participants = await getChallengeParticipations(call.request.challengeId);
    callback(null, { participants });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to get challenge participants",
    });
  }
};

const rankingServiceImpl = {
  // Keep both casings for compatibility with proto-loader method name mapping.
  GetLeaderboard: getLeaderboardHandler,
  getLeaderboard: getLeaderboardHandler,
  GetUserRanking: getUserRankingHandler,
  getUserRanking: getUserRankingHandler,
  UpdateScore: updateScoreHandler,
  updateScore: updateScoreHandler,
  GetChallenges: getChallengesHandler,
  getChallenges: getChallengesHandler,
  GetChallengeParticipants: getChallengeParticipantsHandler,
  getChallengeParticipants: getChallengeParticipantsHandler,
};

export const startGrpcServer = (): grpc.Server => {
  const server = new grpc.Server();

  server.addService(rankingProto.ranking.RankingService.service, rankingServiceImpl);

  const grpcPort = String(env.grpcPort);
  server.bindAsync(`0.0.0.0:${grpcPort}`, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      console.error("Failed to bind challenge-ranking gRPC server:", error);
      return;
    }
    server.start();
    console.log(`Challenge Ranking gRPC on port ${grpcPort}`);
  });

  return server;
};
