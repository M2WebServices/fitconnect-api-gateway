import { GraphQLError } from 'graphql';
import { GraphQLContext } from './context';

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

      const response = await context.clients.event.createEvent({
        groupId,
        title,
        description: description || '',
        date,
        createdBy: context.user.userId,
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
      // This would call the community service to get group members
      const response = await context.clients.community.getGroupMembers({ groupId: parent.id });
      return response.members || [];
    },
  },
};
