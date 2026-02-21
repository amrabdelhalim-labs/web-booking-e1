/**
 * Application Entry Point
 *
 * Initializes the React 18 application with Apollo Client provider.
 * Configures Apollo Client with:
 * - HTTP Link for queries/mutations
 * - WebSocket Link for subscriptions (graphql-ws)
 * - Auth Link for JWT token injection
 * - Split Link to route operations to the correct transport
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/js/bootstrap.min.js";
import "bootstrap/dist/css/bootstrap.rtl.min.css";
import "./index.css";
import App from "./App";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

// ─── Configuration ────────────────────────────────────────────────────────────

const GRAPHQL_HTTP_URI =
  import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:4000/graphql";
const GRAPHQL_WS_URI =
  import.meta.env.VITE_GRAPHQL_WS_URL || "ws://localhost:4000/graphql";

// ─── HTTP Link ────────────────────────────────────────────────────────────────

const httpLink = createHttpLink({
  uri: GRAPHQL_HTTP_URI,
  credentials: "same-origin",
});

// ─── WebSocket Link (Subscriptions) ───────────────────────────────────────────

const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_URI,
    connectionParams: () => ({
      authToken: localStorage.getItem("token"),
    }),
  })
);

// ─── Auth Link (JWT Token Injection) ──────────────────────────────────────────

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `JWT ${token}` : "",
    },
  };
});

// ─── Split Link (Route HTTP vs WebSocket) ─────────────────────────────────────

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// ─── Apollo Client Instance ──────────────────────────────────────────────────

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
});

// ─── Render Application ──────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
