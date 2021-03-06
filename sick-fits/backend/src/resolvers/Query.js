const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils");

// Parent- parent schema
// Args- arguments passed to query
// Ctx- Gives us the request object, including DB
// Info- Info around GraphQL query coming in. Gives us the fields that we are requesting to be returned

const Query = {
  // forwardTo allows us to just pass the query directly to DB (w/o custom logic)
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  me: function(parent, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
      return null; // don't throw error. Return null because we want it to return nothing
    }
    // returning a promise, so don't need to await (?)
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
  },
  users: async function(parent, args, ctx, info) {
    // check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in");
    }
    // check if user has the permissions to query all the users
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);
    // if they do, query all the users
    return ctx.db.query.users({}, info);
  },
  async order(parent, args, ctx, info) {
    // make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in");
    }
    // query the current order
    const order = await ctx.db.query.order(
      {
        where: { id: args.id }
      },
      info
    );
    // check if they have the permissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      "ADMIN"
    );
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error("You can't see this!");
    }
    // return the order
    return order;
  },
  async orders(parent, args, ctx, info) {
    // make sure they are logged in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be logged in");
    }
    // query the users orders
    const orders = await ctx.db.query.orders(
      {
        where: { user: { id: userId } }
      },
      info
    );
    // return the orders
    return orders;
  }
};

module.exports = Query;
