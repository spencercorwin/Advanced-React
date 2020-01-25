const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Parent- parent schema
    // Args- arguments passed to query
    // Ctx- Gives us the request object, including DB
    // Info- Info around GraphQL query coming in
    // Our API for the DB is everything defined in prisma.graphql
    // All those methods are available to us here now
    // Access DB by calling ctx.db
    // TODO: Check if they are logged in
    const item = await ctx.db.mutation.createItem(
      {
        // Can't quite do data: args
        data: {
          ...args
        }
      },
      // createItem needs access to info. Info has the actual query
      // The query also contains what we want returned from query
      info
    );
    return item;
  },
  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find the item
    // Manually passing a query to return here instead of info
    const item = await ctx.db.query.item({ where }, `{ id title }`);
    // 2. Check if they own that item, or have the permissions
    // TODO
    // 3. Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  }
};

module.exports = Mutations;
