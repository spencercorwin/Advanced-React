import withApollo from "next-with-apollo";
import ApolloClient from "apollo-boost";
import { endpoint } from "../config";
import { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION } from "../components/Cart";

// Takes in headers, esp important for auth
const createClient = ({ headers }) => {
  return new ApolloClient({
    uri: process.env.NODE_ENV === "development" ? endpoint : endpoint,
    // Every request gets this "middleware"
    // Provides the request with the users headers/credentials
    request: operation => {
      operation.setContext({
        fetchOptions: {
          credentials: "include"
        },
        headers
      });
    },
    // Local data (in browser)
    clientState: {
      resolvers: {
        Mutation: {
          toggleCart: function(_, variables, { cache }) {
            // read the cartOpen value from the cache
            const { cartOpen } = cache.readQuery({
              query: LOCAL_STATE_QUERY
            });
            const data = {
              data: { cartOpen: !cartOpen }
            };
            cache.writeData(data);
            return data;
          }
        }
      },
      defaults: {
        cartOpen: false
      }
    }
  });
};

// withApollo is a higher order component that will expose
// our ApolloClient (which is like a db in the client) via a prop
// Because we use NextJS we need this for SSR
export default withApollo(createClient);
