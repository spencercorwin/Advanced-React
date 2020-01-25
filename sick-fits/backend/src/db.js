// This file connects to the remote Prisma DB and gives us
// ability to query it with DB
// Import not yet supported in latest NodeJS w/o Babel, etc.
const { Prisma } = require("prisma-binding");

const db = new Prisma({
  typeDefs: "src/generated/prisma.graphql",
  endpoint: process.env.PRISMA_ENDPOINT,
  // Password for Prisma DB. Need to uncommend secret in prisma.yml
  secret: process.env.PRISMA_SECRET,
  // If true, logs all queries and mutations. Quite noisy
  debug: false
});

module.exports = db;
