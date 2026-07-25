"use strict";
/**
 * Server Entry Point
 *
 * Initializes and starts the Apollo Server 4 with Express,
 * sets up WebSocket server for GraphQL subscriptions,
 * configures JWT authentication context, and connects to MongoDB.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const schema_1 = require("@graphql-tools/schema");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config");
const schema_2 = require("./schema");
const resolvers_1 = require("./resolvers");
const user_1 = __importDefault(require("./models/user"));
/**
 * Starts the Apollo Server with Express and WebSocket support.
 * Sets up authentication context, CORS, and database connection.
 */
async function startServer() {
    // Create Express app and HTTP server
    const app = (0, express_1.default)();
    const httpServer = (0, http_1.createServer)(app);
    // Build executable schema from typeDefs and resolvers
    const schema = (0, schema_1.makeExecutableSchema)({ typeDefs: schema_2.typeDefs, resolvers: resolvers_1.resolvers });
    // Set up WebSocket server for subscriptions
    const wsServer = new ws_1.WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });
    const serverCleanup = (0, ws_2.useServer)({ schema }, wsServer);
    // Create Apollo Server instance
    const server = new server_1.ApolloServer({
        schema,
        plugins: [
            {
                async requestDidStart(requestContext) {
                    const { operationName, query } = requestContext.request;
                    // Skip introspection queries to reduce console noise
                    if (query && operationName !== 'IntrospectionQuery') {
                        const opLabel = operationName ? ` (${operationName})` : '';
                        console.log(`📨 GraphQL${opLabel}:\n${query}`);
                    }
                },
            },
            // Graceful shutdown for HTTP server
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
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
    app.use('/graphql', (0, cors_1.default)({ origin: config_1.config.appUrls }), express_1.default.json(), 
    // @ts-ignore - Type mismatch between @apollo/server and @types/express versions
    (0, express4_1.expressMiddleware)(server, {
        context: async ({ req }) => {
            // Extract JWT token from Authorization header (format: "jwt <token>")
            const auth = req?.headers?.authorization;
            if (auth) {
                try {
                    const decodedToken = jsonwebtoken_1.default.verify(auth.slice(4), // Remove "jwt " prefix
                    config_1.config.jwtSecret);
                    const user = await user_1.default.findById(decodedToken.id);
                    return { user };
                }
                catch {
                    // Invalid or expired token - continue as unauthenticated
                    return { user: null };
                }
            }
            return { user: null };
        },
    }));
    // MongoDB connection with retry logic
    const connectDB = async (maxRetries = 5) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔌 Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`);
                await mongoose_1.default.connect(config_1.config.dbUrl, {
                    serverSelectionTimeoutMS: 15000, // 15 seconds timeout
                    connectTimeoutMS: 15000,
                    socketTimeoutMS: 45000,
                    family: 4, // IPv4
                });
                console.log('✅ Database connected successfully');
                return;
            }
            catch (err) {
                console.error(`❌ Connection attempt ${attempt} failed:`, err.message);
                if (attempt < maxRetries) {
                    const delay = 2000 * attempt; // Exponential backoff
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    console.error('❌ Failed to connect to MongoDB after maximum retries');
                    // Don't exit - server can still run in degraded mode
                    console.warn('⚠️  Server starting in degraded mode without database');
                }
            }
        }
    };
    // Start MongoDB connection in background
    connectDB().catch((err) => {
        console.error('Unexpected error during DB connection:', err);
    });
    // Health check endpoint (for Heroku)
    app.get('/health', (_req, res) => {
        const status = mongoose_1.default.connection.readyState === 1 ? 'ok' : 'degraded';
        res.status(status === 'ok' ? 200 : 503).json({
            status,
            timestamp: new Date().toISOString(),
            database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        });
    });
    // Start listening
    await new Promise((resolve) => httpServer.listen({ port: config_1.config.port }, resolve));
    console.log(`🚀 Server ready at port ${config_1.config.port}`);
    console.log(`🌐 CORS origins: ${config_1.config.appUrls.join(', ')}`);
}
startServer();
//# sourceMappingURL=index.js.map