import App, { Container } from "next/app";
import Page from "../components/Page";
import { ApolloProvider } from "react-apollo";
import withData from "../lib/withData";

class MyApp extends App {
  // This written out to expose page numbers
  // getInitialProps is a special NextJS lifecycle method for SSR
  // This runs before initial render. Returning something from
  // getInitialProps passes it down to MyApp props
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    // This exposes the query to the user
    pageProps.query = ctx.query;
    return { pageProps };
  }
  render() {
    const { Component, apollo, pageProps } = this.props;
    // apollo.writeData({ data: { cartOpen: true } });
    return (
      <Container>
        {/* This is available because we export this MyApp
        wrapped in withData() which provides it with apollo */}
        <ApolloProvider client={apollo}>
          <Page>
            <Component {...pageProps} />
          </Page>
        </ApolloProvider>
      </Container>
    );
  }
}

export default withData(MyApp);
