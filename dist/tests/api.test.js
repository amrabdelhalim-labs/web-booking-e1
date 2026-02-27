"use strict";
/**
 * API E2E Tests
 *
 * End-to-end HTTP tests for the GraphQL API.
 * Starts a real Express + Apollo Server and tests:
 * - GraphQL endpoint availability
 * - User registration and login
 * - Authentication protection
 * - Event CRUD operations
 * - Booking operations
 * - Error handling and response structure
 *
 * Run: npm run test:e2e
 * Requires: MongoDB running on localhost:27017
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const test_helpers_1 = require("./test.helpers");
const TEST_DB_URL = process.env.TEST_DB_URL || config_1.config.dbUrl.replace(/\/[^/]+$/, '/event-booking-test-api');
const API_PORT = 4001;
const API_URL = `http://localhost:${API_PORT}/graphql`;
function graphqlRequest(query, variables = {}, token) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query, variables });
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body).toString(),
        };
        if (token) {
            headers['Authorization'] = `JWT ${token}`;
        }
        const url = new URL(API_URL);
        const req = http_1.default.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error(`Invalid JSON response: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
// ─── Server Setup ────────────────────────────────────────────────────────────
async function startTestServer() {
    // Dynamic import to avoid circular issues
    const express = (await Promise.resolve().then(() => __importStar(require('express')))).default;
    const cors = (await Promise.resolve().then(() => __importStar(require('cors')))).default;
    const jwt = (await Promise.resolve().then(() => __importStar(require('jsonwebtoken')))).default;
    const { ApolloServer } = await Promise.resolve().then(() => __importStar(require('@apollo/server')));
    const { expressMiddleware } = await Promise.resolve().then(() => __importStar(require('@apollo/server/express4')));
    const { makeExecutableSchema } = await Promise.resolve().then(() => __importStar(require('@graphql-tools/schema')));
    const { typeDefs } = await Promise.resolve().then(() => __importStar(require('../schema')));
    const { resolvers } = await Promise.resolve().then(() => __importStar(require('../resolvers')));
    const User = (await Promise.resolve().then(() => __importStar(require('../models/user')))).default;
    const app = express();
    const httpServer = http_1.default.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const server = new ApolloServer({
        schema,
    });
    await server.start();
    app.use('/graphql', cors(), express.json(), 
    // @ts-ignore
    expressMiddleware(server, {
        context: async ({ req }) => {
            const auth = req?.headers?.authorization;
            if (auth) {
                try {
                    const decodedToken = jwt.verify(auth.slice(4), config_1.config.jwtSecret);
                    const user = await User.findById(decodedToken.id);
                    return { user };
                }
                catch {
                    return { user: null };
                }
            }
            return { user: null };
        },
    }));
    await new Promise((resolve) => httpServer.listen({ port: API_PORT }, resolve));
    return httpServer;
}
// ─── Test Runner ─────────────────────────────────────────────────────────────
async function runTests() {
    (0, test_helpers_1.logSection)('API E2E Tests — Event Booking GraphQL');
    (0, test_helpers_1.logInfo)(`Connecting to test DB: ${TEST_DB_URL}`);
    try {
        await mongoose_1.default.connect(TEST_DB_URL);
        (0, test_helpers_1.logStep)('Database connected');
    }
    catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
    // Clean DB
    const collections = mongoose_1.default.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
    (0, test_helpers_1.logStep)('Starting test server on port ' + API_PORT + '...');
    let httpServer;
    try {
        httpServer = await startTestServer();
        (0, test_helpers_1.logStep)('Server started');
    }
    catch (err) {
        (0, test_helpers_1.logError)(`Failed to start server: ${err}`);
        process.exit(1);
    }
    let authToken = '';
    let userId = '';
    let secondToken = '';
    let secondUserId = '';
    let eventId = '';
    try {
        // ═══ GraphQL Endpoint ═══════════════════════════════════════════════
        (0, test_helpers_1.logSection)('GraphQL Endpoint');
        (0, test_helpers_1.logStep)('Testing introspection query...');
        const introspection = await graphqlRequest(`{
      __schema {
        queryType { name }
      }
    }`);
        (0, test_helpers_1.assert)(introspection.data?.__schema?.queryType?.name === 'Query', 'GraphQL introspection works');
        // ═══ User Registration ══════════════════════════════════════════════
        (0, test_helpers_1.logSection)('User Registration');
        (0, test_helpers_1.logStep)('Registering user 1...');
        const register1 = await graphqlRequest(`
      mutation {
        createUser(userInput: {
          username: "عمرو"
          email: "amr@test.com"
          password: "Test123!"
        }) {
          userId
          token
          username
        }
      }
    `);
        (0, test_helpers_1.assert)(!register1.errors, 'User 1 registered without errors');
        (0, test_helpers_1.assert)(register1.data?.createUser?.token !== undefined, 'Registration returns token');
        (0, test_helpers_1.assert)(register1.data?.createUser?.username === 'عمرو', 'Registration returns username');
        authToken = register1.data?.createUser?.token || '';
        userId = register1.data?.createUser?.userId || '';
        (0, test_helpers_1.logStep)('Registering user 2...');
        const register2 = await graphqlRequest(`
      mutation {
        createUser(userInput: {
          username: "نورة"
          email: "noura@test.com"
          password: "Test123!"
        }) {
          userId
          token
          username
        }
      }
    `);
        (0, test_helpers_1.assert)(!register2.errors, 'User 2 registered without errors');
        secondToken = register2.data?.createUser?.token || '';
        secondUserId = register2.data?.createUser?.userId || '';
        // Duplicate email
        (0, test_helpers_1.logStep)('Testing duplicate email...');
        const dupEmail = await graphqlRequest(`
      mutation {
        createUser(userInput: {
          username: "مكرر"
          email: "amr@test.com"
          password: "Test123!"
        }) {
          userId
          token
        }
      }
    `);
        (0, test_helpers_1.assert)(dupEmail.errors !== undefined && dupEmail.errors.length > 0, 'Duplicate email returns error');
        // ═══ Login ══════════════════════════════════════════════════════════
        (0, test_helpers_1.logSection)('Login');
        (0, test_helpers_1.logStep)('Login with valid credentials...');
        const login = await graphqlRequest(`
      mutation {
        login(email: "amr@test.com", password: "Test123!") {
          userId
          token
          username
        }
      }
    `);
        (0, test_helpers_1.assert)(!login.errors, 'Login succeeds without errors');
        (0, test_helpers_1.assert)(login.data?.login?.token !== undefined, 'Login returns token');
        (0, test_helpers_1.assert)(login.data?.login?.userId === userId, 'Login returns correct userId');
        (0, test_helpers_1.logStep)('Login with invalid password...');
        const badLogin = await graphqlRequest(`
      mutation {
        login(email: "amr@test.com", password: "WrongPassword") {
          token
        }
      }
    `);
        (0, test_helpers_1.assert)(badLogin.errors !== undefined && badLogin.errors.length > 0, 'Invalid password returns error');
        (0, test_helpers_1.logStep)('Login with non-existent email...');
        const noUser = await graphqlRequest(`
      mutation {
        login(email: "nobody@test.com", password: "Test123!") {
          token
        }
      }
    `);
        (0, test_helpers_1.assert)(noUser.errors !== undefined && noUser.errors.length > 0, 'Non-existent email returns error');
        // ═══ Auth Protection ════════════════════════════════════════════════
        (0, test_helpers_1.logSection)('Auth Protection');
        (0, test_helpers_1.logStep)('Accessing bookings without auth...');
        const noAuth = await graphqlRequest(`
      query {
        bookings {
          _id
        }
      }
    `);
        (0, test_helpers_1.assert)(noAuth.errors !== undefined && noAuth.errors.length > 0, 'Bookings query requires auth');
        (0, test_helpers_1.assert)(noAuth.errors?.[0]?.extensions?.code === 'UNAUTHENTICATED', 'Returns UNAUTHENTICATED error code');
        (0, test_helpers_1.logStep)('Creating event without auth...');
        const noAuthEvent = await graphqlRequest(`
      mutation {
        createEvent(eventInput: {
          title: "Unauthorized"
          description: "Should fail because no auth token"
          price: 100
          date: "2026-06-15T10:00:00"
        }) {
          _id
        }
      }
    `);
        (0, test_helpers_1.assert)(noAuthEvent.errors !== undefined, 'Creating event requires auth');
        // ═══ Event Operations ═══════════════════════════════════════════════
        (0, test_helpers_1.logSection)('Event Operations');
        (0, test_helpers_1.logStep)('Creating event...');
        const createEvent = await graphqlRequest(`
      mutation CreateEvent($title: String!, $desc: String!, $price: Float!, $date: String!) {
        createEvent(eventInput: {
          title: $title
          description: $desc
          price: $price
          date: $date
        }) {
          _id
          title
          description
          price
          date
          creator {
            _id
            username
          }
        }
      }
    `, {
            title: 'مؤتمر الاختبار',
            desc: 'مؤتمر أنشئ لأغراض اختبارية فقط لا أكثر',
            price: 150,
            date: '2026-06-15T10:00:00',
        }, authToken);
        (0, test_helpers_1.assert)(!createEvent.errors, 'Event created without errors');
        (0, test_helpers_1.assert)(createEvent.data?.createEvent?.title === 'مؤتمر الاختبار', 'Event has correct title');
        (0, test_helpers_1.assert)(createEvent.data?.createEvent?.price === 150, 'Event has correct price');
        (0, test_helpers_1.assert)(createEvent.data?.createEvent?.creator?._id === userId, 'Event creator is correct user');
        eventId = createEvent.data?.createEvent?._id || '';
        // Duplicate title
        (0, test_helpers_1.logStep)('Testing duplicate title...');
        const dupTitle = await graphqlRequest(`
      mutation {
        createEvent(eventInput: {
          title: "مؤتمر الاختبار"
          description: "محاولة إنشاء مناسبة بنفس العنوان السابق"
          price: 100
          date: "2026-07-01T10:00:00"
        }) {
          _id
        }
      }
    `, {}, authToken);
        (0, test_helpers_1.assert)(dupTitle.errors !== undefined, 'Duplicate event title returns error');
        // Query events
        (0, test_helpers_1.logStep)('Querying events...');
        const queryEvents = await graphqlRequest(`
      query {
        events {
          _id
          title
          creator { username }
        }
      }
    `);
        (0, test_helpers_1.assert)(!queryEvents.errors, 'Events query succeeds');
        (0, test_helpers_1.assert)(queryEvents.data?.events?.length >= 1, 'At least 1 event returned');
        // Search events
        (0, test_helpers_1.logStep)('Searching events...');
        const searchEvents = await graphqlRequest(`
      query {
        events(searchTerm: "اختبار") {
          _id
          title
        }
      }
    `);
        (0, test_helpers_1.assert)(!searchEvents.errors, 'Search query succeeds');
        (0, test_helpers_1.assert)(searchEvents.data?.events?.length === 1, `Search returns 1 result (got ${searchEvents.data?.events?.length})`);
        // Get user events
        (0, test_helpers_1.logStep)('Getting user events...');
        const userEvents = await graphqlRequest(`
      query GetUserEvents($userId: ID!) {
        getUserEvents(userId: $userId) {
          _id
          title
        }
      }
    `, { userId });
        (0, test_helpers_1.assert)(!userEvents.errors, 'User events query succeeds');
        (0, test_helpers_1.assert)(userEvents.data?.getUserEvents?.length === 1, 'User has 1 event');
        // Update event
        (0, test_helpers_1.logStep)('Updating event...');
        const updateEvent = await graphqlRequest(`
      mutation UpdateEvent($eventId: ID!, $title: String, $price: Float) {
        updateEvent(eventId: $eventId, eventInput: { title: $title, price: $price }) {
          _id
          title
          price
        }
      }
    `, { eventId, title: 'مؤتمر الاختبار (محدث)', price: 200 }, authToken);
        (0, test_helpers_1.assert)(!updateEvent.errors, 'Event updated without errors');
        (0, test_helpers_1.assert)(updateEvent.data?.updateEvent?.price === 200, 'Event price updated');
        // Update event by non-owner
        (0, test_helpers_1.logStep)('Testing update by non-owner...');
        const nonOwnerUpdate = await graphqlRequest(`
      mutation UpdateEvent($eventId: ID!) {
        updateEvent(eventId: $eventId, eventInput: { price: 999 }) {
          _id
        }
      }
    `, { eventId }, secondToken);
        (0, test_helpers_1.assert)(nonOwnerUpdate.errors !== undefined, 'Non-owner cannot update event');
        // ═══ Booking Operations ═════════════════════════════════════════════
        (0, test_helpers_1.logSection)('Booking Operations');
        (0, test_helpers_1.logStep)('Booking an event...');
        const bookEvent = await graphqlRequest(`
      mutation BookEvent($eventId: ID!) {
        bookEvent(eventId: $eventId) {
          _id
          createdAt
        }
      }
    `, { eventId }, secondToken);
        (0, test_helpers_1.assert)(!bookEvent.errors, 'Event booked successfully');
        const bookingId = bookEvent.data?.bookEvent?._id;
        // Duplicate booking
        (0, test_helpers_1.logStep)('Testing duplicate booking...');
        const dupBooking = await graphqlRequest(`
      mutation BookEvent($eventId: ID!) {
        bookEvent(eventId: $eventId) {
          _id
        }
      }
    `, { eventId }, secondToken);
        (0, test_helpers_1.assert)(dupBooking.errors !== undefined, 'Duplicate booking returns error');
        // Query bookings
        (0, test_helpers_1.logStep)('Querying bookings...');
        const bookings = await graphqlRequest(`
      query {
        bookings {
          _id
          event { title }
          user { username }
          createdAt
        }
      }
    `, {}, secondToken);
        (0, test_helpers_1.assert)(!bookings.errors, 'Bookings query succeeds');
        (0, test_helpers_1.assert)(bookings.data?.bookings?.length === 1, 'User has 1 booking');
        // Cancel booking
        (0, test_helpers_1.logStep)('Cancelling booking...');
        const cancelBooking = await graphqlRequest(`
      mutation CancelBooking($bookingId: ID!) {
        cancelBooking(bookingId: $bookingId) {
          _id
          title
        }
      }
    `, { bookingId }, secondToken);
        (0, test_helpers_1.assert)(!cancelBooking.errors, 'Booking cancelled successfully');
        (0, test_helpers_1.assert)(cancelBooking.data?.cancelBooking?.title !== undefined, 'Cancel returns event data');
        // ═══ User Profile ═══════════════════════════════════════════════════
        (0, test_helpers_1.logSection)('User Profile');
        (0, test_helpers_1.logStep)('Updating user profile...');
        const updateUser = await graphqlRequest(`
      mutation {
        updateUser(updateUserInput: { username: "عمرو المحدث" }) {
          _id
          username
        }
      }
    `, {}, authToken);
        (0, test_helpers_1.assert)(!updateUser.errors, 'Profile updated without errors');
        (0, test_helpers_1.assert)(updateUser.data?.updateUser?.username === 'عمرو المحدث', 'Username updated correctly');
        // ═══ Delete Event ════════════════════════════════════════════════════
        (0, test_helpers_1.logSection)('Delete Operations');
        (0, test_helpers_1.logStep)('Deleting event...');
        const deleteEvent = await graphqlRequest(`
      mutation DeleteEvent($eventId: ID!) {
        deleteEvent(eventId: $eventId) {
          _id
        }
      }
    `, { eventId }, authToken);
        (0, test_helpers_1.assert)(!deleteEvent.errors, 'Event deleted successfully');
        // Delete user
        (0, test_helpers_1.logStep)('Deleting user account...');
        const deleteUser = await graphqlRequest(`
      mutation {
        deleteUser
      }
    `, {}, authToken);
        (0, test_helpers_1.assert)(!deleteUser.errors, 'User deleted successfully');
        (0, test_helpers_1.assert)(deleteUser.data?.deleteUser === true, 'Delete returns true');
        // Verify deletion
        (0, test_helpers_1.logStep)('Verifying user deletion...');
        const verifyLogin = await graphqlRequest(`
      mutation {
        login(email: "amr@test.com", password: "Test123!") {
          token
        }
      }
    `);
        (0, test_helpers_1.assert)(verifyLogin.errors !== undefined, 'Deleted user cannot login');
        // ═══ Error Response Structure ════════════════════════════════════════
        (0, test_helpers_1.logSection)('Error Response Structure');
        (0, test_helpers_1.logStep)('Checking error structure...');
        const errorResp = await graphqlRequest(`
      mutation {
        createUser(userInput: {
          username: "ab"
          email: "invalid"
          password: "12"
        }) {
          userId
        }
      }
    `);
        (0, test_helpers_1.assert)(errorResp.errors !== undefined, 'Invalid input returns errors');
        (0, test_helpers_1.assert)(errorResp.errors?.[0]?.message !== undefined, 'Error has message');
        (0, test_helpers_1.assert)(errorResp.errors?.[0]?.extensions?.code !== undefined, 'Error has extension code');
    }
    catch (err) {
        (0, test_helpers_1.logError)(`Unexpected error: ${err}`);
    }
    // ─── Cleanup ──────────────────────────────────────────────────────────
    (0, test_helpers_1.logSection)('Cleanup');
    (0, test_helpers_1.logStep)('Stopping server and cleaning up...');
    httpServer.close();
    const collections2 = mongoose_1.default.connection.collections;
    for (const key of Object.keys(collections2)) {
        await collections2[key].deleteMany({});
    }
    (0, test_helpers_1.logStep)('Done');
    const exitCode = (0, test_helpers_1.printSummary)();
    await mongoose_1.default.disconnect();
    process.exit(exitCode);
}
runTests().catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
});
//# sourceMappingURL=api.test.js.map