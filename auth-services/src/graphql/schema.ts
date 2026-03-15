import { GraphQLError } from 'graphql';
import * as authModule from '../modules/auth';

export const typeDefs = `
  type User {
    id: ID!
    email: String!
    pseudo: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Query {
    me(token: String!): User
    user(id: ID!): User
  }

  type Mutation {
    signUp(email: String!, pseudo: String!, password: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    logout(token: String!): Boolean!
  }
`;

export const resolvers = {
  Query: {
    async me(
      _: unknown,
      { token }: { token: string },
      context: { token?: string }
    ) {
      const authToken = token || context.token;
      if (!authToken) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const payload = await authModule.validateToken(authToken);
      if (!payload) {
        throw new GraphQLError('Invalid token', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const user = await authModule.getUserById(payload.userId);
      return user;
    },

    async user(_: unknown, { id }: { id: string }) {
      const user = await authModule.getUserById(id);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return user;
    },
  },

  Mutation: {
    async signUp(
      _: unknown,
      {
        email,
        pseudo,
        password,
      }: { email: string; pseudo: string; password: string }
    ) {
      try {
        const user = await authModule.signUp({ email, pseudo, password });
        const token = authModule.generateToken({
          userId: user.id,
          email: user.email,
          pseudo: user.pseudo,
        });

        return { user, token };
      } catch (error) {
        if (error instanceof Error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        throw error;
      }
    },

    async signIn(
      _: unknown,
      { email, password }: { email: string; password: string }
    ) {
      try {
        const result = await authModule.signIn({ email, password });
        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        throw error;
      }
    },

    async logout(_: unknown, { token }: { token: string }) {
      try {
        await authModule.invalidateToken(token);
        return true;
      } catch (error) {
        throw new GraphQLError('Failed to logout', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
