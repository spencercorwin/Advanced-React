// This file is essentially an ExpressJS app, but with GraphQL-Yoga
// Require env variables here since this is our app entry
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");

// Start server here since index is our app entry point
const server = createServer();

// Middleware: Something that runs in the MIDDLE of your request and response
// Use express middlware to handle cookies (JWT)
server.express.use(cookieParser());

// Decode the JWT so we can get the user ID on each request
server.express.use((req, res, next) => {
  // cookieParser allows us to access all cookies sent in request
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put userId onto the req
    req.userId = userId;
  }
  next();
});

// Create a middleware that populates the User on each request
server.express.use(async (req, res, next) => {
  // if they aren't logged in then skip
  if (!req.userId) {
    return next();
  }
  const user = await db.query.user(
    { where: { id: req.userId } },
    // a graphql query for what we want returned
    "{ id, permissions, email, name }"
  );
  req.user = user;
  next();
});

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
