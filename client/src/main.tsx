/**
 * Application Entry Point
 *
 * Initializes the React application with Apollo Client provider.
 * Sets up Apollo Client with HTTP link, WebSocket link for subscriptions,
 * and authentication link for JWT token injection.
 *
 * TODO: Implement full Apollo Client setup (Phase 3.3)
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

// ─── HTTP Link ────────────────────────────────────────────────────────────────

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "same-origin",
});

// ─── WebSocket Link (for Subscriptions) ───────────────────────────────────────

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
    connectionParams: {
      authToken: localStorage.getItem("token"),
    },
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

// ─── Split Link (Route to HTTP or WebSocket) ─────────────────────────────────

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
  cache: new InMemoryCache(),
  link: splitLink,
});

// ─── Render Application ──────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
