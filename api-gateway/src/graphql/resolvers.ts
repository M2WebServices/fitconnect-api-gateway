import { GraphQLError } from 'graphql';
import { GraphQLContext } from './context';
import env from '../config/env';

export const resolvers = {
  Query: {
    // Auth/User queries
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return {
        id: context.user.userId,
        username: context.user.username,
        email: context.user.email,
      };
    },

    // Community queries
    group: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.community.getGroup({ groupId: id });
      return response;
    },

    myGroups: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.community.getUserGroups({
        userId: context.user.userId,
      });
      return response.groups || [];
    },

    searchGroups: async (_: any, { query }: { query: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.community.searchGroups({ query });
      return response.groups || [];
    },

    // Event queries
    groupEvents: async (_: any, { groupId }: { groupId: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.event.getGroupEvents({ groupId });
      return response.events || [];
    },

    event: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.event.getEvent({ eventId: id });
      return response;
    },

    myEvents: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.event.getUserEvents({
        userId: context.user.userId,
      });
      return response.events || [];
    },

    eventParticipants: async (_: any, { eventId }: { eventId: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.event.getEventParticipants({ eventId });
      return (response.participants || []).map((p: any) => ({
        userId: p.userId || p.user_id,
        joinedAt: p.joinedAt || p.joined_at || null,
      }));
    },

    // Chat queries
    groupMessages: async (
      _: any,
      { groupId, limit = 50 }: { groupId: string; limit?: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.chat.getGroupMessages({ groupId, limit });
      return response.messages || [];
    },

    // Ranking queries
    leaderboard: async (_: any, { limit = 10 }: { limit?: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.ranking.getLeaderboard({ limit });
      return response.rankings || [];
    },

    myRanking: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.ranking.getUserRanking({
        userId: context.user.userId,
      });
      return response;
    },

    challenges: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.ranking.getChallenges();
      return response.challenges || [];
    },

    challengeParticipants: async (
      _: any,
      { challengeId }: { challengeId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.ranking.getChallengeParticipants({ challengeId });
      return response.participants || [];
    },

    myWorkoutSessions: async (_: any, { limit = 20 }: { limit?: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.event.listUserWorkoutSessions({
        userId: context.user.userId,
        limit,
      });
      return response.sessions || [];
    },

    chatRealtimeConfig: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return {
        wsUrl: env.realtime.chatWsUrl,
        events: ['WS_CONNECTED', 'WORKOUT_COMPLETED', 'EVENT_CREATED'],
        heartbeatSeconds: 30,
      };
    },
  },

  Mutation: {
    // Community mutations
    createGroup: async (
      _: any,
      { name, description }: { name: string; description?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.community.createGroup({
        name,
        description: description || '',
        ownerId: context.user.userId,
      });

      // Auto-add creator as group ADMIN
      if (response && response.id) {
        try {
          await context.clients.community.addMemberToGroup({
            userId: context.user.userId,
            groupId: response.id,
            role: 'ADMIN',
          });
        } catch {
          // Already member or non-critical failure
        }
      }

      return response;
    },

    updateGroup: async (
      _: any,
      { id, name, description }: { id: string; name?: string; description?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.community.updateGroup({
        groupId: id,
        name,
        description,
        userId: context.user.userId,
      });
      return response;
    },

    deleteGroup: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.clients.community.deleteGroup({
        groupId: id,
        userId: context.user.userId,
      });
      return true;
    },

    joinGroup: async (_: any, { groupId }: { groupId: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.clients.community.joinGroup({
        groupId,
        userId: context.user.userId,
      });
      return true;
    },

    leaveGroup: async (_: any, { groupId }: { groupId: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.clients.community.leaveGroup({
        groupId,
        userId: context.user.userId,
      });
      return true;
    },

    // Event mutations
    createEvent: async (
      _: any,
      {
        groupId,
        title,
        description,
        date,
      }: { groupId: string; title: string; description?: string; date: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const membership = await context.clients.community.isUserInGroup({
        userId: context.user.userId,
        groupId,
      });
      const isInGroup =
        membership?.is_in_group ??
        membership?.isInGroup ??
        membership?.isInGroup === true;
      if (!isInGroup) {
        throw new GraphQLError('User is not a member of this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const response = await context.clients.event.createEvent({
        groupId,
        title,
        description: description || '',
        date,
      });
      return response;
    },

    updateEvent: async (
      _: any,
      {
        id,
        title,
        description,
        date,
      }: { id: string; title?: string; description?: string; date?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.event.updateEvent({
        eventId: id,
        title,
        description,
        date,
        userId: context.user.userId,
      });
      return response;
    },

    deleteEvent: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.clients.event.deleteEvent({
        eventId: id,
        userId: context.user.userId,
      });
      return true;
    },

    joinEvent: async (_: any, { eventId }: { eventId: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.clients.event.joinEvent({
        eventId,
        userId: context.user.userId,
      });
      return true;
    },

    // Chat mutations
    sendMessage: async (
      _: any,
      { groupId, content }: { groupId: string; content: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.chat.sendMessage({
        groupId,
        content,
        senderId: context.user.userId,
      });
      return response;
    },

    deleteMessage: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.clients.chat.deleteMessage({
        messageId: id,
        userId: context.user.userId,
      });
      return true;
    },

    // Ranking mutations
    updateScore: async (
      _: any,
      { userId, points }: { userId: string; points: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await context.clients.ranking.updateScore({
        userId,
        points,
      });
      return response;
    },

    completeWorkoutSession: async (
      _: any,
      {
        workoutSessionId,
        completedAt,
        durationMinutes,
        caloriesBurned,
        eventId,
        groupId,
      }: {
        workoutSessionId: string;
        completedAt?: string;
        durationMinutes?: number;
        caloriesBurned?: number;
        eventId?: string;
        groupId?: string;
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return context.clients.event.completeWorkoutSession({
        workoutSessionId,
        userId: context.user.userId,
        completedAt,
        durationMinutes,
        caloriesBurned,
        eventId,
        groupId,
      });
    },

    updateMyProfile: async (
      _: any,
      { email, pseudo }: { email?: string; pseudo?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!email && !pseudo) {
        throw new GraphQLError('At least one field is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updated = await context.clients.auth.updateUserProfile({
        userId: context.user.userId,
        email,
        pseudo,
      });

      return {
        id: updated.id,
        email: updated.email,
        username: updated.pseudo,
      };
    },
  },

  // Field resolvers for nested data
  Event: {
    group: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.groupId) return null;
      const response = await context.clients.community.getGroup({ groupId: parent.groupId });
      return response;
    },
  },

  Message: {
    sender: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.senderId) return null;
      // This would ideally call an auth service to get user details
      // For now, use the loader pattern to batch requests
      return context.loaders.userLoader.load(parent.senderId);
    },
  },

  Ranking: {
    user: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },
  },

  Group: {
    members: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.id) return [];
      const response = await context.clients.community.getGroupMembers({ groupId: parent.id });
      const members = response.members || [];
      const validMembers = members.filter((m: any) => m.userId || m.user_id);
      const users = await Promise.all(
        validMembers.map((m: any) => context.loaders.userLoader.load(m.userId || m.user_id))
      );
      return users.filter(Boolean);
    },
  },

  Participant: {
    user: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },
  },

  ChallengeParticipant: {
    user: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },
  },

  WorkoutSession: {
    user: async (parent: any, _: any, context: GraphQLContext) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },
  },
};
