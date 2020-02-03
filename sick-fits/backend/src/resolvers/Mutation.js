const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { makeANiceEmail, transport } = require("../mail");
const { hasPermission } = require("../utils");
const stripe = require("../stripe");

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
    if (!ctx.request.userId) {
      throw Error("You must be logged in to create an item");
    }
    const item = await ctx.db.mutation.createItem(
      {
        // Can't quite do data: args
        data: {
          // This is how we create a relationship between item and user in Prisma
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
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
    const item = await ctx.db.query.item({ where }, `{ id title user { id } }`);
    // 2. Check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );
    if (!(ownsItem || hasPermissions)) {
      throw new Error("You don't have permission to do that");
    }
    // 3. Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    // all emails lowercase
    args.email = args.email.toLowerCase();
    // hash their password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the DB
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] }
        }
      },
      info
    );
    // create JWT for them for instant sign in
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year sign in
    });
    // return user to browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // check if user exists with email
    const user = await ctx.db.query.user({
      where: { email }
    });
    if (!user) {
      // Caught in front end and displayed to user with frontend logic
      throw new Error(`No such user found for email ${email}`);
    }
    // check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Invalid password`);
    }
    // generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the cookie with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async requestReset(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // set a reset token and expiry on user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 360000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });
    // console.log(res);
    // email them that token
    const mailResponse = await transport.sendMail({
      from: "spencer@gmail.co",
      to: user.email,
      subject: "Password Reset Token",
      html: makeANiceEmail(
        `Your password reset token is here! \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to reset</a>`
      )
    });

    return { message: "Thanks!" };
  },
  async resetPassword(parent, args, ctx, info) {
    // check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords must match");
    }
    // check if it's a legit reset token
    const [matchingTokenUser] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!matchingTokenUser) {
      throw new Error("The token you provided is not valid");
    }
    // hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser(
      {
        where: { email: matchingTokenUser.email },
        data: {
          password,
          resetToken: null,
          resetTokenExpiry: null
        }
      },
      info
    );
    // generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // set JWT cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 24 * 365
    });
    // return new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // query if they are logged in
    if (!ctx.request.userId) {
      throw new Error("Must be logged in");
    }
    // query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId
        }
      },
      info
    );
    // check if they have permission to do this
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);
    // update permissions
    return ctx.db.mutation.updateUser(
      {
        where: { id: args.userId },
        data: {
          permissions: { set: args.permissions }
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // make sure they're signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be signed in");
    }
    // query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: { user: { id: userId }, item: { id: args.id } }
    });
    // check if that item is already in the cart and increment by 1 if it is
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        },
        info
      );
    }
    // if it's not then create a new CartItem for that user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: { connect: { id: userId } },
          item: { connect: { id: args.id } }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // check if they're logged in
    if (!ctx.request.userId) {
      throw new Error("You must be signed in");
    }
    // find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: { id: args.id }
      },
      `{ id, user { id } }`
    );
    // make sure we found an item
    if (!cartItem) {
      throw new Error("No CartItem found");
    }
    // make sure they own that cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error("This item is not in your cart");
    }
    // delete that cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: { id: args.id }
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be signed in to complete this order");
    }
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
          id
          name
          email
          cart {
            id
            quantity
            item {
              title
              price
              id
              description
              image
              largeImage
            }
          }
        }`
    );
    // recalculate the total for the price (important not to accept the price from front-end)
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log(`Going to charge for a total of ${amount}`);
    // create the stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token
    });
    // convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } }
      };
      delete orderItem.id;
      return orderItem;
    });
    // create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } }
      }
    });
    // clean up - clear the user's cart, delete CartItems from DB
    const cartItemIds = user.cart.map(cartItem => cartItem.id); // array of ids of cart items currently in users cart
    await ctx.db.mutation.deleteManyCartItems({
      where: { id_in: cartItemIds }
    });
    // return the order to the client
    return order;
  }
};

module.exports = Mutations;
