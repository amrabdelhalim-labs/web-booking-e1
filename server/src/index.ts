/**
 * Server Entry Point
 *
 * Initializes and starts the Apollo Server 4 with Express,
 * sets up WebSocket server for GraphQL subscriptions,
 * configures JWT authentication context, and connects to MongoDB.
 */

import express from "express";
import { createServer } from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import mongoose from "mongoose";

import { config } from "./config";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { GraphQLContext, JwtPayload } from "./types";
import User from "./models/user";

/**
 * Starts the Apollo Server with Express and WebSocket support.
 * Sets up authentication context, CORS, and database connection.
 */
async function startServer(): Promise<void> {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = createServer(app);

  // Build executable schema from typeDefs and resolvers
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Set up WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });
  const serverCleanup = useServer({ schema }, wsServer);

  // Create Apollo Server instance
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      {
        async requestDidStart(requestContext) {
          const { operationName, query } = requestContext.request;
          // Skip introspection queries to reduce console noise
          if (query && operationName !== "IntrospectionQuery") {
            const opLabel = operationName ? ` (${operationName})` : "";
            console.log(`📨 GraphQL${opLabel}:\n${query}`);
          }
        },
      },
      // Graceful shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Graceful shutdown for WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Start Apollo Server
  await server.start();

  // Apply Express middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ origin: config.appUrl }),
    express.json(),
    // @ts-ignore - Type mismatch between @apollo/server and @types/express versions
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        // Extract JWT token from Authorization header (format: "jwt <token>")
        const auth = req?.headers?.authorization;
        if (auth) {
          try {
            const decodedToken = jwt.verify(
              auth.slice(4), // Remove "jwt " prefix
              config.jwtSecret
            ) as JwtPayload;

            const user = await User.findById(decodedToken.id);
            return { user };
          } catch {
            // Invalid or expired token - continue as unauthenticated
            return { user: null };
          }
        }
        return { user: null };
      },
    })
  );

  // Connect to MongoDB
  try {
    await mongoose.connect(config.dbUrl);
    console.log("📦 Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }

  // Start listening
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: config.port }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:${config.port}/graphql`);
}

startServer();
