// Require env variables here since this is our app entry
require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");

// Start server here since index is our app entry point
const server = createServer();

// TODO Use express middlware to handle cookies (JWT)
// TODO Use express middlware to populate current user

// Starts our GraphQL- sYoga server
server.start(
  {
    cors: {
      credentials: true,
      // Only our website origin should be allowed to access this server endpoint
      origin: process.env.FRONTEND_URL
    }
  },
  // Callback for when the server actually runs
  deets => {
    console.log(`Server is now running on http:/localhost:${deets.port}`);
  }
);
