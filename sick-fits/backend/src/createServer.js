const { GraphQLServer } = require("graphql-yoga");
const Mutation = require("./resolvers/Mutation");
const Query = require("./resolvers/Query");
const db = require("./db");

// Query resolvers to pull data
// Mutation resolvers to push data

// Create the GraphQL Yoga Server

const createServer = () => {
  return new GraphQLServer({
    // Another graphql file we create. Prisma requires its own schema/type defs
    // GraphQL server also needs its own schema/type defs
    typeDefs: "src/schema.graphql",
    resolvers: {
      Mutation,
      Query
    },
    // Would get warnings without these options
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    // This allows us to access the DB from the resolvers. Passed via context
    context: req => ({ ...req, db })
  });
};

module.exports = createServer;
