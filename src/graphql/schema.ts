export const typeDefs = `
  # User Type
  type User {
    id: ID!
    username: String!
    email: String!
  }

  # Group Type
  type Group {
    id: ID!
    name: String!
    description: String
    members: [User!]!
    createdAt: String
    ownerId: ID!
  }

  # Event Type
  type Event {
    id: ID!
    title: String!
    description: String
    date: String!
    groupId: ID!
    group: Group
    createdBy: ID!
  }

  # Message Type
  type Message {
    id: ID!
    content: String!
    senderId: ID!
    sender: User
    groupId: ID!
    createdAt: String!
  }

  # Ranking Type
  type Ranking {
    userId: ID!
    user: User
    score: Int!
    rank: Int!
  }

  # Queries
  type Query {
    # Auth/User queries
    me: User

    # Community queries
    group(id: ID!): Group
    myGroups: [Group!]!
    searchGroups(query: String!): [Group!]!

    # Event queries
    groupEvents(groupId: ID!): [Event!]!
    event(id: ID!): Event
    myEvents: [Event!]!

    # Chat queries
    groupMessages(groupId: ID!, limit: Int): [Message!]!

    # Ranking queries
    leaderboard(limit: Int): [Ranking!]!
    myRanking: Ranking
  }

  # Mutations
  type Mutation {
    # Community mutations
    createGroup(name: String!, description: String): Group
    updateGroup(id: ID!, name: String, description: String): Group
    deleteGroup(id: ID!): Boolean
    joinGroup(groupId: ID!): Boolean
    leaveGroup(groupId: ID!): Boolean

    # Event mutations
    createEvent(
      groupId: ID!
      title: String!
      description: String
      date: String!
    ): Event
    updateEvent(
      id: ID!
      title: String
      description: String
      date: String
    ): Event
    deleteEvent(id: ID!): Boolean

    # Chat mutations
    sendMessage(groupId: ID!, content: String!): Message
    deleteMessage(id: ID!): Boolean

    # Ranking mutations
    updateScore(userId: ID!, points: Int!): Ranking
  }

  # Subscriptions (optional - for real-time features)
  type Subscription {
    messageAdded(groupId: ID!): Message
    groupUpdated(groupId: ID!): Group
  }
`;
