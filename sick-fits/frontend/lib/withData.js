import withApollo from "next-with-apollo";
import ApolloClient from "apollo-boost";
import { endpoint } from "../config";

// Takes in headers, esp important for auth
const createClient = ({ headers }) => {
  return new ApolloClient({
    uri: process.env.NODE_ENV === "development" ? endpoint : endpoint,
    // Every request gets this "middleware"
    // Provides the request with the users headers/credentialsß
    request: operation => {
      operation.setContext({
        fetchOptions: {
          credentials: "include"
        },
        headers
      });
    }
  });
};

// withApollo is a higher order component that will expose
// our ApolloClient (which is like a db in the client) via a prop
// Because we use NextJS we need this for SSR
export default withApollo(createClient);
