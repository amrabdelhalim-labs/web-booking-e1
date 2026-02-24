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

import http from 'http';
import mongoose from 'mongoose';
import { config } from '../config';
import { assert, logSection, logStep, logInfo, logError, printSummary } from './test.helpers';

const TEST_DB_URL =
  process.env.TEST_DB_URL || config.dbUrl.replace(/\/[^/]+$/, '/event-booking-test-api');
const API_PORT = 4001;
const API_URL = `http://localhost:${API_PORT}/graphql`;

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{ message: string; extensions?: Record<string, any> }>;
}

function graphqlRequest(
  query: string,
  variables: Record<string, any> = {},
  token?: string
): Promise<GraphQLResponse> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
    };
    if (token) {
      headers['Authorization'] = `JWT ${token}`;
    }

    const url = new URL(API_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Server Setup ────────────────────────────────────────────────────────────

async function startTestServer(): Promise<http.Server> {
  // Dynamic import to avoid circular issues
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const jwt = (await import('jsonwebtoken')).default;
  const { ApolloServer } = await import('@apollo/server');
  const { expressMiddleware } = await import('@apollo/server/express4');
  const { makeExecutableSchema } = await import('@graphql-tools/schema');

  const { typeDefs } = await import('../schema');
  const { resolvers } = await import('../resolvers');
  const User = (await import('../models/user')).default;

  const app = express();
  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    // @ts-ignore
    expressMiddleware(server, {
      context: async ({ req }: any) => {
        const auth = req?.headers?.authorization;
        if (auth) {
          try {
            const decodedToken = jwt.verify(auth.slice(4), config.jwtSecret) as any;
            const user = await User.findById(decodedToken.id);
            return { user };
          } catch {
            return { user: null };
          }
        }
        return { user: null };
      },
    })
  );

  await new Promise<void>((resolve) => httpServer.listen({ port: API_PORT }, resolve));

  return httpServer;
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

async function runTests(): Promise<void> {
  logSection('API E2E Tests — Event Booking GraphQL');
  logInfo(`Connecting to test DB: ${TEST_DB_URL}`);

  try {
    await mongoose.connect(TEST_DB_URL);
    logStep('Database connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  // Clean DB
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }

  logStep('Starting test server on port ' + API_PORT + '...');
  let httpServer: http.Server;
  try {
    httpServer = await startTestServer();
    logStep('Server started');
  } catch (err) {
    logError(`Failed to start server: ${err}`);
    process.exit(1);
  }

  let authToken = '';
  let userId = '';
  let secondToken = '';
  let secondUserId = '';
  let eventId = '';

  try {
    // ═══ GraphQL Endpoint ═══════════════════════════════════════════════

    logSection('GraphQL Endpoint');

    logStep('Testing introspection query...');
    const introspection = await graphqlRequest(`{
      __schema {
        queryType { name }
      }
    }`);
    assert(
      introspection.data?.__schema?.queryType?.name === 'Query',
      'GraphQL introspection works'
    );

    // ═══ User Registration ══════════════════════════════════════════════

    logSection('User Registration');

    logStep('Registering user 1...');
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
    assert(!register1.errors, 'User 1 registered without errors');
    assert(register1.data?.createUser?.token !== undefined, 'Registration returns token');
    assert(register1.data?.createUser?.username === 'عمرو', 'Registration returns username');
    authToken = register1.data?.createUser?.token || '';
    userId = register1.data?.createUser?.userId || '';

    logStep('Registering user 2...');
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
    assert(!register2.errors, 'User 2 registered without errors');
    secondToken = register2.data?.createUser?.token || '';
    secondUserId = register2.data?.createUser?.userId || '';

    // Duplicate email
    logStep('Testing duplicate email...');
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
    assert(
      dupEmail.errors !== undefined && dupEmail.errors.length > 0,
      'Duplicate email returns error'
    );

    // ═══ Login ══════════════════════════════════════════════════════════

    logSection('Login');

    logStep('Login with valid credentials...');
    const login = await graphqlRequest(`
      mutation {
        login(email: "amr@test.com", password: "Test123!") {
          userId
          token
          username
        }
      }
    `);
    assert(!login.errors, 'Login succeeds without errors');
    assert(login.data?.login?.token !== undefined, 'Login returns token');
    assert(login.data?.login?.userId === userId, 'Login returns correct userId');

    logStep('Login with invalid password...');
    const badLogin = await graphqlRequest(`
      mutation {
        login(email: "amr@test.com", password: "WrongPassword") {
          token
        }
      }
    `);
    assert(
      badLogin.errors !== undefined && badLogin.errors.length > 0,
      'Invalid password returns error'
    );

    logStep('Login with non-existent email...');
    const noUser = await graphqlRequest(`
      mutation {
        login(email: "nobody@test.com", password: "Test123!") {
          token
        }
      }
    `);
    assert(
      noUser.errors !== undefined && noUser.errors.length > 0,
      'Non-existent email returns error'
    );

    // ═══ Auth Protection ════════════════════════════════════════════════

    logSection('Auth Protection');

    logStep('Accessing bookings without auth...');
    const noAuth = await graphqlRequest(`
      query {
        bookings {
          _id
        }
      }
    `);
    assert(noAuth.errors !== undefined && noAuth.errors.length > 0, 'Bookings query requires auth');
    assert(
      noAuth.errors?.[0]?.extensions?.code === 'UNAUTHENTICATED',
      'Returns UNAUTHENTICATED error code'
    );

    logStep('Creating event without auth...');
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
    assert(noAuthEvent.errors !== undefined, 'Creating event requires auth');

    // ═══ Event Operations ═══════════════════════════════════════════════

    logSection('Event Operations');

    logStep('Creating event...');
    const createEvent = await graphqlRequest(
      `
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
    `,
      {
        title: 'مؤتمر الاختبار',
        desc: 'مؤتمر أنشئ لأغراض اختبارية فقط لا أكثر',
        price: 150,
        date: '2026-06-15T10:00:00',
      },
      authToken
    );
    assert(!createEvent.errors, 'Event created without errors');
    assert(createEvent.data?.createEvent?.title === 'مؤتمر الاختبار', 'Event has correct title');
    assert(createEvent.data?.createEvent?.price === 150, 'Event has correct price');
    assert(createEvent.data?.createEvent?.creator?._id === userId, 'Event creator is correct user');
    eventId = createEvent.data?.createEvent?._id || '';

    // Duplicate title
    logStep('Testing duplicate title...');
    const dupTitle = await graphqlRequest(
      `
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
    `,
      {},
      authToken
    );
    assert(dupTitle.errors !== undefined, 'Duplicate event title returns error');

    // Query events
    logStep('Querying events...');
    const queryEvents = await graphqlRequest(`
      query {
        events {
          _id
          title
          creator { username }
        }
      }
    `);
    assert(!queryEvents.errors, 'Events query succeeds');
    assert(queryEvents.data?.events?.length >= 1, 'At least 1 event returned');

    // Search events
    logStep('Searching events...');
    const searchEvents = await graphqlRequest(`
      query {
        events(searchTerm: "اختبار") {
          _id
          title
        }
      }
    `);
    assert(!searchEvents.errors, 'Search query succeeds');
    assert(
      searchEvents.data?.events?.length === 1,
      `Search returns 1 result (got ${searchEvents.data?.events?.length})`
    );

    // Get user events
    logStep('Getting user events...');
    const userEvents = await graphqlRequest(
      `
      query GetUserEvents($userId: ID!) {
        getUserEvents(userId: $userId) {
          _id
          title
        }
      }
    `,
      { userId }
    );
    assert(!userEvents.errors, 'User events query succeeds');
    assert(userEvents.data?.getUserEvents?.length === 1, 'User has 1 event');

    // Update event
    logStep('Updating event...');
    const updateEvent = await graphqlRequest(
      `
      mutation UpdateEvent($eventId: ID!, $title: String, $price: Float) {
        updateEvent(eventId: $eventId, eventInput: { title: $title, price: $price }) {
          _id
          title
          price
        }
      }
    `,
      { eventId, title: 'مؤتمر الاختبار (محدث)', price: 200 },
      authToken
    );
    assert(!updateEvent.errors, 'Event updated without errors');
    assert(updateEvent.data?.updateEvent?.price === 200, 'Event price updated');

    // Update event by non-owner
    logStep('Testing update by non-owner...');
    const nonOwnerUpdate = await graphqlRequest(
      `
      mutation UpdateEvent($eventId: ID!) {
        updateEvent(eventId: $eventId, eventInput: { price: 999 }) {
          _id
        }
      }
    `,
      { eventId },
      secondToken
    );
    assert(nonOwnerUpdate.errors !== undefined, 'Non-owner cannot update event');

    // ═══ Booking Operations ═════════════════════════════════════════════

    logSection('Booking Operations');

    logStep('Booking an event...');
    const bookEvent = await graphqlRequest(
      `
      mutation BookEvent($eventId: ID!) {
        bookEvent(eventId: $eventId) {
          _id
          createdAt
        }
      }
    `,
      { eventId },
      secondToken
    );
    assert(!bookEvent.errors, 'Event booked successfully');
    const bookingId = bookEvent.data?.bookEvent?._id;

    // Duplicate booking
    logStep('Testing duplicate booking...');
    const dupBooking = await graphqlRequest(
      `
      mutation BookEvent($eventId: ID!) {
        bookEvent(eventId: $eventId) {
          _id
        }
      }
    `,
      { eventId },
      secondToken
    );
    assert(dupBooking.errors !== undefined, 'Duplicate booking returns error');

    // Query bookings
    logStep('Querying bookings...');
    const bookings = await graphqlRequest(
      `
      query {
        bookings {
          _id
          event { title }
          user { username }
          createdAt
        }
      }
    `,
      {},
      secondToken
    );
    assert(!bookings.errors, 'Bookings query succeeds');
    assert(bookings.data?.bookings?.length === 1, 'User has 1 booking');

    // Cancel booking
    logStep('Cancelling booking...');
    const cancelBooking = await graphqlRequest(
      `
      mutation CancelBooking($bookingId: ID!) {
        cancelBooking(bookingId: $bookingId) {
          _id
          title
        }
      }
    `,
      { bookingId },
      secondToken
    );
    assert(!cancelBooking.errors, 'Booking cancelled successfully');
    assert(cancelBooking.data?.cancelBooking?.title !== undefined, 'Cancel returns event data');

    // ═══ User Profile ═══════════════════════════════════════════════════

    logSection('User Profile');

    logStep('Updating user profile...');
    const updateUser = await graphqlRequest(
      `
      mutation {
        updateUser(updateUserInput: { username: "عمرو المحدث" }) {
          _id
          username
        }
      }
    `,
      {},
      authToken
    );
    assert(!updateUser.errors, 'Profile updated without errors');
    assert(updateUser.data?.updateUser?.username === 'عمرو المحدث', 'Username updated correctly');

    // ═══ Delete Event ════════════════════════════════════════════════════

    logSection('Delete Operations');

    logStep('Deleting event...');
    const deleteEvent = await graphqlRequest(
      `
      mutation DeleteEvent($eventId: ID!) {
        deleteEvent(eventId: $eventId) {
          _id
        }
      }
    `,
      { eventId },
      authToken
    );
    assert(!deleteEvent.errors, 'Event deleted successfully');

    // Delete user
    logStep('Deleting user account...');
    const deleteUser = await graphqlRequest(
      `
      mutation {
        deleteUser
      }
    `,
      {},
      authToken
    );
    assert(!deleteUser.errors, 'User deleted successfully');
    assert(deleteUser.data?.deleteUser === true, 'Delete returns true');

    // Verify deletion
    logStep('Verifying user deletion...');
    const verifyLogin = await graphqlRequest(`
      mutation {
        login(email: "amr@test.com", password: "Test123!") {
          token
        }
      }
    `);
    assert(verifyLogin.errors !== undefined, 'Deleted user cannot login');

    // ═══ Error Response Structure ════════════════════════════════════════

    logSection('Error Response Structure');

    logStep('Checking error structure...');
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
    assert(errorResp.errors !== undefined, 'Invalid input returns errors');
    assert(errorResp.errors?.[0]?.message !== undefined, 'Error has message');
    assert(errorResp.errors?.[0]?.extensions?.code !== undefined, 'Error has extension code');
  } catch (err) {
    logError(`Unexpected error: ${err}`);
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────
  logSection('Cleanup');
  logStep('Stopping server and cleaning up...');
  httpServer!.close();
  const collections2 = mongoose.connection.collections;
  for (const key of Object.keys(collections2)) {
    await collections2[key].deleteMany({});
  }
  logStep('Done');

  const exitCode = printSummary();
  await mongoose.disconnect();
  process.exit(exitCode);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
