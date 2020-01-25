const { forwardTo } = require("prisma-binding");

const Query = {
  // forwardTo allows us to just pass the query directly to DB (w/o custom logic)
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db")
  // Parent- parent schema
  // Args- arguments passed to query
  // Ctx- Gives us the request object, including DB
  // Info- Info around GraphQL query coming in
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
